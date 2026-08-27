import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import test, { type TestContext } from 'node:test'
import react from '@vitejs/plugin-react'
import { createServer, type Plugin, type ViteDevServer } from 'vite'
import { buildNextMove, buildProjectFileCatalog, buildProjectMonitorSnapshot } from './projectMonitor.ts'
import type { Project } from '../src/types/project'
import type { ProjectSnapshot, RegistryEntry } from '../src/types/snapshot'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

type CdpResponse = {
  id?: number
  method?: string
  result?: {
    errorText?: string
    sessionId?: string
    targetId?: string
    targetInfos?: Array<{
      targetId: string
      type: string
      url?: string
    }>
    result?: {
      type?: string
      value?: JsonValue
    }
  }
  error?: { message: string }
}

type PendingCdpCommand = {
  method: string
  resolve: (value: CdpResponse) => void
  reject: (reason: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

const CDP_COMMAND_TIMEOUT_MS = 5_000
const CDP_CONNECT_TIMEOUT_MS = 5_000
const CHROME_PROBE_TIMEOUT_MS = 1_000
const CHROME_READY_TIMEOUT_MS = 20_000
const CHROME_SPAWN_TIMEOUT_MS = 5_000
const FIXTURE_OPERATION_TIMEOUT_MS = 10_000
const FIXTURE_READY_TIMEOUT_MS = 20_000
const MONITOR_BROWSER_SCENARIO_TIMEOUT_MS = 120_000
const PROCESS_EXIT_TIMEOUT_MS = 5_000
const VISIBLE_TEXT_TIMEOUT_MS = 20_000

function withDeadline<T>(operation: Promise<T>, label: string, timeoutMs = FIXTURE_OPERATION_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false
    const timeout = setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error(`Timed out after ${timeoutMs}ms during ${label}.`))
    }, timeoutMs)
    operation.then(
      (value) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        resolve(value)
      },
      (error) => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        reject(error)
      },
    )
  })
}

class CdpClient {
  private nextId = 1
  private readonly pending = new Map<number, PendingCdpCommand>()
  private readonly socket: WebSocket
  private sessionId: string | undefined

