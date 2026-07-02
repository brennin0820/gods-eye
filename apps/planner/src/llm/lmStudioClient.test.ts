import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LmStudioClient, LmStudioUnreachableError } from './lmStudioClient.js'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  vi.restoreAllMocks()
})

describe('LmStudioClient', () => {
  it('resolves the model from /v1/models when none is pinned', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: 'gpt-oss-20b' }, { id: 'other' }] }),
    }) as unknown as typeof fetch

    const client = new LmStudioClient({ baseUrl: 'http://localhost:1234/v1' })
    await expect(client.resolveModel()).resolves.toBe('gpt-oss-20b')
  })

  it('uses a pinned model without calling /v1/models', async () => {
    global.fetch = vi.fn()
    const client = new LmStudioClient({ baseUrl: 'http://localhost:1234/v1', model: 'pinned-model' })
    await expect(client.resolveModel()).resolves.toBe('pinned-model')
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('throws LmStudioUnreachableError when the server is unreachable', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) as unknown as typeof fetch
    const client = new LmStudioClient({ baseUrl: 'http://localhost:1234/v1' })
    await expect(client.chat([{ role: 'user', content: 'hi' }])).rejects.toBeInstanceOf(LmStudioUnreachableError)
  })

  it('throws LmStudioUnreachableError when no models are loaded', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) }) as unknown as typeof fetch
    const client = new LmStudioClient({ baseUrl: 'http://localhost:1234/v1' })
    await expect(client.resolveModel()).rejects.toBeInstanceOf(LmStudioUnreachableError)
  })

  it('serializes concurrent chat calls — never more than one in flight', async () => {
    let inFlight = 0
    let maxInFlight = 0
    global.fetch = vi.fn(async (url: string) => {
      if (String(url).endsWith('/models')) {
        return { ok: true, json: async () => ({ data: [{ id: 'm' }] }) } as Response
      }
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((r) => setTimeout(r, 10))
      inFlight--
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'ok' } }] }) } as Response
    }) as unknown as typeof fetch

    const client = new LmStudioClient({ baseUrl: 'http://localhost:1234/v1' })
    await Promise.all([
      client.chat([{ role: 'user', content: 'a' }]),
      client.chat([{ role: 'user', content: 'b' }]),
      client.chat([{ role: 'user', content: 'c' }]),
    ])
    expect(maxInFlight).toBe(1)
  })
})
