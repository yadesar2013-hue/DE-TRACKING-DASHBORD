/**
 * PtaImportModal — Console d'importation et d'harmonisation des sous-tâches
 * du PTA 2026 et des fiches d'évaluation mensuelle du DE (Mars à Décembre 2026)
 * Rattachées aux Activités Majeures du PTA et aux 4 rubriques du COP
 * Fondation HYSTERESIS
 */

import React, { useState, useMemo } from 'react';
import { useTracker } from '../context/TrackerContext';
import { MONTH_NAMES, COP_CATEGORIES, PTA_MAJOR_ACTIVITIES } from '../data/initialTasks';
import { parsePtaImportText, ParsedPtaRow } from '../utils/ptaParser';
import { TaskItem, CopCategoryKey, TaskStatus } from '../types';
import {
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  X,
  Sparkles,
  HelpCircle,
  FileText,
  FolderTree,
} from 'lucide-react';

interface PtaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMonth?: number;
}

const SAMPLE_EVALUATION_DATA = `A	OO 1 : Organiser la Journée de l'Excellence	Journée de l'Excellence	Sous-tâche : Tenue effective de la Journée de l'Excellence du 28 au 30 août 2026 à Parakou	Août 2026	Aucun	30 lauréats récompensés et 400 kits scolaires distribués	VALIDE	Rapport général et décharges lauréats (28-30 août 2026)	Succès éclatant à Parakou
A	OO 1 : Réaliser le Programme Conversations Inspirantes	Conversations Inspirantes	Sous-tâche : Cérémonie de lancement de la 2e cohorte de 'Conversations Inspirantes' le 6 juin 2026	Juin 2026	Aucun	74 participants certifiés, forte parité féminine	VALIDE	Validé : mail du sam. 30 mai à la pdh et commentaires	Jalon honoré le 6 juin 2026
A	OO 1 : Réaliser le Programme Conversations Inspirantes	Conversations Inspirantes	Sous-tâche : Sortie officielle et certification de la 2e cohorte de Conversations Inspirantes le 24 octobre 2026	Octobre 2026	Aucun	50 nouveaux jeunes certifiés	EN COURS	Programme de diplomation et livret lauréats	Sortie prévue le 24 octobre 2026
A	OO 1 : Réaliser le Programme Conversations Inspirantes	Conversations Inspirantes (PCI3)	Sous-tâche : Lancement officiel et appel à candidatures de la 3e cohorte (PCI3) le 26 octobre 2026	Octobre 2026	Aucun	Appel à candidatures PCI3 diffusé publiquement	EN COURS	Formulaire en ligne et visuels de campagne	Proclamation des résultats prévue le 13 novembre 2026
B	OO 2 : Déclarations de mise en conformité PNS	Gouvernance Institutionnelle	Sous-tâche : Premier dépôt de la demande de déclaration de mise en conformité au Registre des Associations et Fondations pour FONDATION HYSTÉRÉSIS via le Portail National des Services (30/06/2026)	Juin 2026	Aucun	Dossier initial complet téléversé sur le Portail	VALIDE	Accusé d'enregistrement n°PNS-RAF-2026-0630 du 30/06/2026	Premier dépôt effectué avec succès
B	OO 2 : Déclarations de mise en conformité PNS	Gouvernance Institutionnelle	Sous-tâche : Soumission de la 2e demande de déclaration de mise en conformité au Registre des Associations et Fondations pour FONDATION HYSTÉRÉSIS via le Portail National des Services le 31 août 2026	Août 2026	Aucun	Dossier de régularisation instruit	VALIDE	Bordereau électronique PNS du 31/08/2026	2e demande transmise le 31 août
B	OO 2 : Déclarations de mise en conformité PNS	Gouvernance Institutionnelle	Sous-tâche : Réception et archivage de l'Attestation de mise en conformité au Registre des Associations et Fondations pour FONDATION HYSTÉRÉSIS (délivrée le 1er septembre 2026 via le Portail National des Services)	Septembre 2026	Aucun	Attestation officielle délivrée par l'autorité	VALIDE	Attestation officielle n°RAF-CONF-2026-0901 du 01/09/2026	Fondation en conformité légale totale
C	OO 2 : Tenue régulière des réunions du CA	Gouvernance Statutaire	Sous-tâche : Préparation, convocation et tenue du Conseil d'Administration le 31 octobre 2026	Octobre 2026	Aucun	Session statutaire tenue, résolutions adoptées	EN COURS	Dossier de convocation et ordre du jour du 31/10/2026	Prochain CA fixé au 31 octobre 2026
D	OO 2 : Mobiliser 100M FCFA sur le T4	Levée de fonds & Bailleurs	Sous-tâche : Mobilisation financière T4 — Tranche 1 (Octobre) : Négociations fermes et encaissement initial de 25 000 000 FCFA	Octobre 2026	Bascule T4	25 000 000 FCFA visés pour amorcer les 100M COP	EN COURS	Projets de conventions soumis aux bailleurs	0 FCFA mobilisé jusqu'ici. Étalement COP T4.`;

