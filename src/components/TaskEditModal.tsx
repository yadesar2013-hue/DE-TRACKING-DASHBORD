/**
 * TaskEditModal — Modal de création et modification d'une tâche du PTA / COP
 */

import React, { useState, useEffect } from 'react';
import { TaskItem, TaskStatus, CopCategoryKey } from '../types';
import { COP_CATEGORIES, MONTH_NAMES } from '../data/initialTasks';
import { X, Check } from 'lucide-react';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: TaskItem | null;
  defaultMonth: number;
  onSave: (taskData: Omit<TaskItem, 'id'> | TaskItem) => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  defaultMonth,
  onSave,
}) => {
  const [copCategory, setCopCategory] = useState<CopCategoryKey>('A_ACTIVITES');
  const [strategicObjective, setStrategicObjective] = useState<string>('');
  const [operationalObjective, setOperationalObjective] = useState<string>('');
  const [programmePta, setProgrammePta] = useState<string>('');
  const [activity, setActivity] = useState<string>('');
  const [deadlineCop, setDeadlineCop] = useState<string>('');
  const [month, setMonth] = useState<number>(defaultMonth);
  const [report, setReport] = useState<string>('Aucun');
  const [expectedResult, setExpectedResult] = useState<string>('');
  const [status, setStatus] = useState<TaskStatus>('EN COURS');
  const [proof, setProof] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [financialAmount, setFinancialAmount] = useState<string>('');

  useEffect(() => {
    if (taskToEdit) {
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
      setFinancialAmount(taskToEdit.financialAmount ? taskToEdit.financialAmount.toString() : '');
    } else {
      setCopCategory('A_ACTIVITES');
      setStrategicObjective("OS 1 : Organiser la Journée de l'Excellence");
      setOperationalObjective("OO 1 : Réaliser le Programme Conversations Inspirantes");
      setProgrammePta('Conversations Inspirantes');
      setActivity('');
      setDeadlineCop(`${MONTH_NAMES[defaultMonth].split(' ')[0]} 2026`);
      setMonth(defaultMonth);
      setReport('Aucun');
      setExpectedResult('');
      setStatus('EN COURS');
      setProof('');
      setObservations('');
      setFinancialAmount('');
    }
  }, [taskToEdit, defaultMonth, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.trim()) {
      alert("Veuillez renseigner le libellé de l'activité.");
      return;
    }

    const payload: any = {
      copCategory,
      strategicObjective,
      operationalObjective,
      programmePta,
      activity,
      deadlineCop,
      month,
      report,
      expectedResult,
      status,
      proof,
      observations,
      financialAmount: financialAmount ? parseInt(financialAmount, 10) : undefined,
    };

    if (taskToEdit) {
      payload.id = taskToEdit.id;
    }

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            {taskToEdit ? "Modifier l'Activité du PTA" : 'Ajouter une Activité au PTA 2026'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex-1 overflow-y-auto space-y-4 pr-1">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Objectif Stratégique (OS) :
              </label>
              <input
                type="text"
                value={strategicObjective}
                onChange={(e) => setStrategicObjective(e.target.value)}
                placeholder="Ex: OS 1 : Organiser la Journée de l'Excellence"
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Objectif Opérationnel (OO) :
              </label>
              <input
                type="text"
                value={operationalObjective}
                onChange={(e) => setOperationalObjective(e.target.value)}
                placeholder="Ex: OO 1 : Réaliser le Programme Conversations Inspirantes"
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Programme du PTA :
              </label>
              <input
                type="text"
                value={programmePta}
                onChange={(e) => setProgrammePta(e.target.value)}
                placeholder="Ex: Conversations Inspirantes, Projet Kokari..."
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deadline (selon le COP) :
              </label>
              <input
                type="text"
                value={deadlineCop}
                onChange={(e) => setDeadlineCop(e.target.value)}
                placeholder="Ex: 3ème Trimestre 2026, Juillet 2026..."
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Activité / Tâche :
            </label>
            <textarea
              rows={2}
              required
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="Description précise de l'activité à réaliser..."
              className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Résultats Attendus :
              </label>
              <textarea
                rows={2}
                value={expectedResult}
                onChange={(e) => setExpectedResult(e.target.value)}
                placeholder="Livrable ou indicateur mesurable..."
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statut initial / actuel :
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 font-semibold"
              >
                <option value="EN COURS">EN COURS (0 pt)</option>
                <option value="TERMINE">TERMINE (1 pt provisoire)</option>
                <option value="VALIDE">VALIDE (1 pt officiel Présidence)</option>
                <option value="NON TERMINE">NON TERMINE (0 pt)</option>
              </select>

              <div className="mt-2">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Report :
                </label>
                <input
                  type="text"
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  placeholder="Aucun ou motif de report..."
                  className="w-full p-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preuve (Lien Google Drive ou Référence doc) :
              </label>
              <input
                type="text"
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="Ex: PV réunion signé, https://drive.google.com/..."
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Montant Mobilisation (Optionnel, en FCFA) :
              </label>
              <input
                type="number"
                value={financialAmount}
                onChange={(e) => setFinancialAmount(e.target.value)}
                placeholder="Ex: 10000000"
                className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observations :
            </label>
            <input
              type="text"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Remarques éventuelles pour l'évaluation..."
              className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              {taskToEdit ? 'Mettre à jour' : 'Ajouter au PTA'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
