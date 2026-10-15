import express from 'express';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { INITIAL_TASKS } from '../src/data/initialTasks';
import { readRecord, compareAndSet, deleteRecord } from './storage';

export const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '3mb' }));
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store, max-age=0');
  next();
});
const code = process.env.TRACKER_ACCESS_CODE;
function equal(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
function signature(expires: string) {
  return createHmac('sha256', code || '').update(`tracker:${expires}`).digest('hex');
}
function authorized(req: express.Request) {
  if (!code) return !process.env.VERCEL;
  const cookie = req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith('tracker_session='));
  const [expires, sig] = (cookie?.slice('tracker_session='.length) || '').split('.');
  return !!expires && !!sig && Number(expires) > Date.now() && equal(sig, signature(expires));
}
app.get('/api/session', (req, res) => {
  if (process.env.VERCEL && !code) return res.status(503).json({ success: false, message: 'Configurez TRACKER_ACCESS_CODE dans Vercel.' });
  res.json({ success: true, authenticated: authorized(req) });
});
app.post('/api/session', (req, res) => {
  if (!code) return res.status(503).json({ success: false, message: 'Code d’accès non configuré.' });
  if (typeof req.body.code !== 'string' || !equal(req.body.code, code)) return res.status(401).json({ success: false, message: 'Code incorrect.' });
  const expires = String(Date.now() + 12 * 60 * 60 * 1000);
  res.setHeader('Set-Cookie', `tracker_session=${expires}.${signature(expires)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${process.env.VERCEL ? '; Secure' : ''}`);
  res.json({ success: true });
});
app.use('/api', (req, res, next) => {
  if (!authorized(req)) return res.status(401).json({ success: false, message: 'Connexion requise. Rechargez la page pour saisir le code d’accès.' });
  if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) {
    return res.status(403).json({ success: false, message: 'Origine non autorisée.' });
  }
  next();
});
const wrap = (fn: (req: express.Request, res: express.Response) => Promise<any>) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => { fn(req, res).catch(next); };
function validPayload(body: any) {
  if (!body || !Array.isArray(body.tasks) || body.tasks.length > 5000) return false;
  const ids = new Set<string>();
  const statuses = ['TERMINE', 'NON TERMINE', 'EN COURS', 'VALIDE', 'PLANIFIE', 'PLANIFIER'];
  for (const task of body.tasks) {
    if (!task || typeof task.id !== 'string' || !task.id || ids.has(task.id) || !statuses.includes(task.status) ||
        !Number.isInteger(task.month) || task.month < 1 || task.month > 12 ||
        !['A_ACTIVITES', 'B_RH', 'C_GOUVERNANCE', 'D_FINANCES'].includes(task.copCategory) ||
        !['activity', 'strategicObjective', 'operationalObjective', 'programmePta', 'deadlineCop', 'proof', 'observations', 'report', 'expectedResult'].every(key => typeof task[key] === 'string')) return false;
    ids.add(task.id);
  }
  return Number.isInteger(body.currentMonth) && body.currentMonth >= 1 && body.currentMonth <= 12 &&
    Number.isFinite(body.baseBonusAmount) && body.baseBonusAmount >= 0;
}
async function workspace() {
  let current = await readRecord('workspace');
  if (!current) {
    const initial = { tasks: INITIAL_TASKS, currentMonth: 9, baseBonusAmount: 150000, revision: 1,
      updatedAt: new Date().toISOString(), lastModifiedBy: 'Données du ZIP — PTA/COP 2026', taskCount: INITIAL_TASKS.length };
    await compareAndSet('workspace', 0, initial);
    current = await readRecord('workspace');
  }
  return current;
}
app.get('/api/workspace', wrap(async (_req, res) => res.json({ success: true, workspace: await workspace() })));
app.post('/api/workspace', wrap(async (req, res) => {
  if (!validPayload(req.body) || !Number.isInteger(req.body.expectedRevision)) return res.status(400).json({ success: false, message: 'Données ou révision invalides.' });
  const current = await workspace();
  const updated = { tasks: req.body.tasks, currentMonth: req.body.currentMonth, baseBonusAmount: req.body.baseBonusAmount,
    lastModifiedBy: req.body.lastModifiedBy || 'Collaborateur', role: req.body.role, updatedAt: new Date().toISOString(),
    revision: req.body.expectedRevision + 1, taskCount: req.body.tasks.length };
  if (!await compareAndSet('workspace', req.body.expectedRevision, updated)) return res.status(409).json({ success: false, message: 'Une version plus récente existe. Votre copie locale a été conservée.', workspace: await readRecord('workspace') });
  res.json({ success: true, workspace: updated });
}));
app.get('/api/shares', (_req, res) => res.json({ success: true, shares: [] }));
app.post('/api/shares', wrap(async (req, res) => {
  if (!validPayload(req.body)) return res.status(400).json({ success: false, message: 'Données invalides.' });
  const id = `ept_${randomUUID()}`;
  const share = { ...req.body, id, month: req.body.currentMonth, revision: 1, taskCount: req.body.tasks.length,
    title: String(req.body.title || 'Évaluation DE'), author: String(req.body.author || 'Directeur Exécutif'), createdAt: new Date().toISOString() };
  await compareAndSet(`share:${id}`, 0, share);
  res.status(201).json({ success: true, id, share });
}));
app.get('/api/shares/:id', wrap(async (req, res) => {
  const share = await readRecord(`share:${req.params.id}`);
  if (!share) return res.status(404).json({ success: false, message: 'Partage introuvable. Aucun remplacement par des données locales.' });
  res.json({ success: true, share });
}));
app.put('/api/shares/:id', wrap(async (req, res) => {
  const key = `share:${req.params.id}`;
  const existing = await readRecord(key);
  if (!existing) return res.status(404).json({ success: false, message: 'Partage introuvable.' });
  if (!validPayload(req.body) || !Number.isInteger(req.body.expectedRevision)) return res.status(400).json({ success: false, message: 'Données invalides.' });
  const share = { ...existing, tasks: req.body.tasks, month: req.body.currentMonth, baseBonusAmount: req.body.baseBonusAmount,
    revision: req.body.expectedRevision + 1, updatedAt: new Date().toISOString(), taskCount: req.body.tasks.length,
    lastModifiedBy: req.body.author || 'Collaborateur', lastModifiedRole: req.body.role };
  if (!await compareAndSet(key, req.body.expectedRevision, share)) return res.status(409).json({ success: false, message: 'Le partage a été modifié sur un autre appareil.' });
  res.json({ success: true, share });
}));
app.delete('/api/shares/:id', wrap(async (req, res) => { await deleteRecord(`share:${req.params.id}`); res.json({ success: true }); }));
app.use('/api', (_req, res) => res.status(404).json({ success: false, message: 'Route API introuvable.' }));
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API:', err.message);
  res.status(err.status === 413 ? 413 : 503).json({ success: false, message: err.status === 413 ? 'Fichier trop volumineux (3 Mo maximum).' : err.message || 'Service partagé indisponible.' });
});
export default app;
