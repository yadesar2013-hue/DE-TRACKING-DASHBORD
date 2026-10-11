/**
 * MonthlyEvaluationView — Canevas d'évaluation mensuelle haute fidélité
 * Inspiré du modèle de Juillet du fichier "EVALUATION MENSUELLE DE"
 */

import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import { TaskItem, TaskStatus, CopCategoryKey } from '../types';
import { COP_CATEGORIES, MONTH_NAMES } from '../data/initialTasks';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck2,
  Plus,
  Download,
  Calendar,
  DollarSign,
  ArrowRight,
  Filter,
  Paperclip,
} from 'lucide-react';

interface MonthlyEvaluationViewProps {
  onOpenAddTaskModal: () => void;
  onEditTask: (task: TaskItem) => void;
  onOpenDriveModal: () => void;
}

export const MonthlyEvaluationView: React.FC<MonthlyEvaluationViewProps> = ({
  onOpenAddTaskModal,
  onEditTask,
  onOpenDriveModal,
}) => {
  const {
    tasks,
    currentMonth,
    setCurrentMonth,
    role,
    monthlyStats,
    globalCumulativeRateProvisional,
    globalCumulativeRateOfficial,
    baseBonusAmount,
    setBaseBonusAmount,
    updateTaskStatus,
    validateTaskByPresident,
    validateAllMonthTasksByPresident,
    replanifyTask,
    deleteTask,
    exportCsvData,
  } = useTracker();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingProofId, setEditingProofId] = useState<string | null>(null);
  const [proofText, setProofText] = useState<string>('');
  const [replanModalTask, setReplanModalTask] = useState<TaskItem | null>(null);
  const [targetReplanMonth, setTargetReplanMonth] = useState<number>(10);
  const [replanReason, setReplanReason] = useState<string>('Replanification stratégique pour le T4');

  // Filtrage des tâches du mois sélectionné
  const monthTasks = tasks.filter((t) => t.month === currentMonth);

  const filteredTasks = monthTasks.filter((task) => {
    if (categoryFilter !== 'ALL' && task.copCategory !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        task.activity.toLowerCase().includes(q) ||
        task.programmePta.toLowerCase().includes(q) ||
        task.operationalObjective.toLowerCase().includes(q) ||
        task.expectedResult.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDownloadCsv = () => {
    const csv = exportCsvData();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EVALUATION_MENSUELLE_${MONTH_NAMES[currentMonth].replace(/\s+/g, '_')}_HYSTERESIS.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (newStatus === 'VALIDE' && role !== 'PRESIDENTE') {
      alert("Seule la Présidente de la Fondation peut attribuer le statut VALIDE à une tâche.");
      return;
    }
    updateTaskStatus(taskId, newStatus);
  };

  const handleOpenProofModal = (task: TaskItem) => {
    setEditingProofId(task.id);
    setProofText(task.proof || '');
  };

  const handleSaveProof = (taskId: string) => {
    updateTaskStatus(taskId, tasks.find((t) => t.id === taskId)?.status || 'EN COURS', proofText);
    setEditingProofId(null);
  };

  const handleConfirmReplan = () => {
    if (!replanModalTask) return;
    replanifyTask(replanModalTask.id, targetReplanMonth, replanReason);
    setReplanModalTask(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Sélecteur de mois & Contexte Exécutif */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Canevas d'Évaluation Mensuelle de Performance
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              Évaluation Mensuelle — {MONTH_NAMES[currentMonth]}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Référence : Contrat d'Objectifs et de Performance (COP) & Plan de Travail Annuel (PTA 2026)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exporter Canevas CSV</span>
            </button>
            <button
              onClick={onOpenAddTaskModal}
              className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouvelle Tâche</span>
            </button>
          </div>
        </div>

        {/* Barre de navigation des mois de Mars à Décembre */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
            const isCurrent = currentMonth === m;
            const isQ4 = m >= 10;
            return (
              <button
                key={m}
                onClick={() => setCurrentMonth(m)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>{MONTH_NAMES[m].split(' ')[0]}</span>
                {m === 7 && (
                  <span className={`text-[10px] px-1 rounded ${isCurrent ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>
                    Modèle
                  </span>
                )}
                {isQ4 && (
                  <span className={`text-[10px] px-1 rounded ${isCurrent ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'}`}>
                    T4
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Bandeau Métrique — Calcul des Scores, Taux et Prime */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Tâches */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Total Activités du Mois</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {monthlyStats.totalTasks}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Programmation {MONTH_NAMES[currentMonth].split(' ')[0]}
          </div>
        </div>

        {/* Validées (Présidence) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Validées (Présidence)</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-800 mt-1">
            {monthlyStats.validatedTasks}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1">
            Score officiel : {monthlyStats.officialScoreSum} pt
          </div>
        </div>

        {/* Terminées (DE) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-blue-700 font-medium flex items-center gap-1">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Terminées (DE)</span>
          </div>
          <div className="text-2xl font-bold font-mono text-blue-800 mt-1">
            {monthlyStats.completedTasks}
          </div>
          <div className="text-[11px] text-blue-600 mt-1">
            Score provisoire : {monthlyStats.provisionalScoreSum} pts
          </div>
        </div>

        {/* Taux Mensuel Validé */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-700 font-medium">Taux Mensuel Validé</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {monthlyStats.officialEvolutionRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Provisoire DE : {monthlyStats.provisionalEvolutionRate}%
          </div>
        </div>

        {/* Taux Global Cumulé */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-700 font-medium">Évolution Globale (2026)</div>
          <div className="text-2xl font-bold font-mono text-indigo-700 mt-1">
            {globalCumulativeRateOfficial}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Cumul Mars - {MONTH_NAMES[currentMonth].split(' ')[0]}
          </div>
        </div>

        {/* Prime à Payer */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 bg-slate-900 text-white">
          <div className="text-xs text-slate-300 font-medium flex items-center justify-between">
            <span>Prime Validée (FCFA)</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {monthlyStats.officialBonus.toLocaleString('fr-FR')} F
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            Prévisionnelle : {monthlyStats.provisionalBonus.toLocaleString('fr-FR')} F
          </div>
        </div>
      </div>

      {/* 3. Zone de Validation Présidence & Paramétrage Forfaitaire */}
      {role === 'PRESIDENTE' && monthlyStats.completedTasks > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-emerald-900">
                Espace Validation Présidence — {monthlyStats.completedTasks} tâche(s) en attente d'approbation
              </div>
              <div className="text-xs text-emerald-700">
                Vous pouvez examiner les livrables dans la colonne Preuve puis valider les tâches pour confirmer le score définitif (1) et le montant de la prime.
              </div>
            </div>
          </div>
          <button
            onClick={() => validateAllMonthTasksByPresident(currentMonth)}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs shrink-0"
          >
            Valider tout le lot terminé ({monthlyStats.completedTasks})
          </button>
        </div>
      )}

      {/* 4. Barre de Filtres & Recherche */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtres :</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">Toutes les catégories COP</option>
            {COP_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="VALIDE">VALIDE (1 pt officiel)</option>
            <option value="TERMINE">TERMINE (1 pt prov.)</option>
            <option value="EN COURS">EN COURS (0 pt)</option>
            <option value="NON TERMINE">NON TERMINE (0 pt)</option>
          </select>

          {/* Ajustement de la prime mensuelle de base */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 ml-auto md:ml-2">
            <span>Base contractuelle prime :</span>
            <input
              type="number"
              step="10000"
              value={baseBonusAmount}
              onChange={(e) => setBaseBonusAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-24 px-2 py-1 text-xs font-mono border border-slate-200 rounded bg-slate-50 text-slate-900"
            />
            <span className="font-mono">F CFA</span>
          </div>
        </div>

        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Rechercher une activité..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 5. TABLEAU OFFICIEL DE L'ÉVALUATION MENSUELLE (Modèle de Juillet) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs print-page">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold border-b border-slate-800">
                <th className="py-3 px-3 w-16 text-center">Réf COP</th>
                <th className="py-3 px-3 min-w-[160px]">Objectif Opérationnel</th>
                <th className="py-3 px-3 min-w-[140px]">Programme PTA</th>
                <th className="py-3 px-3 min-w-[240px]">Activité / Tâche</th>
                <th className="py-3 px-2 min-w-[100px]">Deadline COP</th>
                <th className="py-3 px-2 min-w-[120px]">Report</th>
                <th className="py-3 px-3 min-w-[180px]">Résultats Attendus</th>
                <th className="py-3 px-3 min-w-[120px] text-center">Statut</th>
                <th className="py-3 px-2 w-16 text-center font-mono">Score</th>
                <th className="py-3 px-3 min-w-[150px]">Preuve / Livrable</th>
                <th className="py-3 px-3 min-w-[140px]">Observations</th>
                <th className="py-3 px-2 w-20 text-center no-print">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-500">
                    Aucune activité enregistrée pour ce mois ou selon les critères sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const scoreVal = task.status === 'VALIDE' || task.status === 'TERMINE' ? 1 : 0;
                  const isOfficial = task.status === 'VALIDE';

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Réf COP */}
                      <td className="py-3 px-3 text-center align-top">
                        <span className="font-semibold text-slate-900 font-mono">
                          {task.copCategory === 'A_ACTIVITES'
                            ? 'A'
                            : task.copCategory === 'B_RH'
                            ? 'B'
                            : task.copCategory === 'C_GOUVERNANCE'
                            ? 'C'
                            : 'D'}
                        </span>
                      </td>

                      {/* Objectif Opérationnel */}
                      <td className="py-3 px-3 align-top text-slate-700">
                        <div className="font-medium text-slate-900 leading-tight">
                          {task.operationalObjective}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {task.strategicObjective}
                        </div>
                      </td>

                      {/* Programme PTA */}
                      <td className="py-3 px-3 align-top font-medium text-slate-800">
                        {task.programmePta}
                      </td>

                      {/* Activité / Tâche */}
                      <td className="py-3 px-3 align-top">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {task.activity}
                        </div>
                        {task.financialAmount && (
                          <div className="text-[11px] font-mono text-emerald-700 mt-1">
                            Montant mobilisé cible : {task.financialAmount.toLocaleString('fr-FR')} FCFA
                          </div>
                        )}
                      </td>

                      {/* Deadline COP */}
                      <td className="py-3 px-2 align-top text-slate-600 font-mono whitespace-nowrap">
                        {task.deadlineCop}
                      </td>

                      {/* Report */}
                      <td className="py-3 px-2 align-top text-slate-600">
                        {task.report && task.report !== 'Aucun' ? (
                          <span className="text-amber-800 font-medium block">
                            {task.report}
                          </span>
                        ) : (
                          <span className="text-slate-400">Aucun</span>
                        )}
                      </td>

                      {/* Résultats Attendus */}
                      <td className="py-3 px-3 align-top text-slate-700">
                        {task.expectedResult}
                      </td>

                      {/* Statut sélecteur interactif */}
                      <td className="py-3 px-3 align-top text-center">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className={`w-full px-2 py-1 text-xs font-semibold rounded border cursor-pointer focus:outline-none transition-colors ${
                            task.status === 'VALIDE'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : task.status === 'TERMINE'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : task.status === 'EN COURS'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="TERMINE">TERMINE</option>
                          <option value="VALIDE" disabled={role !== 'PRESIDENTE'}>
                            VALIDE {role !== 'PRESIDENTE' ? '(Présidence)' : ''}
                          </option>
                          <option value="EN COURS">EN COURS</option>
                          <option value="NON TERMINE">NON TERMINE</option>
                        </select>

                        {role === 'PRESIDENTE' && task.status === 'TERMINE' && (
                          <button
                            onClick={() => validateTaskByPresident(task.id)}
                            className="mt-1.5 w-full py-0.5 px-1.5 text-[10px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors"
                          >
                            Valider (1 pt)
                          </button>
                        )}
                      </td>

                      {/* Score (1 ou 0) */}
                      <td className="py-3 px-2 align-top text-center font-mono font-bold">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-xs ${
                            isOfficial
                              ? 'text-emerald-800 font-bold'
                              : scoreVal === 1
                              ? 'text-blue-700 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          {scoreVal}
                        </span>
                        <div className="text-[9px] text-slate-400 font-sans">
                          {isOfficial ? 'officiel' : scoreVal === 1 ? 'provisoire' : ''}
                        </div>
                      </td>

                      {/* Preuve */}
                      <td className="py-3 px-3 align-top">
                        {editingProofId === task.id ? (
                          <div className="space-y-1">
                            <textarea
                              rows={2}
                              value={proofText}
                              onChange={(e) => setProofText(e.target.value)}
                              placeholder="Lien Google Drive ou référence du document..."
                              className="w-full p-1 text-xs border border-slate-300 rounded bg-white text-slate-900"
                            />
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleSaveProof(task.id)}
                                className="px-2 py-0.5 text-[10px] bg-slate-900 text-white rounded cursor-pointer"
                              >
                                Enregistrer
                              </button>
                              <button
                                onClick={() => setEditingProofId(null)}
                                className="px-2 py-0.5 text-[10px] bg-slate-200 text-slate-700 rounded cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-1 group">
                            <span className="text-slate-700 break-words leading-tight">
                              {task.proof ? (
                                task.proof.startsWith('http') ? (
                                  <a
                                    href={task.proof}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 underline hover:text-blue-800"
                                  >
                                    Consulter preuve
                                  </a>
                                ) : (
                                  task.proof
                                )
                              ) : (
                                <span className="text-slate-400 italic">Aucune preuve liée</span>
                              )}
                            </span>
                            <button
                              onClick={() => handleOpenProofModal(task)}
                              title="Ajouter ou modifier la preuve"
                              className="opacity-60 group-hover:opacity-100 p-1 text-slate-500 hover:text-slate-900 no-print"
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Observations */}
                      <td className="py-3 px-3 align-top text-slate-600">
                        {task.observations || '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-2 align-top text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditTask(task)}
                            title="Modifier la tâche"
                            className="p-1 text-slate-500 hover:text-slate-900 rounded"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => {
                              setReplanModalTask(task);
                              setTargetReplanMonth(10);
                            }}
                            title="Replanifier vers le T4 (Octobre-Décembre)"
                            className="p-1 text-amber-700 hover:text-amber-900 rounded"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pied de page du tableau : Décompte officiel et visa contractuel */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            <strong>TOTAL TÂCHES — {MONTH_NAMES[currentMonth].toUpperCase()} :</strong>{' '}
            <span className="font-mono font-bold text-slate-900">{monthlyStats.totalTasks}</span> activités |{' '}
            Taux d'évolution mensuel validé :{' '}
            <span className="font-mono font-bold text-emerald-700">{monthlyStats.officialEvolutionRate}%</span> |{' '}
            Prime à payer :{' '}
            <span className="font-mono font-bold text-slate-900">
              {monthlyStats.officialBonus.toLocaleString('fr-FR')} F CFA
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>Directeur Exécutif : Arsène YADES</span>
            <span>·</span>
            <span>Présidente : Cheryle IDOSSOU</span>
          </div>
        </div>
      </div>

      {/* Modal de Replanification rapide d'une tâche */}
      {replanModalTask && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Replanifier l'activité vers le T4
            </h3>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
              {replanModalTask.activity}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mois cible de replanification (T4 2026) :
                </label>
                <select
                  value={targetReplanMonth}
                  onChange={(e) => setTargetReplanMonth(parseInt(e.target.value, 10))}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
                >
                  <option value={10}>Octobre 2026</option>
                  <option value={11}>Novembre 2026</option>
                  <option value={12}>Décembre 2026</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Motif de replanification / Report :
                </label>
                <textarea
                  rows={3}
                  value={replanReason}
                  onChange={(e) => setReplanReason(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setReplanModalTask(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReplan}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Confirmer le report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
