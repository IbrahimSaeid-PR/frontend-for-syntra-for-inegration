/**
 * In-memory conversation store — the frontend-only investigation engine.
 *
 * Conversations live for the browser session (never persisted, never sent
 * anywhere). Questions are resolved against the local demo corpus:
 * safety rules first, then domain knowledge, then honest fallbacks —
 * the same evaluation order the UI copy describes.
 *
 * The security layer still applies: every question/title passes through
 * src/security validation at the call sites, and the corpus output is
 * plain rendered data. The delay/failure triggers give the UI observable
 * loading and error states without any backend.
 *
 * Failure triggers inside a question:
 *  - "fail" or "error" → temporary failure (error state demo)
 *  - "slow"            → multi-second latency (loading state demo)
 */
import {
  defaultLabFor,
  DOMAIN_MATCHERS,
  genericFullReport,
  NO_RESULTS,
  OUT_OF_DOMAIN,
  SAFETY_MATCHERS,
} from "@/mock/corpus";
import { enforceFullReportPolicy } from "@/security/reportValidation";
import type {
  HistoryItem,
  Investigation,
  InvestigationResult,
  Thread,
} from "@/types/investigation";
import {
  fetchHistory,
  fetchHistoryThread,
  deleteHistoryThread,
  isRemoteApiConfigured,
} from "@/api/v1/client";
import { mapReport } from "@/api/v1/mapping";

const STORAGE_KEY = "syntra_conversations_v1";

function loadInitialStore(): Investigation[] {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {
    // Local storage unavailable or parse error
  }
  return [];
}

function persistToLocalStorage(items: Investigation[]): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    // Local storage write failure
  }
}

/** Store (newest first), persisted to localStorage and synchronized with backend. */
const store: Investigation[] = loadInitialStore();
const HISTORY_LIMIT = 60;
let idCounter = 0;

/**
 * Id of the conversation the user last had open — module-level so it
 * survives view unmounts (Investigate → History → Investigate resumes the
 * same chat instead of starting a new one). Session-only by design.
 */
let lastThreadId: string | null = null;

export function rememberThread(id: string | null): void {
  lastThreadId = id;
}

export function getLastThreadId(): string | null {
  return lastThreadId;
}

const FAILURE_PATTERN = /\b(fail|error)\b/i;
const SLOW_PATTERN = /\bslow\b/i;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function simulatedLatency(question: string): number {
  if (SLOW_PATTERN.test(question)) return 2600;
  return 850 + Math.floor(Math.random() * 500);
}

/**
 * Resolve a question against the demo corpus. Every resolved result passes
 * through the full-report validation policy before it is stored, so a
 * malformed report can never reach the render layer.
 *
 * `fullReportMode` (the composer's "Full report" toggle): when on, a
 * cybersecurity question without a specific corpus entry returns the
 * documented generic full report instead of NO_RESULTS, and every report is
 * completed with a derived lab so all 8 sections render. Safety refusals
 * and off-domain questions are unaffected — a report would be dishonest
 * there.
 */
function resolveResult(question: string, fullReportMode: boolean): InvestigationResult {
  const complete = (result: InvestigationResult): InvestigationResult => {
    const policyResult = enforceFullReportPolicy(result);
    if (fullReportMode && policyResult.kind === "report" && !policyResult.lab) {
      return { ...policyResult, lab: defaultLabFor(policyResult.attackChain) };
    }
    return policyResult;
  };
  for (const matcher of SAFETY_MATCHERS) {
    if (matcher.question.test(question)) return complete(matcher.build());
  }
  for (const matcher of DOMAIN_MATCHERS) {
    if (matcher.question.test(question)) return complete(matcher.build());
  }
  const cyberRelated = /\b(cyber|attack|malware|vulnerab|exploit|threat|actor|technique|mitre|cve|breach)\b/i.test(
    question,
  );
  if (fullReportMode && cyberRelated) {
    return complete(genericFullReport());
  }
  if (cyberRelated) {
    return NO_RESULTS;
  }
  return OUT_OF_DOMAIN;
}

/** Read the whole conversation for a thread id (oldest first). */
export function readThread(threadId: string): Thread | null {
  const anchor = store.find((item) => item.threadId === threadId || item.id === threadId);
  if (!anchor) return null;
  const rootId = anchor.threadId;
  const turns = store
    .filter((item) => item.threadId === rootId)
    .sort((a, b) => a.createdAt - b.createdAt);
  return {
    threadId: rootId,
    lastTurnId: turns[turns.length - 1]?.id ?? rootId,
    turns: turns.map((item) => ({
      id: item.id,
      question: item.question,
      createdAt: item.createdAt,
      result: item.result,
    })),
    createdAt: turns[0]?.createdAt ?? Date.now(),
    finishedAt: turns[turns.length - 1]?.createdAt ?? Date.now(),
  };
}

