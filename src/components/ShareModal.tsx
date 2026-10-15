/**
 * ShareModal — Modal de sauvegarde Cloud & de génération de lien de partage collaboratif
 * Fondation HYSTERESIS
 */

import React, { useState, useEffect } from 'react';
import { useTracker, FONDATION_DRIVE_OFFICIAL_URL } from '../context/TrackerContext';
import { MONTH_NAMES } from '../data/initialTasks';
import {
  createCloudShare,
  getLocalShareHistory,
  buildShareUrl,
  ShareMetadata,
} from '../services/shareService';
import {
  X,
  CloudUpload,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Mail,
  MessageCircle,
  Clock,
  HardDrive,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const {
    tasks,
    currentMonth,
    baseBonusAmount,
    monthlyStats,
    role,
    loadSharedSnapshot,
  } = useTracker();

  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string | null>(null);
  const [generatedShareId, setGeneratedShareId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<(ShareMetadata & { shareUrl?: string })[]>([]);

  useEffect(() => {
    if (isOpen) {
      const monthLabel = MONTH_NAMES[currentMonth] || `Mois ${currentMonth}`;
      setTitle(`Évaluation DE — ${monthLabel}`);
      setAuthor(
        role === 'PRESIDENTE'
          ? 'Présidence — Mme Cheryle IDOSSOU'
          : 'Directeur Exécutif — M. Arsène YADES'
      );
      setNotes('');
      setGeneratedShareUrl(null);
      setGeneratedShareId(null);
      setCopied(false);
      setHistory(getLocalShareHistory());
    }
  }, [isOpen, currentMonth, role]);

  if (!isOpen) return null;

  const handleSaveAndShare = async () => {
    setIsSaving(true);
    try {
      const result = await createCloudShare({
        tasks,
        currentMonth,
        baseBonusAmount,
        title: title.trim() || `Évaluation ${MONTH_NAMES[currentMonth]}`,
        author: author.trim() || 'Directeur Exécutif',
        notes: notes.trim(),
        officialEvolutionRate: monthlyStats.officialEvolutionRate,
        provisionalEvolutionRate: monthlyStats.provisionalEvolutionRate,
        officialBonus: monthlyStats.officialBonus,
      });

      // Activer immédiatement la session collaborative en direct pour l'émetteur
      loadSharedSnapshot(result.share);

      setGeneratedShareUrl(result.shareUrl);
      setGeneratedShareId(result.id);
      setHistory(getLocalShareHistory());

      // Copie automatique dans le presse-papier pour un partage immédiat
      try {
        await navigator.clipboard.writeText(result.shareUrl);
        setCopied(true);
      } catch (_) {}
    } catch (err) {
      console.error('Erreur lors de la sauvegarde cloud:', err);
      alert("Une erreur s'est produite lors de la sauvegarde. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = (urlToCopy?: string) => {
    const url = urlToCopy || generatedShareUrl;
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const mailtoLink = generatedShareUrl
    ? `mailto:?subject=${encodeURIComponent(
        `[Fondation HYSTERESIS] Évaluation du Directeur Exécutif — ${MONTH_NAMES[currentMonth]}`
      )}&body=${encodeURIComponent(
        `Bonjour,\n\nVeuillez trouver ci-joint l'état actuel de l'évaluation du Directeur Exécutif pour le mois de ${MONTH_NAMES[currentMonth]} (Fondation HYSTERESIS) :\n\n${generatedShareUrl}\n\n- Taux validé : ${monthlyStats.officialEvolutionRate}%\n- Prime correspondante : ${monthlyStats.officialBonus.toLocaleString('fr-FR')} FCFA\n\nCordialement,\n${author}`
      )}`
    : '#';

  const whatsappLink = generatedShareUrl
    ? `https://wa.me/?text=${encodeURIComponent(
        `*Fondation HYSTERESIS — Executive Performance Tracker*\nConsultez l'évaluation de ${MONTH_NAMES[currentMonth]} :\n${generatedShareUrl}`
      )}`
    : '#';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in duration-200">
        {/* Header institutionnel */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-xs">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Sauvegarde Cloud & Partage Collaboratif</h2>
              <p className="text-xs text-slate-300">
                Enregistrez vos modifications pour que vos collaborateurs accèdent exactement au même état
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Synthèse de l'état actuel à sauvegarder */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Instantané actuel à enregistrer
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[11px] text-slate-500">Mois d'évaluation</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {MONTH_NAMES[currentMonth].split(' ')[0]} 2026
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[11px] text-slate-500">Sous-tâches</div>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {monthlyStats.totalTasks} ({tasks.length} total)
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[11px] text-slate-500">Taux Validé (PDH)</div>
                <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">
                  {monthlyStats.officialEvolutionRate}%
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-[11px] text-slate-500">Prime Validée</div>
                <div className="text-sm font-bold font-mono text-amber-700 mt-0.5">
                  {monthlyStats.officialBonus.toLocaleString('fr-FR')} F
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire de métadonnées */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Titre de la version sauvegardée :
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Évaluation DE — Juillet 2026"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Auteur de la modification :
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Directeur Exécutif ou Présidence"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note ou message aux collaborateurs (optionnel) :
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Preuves Drive ajoutées, en attente de visa"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Bouton d'action principal */}
            <button
              onClick={handleSaveAndShare}
              disabled={isSaving}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Enregistrement dans le Cloud en cours...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4 text-emerald-400" />
                  <span>
                    {generatedShareUrl
                      ? 'Mettre à jour & Générer un nouveau lien'
                      : 'Enregistrer dans le Cloud & Générer le lien de partage'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Résultat du lien généré */}
          {generatedShareUrl && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">
                    Lien de partage prêt et synchronisé !
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200 text-emerald-800">
                  ID: {generatedShareId}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-emerald-300">
                <input
                  type="text"
                  readOnly
                  value={generatedShareUrl}
                  className="flex-1 text-xs font-mono text-slate-800 bg-transparent border-none outline-none select-all"
                />
                <button
                  onClick={() => handleCopy()}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier le lien</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-emerald-800">
                Toute personne qui ouvre ce lien verra instantanément cette version exacte de vos tâches, scores, preuves et calculs de prime.
              </p>

              {/* Raccourcis de partage direct */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <a
                  href={generatedShareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                  <span>Tester dans un nouvel onglet</span>
                </a>

                <a
                  href={mailtoLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Envoyer par Email</span>
                </a>

                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-100/60 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Partager sur WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {/* Raccourci vers le Drive officiel */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <div className="text-xs font-bold text-blue-900">
                  Dossier Drive officiel : Executive Performance Tracker
                </div>
                <div className="text-[11px] text-blue-700">
                  Fondation HYSTERESIS — Contrat COP & Livrables archivés
                </div>
              </div>
            </div>
            <a
              href={FONDATION_DRIVE_OFFICIAL_URL}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1 shrink-0"
            >
              <span>Ouvrir Drive ↗</span>
            </a>
          </div>

          {/* Historique des sauvegardes récentes créées sur cette machine */}
          {history.length > 0 && (
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Historique des sauvegardes cloud récentes</span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {history.map((item) => {
                  const url = item.shareUrl || buildShareUrl(item.id);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 truncate">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>{new Date(item.createdAt).toLocaleString('fr-FR')}</span>
                          <span>·</span>
                          <span>{item.author}</span>
                          <span>·</span>
                          <span className="font-mono">{item.taskCount} tâches</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(url)}
                          title="Copier le lien"
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-white rounded cursor-pointer border border-transparent hover:border-slate-200"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          title="Tester le lien"
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-white rounded border border-transparent hover:border-slate-200"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer modal */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>Fondation HYSTERESIS — Cotonou, Bénin</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
