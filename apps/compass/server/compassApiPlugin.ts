import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import type { Connect } from 'vite'
import type { Plugin } from 'vite'
import { buildProjectSnapshot, computeSnapshotVersion, loadRegistry } from './buildSnapshot'
import { buildProjectFileCatalog } from './projectMonitor'

function findMonorepoRoot(): string {
  let dir = process.cwd()
  for (let i = 0; i < 6; i += 1) {
    if (fs.existsSync(path.join(dir, 'scripts', 'nightraven-projects.conf'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return path.resolve(process.cwd(), '../..')
}

function sendJson(res: import('node:http').ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function readJsonBody(req: import('node:http').IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += String(chunk)
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function isPathInside(base: string, target: string): boolean {
  const relative = path.relative(base, target)
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
}

function isPathInsideOrEqual(base: string, target: string): boolean {
  const relative = path.relative(base, target)
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

const generatedOutputDirs = ['docs/generated', '.codex/generated'] as const

function resolveGeneratedTarget(projectPath: string, relativePath: string): string | null {
  const normalizedRelative = relativePath.replace(/\\/g, '/')
  const targetPath = path.resolve(projectPath, normalizedRelative)
  const allowedRoot = generatedOutputDirs
    .map((dir) => path.resolve(projectPath, dir))
    .find((dir) => isPathInside(dir, targetPath))

  return allowedRoot ? targetPath : null
}

function resolveProjectTarget(projectPath: string, targetPath: string): string {
  const normalizedTarget = path.normalize(targetPath)
  if (path.isAbsolute(normalizedTarget)) return path.resolve(normalizedTarget)
  return path.resolve(projectPath, normalizedTarget)
}

function openWindowsExplorer(targetPath: string, mode: 'open' | 'reveal'): Promise<void> {
  return new Promise((resolve, reject) => {
    const args =
      mode === 'reveal' && fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()
        ? [`/select,${targetPath}`]
        : [targetPath]
    execFile('explorer.exe', args, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

function attachApi(server: { middlewares: Connect.Server }, monorepoRoot: string) {
  const confPath = path.join(monorepoRoot, 'scripts', 'nightraven-projects.conf')

  server.middlewares.use('/api/registry', (_req, res) => {
    try {
      const registry = loadRegistry(confPath, monorepoRoot)
      sendJson(res, 200, { registry })
    } catch (error) {
      sendJson(res, 500, { error: String(error) })
    }
  })

  server.middlewares.use('/api/project/version', (req, res) => {
    try {
      const url = new URL(req.url ?? '', 'http://localhost')
      const projectPath = url.searchParams.get('path')

      if (!projectPath) {
        sendJson(res, 400, { error: 'Missing path query parameter' })
        return
      }

      const normalized = path.normalize(projectPath)
      if (!fs.existsSync(normalized)) {
        sendJson(res, 404, { error: `Project path not found: ${normalized}` })
        return
      }

      sendJson(res, 200, {
        snapshotVersion: computeSnapshotVersion(normalized),
        checkedAt: new Date().toISOString(),
      })
    } catch (error) {
      sendJson(res, 500, { error: String(error) })
    }
  })

  server.middlewares.use('/api/project/files', (req, res) => {
    try {
      const url = new URL(req.url ?? '', 'http://localhost')
      const projectPath = url.searchParams.get('path')

      if (!projectPath) {
        sendJson(res, 400, { error: 'Missing path query parameter' })
        return
      }

      const normalized = path.resolve(path.normalize(projectPath))
      if (!fs.existsSync(normalized)) {
        sendJson(res, 404, { error: `Project path not found: ${normalized}` })
        return
      }

      sendJson(res, 200, {
        fileCatalog: buildProjectFileCatalog(normalized),
        checkedAt: new Date().toISOString(),
      })
    } catch (error) {
      sendJson(res, 500, { error: String(error) })
    }
  })

  server.middlewares.use('/api/project', (req, res) => {
    try {
      const url = new URL(req.url ?? '', 'http://localhost')
      const projectPath = url.searchParams.get('path')
      const label = url.searchParams.get('label') ?? path.basename(projectPath ?? 'project')

      if (!projectPath) {
        sendJson(res, 400, { error: 'Missing path query parameter' })
        return
      }

      const normalized = path.normalize(projectPath)
      if (!fs.existsSync(normalized)) {
        sendJson(res, 404, { error: `Project path not found: ${normalized}` })
        return
      }

      const registry = loadRegistry(confPath, monorepoRoot)
      const snapshot = buildProjectSnapshot(normalized, label, registry)
      sendJson(res, 200, snapshot)
    } catch (error) {
      sendJson(res, 500, { error: String(error) })
    }
  })

  server.middlewares.use('/api/system/open-path', async (req, res) => {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' })
      return
    }

    try {
      const body = (await readJsonBody(req)) as {
        projectPath?: string
        targetPath?: string
        mode?: string
      }

      if (!body.projectPath || !body.targetPath || !body.mode) {
        sendJson(res, 400, { error: 'Missing projectPath, targetPath, or mode' })
        return
      }

      if (body.mode !== 'open' && body.mode !== 'reveal') {
        sendJson(res, 400, { error: 'Unsupported mode. Use "open" or "reveal".' })
        return
      }

      const projectPath = path.resolve(path.normalize(body.projectPath))
      if (!fs.existsSync(projectPath)) {
        sendJson(res, 404, { error: `Project path not found: ${projectPath}` })
        return
      }

      const targetPath = resolveProjectTarget(projectPath, body.targetPath)
      if (!isPathInsideOrEqual(projectPath, targetPath)) {
        sendJson(res, 400, { error: 'Target path escapes project root' })
        return
      }

      if (!fs.existsSync(targetPath)) {
        sendJson(res, 404, { error: `Target path not found: ${targetPath}` })
        return
      }

      if (process.platform !== 'win32') {
        sendJson(res, 501, {
          error: 'System File Explorer integration is Windows-only in this version.',
          platform: process.platform,
        })
        return
      }

      await openWindowsExplorer(targetPath, body.mode)
      sendJson(res, 200, {
        ok: true,
        mode: body.mode,
        targetPath,
        openedAt: new Date().toISOString(),
      })
    } catch (error) {
      sendJson(res, 500, { error: String(error) })
    }
  })

  server.middlewares.use('/api/generate-file', async (req, res) => {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed' })
      return
    }

    try {
      const body = (await readJsonBody(req)) as {
        projectPath?: string
        relativePath?: string
        content?: string
      }

      if (!body.projectPath || !body.relativePath || typeof body.content !== 'string') {
        sendJson(res, 400, { error: 'Missing projectPath, relativePath, or content' })
        return
      }

      const projectPath = path.resolve(path.normalize(body.projectPath))
      if (!fs.existsSync(projectPath)) {
        sendJson(res, 404, { error: `Project path not found: ${projectPath}` })
        return
      }

      const targetPath = resolveGeneratedTarget(projectPath, body.relativePath)
      if (!targetPath) {
        sendJson(res, 400, {
          error: 'Generated files are restricted to docs/generated/ or .codex/generated/',
        })
        return
      }

      if (!isPathInside(projectPath, targetPath)) {
        sendJson(res, 400, { error: 'Target path escapes project root' })
        return
      }

      fs.mkdirSync(path.dirname(targetPath), { recursive: true })
      fs.writeFileSync(targetPath, body.content, 'utf8')

      sendJson(res, 200, {
        ok: true,
        artifactPath: path.relative(projectPath, targetPath).replace(/\\/g, '/'),
        absolutePath: targetPath,
        writtenAt: new Date().toISOString(),
      })
    } catch (error) {
      sendJson(res, 500, { error: String(error) })
    }
  })
}

export function compassApiPlugin(): Plugin {
  const monorepoRoot = findMonorepoRoot()

  return {
    name: 'compass-api',
    configureServer(server) {
      attachApi(server, monorepoRoot)
    },
    configurePreviewServer(server) {
      attachApi(server, monorepoRoot)
    },
  }
}