  private constructor(socket: WebSocket) {
    this.socket = socket
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data)) as CdpResponse
      if (message.id === undefined) return
      const pending = this.pending.get(message.id)
      if (!pending) return
      this.pending.delete(message.id)
      clearTimeout(pending.timeout)
      pending.resolve(message)
    })
    socket.addEventListener('close', () => this.rejectPending(new Error('Chrome CDP connection closed.')))
    socket.addEventListener('error', () => this.rejectPending(new Error('Chrome CDP connection failed.')))
  }

  static connect(
    url: string,
    timeoutMs = CDP_CONNECT_TIMEOUT_MS,
    createSocket: (target: string) => WebSocket = (target) => new WebSocket(target),
  ): Promise<CdpClient> {
    return new Promise((resolve, reject) => {
      let socket: WebSocket
      try {
        socket = createSocket(url)
      } catch (error) {
        reject(new Error(`Unable to create Chrome CDP connection to ${url}.`, { cause: error }))
        return
      }
      let settled = false
      const fail = (error: Error): void => {
        if (settled) return
        settled = true
        clearTimeout(timeout)
        try {
          socket.close()
        } catch {
          // Preserve the connection failure; Chrome teardown owns the process.
        }
        reject(error)
      }
      const timeout = setTimeout(() => {
        fail(new Error(`Timed out after ${timeoutMs}ms connecting to Chrome CDP at ${url}.`))
      }, timeoutMs)
      socket.addEventListener('open', () => {
        if (settled) {
          socket.close()
          return
        }
        settled = true
        clearTimeout(timeout)
        resolve(new CdpClient(socket))
      }, { once: true })
      socket.addEventListener('close', () => {
        fail(new Error(`Chrome CDP connection closed before opening at ${url}.`))
      }, { once: true })
      socket.addEventListener('error', () => {
        fail(new Error(`Unable to connect to Chrome CDP at ${url}.`))
      }, { once: true })
    })
  }

  close(): void {
    this.rejectPending(new Error('Chrome CDP client closed.'))
    this.socket.close()
  }

  useSession(sessionId: string): void {
    this.sessionId = sessionId
  }

  command(
    method: string,
    params: Record<string, JsonValue> = {},
    includeSession = true,
  ): Promise<CdpResponse> {
    const id = this.nextId
    this.nextId += 1
    return new Promise<CdpResponse>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Timed out waiting for Chrome CDP command: ${method}`))
      }, CDP_COMMAND_TIMEOUT_MS)
      this.pending.set(id, { method, resolve, reject, timeout })
      try {
        this.socket.send(JSON.stringify({
          id,
          method,
          params,
          ...(includeSession && this.sessionId ? { sessionId: this.sessionId } : {}),
        }))
      } catch (error) {
        clearTimeout(timeout)
        this.pending.delete(id)
        reject(new Error(`Unable to send Chrome CDP command: ${method}`, { cause: error }))
      }
    }).then((response) => {
      if (response.error) throw new Error(response.error.message)
      return response
    })
  }

  async evaluate(expression: string): Promise<JsonValue | undefined> {
    const response = await this.command('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    })
    return response.result?.result?.value
  }

  browserCommand(method: string, params: Record<string, JsonValue> = {}): Promise<CdpResponse> {
    return this.command(method, params, false)
  }

  private rejectPending(error: Error): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout)
      pending.reject(new Error(`${error.message} Pending command: ${pending.method}`))
    }
    this.pending.clear()
  }
}

function writeProjectFile(projectPath: string, relativePath: string, content: string): void {
  const fullPath = path.join(projectPath, relativePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, content)
}

type FixtureMode = 'ready' | 'blocked'

function createFixtureProject(mode: FixtureMode = 'ready'): string {
  const failed = mode === 'blocked'
  const projectPath = fs.mkdtempSync(path.join(os.tmpdir(), 'compass-browser-'))
  writeProjectFile(projectPath, 'AGENTS.md', '# Agent instructions\n')
  writeProjectFile(
    projectPath,
    'docs/14_SESSION_HANDOFF.md',
    [
      '# Handoff',
      '',
      '## Current state / focus',
      '',
      failed ? 'Rendered monitor smoke fixture. **Next:** fix failed run.' : 'Rendered monitor smoke fixture. **Next:** prepare detach package.',
      '',
      '## Recent sessions',
      '- **2026-08-07** — Browser fixture session.',
      '',
    ].join('\n'),
  )
  writeProjectFile(projectPath, 'docs/NIGHTRAVEN_REPO_OVERLAY.md', '# Overlay\n')
  writeProjectFile(projectPath, 'docs/PROJECT_SCOPE.md', '# Scope\n')
  writeProjectFile(projectPath, 'docs/PROJECT_DECISIONS.md', '# Decisions\n')
  writeProjectFile(projectPath, 'docs/NIGHTRAVEN_ROADMAP.md', '# Roadmap\n')
  writeProjectFile(projectPath, 'docs/02_ENGINEERING_CHANGELOG.md', '# Changelog\n')
  writeProjectFile(projectPath, 'docs/04_LEARNING_LOG.md', '# Learning\n')
  writeProjectFile(projectPath, 'PROJECT_STATE.md', '# Project State\n')
  writeProjectFile(projectPath, 'APP_FINAL_FORM_GOAL.md', '# App Final Form Goal\n')
  writeProjectFile(
    projectPath,
    '.nightraven/file-claims.json',
    failed ? '{"claims":[{"path":".nightraven/file-claims.json","status":"claimed"}]}\n' : '{"claims":[]}\n',
  )
  writeProjectFile(
    projectPath,
    'docs/PARALLEL_RUN_STATUS.md',
    [
      '_Generated 2026-08-07T12:00:00.000Z by NightRaven Orchestrator._',
      '',
      '| Stream | Agent | Scope | Status | Notes |',
      '| --- | --- | --- | --- | --- |',
      failed
        ? '| rendered-monitor | Codex | apps/compass/server/monitorBrowserSmoke.test.ts | failed | browser smoke failed |'
        : '| rendered-monitor | Codex | apps/compass/server/monitorBrowserSmoke.test.ts | passed | browser smoke passed |',
      '',
    ].join('\n'),
  )
  writeProjectFile(
    projectPath,
    'docs/ledgers/BUILD_LEDGER.md',
    [
      '## [2026-08-07] Feature Builder - rendered monitor smoke',
      '- Event: FeatureBuilt',
      '- Files modified: apps/compass/server/monitorBrowserSmoke.test.ts',
      '',
    ].join('\n'),
  )
  writeProjectFile(
    projectPath,
    'docs/ledgers/AUDIT_LEDGER.md',
    [
      '## [2026-08-07] General Auditor - rendered monitor smoke',
      '- Event: AuditCompleted',
      '- Findings: pass',
      '',
    ].join('\n'),
  )
  return projectPath
}

function sendJson(res: http.ServerResponse, body: unknown): void {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function fixtureApiPlugin(projectPath: string): Plugin {
  const registry: RegistryEntry[] = [
    {
      path: projectPath,
      label: 'Rendered Monitor Fixture',
      role: 'framework',
      available: true,
    },
  ]
  function snapshot(): ProjectSnapshot {
    const loadedAt = new Date().toISOString()
    const project: Project = {
      id: 'fixture',
      name: 'Rendered Monitor Fixture',
      concept: 'Fixture-backed monitor browser smoke.',
      status: 'ready',
      currentPhaseId: 'phase-monitor',
      scopeLocked: true,
      createdAt: loadedAt,
      updatedAt: loadedAt,
    }
    const fileCatalog = buildProjectFileCatalog(projectPath)
    const monitor = buildProjectMonitorSnapshot(fileCatalog, {
      handoffFound: true,
      overlayFound: true,
      tasks: [],
      blockers: [],
      decisions: [],
      auditItems: [],
    })
    return {
      registry,
      project,
      phases: [
        {
          id: 'phase-monitor',
          projectId: project.id,
          name: 'Monitor smoke',
          goal: 'Validate monitor pages render current evidence.',
          order: 1,
          status: 'done',
          doneCriteria: ['Files page renders', 'Runs page renders', 'Detach page renders'],
          notAllowedYet: [],
        },
      ],
      tasks: [
        {
          id: 'task-monitor-smoke',
          projectId: project.id,
          phaseId: 'phase-monitor',
          title: 'Rendered monitor smoke',
          description: 'Verify monitor pages render fixture-backed evidence.',
          why: 'Rendered pages can regress independently from API serialization.',
          type: 'test',
          priority: 'P1',
          lane: 'done',
          state: 'done',
          owner: 'nightraven_builder',
          dependencies: [],
          acceptanceCriteria: ['Files, Runs, and Detach are visible'],
          allowedAreas: ['apps/compass/server'],
          notAllowedChanges: [],
          auditRequired: false,
        },
      ],
      decisions: [],
      blockers: [],
      notNowItems: [],
      auditItems: [],
      promptCards: [],
      progress: {
        projectId: project.id,
        scopeProgress: 100,
        buildProgress: 100,
        auditProgress: 100,
        decisionProgress: 100,
        shippingProgress: 100,
        learningProgress: 100,
      },
      memoryFeed: [
        {
          id: 'fixture-session',
          date: '2026-08-07',
          kind: 'session',
          title: 'Browser fixture session',
          text: 'Rendered monitor browser smoke fixture.',
          source: 'docs/14_SESSION_HANDOFF.md',
        },
      ],
      loopSignals: [],
      doneCriteria: [],
      reports: [],
      fileCatalog,
      monitor,
      nextMove: buildNextMove(monitor),
      evolution: {
        currentVersion: 'fixture',
        currentStage: 'smoke',
        goal: 'Validate monitor rendering',
        corePromise: 'Compass points to evidence-backed next steps.',
        lastUpdated: loadedAt,
        requiredScreens: ['Files', 'Runs', 'Detach'],
        definitionOfDone: ['Rendered smoke passes'],
        mockupItems: [],
        integrityFindings: [],
        nextVersionTarget: 'fixture',
        upgradeThesis: 'No upgrade in fixture.',
        versionDeltaGate: 'Smoke only.',
        trackingFiles: [],
        changelogEntries: [],
      },
      settings: {
        dataMode: 'registry',
        autoRefresh: false,
        showPhaseBadges: true,
        projectRootHint: projectPath,
      },
      meta: {
        projectPath,
        handoffFound: true,
        overlayFound: true,
        artifactCount: fileCatalog.filter((entry) => entry.status === 'present').length,
        artifactTotal: fileCatalog.length,
        snapshotVersion: 'fixture-version',
        loadedAt,
      },
    }
  }
  return {
    name: 'monitor-browser-fixture-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (url.pathname === '/api/registry') {
          sendJson(res, { registry })
          return
        }
        if (url.pathname === '/api/project/version') {
          sendJson(res, { snapshotVersion: 'fixture-version', checkedAt: new Date().toISOString() })
          return
        }
        if (url.pathname === '/api/project/files') {
          sendJson(res, {
            fileCatalog: buildProjectFileCatalog(projectPath),
            checkedAt: new Date().toISOString(),
          })
          return
        }
        if (url.pathname === '/api/project') {
          sendJson(res, snapshot())
          return
        }
        next()
      })
    },
  }
}

async function startFixtureServer(projectPath: string): Promise<{ server: ViteDevServer; baseUrl: string }> {
  const server = await createServer({
    configFile: false,
    root: process.cwd(),
    logLevel: 'silent',
    plugins: [fixtureApiPlugin(projectPath), react()],
    server: { host: '127.0.0.1', port: 0 },
  })
  try {
    await withDeadline(server.listen(), 'Vite fixture server listen')
    const address = server.httpServer?.address()
    assert.ok(address && typeof address === 'object', 'Expected Vite server address')
    const baseUrl = `http://127.0.0.1:${address.port}`
    await withDeadline(server.warmupRequest('/src/main.tsx'), 'Vite fixture warmup')
    await waitForFixtureReady(baseUrl)
    return { server, baseUrl }
  } catch (error) {
    try {
      await withDeadline(server.close(), 'Vite fixture server close after startup failure')
    } catch (cleanupError) {
      throw new AggregateError(
        [error],
        'Unable to start or close the monitor browser fixture server.',
        { cause: cleanupError },
      )
    }
    throw new Error('Unable to start the monitor browser fixture server.', { cause: error })
  }
}

