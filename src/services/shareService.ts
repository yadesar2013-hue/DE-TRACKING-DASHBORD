import { TaskItem } from '../types';

export interface ShareMetadata {
  id: string; createdAt: string; title: string; author: string; month: number;
  baseBonusAmount: number; revision: number; taskCount: number; notes?: string;
  officialEvolutionRate?: number; provisionalEvolutionRate?: number; officialBonus?: number;
  lastModifiedBy?: string; lastModifiedRole?: string; updatedAt?: string;
}
export interface ShareData extends ShareMetadata { tasks: TaskItem[]; }
export interface WorkspaceData {
  tasks: TaskItem[]; currentMonth: number; baseBonusAmount: number; revision: number;
  updatedAt: string; lastModifiedBy: string; role?: string;
}
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function apiRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(path, { ...options, cache: 'no-store', credentials: 'same-origin',
    signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/json', ...options.headers } });
  let data;
  try { data = await response.json(); }
  catch { throw new ApiError('API indisponible : vérifiez le déploiement Vercel et le stockage partagé.', response.status); }
  if (!response.ok || !data.success) throw new ApiError(data.message || 'Échec de la synchronisation.', response.status);
  return data;
}
const LOCAL_SHARE_HISTORY_KEY = 'fondation_hysteresis_share_history_v1';
export async function createCloudShare(params: {
  tasks: TaskItem[]; currentMonth: number; baseBonusAmount: number; title?: string; author?: string;
  notes?: string; officialEvolutionRate?: number; provisionalEvolutionRate?: number; officialBonus?: number;
}): Promise<{ id: string; shareUrl: string; share: ShareData }> {
  const data = await apiRequest('/api/shares', { method: 'POST', body: JSON.stringify(params) });
  const shareUrl = buildShareUrl(data.id);
  saveToLocalHistory({ ...data.share, shareUrl });
  return { id: data.id, shareUrl, share: data.share };
}
export async function updateCloudShare(shareId: string, params: {
  tasks: TaskItem[]; currentMonth: number; baseBonusAmount: number; expectedRevision: number;
  author?: string; role?: string; notes?: string;
}): Promise<ShareData> {
  return (await apiRequest(`/api/shares/${encodeURIComponent(shareId)}`, { method: 'PUT', body: JSON.stringify(params) })).share;
}
export async function getSharedWorkspace(): Promise<WorkspaceData> {
  return (await apiRequest('/api/workspace')).workspace;
}
export async function saveSharedWorkspace(params: {
  tasks: TaskItem[]; currentMonth: number; baseBonusAmount: number; expectedRevision: number;
  lastModifiedBy?: string; role?: string;
}): Promise<WorkspaceData> {
  return (await apiRequest('/api/workspace', { method: 'POST', body: JSON.stringify(params) })).workspace;
}
export async function getCloudShare(id: string): Promise<ShareData> {
  return (await apiRequest(`/api/shares/${encodeURIComponent(id)}`)).share;
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
