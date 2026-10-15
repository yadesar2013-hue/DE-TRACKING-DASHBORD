import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.TRACKER_DATA_DIR = await mkdtemp(join(tmpdir(), 'ept-test-'));
process.env.TRACKER_ACCESS_CODE = 'test-access-only';
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.VERCEL;
const { default: app } = await import('../backend/app');
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.on('listening', resolve));
const address = server.address() as { port: number };
const base = `http://127.0.0.1:${address.port}`;
let cookie = '';
async function request(path: string, method = 'GET', body?: any, authenticated = true) {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(authenticated ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { res, data: await res.json() };
}
after(async () => { await new Promise<void>(resolve => server.close(() => resolve())); await rm(process.env.TRACKER_DATA_DIR!, { recursive: true, force: true }); });

test('accès privé, données communes, versions concurrentes et partages persistants', async () => {
  assert.equal((await request('/api/workspace', 'GET', undefined, false)).res.status, 401);
  assert.equal((await request('/api/session', 'POST', { code: 'wrong' }, false)).res.status, 401);
  const login = await request('/api/session', 'POST', { code: 'test-access-only' }, false);
  assert.equal(login.res.status, 200);
  cookie = login.res.headers.get('set-cookie')!.split(';')[0];
  const pc = await request('/api/workspace');
  const mobile = await request('/api/workspace');
  assert.deepEqual(pc.data.workspace, mobile.data.workspace);
  assert.equal(pc.res.headers.get('cache-control'), 'no-store, max-age=0');
  const initial = pc.data.workspace;
  assert.ok(initial.tasks.length > 0);
  assert.equal(new Set(initial.tasks.map((t: any) => t.id)).size, initial.tasks.length);
  const body = { ...initial, tasks: initial.tasks.map((t: any, i: number) => i ? t : { ...t, observations: 'Mise à jour PC' }), expectedRevision: initial.revision, baseBonusAmount: 0 };
  const saved = await request('/api/workspace', 'POST', body);
  assert.equal(saved.res.status, 200, JSON.stringify(saved.data));
  assert.equal(saved.data.workspace.revision, initial.revision + 1);
  assert.equal(saved.data.workspace.baseBonusAmount, 0);
  const stale = await request('/api/workspace', 'POST', { ...initial, expectedRevision: initial.revision });
  assert.equal(stale.res.status, 409);
  const reread = await request('/api/workspace');
  assert.equal(reread.data.workspace.tasks[0].observations, 'Mise à jour PC');
  const share = await request('/api/shares', 'POST', { ...saved.data.workspace, title: 'Test' });
  assert.equal(share.res.status, 201);
  const id = share.data.id;
  assert.equal((await request(`/api/shares/${id}`)).data.share.tasks[0].observations, 'Mise à jour PC');
  const updatedShare = await request(`/api/shares/${id}`, 'PUT', { ...body, expectedRevision: 1 });
  assert.equal(updatedShare.res.status, 200);
  assert.equal((await request(`/api/shares/${id}`, 'PUT', { ...body, expectedRevision: 1 })).res.status, 409);
  assert.equal((await request('/api/shares/missing')).res.status, 404);
  assert.equal((await request('/api/workspace', 'POST', { ...body, tasks: [...body.tasks, body.tasks[0]] })).res.status, 400);
  assert.equal((await request('/api/workspace', 'POST', { ...body, baseBonusAmount: -1 })).res.status, 400);
  // Un partage est isolé du tableau global.
  assert.equal((await request('/api/workspace')).data.workspace.revision, saved.data.workspace.revision);
  // Une liste vide est un état valide, pas un signal de restauration des tâches supprimées.
  const empty = await request('/api/workspace', 'POST', { ...body, tasks: [], expectedRevision: saved.data.workspace.revision });
  assert.equal(empty.res.status, 200);
  assert.deepEqual((await request('/api/workspace')).data.workspace.tasks, []);
});
