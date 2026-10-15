/**
 * ActiveShareBanner — Bandeau d'information affiché lors de la consultation d'un lien partagé
 * Fondation HYSTERESIS
 */

import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import { Share2, Copy, Check, RotateCcw, CloudUpload, Info, AlertCircle } from 'lucide-react';

interface ActiveShareBannerProps {
  onOpenShareModal: () => void;
}

export const ActiveShareBanner: React.FC<ActiveShareBannerProps> = ({ onOpenShareModal }) => {
  const {
    activeShare,
    syncError,
    isCollaborativeSyncActive,
    exportBackup,
    isLoadingShare,
    exitSharedView,
    lastSyncedAt,
    lastSyncAuthor,
    syncNotification,
    clearSyncNotification,
    roleSwitchNotification,
    clearRoleSwitchNotification,
    role,
    toggleRole,
    syncNow,
  } = useTracker();
  const [copied, setCopied] = useState<boolean>(false);

  return (
    <>
      <div className={`px-4 py-2 text-sm flex flex-wrap items-center gap-3 ${syncError ? 'bg-amber-100 text-amber-950' : 'bg-slate-100 text-slate-700'}`}>
        <span role="status">{syncError || (isCollaborativeSyncActive ? `Espace partagé connecté${lastSyncedAt ? ` — synchronisé à ${lastSyncedAt}` : ''}` : 'Connexion en cours…')}</span>
        <button onClick={syncNow} className="underline font-medium">Actualiser / Réessayer</button>
        <button onClick={exportBackup} className="underline">Exporter une sauvegarde JSON</button>
      </div>
      {/* Toast de bascule de rôle (ex: Basculer DE <-> Présidente) */}
      {roleSwitchNotification && (
        <div className="bg-slate-900 border-b border-indigo-500 text-white px-4 py-2 text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <span className="font-medium">{roleSwitchNotification}</span>
          </div>
          <button
            onClick={clearRoleSwitchNotification}
            className="text-slate-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Toast d'ajustement collaboratif en temps réel */}
      {syncNotification && (
        <div className="bg-emerald-900 border-b border-emerald-500 text-white px-4 py-2 text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">{syncNotification}</span>
          </div>
          <button
            onClick={clearSyncNotification}
            className="text-emerald-300 hover:text-white px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {isLoadingShare && (
        <div className="bg-blue-900 text-white py-2.5 px-4 text-xs flex items-center justify-center gap-2 animate-pulse">
          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Chargement et synchronisation de la version collaborative...</span>
        </div>
      )}

      {activeShare && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-4 py-2.5 shadow-md border-b border-indigo-700/50">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1 bg-white/10 rounded-md shrink-0 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Share2 className="w-3.5 h-3.5 text-blue-300" />
              </div>
              <div className="truncate">
                <span className="font-bold text-blue-200">Session collaborative en direct : </span>
                <span className="font-semibold text-white">{activeShare.title}</span>
                <span className="text-blue-300/80 ml-2">
                  (Dernier ajustement {lastSyncedAt ? `à ${lastSyncedAt}` : ''} par{' '}
                  <strong className="text-white">{lastSyncAuthor || activeShare.author}</strong>)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleRole}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  role === 'PRESIDENTE'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
                title="Cliquer pour basculer rapidement entre la vue Directeur Exécutif et Présidente"
              >
                <span>{role === 'PRESIDENTE' ? '👑 Mode Présidente (PDH)' : '👔 Mode Dir. Exécutif'}</span>
                <span className="text-[10px] underline font-normal">(Basculer)</span>
              </button>

              <button
                type="button"
                onClick={syncNow}
                className="px-2.5 py-1 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Forcer la vérification immédiate des modifications faites par vos collaborateurs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Actualiser en direct</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-md font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Copier le lien actuel pour le partager à d'autres collaborateurs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Lien copié</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-blue-200" />
                    <span>Copier le lien direct</span>
                  </>
                )}
              </button>

              <button
                onClick={onOpenShareModal}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                title="Enregistrer un nouvel instantané cloud daté"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span>Nouveau lien</span>
              </button>

              <button
                onClick={exitSharedView}
                className="px-2 py-1 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                title="Quitter la version partagée et retrouver vos données personnelles enregistrées sur ce navigateur"
              >
                <span>Quitter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