function chromeExecutable(): string | undefined {
  const candidates = [
    process.env.CHROME_BIN,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ].filter((candidate): candidate is string => Boolean(candidate))
  return candidates.find((candidate) => fs.existsSync(candidate))
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      server.close(() => {
        if (address && typeof address === 'object') resolve(address.port)
        else reject(new Error('Unable to allocate local port'))
      })
    })
    server.on('error', reject)
  })
}

async function fetchText(url: string, timeoutMs = CDP_COMMAND_TIMEOUT_MS): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => {
        body += chunk
      })
      response.on('end', () => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`HTTP ${response.statusCode ?? 'unknown'} from ${url}`))
          return
        }
        resolve(body)
      })
    })
    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`Timed out requesting ${url}`))
    })
    request.on('error', reject)
  })
}

async function fetchJson<T>(url: string, timeoutMs = CDP_COMMAND_TIMEOUT_MS): Promise<T> {
  return JSON.parse(await fetchText(url, timeoutMs)) as T
}

async function waitForFixtureReady(baseUrl: string): Promise<void> {
  const started = Date.now()
  let lastError = ''
  while (Date.now() - started < FIXTURE_READY_TIMEOUT_MS) {
    try {
      const [html, snapshot] = await Promise.all([
        fetchText(baseUrl),
        fetchJson<{ project?: { name?: string } }>(`${baseUrl}/api/project`),
      ])
      assert.match(html, /id=["']root["']/, 'Expected Compass root element')
      assert.equal(snapshot.project?.name, 'Rendered Monitor Fixture')
      return
    } catch (error) {
      lastError = String(error)
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }
  throw new Error(`Timed out waiting for the monitor fixture server: ${lastError}`)
}

type ChromeEndpoint =
  | { kind: 'page'; webSocketDebuggerUrl: string }
  | { kind: 'browser'; webSocketDebuggerUrl: string }

function browserWebSocketFromStderr(stderr: string): string | undefined {
  return stderr.match(/DevTools listening on (ws:\/\/\S+)/)?.[1]
}

async function waitForChromeEndpoint(
  url: string,
  chrome: ChildProcess,
  getStderr: () => string,
): Promise<ChromeEndpoint> {
  const started = Date.now()
  let lastError = ''
  while (Date.now() - started < CHROME_READY_TIMEOUT_MS) {
    try {
      const tabs = await fetchJson<Array<{ type: string; url?: string; webSocketDebuggerUrl?: string }>>(
        url,
        CHROME_PROBE_TIMEOUT_MS,
      )
      const page = tabs.find((tab) => tab.type === 'page' && tab.url === 'about:blank' && tab.webSocketDebuggerUrl)
        ?? tabs.find((tab) => tab.type === 'page' && tab.webSocketDebuggerUrl)
      if (page?.webSocketDebuggerUrl) {
        return { kind: 'page', webSocketDebuggerUrl: page.webSocketDebuggerUrl }
      }
      lastError = 'Chrome target list did not include a page websocket.'
    } catch (error) {
      lastError = String(error)
      const browserWebSocket = browserWebSocketFromStderr(getStderr())
      if (browserWebSocket) {
        return { kind: 'browser', webSocketDebuggerUrl: browserWebSocket }
      }
      if (chrome.exitCode !== null || chrome.signalCode !== null) {
        const detail = getStderr().trim()
        throw new Error(
          `Chrome exited before remote debugging was ready (${chrome.exitCode ?? chrome.signalCode ?? 'unknown'}).${
            detail ? ` stderr: ${detail}` : ''
          }`,
          { cause: error },
        )
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  const detail = getStderr().trim()
  throw new Error(`Timed out waiting for ${url}: ${lastError}.${detail ? ` Chrome stderr: ${detail}` : ''}`)
}

async function connectChromePage(
  endpoint: ChromeEndpoint,
  connect: (url: string) => Promise<CdpClient> = CdpClient.connect,
): Promise<CdpClient> {
  const client = await connect(endpoint.webSocketDebuggerUrl)
  try {
    if (endpoint.kind === 'browser') {
      const targets = await client.browserCommand('Target.getTargets')
      let targetId = targets.result?.targetInfos?.find((target) => target.type === 'page' && target.url === 'about:blank')
        ?.targetId
        ?? targets.result?.targetInfos?.find((target) => target.type === 'page')?.targetId
      if (!targetId) {
        const created = await client.browserCommand('Target.createTarget', { url: 'about:blank' })
        targetId = created.result?.targetId
      }
      assert.ok(targetId, 'Expected Chrome page target ID')
      const attached = await client.browserCommand('Target.attachToTarget', { targetId, flatten: true })
      assert.ok(attached.result?.sessionId, 'Expected Chrome page session ID')
      client.useSession(attached.result.sessionId)
    }
    await client.command('Page.enable')
    await client.command('Runtime.enable')
    return client
  } catch (error) {
    client.close()
    throw new Error('Unable to initialize the Chrome CDP page session.', { cause: error })
  }
}

function waitForProcessSpawn(child: ChildProcess, timeoutMs = CHROME_SPAWN_TIMEOUT_MS): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      clearTimeout(timeout)
      child.removeListener('error', fail)
      child.removeListener('spawn', finish)
    }
    const finish = (): void => {
      cleanup()
      resolve()
    }
    const fail = (error: Error): void => {
      cleanup()
      reject(new Error('Chrome process failed to spawn.', { cause: error }))
    }
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error(`Timed out after ${timeoutMs}ms waiting for Chrome to spawn.`))
    }, timeoutMs)
    child.once('error', fail)
    child.once('spawn', finish)
  })
}