/**
 * Sidebar/history list: one entry per thread, represented by its newest turn.
 * Archived entries are included but flagged, so the UI can dim them and offer
 * an unarchive action instead of making them unreachable.
 */
export function readHistory(): HistoryItem[] {
  const threads = new Map<string, { item: Investigation; turnCount: number }>();
  for (const item of store) {
    const key = item.threadId;
    const existing = threads.get(key);
    if (existing) {
      existing.turnCount += 1;
      continue; // store is newest-first; keep the newest as representative
    }
    threads.set(key, { item, turnCount: 1 });
  }
  return [...threads.values()]
    .sort((a, b) => {
      // Pinned conversations sort first, then newest.
      const pa = a.item.pinned === true ? 1 : 0;
      const pb = b.item.pinned === true ? 1 : 0;
      if (pa !== pb) return pb - pa;
      return b.item.createdAt - a.item.createdAt;
    })
    .map(({ item, turnCount }) => ({
      id: item.id,
      threadId: item.threadId,
      question: item.title ?? item.question,
      createdAt: item.createdAt,
      evidenceStatus:
        item.result.kind === "report"
          ? item.result.evidenceStatus
          : item.result.kind === "safety"
            ? ("insufficient" as const)
            : ("unverified" as const),
      turnCount,
      pinned: item.pinned === true,
      archived: item.archived === true,
    }));
}

/** Notify subscribers that the store changed (sidebar/history refresh). */
const listeners = new Set<() => void>();
export function subscribeToConversationStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function notifyChanged(): void {
  persistToLocalStorage(store);
  for (const listener of listeners) listener();
}

/** Delay wrapper matching the old demo latency so loading states stay observable. */
async function runWithLatency(question: string): Promise<void> {
  await delay(simulatedLatency(question));
}

/**
 * Run an investigation. Appends to an existing conversation when
 * `threadId` is provided, otherwise opens a new one. Throws a plain
 * `Error("temporary")` on the "fail"/"error" trigger so the UI error
 * state exercises exactly like a transport failure did.
 */
export async function runInvestigation(
  question: string,
  threadId?: string,
  fullReportMode = true,
): Promise<Investigation> {
  await runWithLatency(question);

  if (FAILURE_PATTERN.test(question)) {
    throw new Error("temporary");
  }

  let resolvedThreadId: string;
  if (typeof threadId === "string" && threadId.length > 0) {
    const root = store.find((item) => item.id === threadId || item.threadId === threadId);
    if (!root) {
      throw new Error("not_found");
    }
    resolvedThreadId = root.threadId;
  } else {
    resolvedThreadId = "";
  }

  const id = `local-${Date.now()}-${++idCounter}`;
  const investigation: Investigation = {
    id,
    threadId: resolvedThreadId || id,
    question,
    createdAt: Date.now(),
    result: resolveResult(question, fullReportMode),
  };

  store.unshift(investigation);
  if (store.length > HISTORY_LIMIT) store.length = HISTORY_LIMIT;
  lastThreadId = investigation.threadId;
  notifyChanged();
  return investigation;
}

/**
 * Persist a turn produced outside the local resolver (e.g. the remote
 * backend adapter) into the session store so history, restore and the
 * sidebar work uniformly for both engines. The result is stored as-is —
 * it has already passed through the adapter mapping and the caller's
 * report-policy validation.
 *
 * When `threadId` matches an open conversation, the turn joins that
 * conversation (UI continuity); the v1 query contract is stateless, so the
 * grouping is a presentation concern only.
 */
export function persistExternalTurn(args: {
  id: string;
  threadId?: string;
  question: string;
  createdAt: number;
  result: InvestigationResult;
}): Investigation {
  let resolvedThreadId = "";
  if (typeof args.threadId === "string" && args.threadId.length > 0) {
    const root = store.find((item) => item.id === args.threadId || item.threadId === args.threadId);
    if (root) resolvedThreadId = root.threadId;
  }
  const id = args.id.length > 0 ? args.id : `remote-${Date.now()}-${++idCounter}`;
  const investigation: Investigation = {
    id,
    threadId: resolvedThreadId || id,
    question: args.question,
    createdAt: args.createdAt,
    result: args.result,
  };
  store.unshift(investigation);
  if (store.length > HISTORY_LIMIT) store.length = HISTORY_LIMIT;
  lastThreadId = investigation.threadId;
  notifyChanged();
  return investigation;
}

