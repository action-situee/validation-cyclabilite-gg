type KVLike = {
  get(key: string, type: 'json'): Promise<unknown | null>;
  put(key: string, value: string): Promise<void>;
};

type EnvLike = {
  CONTRIBUTIONS_KV?: KVLike;
};

export function hasContributionsKv(env: EnvLike) {
  return Boolean(env.CONTRIBUTIONS_KV);
}

export async function loadCollection<T>(env: EnvLike, key: string): Promise<T[]> {
  if (!env.CONTRIBUTIONS_KV) return [];

  const stored = await env.CONTRIBUTIONS_KV.get(key, 'json');
  return Array.isArray(stored) ? (stored as T[]) : [];
}

export async function saveCollection<T>(env: EnvLike, key: string, items: T[]) {
  if (!env.CONTRIBUTIONS_KV) return;

  const payload = JSON.stringify(items);
  await env.CONTRIBUTIONS_KV.put(key, payload);
}

export function upsertById<T extends { id?: string }>(items: T[], item: T, id: string) {
  const index = items.findIndex((entry) => entry.id === id);
  if (index >= 0) {
    const next = [...items];
    next[index] = item;
    return next;
  }
  return [...items, item];
}

export function removeById<T extends { id?: string }>(items: T[], id: string) {
  return items.filter((item) => item.id !== id);
}

export function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}