async function launchChrome(executable = chromeExecutable()): Promise<{
  client: CdpClient
  process: ChildProcess
  userDataDir: string
}> {
  if (!executable) throw new Error('Chrome executable not found; set CHROME_BIN to run browser smoke.')

  const debugPort = await getFreePort()
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compass-chrome-'))
  let chromeStderr = ''
  let chrome: ChildProcess | undefined
  try {
    chrome = spawn(executable, [
      '--headless=new',
      `--remote-debugging-port=${debugPort}`,
      '--remote-debugging-address=127.0.0.1',
      `--user-data-dir=${userDataDir}`,
      '--disable-gpu',
      '--disable-breakpad',
      '--disable-crash-reporter',
      '--no-first-run',
      '--no-default-browser-check',
      '--noerrdialogs',
      'about:blank',
    ], { stdio: ['ignore', 'ignore', 'pipe'] })
    chrome.stderr?.setEncoding('utf8')
    chrome.stderr?.on('data', (chunk: string) => {
      chromeStderr = `${chromeStderr}${chunk}`.slice(-4_000)
    })
    await waitForProcessSpawn(chrome)
    const endpoint = await waitForChromeEndpoint(
      `http://127.0.0.1:${debugPort}/json/list`,
      chrome,
      () => chromeStderr,
    )
    const client = await connectChromePage(endpoint)
    return { client, process: chrome, userDataDir }
  } catch (error) {
    const cleanupFailures: unknown[] = []
    try {
      if (chrome?.pid !== undefined && chrome.exitCode === null && chrome.signalCode === null) {
        await terminateProcess(chrome)
      }
    } catch (cleanupError) {
      cleanupFailures.push(cleanupError)
    } finally {
      chrome?.stderr?.destroy()
    }
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
    } catch (cleanupError) {
      cleanupFailures.push(cleanupError)
    }
    if (cleanupFailures.length > 0) {
      throw new AggregateError(
        [error, ...cleanupFailures],
        'Unable to launch or clean up Chrome for the monitor browser smoke.',
        { cause: error },
      )
    }
    throw new Error('Unable to launch Chrome for the monitor browser smoke.', { cause: error })
  }
}

