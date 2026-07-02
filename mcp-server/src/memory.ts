import { constants as fsConstants } from "node:fs";
import { access, lstat, open, readFile, realpath } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

export interface MemorySlot {
  id: string;
  label: string;
  relativePath: string;
  layer: "L1" | "L2" | "L3";
  readOnlyDefault: boolean;
}

export const MEMORY_SLOTS: MemorySlot[] = [
  {
    id: "handoff",
    label: "Session handoff",
    relativePath: "docs/14_SESSION_HANDOFF.md",
    layer: "L3",
    readOnlyDefault: false,
  },
  {
    id: "changelog",
    label: "Engineering changelog",
    relativePath: "docs/02_ENGINEERING_CHANGELOG.md",
    layer: "L3",
    readOnlyDefault: false,
  },
  {
    id: "learning_log",
    label: "Learning log",
    relativePath: "docs/04_LEARNING_LOG.md",
    layer: "L3",
    readOnlyDefault: false,
  },
  {
    id: "overlay",
    label: "Repo overlay",
    relativePath: "docs/NIGHTRAVEN_REPO_OVERLAY.md",
    layer: "L3",
    readOnlyDefault: false,
  },
  {
    id: "bible",
    label: "Portable Bible",
    relativePath: "docs/37_NIGHTRAVEN.md",
    layer: "L2",
    readOnlyDefault: true,
  },
  {
    id: "agents",
    label: "AGENTS.md",
    relativePath: "AGENTS.md",
    layer: "L1",
    readOnlyDefault: false,
  },
  {
    id: "router",
    label: "Grand spec router",
    relativePath: "docs/NIGHTRAVEN_LAYERED_SPEC_ROUTER.md",
    layer: "L1",
    readOnlyDefault: true,
  },
  {
    id: "session_tree",
    label: "Session tree",
    relativePath: "docs/NIGHTRAVEN_SESSION_SPEC_TREES.md",
    layer: "L2",
    readOnlyDefault: true,
  },
];

export const READ_ORDER = [
  ".cursor/rules/nightraven-context-intent.mdc",
  "docs/37_NIGHTRAVEN.md (§0 — or $NIGHTRAVEN_ROOT when not vendored)",
  "docs/NIGHTRAVEN_REPO_OVERLAY.md (if present)",
  "docs/NIGHTRAVEN_LAYERED_SPEC_ROUTER.md (router — if present)",
  "docs/14_SESSION_HANDOFF.md → AGENTS.md",
];

export interface ProjectPaths {
  projectRoot: string;
  nightravenRoot: string;
}

export function resolveProjectRoot(): string {
  const candidates = [
    process.env.NIGHTRAVEN_PROJECT_ROOT,
    process.env.CURSOR_PROJECT_DIR,
    process.env.CLAUDE_PROJECT_DIR,
    process.cwd(),
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return path.resolve(candidate);
    }
  }

  return process.cwd();
}

export async function resolveNightRavenRoot(projectRoot: string): Promise<string> {
  const envRoot = process.env.NIGHTRAVEN_ROOT ?? process.env.NIGHTRAVEN_INSTALL_ROOT;
  const vendoredBible = path.join(projectRoot, "docs/37_NIGHTRAVEN.md");

  if (await fileExists(vendoredBible)) {
    return projectRoot;
  }

  if (envRoot && (await fileExists(path.join(envRoot, "docs/37_NIGHTRAVEN.md")))) {
    return path.resolve(envRoot);
  }

  const defaultCandidates = [
    path.join(process.env.HOME ?? "", "Developer/NightRaven/nightraven"),
    path.join(process.env.HOME ?? "", "Projects/nightraven"),
  ];
  for (const defaultRoot of defaultCandidates) {
    if (await fileExists(path.join(defaultRoot, "docs/37_NIGHTRAVEN.md"))) {
      return defaultRoot;
    }
  }

  return envRoot ? path.resolve(envRoot) : projectRoot;
}

export async function getProjectPaths(): Promise<ProjectPaths> {
  const projectRoot = resolveProjectRoot();
  const nightravenRoot = await resolveNightRavenRoot(projectRoot);
  return { projectRoot, nightravenRoot };
}

export function getSlot(slotId: string): MemorySlot | undefined {
  return MEMORY_SLOTS.find((slot) => slot.id === slotId);
}

export async function resolveSlotPath(
  slot: MemorySlot,
  paths: ProjectPaths
): Promise<{ absolutePath: string; exists: boolean }> {
  const projectCandidate = path.join(paths.projectRoot, slot.relativePath);
  if (await fileExists(projectCandidate)) {
    return { absolutePath: projectCandidate, exists: true };
  }

  if (slot.id === "bible" || slot.id === "router" || slot.id === "session_tree") {
    const rootCandidate = path.join(paths.nightravenRoot, slot.relativePath);
    if (await fileExists(rootCandidate)) {
      return { absolutePath: rootCandidate, exists: true };
    }
  }

  return { absolutePath: projectCandidate, exists: false };
}