export const PtaImportModal: React.FC<PtaImportModalProps> = ({
  isOpen,
  onClose,
  defaultMonth = 7,
}) => {
  const { currentMonth, importTasks, setCurrentMonth } = useTracker();

  const [targetMonth, setTargetMonth] = useState<number>(defaultMonth || currentMonth);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [rawText, setRawText] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<ParsedPtaRow[]>([]);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Mise à jour de l'analyse automatique lorsque le texte change
  const handleTextChange = (text: string) => {
    setRawText(text);
    if (!text.trim()) {
      setParsedItems([]);
      return;
    }
    const parsed = parsePtaImportText(text, targetMonth);
    setParsedItems(parsed);
  };

  const handleLoadSample = () => {
    handleTextChange(SAMPLE_EVALUATION_DATA);
  };

  const handleClear = () => {
    setRawText('');
    setParsedItems([]);
    setSuccessMessage(null);
  };

  const handleCategoryChange = (index: number, newCategory: CopCategoryKey) => {
    // Sélectionner la première activité majeure de cette nouvelle catégorie
    const defaultMajor = PTA_MAJOR_ACTIVITIES.find((a) => a.copCategory === newCategory);
    setParsedItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              copCategory: newCategory,
              parentPtaId: defaultMajor ? defaultMajor.id : undefined,
              parentPtaTitle: defaultMajor ? defaultMajor.title : undefined,
              programmePta: defaultMajor ? defaultMajor.programmePta : item.programmePta,
            }
          : item
      )
    );
  };

  const handleParentPtaChange = (index: number, ptaId: string) => {
    const selectedPta = PTA_MAJOR_ACTIVITIES.find((a) => a.id === ptaId);
    if (!selectedPta) return;
    setParsedItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              parentPtaId: selectedPta.id,
              parentPtaTitle: selectedPta.title,
              programmePta: selectedPta.programmePta,
              copCategory: selectedPta.copCategory,
            }
          : item
      )
    );
  };

  const handleStatusChange = (index: number, newStatus: TaskStatus) => {
    setParsedItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, status: newStatus } : item))
    );
  };

  // Répartition par catégorie COP
  const categoryCounts = useMemo(() => {
    const counts: Record<CopCategoryKey, number> = {
      A_ACTIVITES: 0,
      B_RH: 0,
      C_GOUVERNANCE: 0,
      D_FINANCES: 0,
    };
    parsedItems.forEach((item) => {
      if (counts[item.copCategory] !== undefined) {
        counts[item.copCategory] += 1;
      }
    });
    return counts;
  }, [parsedItems]);

  const handleConfirmImport = () => {
    if (parsedItems.length === 0) return;

    const newTasks: TaskItem[] = parsedItems.map((p, idx) => ({
      id: `subtask-import-${Date.now()}-${idx}`,
      copCategory: p.copCategory,
      parentPtaId: p.parentPtaId,
      parentPtaTitle: p.parentPtaTitle,
      strategicObjective: p.strategicObjective,
      operationalObjective: p.operationalObjective,
      programmePta: p.programmePta,
      activity: p.activity.startsWith('Sous-tâche') ? p.activity : `Sous-tâche : ${p.activity}`,
      deadlineCop: p.deadlineCop,
      month: targetMonth,
      report: p.report,
      expectedResult: p.expectedResult,
      status: p.status,
      proof: p.proof,
      observations: p.observations,
      validatedByPresident: p.status === 'VALIDE',
      validatedAt: p.status === 'VALIDE' ? new Date().toISOString() : undefined,
      financialAmount: p.financialAmount,
      financialAmountTarget: p.financialAmountTarget,
      financialAmountRealized: p.financialAmountRealized || 0,
    }));

    importTasks(newTasks, targetMonth, importMode);
    setCurrentMonth(targetMonth);

    setSuccessMessage(
      `${newTasks.length} sous-tâche(s) d'évaluation intégrée(s) et classée(s) sous les activités majeures du PTA pour ${MONTH_NAMES[targetMonth]} !`
    );

    setTimeout(() => {
      onClose();
      setSuccessMessage(null);
      setRawText('');
      setParsedItems([]);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Institutionnel */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Coller & Harmoniser les Sous-Tâches d'Évaluation (PTA 2026)
              </h2>
              <p className="text-xs text-slate-500">
                Rattachement automatique ou manuel aux Activités Majeures du PTA et aux 4 catégories du COP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps du modal */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Configuration du mois et du mode d'import */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mois d'évaluation cible :
              </label>
              <select
                value={targetMonth}
                onChange={(e) => {
                  const m = parseInt(e.target.value, 10);
                  setTargetMonth(m);
                  if (rawText) {
                    setParsedItems(parsePtaImportText(rawText, m));
                  }
                }}
                className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {MONTH_NAMES[m]} {m < 10 ? '(Évaluation Réalisée)' : '(T4 Replanifié)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mode d'intégration :
              </label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setImportMode('append')}
                  className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer text-center ${
                    importMode === 'append'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Ajouter aux sous-tâches
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer text-center ${
                    importMode === 'replace'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Remplacer le mois
                </button>
              </div>
            </div>
          </div>

          {/* Zone de texte de collage */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Coller le tableau ou la liste des sous-activités / sous-tâches :</span>
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Format attendu</span>
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Charger un exemple</span>
                </button>
                {rawText && (
                  <>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-slate-500 hover:text-red-700 cursor-pointer"
                    >
                      Effacer
                    </button>
                  </>
                )}
              </div>
            </div>

            {showHelp && (
              <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <div className="font-semibold">Format et structuration :</div>
                <ul className="list-disc list-inside space-y-0.5 text-blue-800">
                  <li>
                    <strong>Copier depuis Excel / Sheets</strong> : Collez les lignes contenant la sous-tâche, le statut, les livrables, preuves et observations.
                  </li>
                  <li>
                    <strong>Rattachement automatique</strong> : L'analyseur détecte les mots-clés (Excellence, Conversations, Kokari, Academia, Bénévoles, CA, Réseaux, etc.) pour relier chaque sous-tâche à la bonne Activité Majeure du PTA 2026.
                  </li>
                </ul>
              </div>
            )}

            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Collez ici les lignes d'évaluation mensuelle du DE (cellules Excel ou texte séparé par tabulations)..."
              className="w-full p-3 text-xs font-mono border border-slate-300 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Synthèse de classification des sous-tâches */}
          {parsedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-600" />
                  <span>
                    Aperçu hiérarchique ({parsedItems.length} sous-tâche{parsedItems.length > 1 ? 's' : ''} détectée{parsedItems.length > 1 ? 's' : ''})
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Vous pouvez ajuster l'activité majeure PTA de rattachement pour chaque ligne ci-dessous.
                </div>
              </div>

              {/* Badges de comptage par rubrique */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-700">A / ACTIVITÉS</div>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    {categoryCounts.A_ACTIVITES}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-700">B / RESSOURCES HUMAINES</div>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    {categoryCounts.B_RH}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-700">C / BONNE GESTION & GOUV.</div>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    {categoryCounts.C_GOUVERNANCE}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-700">D / MOBILISATION FINANCES</div>
                  <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                    {categoryCounts.D_FINANCES}
                  </div>
                </div>
              </div>

              {/* Tableau d'aperçu modifiable ligne par ligne */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5 w-48">Activité Majeure PTA Parente</th>
                      <th className="py-2 px-2.5">Sous-Tâche d'Évaluation (DE)</th>
                      <th className="py-2 px-2.5 w-28 text-center">Statut</th>
                      <th className="py-2 px-2.5 min-w-[120px]">Preuve / Livrable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {parsedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-2 px-2.5 align-top">
                          <select
                            value={item.parentPtaId || ''}
                            onChange={(e) => handleParentPtaChange(idx, e.target.value)}
                            className="w-full px-2 py-1 text-xs font-semibold bg-white border border-slate-300 rounded focus:outline-none"
                          >
                            {PTA_MAJOR_ACTIVITIES.map((act) => (
                              <option key={act.id} value={act.id}>
                                [{act.code}] {act.title.substring(0, 32)}...
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2.5 align-top">
                          <div className="font-semibold text-slate-900 leading-tight">
                            {item.activity}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {item.programmePta} · {item.expectedResult}
                          </div>
                        </td>
                        <td className="py-2 px-2.5 align-top text-center">
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(idx, e.target.value as TaskStatus)}
                            className="w-full px-1.5 py-1 text-[11px] font-semibold border rounded bg-white text-slate-800"
                          >
                            <option value="VALIDE">VALIDE (1)</option>
                            <option value="TERMINE">TERMINE (1)</option>
                            <option value="EN COURS">EN COURS (0)</option>
                            <option value="PLANIFIER">PLANIFIER (0)</option>
                            <option value="NON TERMINE">NON TERMINE (0)</option>
                          </select>
                        </td>
                        <td className="py-2 px-2.5 align-top text-slate-600 truncate max-w-xs">
                          {item.proof || item.observations || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer avec Boutons d'Action */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 cursor-pointer"
          >
            Fermer
          </button>

          <button
            type="button"
            disabled={parsedItems.length === 0}
            onClick={handleConfirmImport}
            className={`px-5 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
              parsedItems.length > 0
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Intégrer les {parsedItems.length} sous-tâche{parsedItems.length > 1 ? 's' : ''} dans {MONTH_NAMES[targetMonth]}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