async function terminateChrome(browser: Awaited<ReturnType<typeof launchChrome>>): Promise<void> {
  if (browser.process.exitCode === null && browser.process.signalCode === null) {
    try {
      await browser.client.browserCommand('Browser.close')
    } catch {
      // The bounded CDP command can fail when Chrome already disconnected; force termination below.
    }
  }
  browser.client.close()
  try {
    await terminateProcess(browser.process)
  } finally {
    browser.process.stderr?.destroy()
  }
  fs.rmSync(browser.userDataDir, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  })
}

function waitForProcessExit(child: ChildProcess, timeoutMs: number): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      clearTimeout(timeout)
      child.removeListener('error', fail)
      child.removeListener('exit', finish)
    }
    const finish = (): void => {
      cleanup()
      resolve()
    }
    const fail = (error: Error): void => {
      cleanup()
      reject(new Error('Child process failed while waiting for exit.', { cause: error }))
    }
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error(`Timed out waiting ${timeoutMs}ms for Chrome process ${child.pid ?? 'unknown'} to exit.`))
    }, timeoutMs)
    child.once('error', fail)
    child.once('exit', finish)
  })
}

async function terminateProcess(
  child: ChildProcess,
  gracefulTimeoutMs = 1_000,
  forceTimeoutMs = PROCESS_EXIT_TIMEOUT_MS,
): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return
  try {
    await waitForProcessExit(child, gracefulTimeoutMs)
    return
  } catch (error) {
    if (child.exitCode !== null || child.signalCode !== null) return
    if (!child.kill('SIGKILL')) {
      throw new Error(`Unable to force Chrome process ${child.pid ?? 'unknown'} to terminate.`, { cause: error })
    }
  }
  await waitForProcessExit(child, forceTimeoutMs)
}

