/**
 * shareService — Service de sauvegarde Cloud et de partage collaboratif
 * Fondation HYSTERESIS
 */

import { TaskItem } from '../types';

export interface ShareMetadata {
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
  lastModifiedBy?: string;
  lastModifiedRole?: string;
  updatedAt?: string;
}

export interface ShareData extends ShareMetadata {
  tasks: TaskItem[];
}

const LOCAL_SHARE_HISTORY_KEY = 'fondation_hysteresis_share_history_v1';

/**
 * Sauvegarde un état complet dans le cloud et génère un lien de partage
 */
export async function createCloudShare(params: {
  tasks: TaskItem[];
  currentMonth: number;
  baseBonusAmount: number;
  title?: string;
  author?: string;
  notes?: string;
  officialEvolutionRate?: number;
  provisionalEvolutionRate?: number;
  officialBonus?: number;
}): Promise<{ id: string; shareUrl: string; share: ShareData }> {
  try {
    const res = await fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.id) {
        const shareUrl = buildShareUrl(data.id);
        saveToLocalHistory({
          ...data.share,
          shareUrl,
        });
        return {
          id: data.id,
          shareUrl,
          share: data.share,
        };
      }
    }
    throw new Error('Réponse serveur non valide');
  } catch (err) {
    console.warn('API cloud indisponible, utilisation du fallback local / url encodée:', err);

    // Fallback autonome : identifiant local et stockage dans localStorage
    const shortId = `ept_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const fallbackShare: ShareData = {
      id: shortId,
      createdAt: new Date().toISOString(),
      title: params.title || `Sauvegarde locale — ${new Date().toLocaleDateString('fr-FR')}`,
      author: params.author || 'Directeur Exécutif',
      month: params.currentMonth,
      baseBonusAmount: params.baseBonusAmount,
      officialEvolutionRate: params.officialEvolutionRate,
      provisionalEvolutionRate: params.provisionalEvolutionRate,
      officialBonus: params.officialBonus,
      taskCount: params.tasks.length,
      notes: params.notes,
      tasks: params.tasks,
    };

    localStorage.setItem(`ept_share_snapshot_${shortId}`, JSON.stringify(fallbackShare));
    const shareUrl = buildShareUrl(shortId);
    saveToLocalHistory({
      ...fallbackShare,
      shareUrl,
    });

    return {
      id: shortId,
      shareUrl,
      share: fallbackShare,
    };
  }
}

/**
 * Met à jour un snapshot partagé existant dans le cloud (synchronisation live)
 */
export async function updateCloudShare(
  shareId: string,
  params: {
    tasks: TaskItem[];
    currentMonth?: number;
    baseBonusAmount?: number;
    author?: string;
    role?: string;
    notes?: string;
    officialEvolutionRate?: number;
    provisionalEvolutionRate?: number;
    officialBonus?: number;
  }
): Promise<ShareData | null> {
  try {
    const res = await fetch(`/api/shares/${encodeURIComponent(shareId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.share) {
        return data.share;
      }
    }
  } catch (err) {
    console.warn('Erreur mise à jour cloud share:', err);
  }

  // Fallback local
  try {
    const local = localStorage.getItem(`ept_share_snapshot_${shareId}`);
    if (local) {
      const parsed = JSON.parse(local);
      const updated = {
        ...parsed,
        tasks: params.tasks,
        month: params.currentMonth ?? parsed.month,
        baseBonusAmount: params.baseBonusAmount ?? parsed.baseBonusAmount,
        lastModifiedBy: params.author,
        lastModifiedRole: params.role,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`ept_share_snapshot_${shareId}`, JSON.stringify(updated));
      return updated;
    }
  } catch (_) {}

  return null;
}

/**
 * Récupère l'espace de travail global partagé
 */
export async function getSharedWorkspace(): Promise<{
  tasks: TaskItem[];
  updatedAt: string;
  lastModifiedBy: string;
  role: string;
  currentMonth: number;
  baseBonusAmount: number;
} | null> {
  try {
    const res = await fetch('/api/workspace');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.workspace) {
        return data.workspace;
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Enregistre l'espace de travail global partagé
 */
export async function saveSharedWorkspace(params: {
  tasks: TaskItem[];
  currentMonth: number;
  baseBonusAmount: number;
  lastModifiedBy?: string;
  role?: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

/**
 * Récupère un état partagé via son ID
 */
export async function getCloudShare(shareId: string): Promise<ShareData | null> {
  // 1. Tenter l'API
  try {
    const res = await fetch(`/api/shares/${encodeURIComponent(shareId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.share) {
        return data.share;
      }
    }
  } catch (e) {
    console.warn('Impossible de charger depuis /api/shares:', e);
  }

  // 2. Fallback localStorage
  try {
    const local = localStorage.getItem(`ept_share_snapshot_${shareId}`);
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {
    console.error('Erreur lecture fallback local:', e);
  }

  return null;
}

/**
 * Construit l'URL complète avec le paramètre de partage
 */
export function buildShareUrl(shareId: string): string {
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?share=${encodeURIComponent(shareId)}`;
}

/**
 * Historique des partages créés sur cette machine
 */
export function getLocalShareHistory(): (ShareMetadata & { shareUrl?: string })[] {
  try {
    const raw = localStorage.getItem(LOCAL_SHARE_HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Erreur getLocalShareHistory:', e);
  }
  return [];
}

function saveToLocalHistory(item: ShareMetadata & { shareUrl?: string }) {
  try {
    const list = getLocalShareHistory().filter((s) => s.id !== item.id);
    list.unshift(item);
    localStorage.setItem(LOCAL_SHARE_HISTORY_KEY, JSON.stringify(list.slice(0, 15)));
  } catch (e) {
    console.error('Erreur saveToLocalHistory:', e);
  }
}
