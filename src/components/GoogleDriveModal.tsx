/**
 * GoogleDriveModal — Gestionnaire de synchronisation et de pièces justificatives Google Drive
 * Conforme au skill workspace-integration
 */

import React, { useState, useEffect } from 'react';
import {
  googleSignIn,
  googleSignOut,
  listDriveFiles,
  saveEvaluationToDrive,
  DriveFileItem,
} from '../services/googleDriveService';
import { useTracker } from '../context/TrackerContext';
import { MONTH_NAMES } from '../data/initialTasks';
import {
  HardDrive,
  CheckCircle,
  AlertCircle,
  FileText,
  UploadCloud,
  ExternalLink,
  X,
  LogOut,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any | null;
  onUserChange: (user: any | null) => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
}) => {
  const { currentMonth, tasks, exportCsvData } = useTracker();
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadDriveFiles();
    }
  }, [isOpen, currentUser]);

  const loadDriveFiles = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const files = await listDriveFiles();
      setDriveFiles(files);
    } catch (err: any) {
      console.error('Erreur chargement Drive:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Erreur lors de la lecture des fichiers Drive.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onUserChange(result.user);
        await loadDriveFiles();
        setStatusMessage({ type: 'success', text: `Connecté avec succès : ${result.user.email}` });
      }
    } catch (err: any) {
      console.error('Erreur connexion:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Impossible de se connecter à Google Drive.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await googleSignOut();
    onUserChange(null);
    setDriveFiles([]);
    setStatusMessage({ type: 'success', text: 'Déconnecté de Google Drive.' });
  };

  const handleSaveToDrive = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const filename = `EVALUATION_MENSUELLE_${MONTH_NAMES[currentMonth].replace(/\s+/g, '_')}_HYSTERESIS.csv`;
      const csvContent = exportCsvData();

      const created = await saveEvaluationToDrive(filename, csvContent, 'text/csv');
      setStatusMessage({
        type: 'success',
        text: `Fichier sauvegardé avec succès sur Google Drive : ${created.name}`,
      });
      await loadDriveFiles();
    } catch (err: any) {
      console.error('Erreur sauvegarde Drive:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Erreur lors de l’envoi du fichier sur Google Drive.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Espace Google Drive — Fondation HYSTERESIS
              </h2>
              <p className="text-xs text-slate-500">
                Sauvegarde des fiches d'évaluation et archivage des pièces justificatives.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message de notification */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Corps */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-4">
          {!currentUser ? (
            <div className="text-center py-8 space-y-4">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="max-w-md mx-auto space-y-1">
                <p className="text-sm font-semibold text-slate-900">
                  Connexion Google Workspace requise
                </p>
                <p className="text-xs text-slate-500">
                  Connectez-vous pour exporter directement vos fiches d'évaluation vers Google Drive et attacher vos rapports comme preuves.
                </p>
              </div>

              {/* Bouton officiel Google Sign-in */}
              <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="inline-flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoading ? 'Connexion en cours...' : 'Se connecter avec Google'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Profil & Actions de synchronisation */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || ''}
                      className="w-9 h-9 rounded-full border border-slate-300"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
                      {currentUser.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {currentUser.displayName || 'Utilisateur Google'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveToDrive}
                    disabled={isSaving}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Envoi...' : `Sauvegarder ${MONTH_NAMES[currentMonth].split(' ')[0]}`}</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    title="Déconnexion"
                    className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 bg-white rounded-lg cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Liste des fichiers sauvegardés sur Drive */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-slate-700">
                    Fichiers récents sur votre Google Drive ({driveFiles.length})
                  </div>
                  <button
                    onClick={loadDriveFiles}
                    disabled={isLoading}
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Actualiser</span>
                  </button>
                </div>

                {driveFiles.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
                    Aucun fichier de sauvegarde pour le moment. Cliquez sur "Sauvegarder" ci-dessus pour archiver la fiche du mois courant sur votre Drive.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {driveFiles.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="font-medium text-slate-800 truncate">
                            {file.name}
                          </span>
                        </div>
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:text-blue-800 shrink-0 flex items-center gap-1 text-[11px]"
                          >
                            <span>Ouvrir</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Permissions : accès restreint aux fichiers de l'application (drive.file)</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