async function cleanupFixture(
  browser: Awaited<ReturnType<typeof launchChrome>> | undefined,
  server: ViteDevServer | undefined,
  projectPath: string,
): Promise<void> {
  const failures: unknown[] = []
  if (browser) {
    try {
      await terminateChrome(browser)
    } catch (error) {
      failures.push(error)
    }
  }
  try {
    if (server) await withDeadline(server.close(), 'Vite fixture server close')
  } catch (error) {
    failures.push(error)
  }
  try {
    fs.rmSync(projectPath, { recursive: true, force: true })
  } catch (error) {
    failures.push(error)
  }
  if (failures.length > 0) {
    throw new AggregateError(failures, 'Monitor browser fixture cleanup failed.')
  }
}

async function waitForText(client: CdpClient, text: string): Promise<string> {
  const started = Date.now()
  let lastBodyText = ''
  while (Date.now() - started < VISIBLE_TEXT_TIMEOUT_MS) {
    const bodyText = await client.evaluate('document.body.innerText')
    if (typeof bodyText === 'string') {
      lastBodyText = bodyText
      if (bodyText.includes(text)) return bodyText
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  const location = await client.evaluate('window.location.href')
  throw new Error(
    `Timed out waiting for visible text: ${text}. Location: ${String(location)}. `
      + `Body: ${lastBodyText.slice(0, 500) || '<empty>'}`,
  )
}

async function navigateAndWaitForText(client: CdpClient, url: string, text: string): Promise<string> {
  const response = await client.command('Page.navigate', { url })
  assert.equal(response.result?.errorText, undefined, `Expected Chrome to navigate to ${url}`)
  return waitForText(client, text)
}

async function clickNav(client: CdpClient, label: string, waitText: string): Promise<string> {
  const escaped = JSON.stringify(label)
  const result = await client.evaluate(`
    (() => {
      const button = [...document.querySelectorAll('button')].find((element) => element.textContent?.includes(${escaped}));
      if (!button) return 'missing';
      button.click();
      return 'clicked';
    })()
  `)
  assert.equal(result, 'clicked', `Expected nav button ${label}`)
  return waitForText(client, waitText)
}

test('forced process cleanup waits for the child to exit', async (context: TestContext) => {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1_000)'], { stdio: 'ignore' })
  context.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL')
      await waitForProcessExit(child, PROCESS_EXIT_TIMEOUT_MS)
    }
  })
  await new Promise<void>((resolve, reject) => {
    child.once('error', reject)
    child.once('spawn', resolve)
  })

  await terminateProcess(child, 10)

  assert.ok(child.exitCode !== null || child.signalCode !== null, 'Expected the child process to be reaped')
})

