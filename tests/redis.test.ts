import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const records = new Map<string, string>();
const server = http.createServer(async (req, res) => {
  assert.equal(req.headers.authorization, 'Bearer test-rest-token');
  let body = ''; for await (const chunk of req) body += chunk;
  const command = JSON.parse(body);
  let result: any;
  if (command[0] === 'GET') result = records.get(command[1]) ?? null;
  else if (command[0] === 'DEL') { result = records.delete(command[1]) ? 1 : 0; }
  else if (command[0] === 'EVAL') {
    const key = command[3], expected = Number(command[4]);
    const revision = JSON.parse(records.get(key) || '{"revision":0}').revision;
    result = revision === expected ? 1 : 0;
    if (result) records.set(key, command[5]);
  } else throw new Error('Unexpected command');
  res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ result }));
});
server.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.on('listening', resolve));
process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${(server.address() as any).port}`;
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-rest-token';
process.env.VERCEL = '1';
const { readRecord, compareAndSet, deleteRecord } = await import('../backend/storage');
after(() => new Promise<void>(resolve => server.close(() => resolve())));
test('stockage REST en mode Vercel et refus atomique des écritures obsolètes', async () => {
  assert.equal(await readRecord('test'), null);
  assert.equal(await compareAndSet('test', 0, { revision: 1, tasks: ['pc'] }), true);
  const outcomes = await Promise.all([
    compareAndSet('test', 1, { revision: 2, tasks: ['mobile'] }),
    compareAndSet('test', 1, { revision: 2, tasks: ['stale'] }),
  ]);
  assert.equal(outcomes.filter(Boolean).length, 1);
  assert.deepEqual(await readRecord('test'), { revision: 2, tasks: ['mobile'] });
  await deleteRecord('test');
  assert.equal(await readRecord('test'), null);
});
