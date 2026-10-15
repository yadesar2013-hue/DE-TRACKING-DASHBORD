import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));

// Stockage persistant des partages cloud
const DATA_DIR = path.resolve(__dirname, 'data');
const SHARES_FILE = path.resolve(DATA_DIR, 'shares.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface ShareSnapshot {
  id: string;
  createdAt: string;
  title: string;
  author: string;
  month: number;
  baseBonusAmount: number;
  officialEvolutionRate?: number;
  provisionalEvolutionRate?: number;
  officialBonus?: number;
  taskCount: number;
  notes?: string;
  tasks: any[];
}

function loadShares(): Record<string, ShareSnapshot> {
  try {
    if (fs.existsSync(SHARES_FILE)) {
      const data = fs.readFileSync(SHARES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Erreur lecture shares.json:', err);
  }
  return {};
}

function saveShares(shares: Record<string, ShareSnapshot>) {
  try {
    fs.writeFileSync(SHARES_FILE, JSON.stringify(shares, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erreur écriture shares.json:', err);
  }
}

// In-memory cache synced with disk
let sharesCache: Record<string, ShareSnapshot> = loadShares();

// --- ROUTES API ---

// 1. Récupérer la liste des sauvegardes récentes
app.get('/api/shares', (_req, res) => {
  const list = Object.values(sharesCache)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(({ tasks: _t, ...meta }) => meta);
  res.json({ success: true, shares: list });
});

// 2. Récupérer un snapshot précis par son ID
app.get('/api/shares/:id', (req, res) => {
  const { id } = req.params;
  const share = sharesCache[id];
  if (!share) {
    return res.status(404).json({ success: false, message: 'Partage introuvable ou expiré' });
  }
  return res.json({ success: true, share });
});

// 3. Enregistrer un nouveau snapshot et générer un ID unique de partage
app.post('/api/shares', (req, res) => {
  try {
    const {
      tasks,
      currentMonth,
      baseBonusAmount,
      title,
      author,
      notes,
      officialEvolutionRate,
      provisionalEvolutionRate,
      officialBonus,
    } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ success: false, message: 'Liste de tâches requise' });
    }

    const shortRandom = Math.random().toString(36).substring(2, 7);
    const id = `ept_${Date.now().toString(36)}_${shortRandom}`;

    const newSnapshot: ShareSnapshot = {
      id,
      createdAt: new Date().toISOString(),
      title: title?.trim() || `Évaluation DE — ${new Date().toLocaleDateString('fr-FR')}`,
      author: author?.trim() || 'Directeur Exécutif',
      month: typeof currentMonth === 'number' ? currentMonth : 7,
      baseBonusAmount: typeof baseBonusAmount === 'number' ? baseBonusAmount : 150000,
      officialEvolutionRate: officialEvolutionRate || 0,
      provisionalEvolutionRate: provisionalEvolutionRate || 0,
      officialBonus: officialBonus || 0,
      taskCount: tasks.length,
      notes: notes?.trim() || '',
      tasks,
    };

    sharesCache[id] = newSnapshot;
    saveShares(sharesCache);

    return res.status(201).json({
      success: true,
      id,
      share: newSnapshot,
    });
  } catch (err: any) {
    console.error('Erreur sauvegarde share:', err);
    return res.status(500).json({ success: false, message: err.message || 'Erreur serveur' });
  }
});

// 4. Mettre à jour un partage existant (synchronisation en temps réel pour tous les collaborateurs)
app.put('/api/shares/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      tasks,
      currentMonth,
      baseBonusAmount,
      author,
      role,
      notes,
      officialEvolutionRate,
      provisionalEvolutionRate,
      officialBonus,
    } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ success: false, message: 'Liste de tâches requise' });
    }

    const existing = sharesCache[id];
    const updatedSnapshot: ShareSnapshot & { lastModifiedBy?: string; lastModifiedRole?: string; updatedAt?: string } = {
      id,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      title: existing?.title || `Session partagée — ${new Date().toLocaleDateString('fr-FR')}`,
      author: author || existing?.author || (role === 'PRESIDENTE' ? 'Présidence' : 'Directeur Exécutif'),
      lastModifiedBy: author || (role === 'PRESIDENTE' ? 'Présidence' : 'Directeur Exécutif'),
      lastModifiedRole: role,
      month: typeof currentMonth === 'number' ? currentMonth : existing?.month || 9,
      baseBonusAmount: typeof baseBonusAmount === 'number' ? baseBonusAmount : existing?.baseBonusAmount || 150000,
      officialEvolutionRate: officialEvolutionRate ?? existing?.officialEvolutionRate ?? 0,
      provisionalEvolutionRate: provisionalEvolutionRate ?? existing?.provisionalEvolutionRate ?? 0,
      officialBonus: officialBonus ?? existing?.officialBonus ?? 0,
      taskCount: tasks.length,
      notes: notes !== undefined ? notes : existing?.notes || '',
      tasks,
    };

    sharesCache[id] = updatedSnapshot as any;
    saveShares(sharesCache);

    return res.json({
      success: true,
      id,
      share: updatedSnapshot,
    });
  } catch (err: any) {
    console.error('Erreur mise à jour share:', err);
    return res.status(500).json({ success: false, message: err.message || 'Erreur serveur' });
  }
});

// 5. Espace de travail collaboratif global partagé (tous les ajustements synchronisés)
const WORKSPACE_FILE = path.resolve(DATA_DIR, 'workspace.json');

app.get('/api/workspace', (_req, res) => {
  try {
    if (fs.existsSync(WORKSPACE_FILE)) {
      const data = JSON.parse(fs.readFileSync(WORKSPACE_FILE, 'utf-8'));
      return res.json({ success: true, workspace: data });
    }
  } catch (err) {
    console.error('Erreur lecture workspace.json:', err);
  }
  return res.json({ success: true, workspace: null });
});

app.post('/api/workspace', (req, res) => {
  try {
    const { tasks, currentMonth, baseBonusAmount, lastModifiedBy, role, notes } = req.body;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ success: false, message: 'Tâches requises' });
    }

    const payload = {
      updatedAt: new Date().toISOString(),
      lastModifiedBy: lastModifiedBy || (role === 'PRESIDENTE' ? 'Présidence' : 'Directeur Exécutif'),
      role: role || 'DIRECTEUR_EXECUTIF',
      currentMonth: currentMonth || 9,
      baseBonusAmount: baseBonusAmount || 150000,
      notes: notes || '',
      taskCount: tasks.length,
      tasks,
    };

    fs.writeFileSync(WORKSPACE_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    return res.json({ success: true, workspace: payload });
  } catch (err: any) {
    console.error('Erreur sauvegarde workspace:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Supprimer un partage (optionnel)
app.delete('/api/shares/:id', (req, res) => {
  const { id } = req.params;
  if (sharesCache[id]) {
    delete sharesCache[id];
    saveShares(sharesCache);
    return res.json({ success: true, message: 'Partage supprimé' });
  }
  return res.status(404).json({ success: false, message: 'Partage introuvable' });
});

// --- DEV & PROD SERVING ---
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur Executive Performance Tracker démarré sur http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Erreur lancement serveur:', err);
  process.exit(1);
});