test('CDP connection timeout closes a socket that never opens', async () => {
  let closed = false
  const socket = {
    addEventListener: () => undefined,
    close: () => {
      closed = true
    },
    send: () => undefined,
  } as unknown as WebSocket

  await assert.rejects(
    CdpClient.connect('ws://127.0.0.1:1/devtools/browser/stalled', 10, () => socket),
    /Timed out after 10ms connecting to Chrome CDP/,
  )
  assert.equal(closed, true)
})

test('CDP connection timeout closes a real stalled WebSocket handshake', async () => {
  const sockets = new Set<net.Socket>()
  let peerClosed = false
  let resolvePeerClosed: (() => void) | undefined
  const peerClosedPromise = new Promise<void>((resolve) => {
    resolvePeerClosed = resolve
  })
  const server = net.createServer((socket) => {
    sockets.add(socket)
    socket.resume()
    socket.once('close', () => {
      sockets.delete(socket)
      peerClosed = true
      resolvePeerClosed?.()
    })
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => resolve())
  })
  const address = server.address()
  assert.ok(address && typeof address === 'object', 'Expected a local TCP fixture address')

  try {
    await assert.rejects(
      CdpClient.connect(`ws://127.0.0.1:${address.port}/devtools/browser/stalled`, 100),
      /Timed out after 100ms connecting to Chrome CDP/,
    )
    await Promise.race([
      peerClosedPromise,
      new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Stalled handshake peer stayed open.')), 1_000)),
    ])
    assert.equal(peerClosed, true)
  } finally {
    for (const socket of sockets) socket.destroy()
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})