export async function readMemoryDoc(
  slotId: string,
  paths: ProjectPaths
): Promise<{ slot: MemorySlot; path: string; content: string; exists: boolean }> {
  const slot = getSlot(slotId);
  if (!slot) {
    throw new Error(`Unknown memory slot "${slotId}". Use nightraven_list_memory_slots.`);
  }

  const resolved = await resolveSlotPath(slot, paths);
  if (!resolved.exists) {
    return {
      slot,
      path: resolved.absolutePath,
      content: "",
      exists: false,
    };
  }

  const content = await readFile(resolved.absolutePath, "utf8");
  return {
    slot,
    path: resolved.absolutePath,
    content,
    exists: true,
  };
}

export async function searchMemoryDocs(
  query: string,
  paths: ProjectPaths,
  maxResults = 20
): Promise<
  Array<{
    slot: string;
    path: string;
    line: number;
    text: string;
  }>
> {
  const results: Array<{
    slot: string;
    path: string;
    line: number;
    text: string;
  }> = [];

  const needle = query.toLowerCase();

  for (const slot of MEMORY_SLOTS) {
    const doc = await readMemoryDoc(slot.id, paths);
    if (!doc.exists) {
      continue;
    }

    const lines = doc.content.split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      if (!lines[index]?.toLowerCase().includes(needle)) {
        continue;
      }

      results.push({
        slot: slot.id,
        path: doc.path,
        line: index + 1,
        text: lines[index] ?? "",
      });

      if (results.length >= maxResults) {
        return results;
      }
    }
  }

  return results;
}

export async function appendRecentSession(
  entry: string,
  paths: ProjectPaths
): Promise<{ path: string; appended: string }> {
  const trimmed = entry.trim();
  if (!trimmed) {
    throw new Error("Entry must not be empty.");
  }

  if (trimmed.includes("\n")) {
    throw new Error("Entry must be a single line for Recent sessions.");
  }

  const handoff = await readMemoryDoc("handoff", paths);
  if (!handoff.exists) {
    throw new Error(
      `Handoff not found at ${handoff.path}. Bootstrap docs/14_SESSION_HANDOFF.md first.`
    );
  }

  const marker = "## Recent sessions";
  const markerIndex = handoff.content.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error('Handoff is missing "## Recent sessions" section.');
  }

  const afterMarker = handoff.content.indexOf("\n", markerIndex);
  const insertAt = afterMarker === -1 ? handoff.content.length : afterMarker + 1;
  const prefix = handoff.content.slice(0, insertAt);
  const suffix = handoff.content.slice(insertAt);
  const line = `- **${todayIso()}** — ${trimmed}\n`;
  const nextContent = `${prefix}${line}${suffix}`;

  if (nextContent.length < handoff.content.length) {
    throw new Error("Refusing append: content would shrink (+# only).");
  }

  await assertSafeProjectDocsPath(handoff.path, paths.projectRoot);
  await writeFileNoFollow(handoff.path, nextContent);
  return { path: handoff.path, appended: line.trim() };
}

export async function listAvailableSlots(
  paths: ProjectPaths
): Promise<
  Array<{
    id: string;
    label: string;
    layer: string;
    relativePath: string;
    absolutePath: string;
    exists: boolean;
    readOnlyDefault: boolean;
  }>
> {
  const rows = [];
  for (const slot of MEMORY_SLOTS) {
    const resolved = await resolveSlotPath(slot, paths);
    rows.push({
      id: slot.id,
      label: slot.label,
      layer: slot.layer,
      relativePath: slot.relativePath,
      absolutePath: resolved.absolutePath,
      exists: resolved.exists,
      readOnlyDefault: slot.readOnlyDefault,
    });
  }
  return rows;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function assertSafeProjectDocsPath(filePath: string, projectRoot: string): Promise<void> {
  const resolvedProjectRoot = await realpath(projectRoot).catch(() => path.resolve(projectRoot));
  const docsRoot = path.join(resolvedProjectRoot, "docs");
  const resolvedFilePath = path.resolve(filePath);
  const fileStat = await lstat(resolvedFilePath);
  if (fileStat.isSymbolicLink()) {
    throw new Error(`Refusing append: handoff path is a symlink (${resolvedFilePath}).`);
  }

  const canonicalFilePath = await realpath(resolvedFilePath);
  const relativeToDocs = path.relative(docsRoot, canonicalFilePath);
  if (relativeToDocs.startsWith("..") || path.isAbsolute(relativeToDocs)) {
    throw new Error(
      `Refusing append: handoff path resolves outside project docs (${canonicalFilePath}).`
    );
  }
}

async function writeFileNoFollow(filePath: string, content: string): Promise<void> {
  const noFollowFlag =
    typeof fsConstants.O_NOFOLLOW === "number" ? fsConstants.O_NOFOLLOW : 0;
  const fileHandle = await open(filePath, fsConstants.O_WRONLY | fsConstants.O_TRUNC | noFollowFlag);
  try {
    await fileHandle.writeFile(content, "utf8");
  } finally {
    await fileHandle.close();
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function gitTopLevel(startDir: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--show-toplevel"], {
      cwd: startDir,
    });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}
