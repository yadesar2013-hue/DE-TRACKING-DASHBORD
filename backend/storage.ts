import fs from 'node:fs/promises';
import path from 'node:path';

const prefix = process.env.TRACKER_STORAGE_PREFIX || 'hysteresis:ept:2026';
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const localFile = path.resolve(process.env.TRACKER_DATA_DIR || 'data', 'cloud-store.json');
let queue: Promise<unknown> = Promise.resolve();

async function redis(command: unknown[]) {
  if (!url || !token) throw new Error('Configurez UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN dans Vercel.');
  const response = await fetch(url, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command), signal: AbortSignal.timeout(12000), cache: 'no-store',
  });
  if (!response.ok) throw new Error('Stockage partagé indisponible.');
  const data = await response.json();
  if (data.error) throw new Error('Erreur du stockage partagé.');
  return data.result;
}

async function localOperation<T>(operation: (records: Record<string, any>) => T | Promise<T>, write = false): Promise<T> {
  if (process.env.VERCEL) throw new Error('Le stockage partagé doit être configuré dans Vercel.');
  const job = queue.then(async () => {
    let records = {};
    try { records = JSON.parse(await fs.readFile(localFile, 'utf8')); }
    catch (error: any) { if (error.code !== 'ENOENT') throw error; }
    const result = await operation(records);
    if (write) {
      await fs.mkdir(path.dirname(localFile), { recursive: true });
      await fs.writeFile(`${localFile}.tmp`, JSON.stringify(records, null, 2));
      await fs.rename(`${localFile}.tmp`, localFile);
    }
    return result;
  });
  queue = job.catch(() => {});
  return job;
}

export async function readRecord(key: string): Promise<any | null> {
  if (url && token) {
    const raw = await redis(['GET', `${prefix}:${key}`]);
    return raw ? JSON.parse(raw) : null;
  }
  return localOperation(records => records[key] ?? null);
}

// Comparaison atomique : un navigateur ancien ne peut pas écraser une version plus récente.
export async function compareAndSet(key: string, expectedRevision: number, record: any): Promise<boolean> {
  if (url && token) {
    const script = `local raw = redis.call('GET', KEYS[1])
local revision = 0
if raw then revision = cjson.decode(raw).revision or 0 end
if revision ~= tonumber(ARGV[1]) then return 0 end
redis.call('SET', KEYS[1], ARGV[2])
return 1`;
    return (await redis(['EVAL', script, 1, `${prefix}:${key}`, expectedRevision, JSON.stringify(record)])) === 1;
  }
  return localOperation(records => {
    if ((records[key]?.revision ?? 0) !== expectedRevision) return false;
    records[key] = record;
    return true;
  }, true);
}

export async function deleteRecord(key: string) {
  if (url && token) return redis(['DEL', `${prefix}:${key}`]);
  return localOperation(records => { delete records[key]; }, true);
}