test('Chrome spawn failure is prompt and removes its isolated profile', async () => {
  const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compass-non-executable-'))
  const nonExecutable = path.join(fixtureDir, 'chrome')
  const profilesBefore = fs.readdirSync(os.tmpdir()).filter((name) => name.startsWith('compass-chrome-')).sort()
  fs.writeFileSync(nonExecutable, '#!/bin/sh\nexit 0\n', { mode: 0o600 })
  try {
    await assert.rejects(launchChrome(nonExecutable), (error) => {
      assert.match(String(error), /Unable to launch Chrome for the monitor browser smoke/)
      assert.match(String((error as Error & { cause?: unknown }).cause), /Chrome process failed to spawn/)
      return true
    })
    const profilesAfter = fs.readdirSync(os.tmpdir()).filter((name) => name.startsWith('compass-chrome-')).sort()
    assert.deepEqual(profilesAfter, profilesBefore)
  } finally {
    fs.rmSync(fixtureDir, { recursive: true, force: true })
  }
})

test('CDP page setup failure closes the partial client', async () => {
  let closed = false
  const client = {
    browserCommand: async () => {
      throw new Error('fixture setup failure')
    },
    close: () => {
      closed = true
    },
  } as unknown as CdpClient

  await assert.rejects(
    connectChromePage(
      { kind: 'browser', webSocketDebuggerUrl: 'ws://127.0.0.1/devtools/browser/fixture' },
      async () => client,
    ),
    /Unable to initialize the Chrome CDP page session/,
  )
  assert.equal(closed, true)
})

test(
  'rendered monitor pages show fixture-backed ready and blocked signals',
  { timeout: MONITOR_BROWSER_SCENARIO_TIMEOUT_MS },
  async () => {
  const projectPath = createFixtureProject()
  let server: ViteDevServer | undefined
  let browser: Awaited<ReturnType<typeof launchChrome>> | undefined
  try {
    const app = await startFixtureServer(projectPath)
    server = app.server
    browser = await launchChrome()
    await navigateAndWaitForText(browser.client, app.baseUrl, 'Rendered Monitor Fixture')

    const filesText = await clickNav(browser.client, 'Files', 'Friendly file and folder map')
    assert.match(filesText, /Friendly file and folder map/)
    assert.match(filesText, /Run Status/)
    assert.match(filesText, /Build: built/)

    const runsText = await clickNav(browser.client, 'Runs', 'Build, audit, and run evidence')
    assert.match(runsText, /Build, audit, and run evidence/)
    assert.match(runsText, /Ready To Detach/)
    assert.match(runsText, /Run Status/)

    const detachText = await clickNav(browser.client, 'Detach', 'Project can prepare to detach')
    assert.match(detachText, /Project can prepare to detach/)
    assert.match(detachText, /Pass\s+Changed files clear/)
    assert.match(detachText, /Prepare detach package/)

    writeProjectFile(
      projectPath,
      '.nightraven/file-claims.json',
      '{"claims":[{"path":".nightraven/file-claims.json","status":"claimed"}]}\n',
    )
    writeProjectFile(
      projectPath,
      'docs/PARALLEL_RUN_STATUS.md',
      [
        '_Generated 2026-08-13T12:00:00.000Z by NightRaven Orchestrator._',
        '',
        '| Stream | Agent | Scope | Status | Notes |',
        '| --- | --- | --- | --- | --- |',
        '| rendered-monitor | Codex | apps/compass/server/monitorBrowserSmoke.test.ts | failed | browser smoke failed |',
        '',
      ].join('\n'),
    )
    await navigateAndWaitForText(browser.client, app.baseUrl, 'Rendered Monitor Fixture')

    const blockedFilesText = await clickNav(browser.client, 'Files', 'Friendly file and folder map')
    assert.match(blockedFilesText, /File Claims/)
    assert.match(blockedFilesText, /Claim: claimed/)
    assert.match(blockedFilesText, /Run Status/)
    assert.match(blockedFilesText, /Audit: fail/)

    const blockedRunsText = await clickNav(browser.client, 'Runs', 'Build, audit, and run evidence')
    assert.match(blockedRunsText, /Fix Needed/)
    assert.match(blockedRunsText, /Fix build failure/)

    const blockedDetachText = await clickNav(browser.client, 'Detach', 'Project is not ready to detach')
    assert.match(blockedDetachText, /Blocked\s+No blocking file claims/)
    assert.match(blockedDetachText, /Fix build failure/)
    assert.match(blockedDetachText, /Current run status has failed stream evidence/)
  } finally {
    await cleanupFixture(browser, server, projectPath)
  }
  },
)