/* --------------------------- thread mutations --------------------------- */

/** Apply a mutation to every turn of a thread; returns false when not found. */
function mutateThread(threadId: string, mutate: (item: Investigation) => void): boolean {
  const root = store.find((item) => item.id === threadId || item.threadId === threadId);
  if (!root) return false;
  const rootId = root.threadId;
  for (const item of store) {
    if (item.threadId === rootId) mutate(item);
  }
  notifyChanged();
  return true;
}

/** Rename a conversation thread (all turns share the title). */
export function renameThread(threadId: string, title: string): boolean {
  return mutateThread(threadId, (item) => {
    item.title = title;
  });
}

/** Pin / unpin a conversation; pinned threads sort first in lists. */
export function setThreadPinned(threadId: string, pinned: boolean): boolean {
  return mutateThread(threadId, (item) => {
    item.pinned = pinned || undefined;
  });
}

/** Archive a conversation; archived threads are hidden from the Recent list. */
export function setThreadArchived(threadId: string, archived: boolean): boolean {
  return mutateThread(threadId, (item) => {
    item.archived = archived || undefined;
  });
}

/** Delete a conversation and every turn in it. */
export function deleteThread(threadId: string): boolean {
  if (isRemoteApiConfigured()) {
    deleteHistoryThread(threadId).catch(() => undefined);
  }
  const root = store.find((item) => item.id === threadId || item.threadId === threadId);
  if (!root) {
    notifyChanged();
    return true;
  }
  const rootId = root.threadId;
  for (let i = store.length - 1; i >= 0; i -= 1) {
    if (store[i].threadId === rootId) store.splice(i, 1);
  }
  if (lastThreadId === rootId) lastThreadId = null;
  notifyChanged();
  return true;
}

/** Synchronize remote investigation history from the backend into the store. */
export async function syncRemoteHistory(): Promise<void> {
  if (!isRemoteApiConfigured()) return;
  try {
    const listRes = await fetchHistory();
    if (!listRes || !Array.isArray(listRes.items)) return;

    for (const remoteItem of listRes.items) {
      const exists = store.some(
        (item) => item.threadId === remoteItem.thread_id || item.id === remoteItem.thread_id,
      );
      if (!exists) {
        // Add stub to store so it appears in recent and history
        store.push({
          id: remoteItem.thread_id,
          threadId: remoteItem.thread_id,
          question: remoteItem.question,
          createdAt: remoteItem.created_at,
          result: {
            kind: "no_results",
            message: remoteItem.preview || remoteItem.question,
          },
        });
      }
    }
    if (store.length > HISTORY_LIMIT) store.length = HISTORY_LIMIT;
    notifyChanged();
  } catch {
    // Backend unreachable or offline
  }
}

/**
 * Fetch and hydrate full thread turns from backend when not present or stubbed.
 */
export async function loadRemoteThread(threadId: string): Promise<Thread | null> {
  if (!isRemoteApiConfigured()) return null;
  try {
    const detail = await fetchHistoryThread(threadId);
    if (!detail || !Array.isArray(detail.turns) || detail.turns.length === 0) return null;

    // Filter out previous stubs for this thread
    for (let i = store.length - 1; i >= 0; i -= 1) {
      if (store[i].threadId === detail.thread_id) {
        store.splice(i, 1);
      }
    }

    // Hydrate real turns
    for (const t of detail.turns) {
      const firstResult = t.results && t.results.length > 0 ? t.results[0] : null;
      let mappedResult: InvestigationResult;
      if (firstResult) {
        const report = mapReport(firstResult);
        if (report) {
          mappedResult = {
            ...report,
            ...(t.answer ? { answer: t.answer } : {}),
            ...(t.uncertainty ? { uncertainty: t.uncertainty } : {}),
          };
        } else {
          mappedResult = {
            kind: "no_results",
            message: t.answer || "No verified evidence.",
          };
        }
      } else {
        mappedResult = {
          kind: "no_results",
          message: t.answer || "No verified evidence.",
        };
      }

      store.push({
        id: t.id,
        threadId: detail.thread_id,
        question: t.question,
        createdAt: t.created_at,
        result: mappedResult,
      });
    }

    notifyChanged();
    return readThread(detail.thread_id);
  } catch {
    return null;
  }
}

