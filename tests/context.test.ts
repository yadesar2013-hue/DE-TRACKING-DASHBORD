import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import React from 'react';
import { act, create, ReactTestRenderer } from 'react-test-renderer';

process.env.TRACKER_DATA_DIR = await mkdtemp(join(tmpdir(), 'ept-context-'));
for (const key of ['VERCEL', 'TRACKER_ACCESS_CODE', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN']) delete process.env[key];
const { default: app } = await import('../backend/app');
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.on('listening', resolve));
const base = `http://127.0.0.1:${(server.address() as any).port}`;
const originalFetch = globalThis.fetch;
globalThis.fetch = (input: any, options: any) => originalFetch(typeof input === 'string' && input.startsWith('/') ? base + input : input, options);
const storage = new Map<string, string>([['fondation_hysteresis_ept_tasks_v17_august_official_integrated', 'ancienne copie PC']]);
(globalThis as any).localStorage = { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v), removeItem: (k: string) => storage.delete(k) };
const listeners = new Set<() => void>();
(globalThis as any).window = { location: new URL(base), history: { replaceState() {} }, confirm: () => true,
  addEventListener: (name: string, fn: () => void) => { if (name === 'focus') listeners.add(fn); },
  removeEventListener: (name: string, fn: () => void) => { if (name === 'focus') listeners.delete(fn); } };
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const { TrackerProvider, useTracker } = await import('../src/context/TrackerContext');
let pc: ReturnType<typeof useTracker>, mobile: ReturnType<typeof useTracker>;
function Capture({ device }: { device: string }) { const value = useTracker(); if (device === 'pc') pc = value; else mobile = value; return null; }
let render: ReactTestRenderer;
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const remote = async () => (await (await fetch('/api/workspace')).json()).workspace;
after(async () => { if (render!) await act(async () => render.unmount()); globalThis.fetch = originalFetch; await new Promise<void>(resolve => server.close(() => resolve())); await rm(process.env.TRACKER_DATA_DIR!, { recursive: true, force: true }); });

test('deux interfaces : démarrage sans écrasement, propagation, et conflits conservés', async () => {
  await act(async () => { render = create(React.createElement(React.Fragment, null,
    React.createElement(TrackerProvider, { children: React.createElement(Capture, { device: 'pc' }) }),
    React.createElement(TrackerProvider, { children: React.createElement(Capture, { device: 'mobile' }) })
  )); });
  await act(async () => { await wait(250); });
  assert.equal(pc!.tasks.length, 235);
  assert.deepEqual(pc!.tasks, mobile!.tasks);
  assert.equal(storage.get('fondation_hysteresis_ept_tasks_v17_august_official_integrated'), 'ancienne copie PC');
  await act(async () => { await wait(800); });
  assert.equal((await remote()).revision, 1, 'aucune écriture au démarrage');
  await act(async () => { pc!.setRole('PRESIDENTE'); pc!.setCurrentMonth(10); });
  await act(async () => { await wait(800); });
  assert.equal((await remote()).revision, 1, 'changer le rôle ou le mois ne réécrit pas les tâches');
  const id = pc!.tasks[0].id;
  await act(async () => { pc!.updateTaskField(id, 'observations', 'Saisie PC'); });
  await act(async () => { await wait(1000); });
  assert.equal((await remote()).tasks[0].observations, 'Saisie PC');
  await act(async () => { for (const listener of listeners) listener(); await wait(250); });
  assert.equal(mobile!.tasks[0].observations, 'Saisie PC');
  assert.deepEqual(pc!.tasks, mobile!.tasks);
  await act(async () => { pc!.updateTaskField(id, 'observations', 'Concurrent PC'); mobile!.updateTaskField(id, 'observations', 'Concurrent mobile'); });
  await act(async () => { await wait(1000); });
  assert.ok(pc!.syncError || mobile!.syncError, 'conflit affiché');
  assert.equal(pc!.tasks[0].observations, 'Concurrent PC');
  assert.equal(mobile!.tasks[0].observations, 'Concurrent mobile');
  assert.ok([...storage.keys()].some(k => k.startsWith('ept_recovery_')), 'copie de récupération conservée');
});
