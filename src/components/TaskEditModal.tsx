/**
 * TaskEditModal — Modal de création et modification d'une sous-tâche d'évaluation du PTA / COP
 * Rattachée à une Activité Majeure du PTA 2026
 */

import React, { useState, useEffect } from 'react';
import { TaskItem, TaskStatus, CopCategoryKey } from '../types';
import { COP_CATEGORIES, MONTH_NAMES, PTA_MAJOR_ACTIVITIES } from '../data/initialTasks';
import { FONDATION_DRIVE_OFFICIAL_URL } from '../context/TrackerContext';
import { X, Check, FolderOpen, ExternalLink, Sparkles, HardDrive } from 'lucide-react';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: TaskItem | null;
  defaultMonth: number;
  onSave: (taskData: any) => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultMonth,
  onSave,
}) => {
  const [parentPtaId, setParentPtaId] = useState<string>('pta-a1');
  const [copCategory, setCopCategory] = useState<CopCategoryKey>('A_ACTIVITES');
  const [strategicObjective, setStrategicObjective] = useState<string>('');
  const [operationalObjective, setOperationalObjective] = useState<string>('');
  const [programmePta, setProgrammePta] = useState<string>('');
  const [activity, setActivity] = useState<string>('');
  const [deadlineCop, setDeadlineCop] = useState<string>('');
  const [month, setMonth] = useState<number>(defaultMonth);
  const [report, setReport] = useState<string>('Aucun');
  const [expectedResult, setExpectedResult] = useState<string>('');
  const [autoGenerateValidationTasks, setAutoGenerateValidationTasks] = useState<boolean>(false);
  const [validationType, setValidationType] = useState<'projet' | 'mission'>('projet');
  const [status, setStatus] = useState<TaskStatus>('EN COURS');
  const [proof, setProof] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [financialAmountTarget, setFinancialAmountTarget] = useState<string>('');
  const [financialAmountRealized, setFinancialAmountRealized] = useState<string>('0');

  useEffect(() => {
    if (taskToEdit) {
      setParentPtaId(taskToEdit.parentPtaId || 'pta-a1');
      setCopCategory(taskToEdit.copCategory);
      setStrategicObjective(taskToEdit.strategicObjective);
      setOperationalObjective(taskToEdit.operationalObjective);
      setProgrammePta(taskToEdit.programmePta);
      setActivity(taskToEdit.activity);
      setDeadlineCop(taskToEdit.deadlineCop);
      setMonth(taskToEdit.month);
      setReport(taskToEdit.report || 'Aucun');
      setExpectedResult(taskToEdit.expectedResult);
      setStatus(taskToEdit.status);
      setProof(taskToEdit.proof || '');
      setObservations(taskToEdit.observations || '');
      setFinancialAmountTarget(
        taskToEdit.financialAmountTarget
          ? taskToEdit.financialAmountTarget.toString()
          : taskToEdit.financialAmount
          ? taskToEdit.financialAmount.toString()
          : ''
      );
      setFinancialAmountRealized(
        taskToEdit.financialAmountRealized !== undefined
          ? taskToEdit.financialAmountRealized.toString()
          : '0'
      );
    } else {
      const defaultMajor = PTA_MAJOR_ACTIVITIES[0];
      setParentPtaId(defaultMajor.id);
      setCopCategory(defaultMajor.copCategory);
      setStrategicObjective(defaultMajor.strategicObjective);
      setOperationalObjective(defaultMajor.operationalObjective);
      setProgrammePta(defaultMajor.programmePta);
      setActivity('');
      setDeadlineCop(`${MONTH_NAMES[defaultMonth].split(' ')[0]} 2026`);
      setMonth(defaultMonth);
      setReport('Aucun');
      setExpectedResult('');
      setStatus('EN COURS');
      setProof('');
      setObservations('');
      setFinancialAmountTarget('');
      setFinancialAmountRealized('0');
    }
  }, [taskToEdit, defaultMonth, isOpen]);

  const handleSelectMajorPta = (ptaId: string) => {
    setParentPtaId(ptaId);
    const selected = PTA_MAJOR_ACTIVITIES.find((a) => a.id === ptaId);
    if (selected) {
      setCopCategory(selected.copCategory);
      setProgrammePta(selected.programmePta);
      setOperationalObjective(selected.operationalObjective);
      setStrategicObjective(selected.strategicObjective);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) {
      alert("Veuillez renseigner le libellé de la sous-tâche.");
      return;
    }

    const selectedMajor = PTA_MAJOR_ACTIVITIES.find((a) => a.id === parentPtaId);

    const payload: any = {
      parentPtaId,
      parentPtaTitle: selectedMajor ? selectedMajor.title : undefined,
      copCategory,
      strategicObjective,
      operationalObjective,
      programmePta,
      activity: activity.startsWith('Sous-tâche') ? activity : `Sous-tâche : ${activity}`,
      deadlineCop,
      month,
      report,
      expectedResult,
      status,
      proof,
      observations,
      financialAmount: financialAmountTarget ? parseInt(financialAmountTarget, 10) : undefined,
      financialAmountTarget: financialAmountTarget ? parseInt(financialAmountTarget, 10) : undefined,
      financialAmountRealized: financialAmountRealized ? parseInt(financialAmountRealized, 10) : 0,
    };

    if (taskToEdit) {
      payload.id = taskToEdit.id;
    } else if (autoGenerateValidationTasks) {
      const cleanTitle = activity.replace(/^Sous-tâche\s*:\s*/i, '');
      payload.companionTasks = [
        {
          parentPtaId,
          parentPtaTitle: selectedMajor ? selectedMajor.title : undefined,
          copCategory,
          strategicObjective,
          operationalObjective,
          programmePta,
          activity: `Sous-tâche : Validation des TDR — ${cleanTitle}`,
          deadlineCop,
          month,
          report: 'Aucun',
          expectedResult: `Termes de référence (TDR) officiellement instruits et validés`,
          status: 'VALIDE' as TaskStatus,
          proof: proof || '',
          observations: `Validation formelle des TDR liée à la mise en œuvre de ${cleanTitle}.`,
          validatedByPresident: true,
        },
        {
          parentPtaId,
          parentPtaTitle: selectedMajor ? selectedMajor.title : undefined,
          copCategory,
          strategicObjective,
          operationalObjective,
          programmePta,
          activity: `Sous-tâche : Validation du ${validationType === 'mission' ? 'rapport de mission' : "rapport d'activités"} — ${cleanTitle}`,
          deadlineCop,
          month,
          report: 'Aucun',
          expectedResult: `${validationType === 'mission' ? 'Rapport de mission' : "Rapport d'activités"} élaboré, visé et archivé`,
          status: 'VALIDE' as TaskStatus,
          proof: proof || '',
          observations: `Validation officielle du ${validationType === 'mission' ? 'rapport de mission' : "rapport d'activités"} de fin d'exécution.`,
          validatedByPresident: true,
        },
      ];
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            {taskToEdit ? "Modifier la Sous-Tâche d'Évaluation" : "Ajouter une Sous-Tâche au PTA 2026"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Sélection de l'Activité Majeure PTA Parente */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rattachement — Activité Majeure du PTA 2026 :
            </label>
            <select
              value={parentPtaId}
              onChange={(e) => handleSelectMajorPta(e.target.value)}
              className="w-full p-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              {PTA_MAJOR_ACTIVITIES.map((act) => (
                <option key={act.id} value={act.id}>
                  [{act.code}] {act.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catégorie COP :
              </label>
              <select
                value={copCategory}
                onChange={(e) => setCopCategory(e.target.value as CopCategoryKey)}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
              >
                {COP_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mois d'évaluation :
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
              >
                {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {MONTH_NAMES[m]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Intitulé de la Sous-Tâche d'Évaluation :
            </label>
            <textarea
              rows={2}
              required
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="Ex: Cérémonie de remise des prix et bourses d'études aux lauréats du Borgou..."
              className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Échéance COP :
              </label>
              <input
                type="text"
                value={deadlineCop}
                onChange={(e) => setDeadlineCop(e.target.value)}
                placeholder="Ex: Juillet 2026 ou 3ème Trimestre"
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statut :
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full p-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-900"
              >
                <option value="TERMINE">TERMINE (1 pt DE)</option>
                <option value="VALIDE">VALIDE (1 pt PDH - Visa Présidente d'Honneur)</option>
                <option value="EN COURS">EN COURS (0 pt)</option>
                <option value="PLANIFIER">PLANIFIER (0 pt)</option>
                {status === 'PLANIFIE' && <option value="PLANIFIE">PLANIFIER (0 pt)</option>}
                <option value="NON TERMINE">NON TERMINE (0 pt)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Résultats Attendus :
            </label>
            <input
              type="text"
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
              placeholder="Ex: Au moins 30 lauréats récompensés et 400 kits scolaires distribués"
              className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
            />
          </div>

          {!taskToEdit && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoGenerateValidationTasks}
                  onChange={(e) => setAutoGenerateValidationTasks(e.target.checked)}
                  className="mt-0.5 rounded text-slate-900 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Créer systématiquement les sous-tâches de validation requises</span>
                  </span>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Génère automatiquement : <strong>1. Validation des TDR</strong> puis <strong>2. Validation du rapport d'activités (ou rapport de mission)</strong>.
                  </p>
                </div>
              </label>

              {autoGenerateValidationTasks && (
                <div className="flex items-center gap-4 pl-6 text-xs text-slate-700 pt-1">
                  <span className="font-medium text-slate-600">Nature :</span>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="valType"
                      value="projet"
                      checked={validationType === 'projet'}
                      onChange={() => setValidationType('projet')}
                      className="cursor-pointer"
                    />
                    <span>Projet (Rapport d'activités)</span>
                  </label>
                  <label className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="valType"
                      value="mission"
                      checked={validationType === 'mission'}
                      onChange={() => setValidationType('mission')}
                      className="cursor-pointer"
                    />
                    <span>Mission (Rapport de mission)</span>
                  </label>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Preuve / Livrable (Lien Drive, PV, décharge) :
                </label>
                {proof && proof.startsWith('http') && (
                  <a
                    href={proof}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:text-blue-800 underline flex items-center gap-0.5 font-medium"
                  >
                    <span>Tester ↗</span>
                  </a>
                )}
              </div>
              <input
                type="text"
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/... ou référence PV"
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 font-mono text-[11px]"
              />
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setProof(FONDATION_DRIVE_OFFICIAL_URL)}
                  className="text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-1"
                  title="Coller l'adresse officielle du dossier Executive Performance Tracker - Fondation HYSTERESIS"
                >
                  <FolderOpen className="w-3 h-3 text-blue-600" />
                  <span>Drive Fondation HYSTERESIS (Officiel)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProof(FONDATION_DRIVE_OFFICIAL_URL)}
                  className="text-[10px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-1"
                  title="Dossier pour commande & livraison des T-shirts et polos"
                >
                  <HardDrive className="w-3 h-3 text-slate-500" />
                  <span>Lien Drive T-shirts</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Historique de Report :
              </label>
              <input
                type="text"
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="Ex: Aucun ou Reporté vers T4"
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observations / Commentaires :
            </label>
            <textarea
              rows={2}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Observations sur la réalisation ou contraintes..."
              className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
            />
          </div>

          {copCategory === 'D_FINANCES' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cible financière (FCFA) :
                </label>
                <input
                  type="number"
                  value={financialAmountTarget}
                  onChange={(e) => setFinancialAmountTarget(e.target.value)}
                  placeholder="Ex: 15000000"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Montant encaissé réel (FCFA) :
                </label>
                <input
                  type="number"
                  value={financialAmountRealized}
                  onChange={(e) => setFinancialAmountRealized(e.target.value)}
                  placeholder="0"
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 font-mono"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Enregistrer la sous-tâche</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
