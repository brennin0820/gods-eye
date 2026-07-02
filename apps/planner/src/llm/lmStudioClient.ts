// LM Studio brain — OpenAI-compatible client for the orchestrator's agents.
//
// Mirrors scripts/lmstudio-division-improve.sh conventions: base URL from
// NIGHTRAVEN_LMSTUDIO_URL (default http://localhost:1234/v1), model auto-resolved
// from /v1/models when not pinned. Local-mode law (Bible / LOCAL_VS_CLOUD_EXECUTION
// §4): "Never parallel under LM Studio" — every chat call is queued through a single
// in-flight slot so concurrent agent calls never contend for VRAM, regardless of how
// many orchestration streams are logically running.

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type LmStudioConfig = {
  baseUrl: string
  model?: string
  timeoutMs: number
}

export class LmStudioUnreachableError extends Error {}

function resolveConfig(overrides: Partial<LmStudioConfig> = {}): LmStudioConfig {
  return {
    baseUrl: overrides.baseUrl ?? process.env.NIGHTRAVEN_LMSTUDIO_URL ?? 'http://localhost:1234/v1',
    model: overrides.model ?? process.env.NIGHTRAVEN_LMSTUDIO_MODEL,
    timeoutMs: overrides.timeoutMs ?? 60_000,
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await promise
  } catch (err) {
    if (controller.signal.aborted) throw new LmStudioUnreachableError(`${label} timed out after ${ms}ms`)
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export class LmStudioClient {
  private config: LmStudioConfig
  private resolvedModel: string | undefined
  // Serial-only law: one chat call in flight at a time, enforced in code, not just docs.
  private queue: Promise<unknown> = Promise.resolve()

  constructor(overrides: Partial<LmStudioConfig> = {}) {
    this.config = resolveConfig(overrides)
    this.resolvedModel = this.config.model
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task)
    // Swallow rejections in the queue chain itself so one failed call doesn't wedge the queue.
    this.queue = run.catch(() => undefined)
    return run
  }

  async resolveModel(): Promise<string> {
    if (this.resolvedModel) return this.resolvedModel
    let res: Response
    try {
      res = await withTimeout(
        fetch(`${this.config.baseUrl}/models`),
        this.config.timeoutMs,
        'GET /models',
      )
    } catch {
      throw new LmStudioUnreachableError(
        `LM Studio not reachable at ${this.config.baseUrl} — start Local Server in LM Studio.`,
      )
    }
    if (!res.ok) throw new LmStudioUnreachableError(`GET /models failed: HTTP ${res.status}`)
    const body = (await res.json()) as { data?: Array<{ id?: string }> }
    const id = body.data?.find((m) => m.id)?.id
    if (!id) throw new LmStudioUnreachableError('No models loaded in LM Studio.')
    this.resolvedModel = id
    return id
  }

  /** Serialized (queued) OpenAI-compatible chat completion. Never runs concurrently with another call. */
  async chat(messages: ChatMessage[], opts: { temperature?: number } = {}): Promise<string> {
    return this.enqueue(async () => {
      const model = await this.resolveModel()
      let res: Response
      try {
        res = await withTimeout(
          fetch(`${this.config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model,
              messages,
              temperature: opts.temperature ?? 0.2,
            }),
          }),
          this.config.timeoutMs,
          'POST /chat/completions',
        )
      } catch (err) {
        if (err instanceof LmStudioUnreachableError) throw err
        throw new LmStudioUnreachableError(
          `LM Studio not reachable at ${this.config.baseUrl} — start Local Server in LM Studio.`,
        )
      }
      if (!res.ok) throw new LmStudioUnreachableError(`POST /chat/completions failed: HTTP ${res.status}`)
      const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
      const content = body.choices?.[0]?.message?.content
      if (!content) throw new LmStudioUnreachableError('LM Studio returned no completion content.')
      return content
    })
  }
}
