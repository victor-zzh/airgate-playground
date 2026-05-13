import type { SerializedWorkflow } from './types';

const STORAGE_KEY = 'airgate.playground.workflows';

interface StoredWorkflows {
  [id: string]: {
    name: string;
    updatedAt: string;
    data: SerializedWorkflow;
  };
}

function readStore(): StoredWorkflows {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store: StoredWorkflows) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch { /* storage full or unavailable */ }
}

export function listWorkflows(): Array<{ id: string; name: string; updatedAt: string }> {
  const store = readStore();
  return Object.entries(store)
    .map(([id, entry]) => ({ id, name: entry.name, updatedAt: entry.updatedAt }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function loadWorkflow(id: string): SerializedWorkflow | null {
  const store = readStore();
  return store[id]?.data || null;
}

export function saveWorkflow(id: string, name: string, data: SerializedWorkflow) {
  const store = readStore();
  store[id] = { name, updatedAt: new Date().toISOString(), data };
  writeStore(store);
}

export function deleteWorkflow(id: string) {
  const store = readStore();
  delete store[id];
  writeStore(store);
}

export function generateWorkflowId(): string {
  return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
