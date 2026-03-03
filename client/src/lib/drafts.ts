export type DraftMeta = {
  id: string;
  clientName: string;
  projectName: string;
  pack: string;
  lastModified: number;
  status: "draft" | "intake received";
};

const INDEX_KEY = "tco_drafts_index";
const DRAFT_PREFIX = "tco_draft_";
const LEGACY_KEY = "tco_tool_master";

export function getDraftIndex(): DraftMeta[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DraftMeta[];
  } catch {
    return [];
  }
}

function saveDraftIndex(index: DraftMeta[]) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export function createDraft(opts?: { clientName?: string; projectName?: string; status?: DraftMeta["status"] }): string {
  const id = crypto.randomUUID();
  const meta: DraftMeta = {
    id,
    clientName: opts?.clientName ?? "",
    projectName: opts?.projectName ?? "",
    pack: "Baseline TCO",
    lastModified: Date.now(),
    status: opts?.status ?? "draft",
  };
  const index = getDraftIndex();
  index.unshift(meta);
  saveDraftIndex(index);
  return id;
}

export function updateDraftStatus(id: string, status: DraftMeta["status"]) {
  const index = getDraftIndex();
  const entry = index.find((d) => d.id === id);
  if (entry) {
    entry.status = status;
    saveDraftIndex(index);
  }
}

export function saveDraftData(id: string, data: unknown, clientName?: string, projectName?: string) {
  localStorage.setItem(`${DRAFT_PREFIX}${id}`, JSON.stringify(data));
  const index = getDraftIndex();
  const entry = index.find((d) => d.id === id);
  if (entry) {
    entry.lastModified = Date.now();
    if (clientName !== undefined) entry.clientName = clientName;
    if (projectName !== undefined) entry.projectName = projectName;
    saveDraftIndex(index);
  }
}

export function loadDraftData(id: string): unknown | null {
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${id}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function deleteDraft(id: string) {
  localStorage.removeItem(`${DRAFT_PREFIX}${id}`);
  const index = getDraftIndex().filter((d) => d.id !== id);
  saveDraftIndex(index);
}

export function migrateLegacyDraft(): string | null {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return null;
    const parsed = JSON.parse(legacy);
    if (!parsed.inputs && !parsed.assumptions) return null;

    const id = createDraft();
    const clientName = parsed.inputs?.project?.clientName || "";
    saveDraftData(id, parsed, clientName, "");
    localStorage.removeItem(LEGACY_KEY);
    return id;
  } catch {
    return null;
  }
}
