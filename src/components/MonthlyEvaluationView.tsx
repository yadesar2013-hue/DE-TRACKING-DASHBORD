/**
 * MonthlyEvaluationView — Canevas d'évaluation mensuelle haute fidélité
 * Aligné sur le Contrat d'Objectifs et de Performance (COP) et le PTA 2026
 * Structure hiérarchique :
 * Catégories COP (A, B, C, D) -> Activités Majeures PTA -> Sous-tâches d'évaluation dépliables
 * Fondation HYSTERESIS
 */

import React, { useState, useMemo } from 'react';
import { useTracker, FONDATION_DRIVE_OFFICIAL_URL, FONDATION_DRIVE_OFFICIAL_TITLE } from '../context/TrackerContext';
import { TaskItem, TaskStatus, CopCategoryKey } from '../types';
import { COP_CATEGORIES, MONTH_NAMES, PTA_MAJOR_ACTIVITIES } from '../data/initialTasks';
import { getTaskDateAndStatusInfo } from '../utils/performanceStats';
import { PtaImportModal } from './PtaImportModal';
import {
  CheckCircle2,
  FileCheck2,
  Plus,
  Download,
  Calendar,
  DollarSign,
  ArrowRight,
  Filter,
  Paperclip,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Layers,
  FolderOpen,
  ExternalLink,
  Copy,
  Check,
  CloudUpload,
  HardDrive,
  RotateCcw,
} from 'lucide-react';

interface MonthlyEvaluationViewProps {
  onOpenAddTaskModal: () => void;
  onEditTask: (task: TaskItem) => void;
  onOpenDriveModal: () => void;
  onOpenShareModal: () => void;
}

export const MonthlyEvaluationView: React.FC<MonthlyEvaluationViewProps> = ({
  onOpenAddTaskModal,
  onEditTask,
  onOpenDriveModal,
  onOpenShareModal,
}) => {
  const {
    tasks,
    currentMonth,
    setCurrentMonth,
    role,
    setRole,
    toggleRole,
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
    resetMonthToInitialTasks,
  } = useTracker();

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingProofId, setEditingProofId] = useState<string | null>(null);
  const [proofText, setProofText] = useState<string>('');
  const [replanModalTask, setReplanModalTask] = useState<TaskItem | null>(null);
  const [targetReplanMonth, setTargetReplanMonth] = useState<number>(10);
  const [replanReason, setReplanReason] = useState<string>('Replanification stratégique pour le T4');
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // État de dépliement des cartes d'activités majeures PTA (toutes dépliées par défaut)
  const [expandedActivities, setExpandedActivities] = useState<{ [actId: string]: boolean }>({});

  const toggleActivityExpand = (actId: string) => {
    setExpandedActivities((prev) => ({
      ...prev,
      [actId]: prev[actId] === undefined ? false : !prev[actId],
    }));
  };

  const isActivityExpanded = (actId: string) => {
    // Par défaut déplié si non spécifié
    return expandedActivities[actId] !== false;
  };

  const expandAll = () => {
    const newState: { [actId: string]: boolean } = {};
    PTA_MAJOR_ACTIVITIES.forEach((act) => {
      newState[act.id] = true;
    });
    newState['other'] = true;
    setExpandedActivities(newState);
  };

  const collapseAll = () => {
    const newState: { [actId: string]: boolean } = {};
    PTA_MAJOR_ACTIVITIES.forEach((act) => {
      newState[act.id] = false;
    });
    newState['other'] = false;
    setExpandedActivities(newState);
  };

  // Filtrage des sous-tâches du mois sélectionné
  const monthTasks = useMemo(() => {
    return tasks.filter((t) => t.month === currentMonth);
  }, [tasks, currentMonth]);

  const filteredTasks = useMemo(() => {
    return monthTasks.filter((task) => {
      if (categoryFilter !== 'ALL' && task.copCategory !== categoryFilter) return false;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PLANIFIER' || statusFilter === 'PLANIFIE') {
          if (task.status !== 'PLANIFIER' && task.status !== 'PLANIFIE') return false;
        } else if (task.status !== statusFilter) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          task.activity.toLowerCase().includes(q) ||
          task.programmePta.toLowerCase().includes(q) ||
          task.operationalObjective.toLowerCase().includes(q) ||
          task.expectedResult.toLowerCase().includes(q) ||
          (task.parentPtaTitle && task.parentPtaTitle.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [monthTasks, categoryFilter, statusFilter, searchQuery]);

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

  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopyLink = (url: string) => {
    try {
      navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch {
      // Fallback
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2500);
    }
  };

  // Helper pour afficher élégamment les preuves et liens Google Drive
  const renderProofContent = (task: TaskItem) => {
    const rawProof = task.proof || '';
    const isTshirt =
      task.id.includes('tshirt') ||
      task.activity.toLowerCase().includes('t-shirt') ||
      task.activity.toLowerCase().includes('tshirt') ||
      task.activity.toLowerCase().includes('vestimentaire');

    // Détection d'URL http/https
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = rawProof.match(urlRegex);

    if (!rawProof.trim()) {
      return (
        <div className="space-y-1">
          <span className="text-slate-400 italic text-[11px] block">Aucune preuve liée</span>
          <a
            href={FONDATION_DRIVE_OFFICIAL_URL}
            target="_blank"
            rel="noreferrer"
            title="Ouvrir le dossier officiel : Executive Performance Tracker - Fondation HYSTERESIS"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 border border-blue-200 transition-colors shadow-2xs"
          >
            <FolderOpen className="w-3 h-3 text-blue-600 shrink-0" />
            <span>Drive Fondation HYSTERESIS</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
          </a>
        </div>
      );
    }

    if (!matches || matches.length === 0) {
      return (
        <div className="space-y-1">
          <span className="text-slate-700 leading-tight break-words text-[11px] block">{rawProof}</span>
          <a
            href={FONDATION_DRIVE_OFFICIAL_URL}
            target="_blank"
            rel="noreferrer"
            title="Ouvrir le dossier officiel : Executive Performance Tracker - Fondation HYSTERESIS"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 border border-blue-200 transition-colors shadow-2xs"
          >
            <FolderOpen className="w-3 h-3 text-blue-600 shrink-0" />
            <span>Drive Fondation HYSTERESIS</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
          </a>
        </div>
      );
    }

    const firstUrl = matches[0];
    const isDrive = firstUrl.includes('drive.google.com') || firstUrl.includes('docs.google.com');
    const isOfficialDrive =
      firstUrl.includes('1h-vKuDGeu151t0r0N0EuYvgW8B92HKkM') ||
      firstUrl === FONDATION_DRIVE_OFFICIAL_URL;

    const textWithoutUrl = rawProof.replace(firstUrl, '').trim();

    // Déduire un libellé clair pour le bouton en fonction du sous-dossier ou du type
    let driveButtonLabel = 'Consulter preuve';
    if (firstUrl.includes('/digitelles-')) {
      driveButtonLabel = "Drive : Digit'ELLES";
    } else if (firstUrl.includes('/caravane-vr-')) {
      driveButtonLabel = 'Drive : Caravane VR';
    } else if (firstUrl.includes('/academia-') || firstUrl.includes('/hysteresis-academia-')) {
      driveButtonLabel = 'Drive : Hystérésis Academia';
    } else if (firstUrl.includes('/ci2-') || firstUrl.includes('/conversations-inspirantes-')) {
      driveButtonLabel = 'Drive : PCI Cohorte 2';
    } else if (firstUrl.includes('/centre-ibabi-')) {
      driveButtonLabel = 'Drive : Centre IBABI Nikki';
    } else if (firstUrl.includes('/kokari-')) {
      driveButtonLabel = 'Drive : Projet Kokari';
    } else if (firstUrl.includes('/ca-')) {
      driveButtonLabel = 'Drive : Séances CA';
    } else if (firstUrl.includes('/partenariat-') || firstUrl.includes('/bailleur-') || firstUrl.includes('/conventions-')) {
      driveButtonLabel = 'Drive : Bailleurs & Partenariats';
    } else if (firstUrl.includes('/reseaux-sociaux-')) {
      driveButtonLabel = 'Drive : Statistiques RS';
    } else if (firstUrl.includes('/contrat-agence-je2026')) {
      driveButtonLabel = 'Drive : Contrat Agence JE';
    } else if (firstUrl.includes('/listes-laureats-borgou-400eleves')) {
      driveButtonLabel = 'Drive : Listes Lauréats Borgou';
    } else if (firstUrl.includes('/commande-tshirts-polos-je2026') || isTshirt) {
      driveButtonLabel = 'Drive : T-shirts & Polos JE';
    } else if (firstUrl.includes('/projet-kokari-business-model-v1')) {
      driveButtonLabel = 'Drive : Projet Kokari BM';
    } else if (firstUrl.includes('/base-donnees-beneficiaires-unifiee')) {
      driveButtonLabel = 'Drive : Base Bénéficiaires';
    } else if (firstUrl.includes('/campagne-digitale-je2026-statistiques')) {
      driveButtonLabel = 'Drive : Métriques Campagne JE';
    } else if (firstUrl.includes('/dons-kits-scolaires-hebergement-je2026')) {
      driveButtonLabel = 'Drive : Dons Kits & Hébergement';
    } else if (firstUrl.includes('/declic-pro-')) {
      driveButtonLabel = 'Drive : Déclic Pro';
    } else if (isOfficialDrive) {
      driveButtonLabel = 'Drive HYSTERESIS';
    } else if (isDrive) {
      driveButtonLabel = 'Dossier Drive';
    }

    return (
      <div className="space-y-1">
        {textWithoutUrl && (
          <p className="text-[11px] text-slate-700 leading-tight break-words font-medium">
            {textWithoutUrl}
          </p>
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <a
            href={firstUrl}
            target="_blank"
            rel="noreferrer"
            title={`Ouvrir le dossier/fichier : ${firstUrl}`}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors shadow-2xs border ${
              isOfficialDrive
                ? 'bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300'
                : isDrive
                ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-950 border-blue-200'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate max-w-[170px]" title={driveButtonLabel}>
              {driveButtonLabel}
            </span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
          </a>

          {!isOfficialDrive && (
            <a
              href={FONDATION_DRIVE_OFFICIAL_URL}
              target="_blank"
              rel="noreferrer"
              title="Accéder au dossier officiel Executive Performance Tracker"
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 transition-colors"
            >
              <span>Drive Officiel ↗</span>
            </a>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyLink(firstUrl);
            }}
            title="Copier le lien complet vers le presse-papiers"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded no-print cursor-pointer transition-colors"
          >
            {copiedUrl === firstUrl ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    );
  };

  // Helper pour rendre une sous-tâche d'évaluation
  const renderSubTaskRow = (task: TaskItem) => {
    const scoreDe = task.status === 'VALIDE' || task.status === 'TERMINE' ? 1 : 0;
    const scorePdh = task.status === 'VALIDE' ? 1 : 0;
    const dateInfo = getTaskDateAndStatusInfo(task);

    return (
      <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
        {/* Libellé de la sous-tâche */}
        <td className="py-2.5 px-3 align-top">
          <div className="font-semibold text-slate-900 leading-snug">
            {task.activity.replace(/^Sous-tâche\s*:\s*/i, '')}
          </div>
          {task.parentPtaTitle && (
            <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Activité PTA : {task.parentPtaTitle}
            </div>
          )}
          {(task.strategicObjective || task.operationalObjective) && (
            <div className="mt-1 space-y-0.5 text-[10px] bg-slate-50 p-1.5 rounded border border-slate-200">
              {task.strategicObjective && (
                <div className="text-slate-700 font-medium leading-tight">
                  <span className="font-bold text-indigo-700">OS :</span> {task.strategicObjective}
                </div>
              )}
              {task.operationalObjective && (
                <div className="text-slate-600 leading-tight">
                  <span className="font-bold text-slate-700">OO :</span> {task.operationalObjective}
                </div>
              )}
            </div>
          )}
          {task.financialAmountTarget ? (
            <div className="text-[11px] font-mono text-amber-700 mt-1">
              Cible T4 : {task.financialAmountTarget.toLocaleString('fr-FR')} FCFA · Réalisé : {(task.financialAmountRealized || 0).toLocaleString('fr-FR')} FCFA
            </div>
          ) : null}
        </td>

        {/* Date Initiale & Échéance à date */}
        <td className="py-2.5 px-2.5 align-top font-mono whitespace-nowrap">
          <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
            <span className="text-[10px] font-sans font-normal text-slate-500">Initiale :</span>
            <span>{dateInfo.initialDate}</span>
          </div>
          {dateInfo.hasChangedDate && (
            <div className="text-[10px] text-amber-900 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1 inline-flex items-center gap-1">
              <span>➔ À date : {dateInfo.currentDate}</span>
            </div>
          )}
        </td>

        {/* Statut à date & Report */}
        <td className="py-2.5 px-2.5 align-top">
          <div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] border ${dateInfo.statusBadge.bgClass} ${dateInfo.statusBadge.textClass} ${dateInfo.statusBadge.borderClass}`}
            >
              {dateInfo.statusBadge.label}
            </span>
          </div>
          {dateInfo.details && dateInfo.details !== 'Aucun' && dateInfo.details !== 'Non défini' && (
            <div className="text-[11px] text-slate-600 mt-1 leading-tight">
              {dateInfo.details}
            </div>
          )}
        </td>

        {/* Résultats Attendus */}
        <td className="py-2.5 px-3 align-top text-slate-700 leading-tight">
          {task.expectedResult}
        </td>

        {/* Statut sélecteur interactif */}
        <td className="py-2.5 px-3 align-top text-center">
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
                : task.status === 'PLANIFIER' || task.status === 'PLANIFIE'
                ? 'bg-purple-50 text-purple-800 border-purple-300'
                : 'bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <option value="TERMINE">TERMINE (1 pt DE)</option>
            <option value="VALIDE" disabled={role !== 'PRESIDENTE'}>
              VALIDE {role !== 'PRESIDENTE' ? '(1 pt PDH)' : '(1 pt)'}
            </option>
            <option value="EN COURS">EN COURS (0 pt)</option>
            <option value="PLANIFIER">PLANIFIER (0 pt)</option>
            {task.status === 'PLANIFIE' && <option value="PLANIFIE">PLANIFIER (0 pt)</option>}
            <option value="NON TERMINE">NON TERMINE (0 pt)</option>
          </select>

          {role === 'PRESIDENTE' && task.status === 'TERMINE' && (
            <button
              onClick={() => validateTaskByPresident(task.id)}
              className="mt-1 w-full py-0.5 px-1.5 text-[10px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded transition-colors cursor-pointer shadow-xs"
              title="Valider la sous-tâche pour lui attribuer 1 point officiel"
            >
              👑 Valider visa PDH (1 pt)
            </button>
          )}
          {role !== 'PRESIDENTE' && task.status === 'TERMINE' && (
            <span className="mt-1 inline-block text-[10px] text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200">
              1 pt DE acquis · Visa PDH attendu
            </span>
          )}
        </td>

        {/* Score DE (1 ou 0) */}
        <td className="py-2.5 px-2 align-top text-center font-mono font-bold">
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-xs ${
              scoreDe === 1
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {scoreDe} pt
          </span>
          <div className="text-[9px] text-slate-500 font-sans mt-0.5">
            {scoreDe === 1 ? 'Accordé' : '0 pt'}
          </div>
        </td>

        {/* Score PDH Validé (1 ou 0) */}
        <td className="py-2.5 px-2 align-top text-center font-mono font-bold">
          <span
            className={`inline-block px-1.5 py-0.5 rounded text-xs ${
              scorePdh === 1
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : task.status === 'TERMINE'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : task.status === 'PLANIFIER' || task.status === 'PLANIFIE'
                ? 'bg-purple-50 text-purple-800 border border-purple-200'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {scorePdh === 1 ? '1 pt' : task.status === 'TERMINE' ? '0 pt*' : '0 pt'}
          </span>
          <div className="text-[9px] text-slate-500 font-sans mt-0.5">
            {scorePdh === 1
              ? 'Validé'
              : task.status === 'TERMINE'
              ? 'En attente'
              : task.status === 'PLANIFIER' || task.status === 'PLANIFIE'
              ? 'Planifié'
              : '0 pt'}
          </div>
        </td>

        {/* Preuve & Justificatif Drive */}
        <td className="py-2.5 px-3 align-top min-w-[190px]">
          {editingProofId === task.id ? (
            <div className="space-y-1.5 min-w-[220px] bg-slate-50 p-2 rounded-lg border border-slate-300 shadow-2xs">
              <label className="block text-[10px] font-bold text-slate-700 uppercase">
                Lien Google Drive / Preuve :
              </label>
              <textarea
                rows={3}
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/... ou référence PV"
                className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900 font-mono"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setProofText(FONDATION_DRIVE_OFFICIAL_URL)}
                  className="text-[10px] font-semibold text-blue-700 bg-blue-100/70 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1"
                  title="Insérer le lien officiel du dossier Executive Performance Tracker"
                >
                  <FolderOpen className="w-3 h-3 text-blue-600" />
                  <span>Insérer Drive Fondation HYSTERESIS</span>
                </button>
              </div>
              <div className="flex items-center justify-between gap-1 flex-wrap pt-0.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSaveProof(task.id)}
                    className="px-2.5 py-1 text-[10px] font-bold bg-slate-900 text-white rounded cursor-pointer hover:bg-slate-800 transition-colors"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingProofId(null)}
                    className="px-2 py-1 text-[10px] bg-slate-200 text-slate-700 rounded cursor-pointer hover:bg-slate-300 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
                {proofText && proofText.startsWith('http') && (
                  <a
                    href={proofText}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-blue-600 hover:text-blue-800 underline flex items-center gap-0.5 font-medium"
                  >
                    <span>Tester ↗</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-1.5 group">
              <div className="flex-1 min-w-0">
                {renderProofContent(task)}
              </div>
              <button
                onClick={() => handleOpenProofModal(task)}
                title="Ajouter ou modifier la preuve (lien Drive, document...)"
                className="opacity-60 group-hover:opacity-100 p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded no-print cursor-pointer transition-colors shrink-0"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </td>

        {/* Observations */}
        <td className="py-2.5 px-3 align-top text-slate-600 leading-tight">
          {task.observations || '—'}
        </td>

        {/* Actions */}
        <td className="py-2.5 px-2 align-top text-center no-print">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEditTask(task)}
                title="Modifier les détails de la tâche"
                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer transition-colors"
              >
                ✎
              </button>
              <button
                onClick={() => {
                  setReplanModalTask(task);
                  setTargetReplanMonth(10);
                }}
                title="Basculer cette tâche vers le T4 (Octobre, Novembre, Décembre)"
                className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded cursor-pointer transition-colors flex items-center gap-0.5 whitespace-nowrap"
              >
                <span>Basculer T4</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            </div>
            {role === 'PRESIDENTE' && task.status !== 'VALIDE' && (
              <button
                onClick={() => validateTaskByPresident(task.id)}
                title="Valider immédiatement la sous-tâche (Visa Présidence 1 pt)"
                className="w-full px-1.5 py-0.5 text-[10px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded cursor-pointer transition-colors whitespace-nowrap"
              >
                ✓ Valider PDH
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Sélecteur de mois & Contexte Exécutif */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              <span>Canevas Hiérarchique — Activités PTA & Sous-Tâches d'Évaluation</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              Évaluation Mensuelle — {MONTH_NAMES[currentMonth]}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Les activités du PTA 2026 encadrent les sous-tâches d'évaluation du Directeur Exécutif réparties dans les 4 rubriques COP.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onOpenShareModal}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Enregistrer vos modifications dans le cloud et générer un lien de partage"
            >
              <CloudUpload className="w-3.5 h-3.5 text-blue-200" />
              <span>Enregistrer & Partager</span>
            </button>
            <a
              href={FONDATION_DRIVE_OFFICIAL_URL}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Ouvrir le dossier officiel Google Drive Executive Performance Tracker"
            >
              <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Drive HYSTERESIS</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Coller / Importer Sous-Tâches</span>
            </button>
            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exporter CSV</span>
            </button>
            <button
              onClick={onOpenAddTaskModal}
              className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouvelle Sous-Tâche</span>
            </button>
            <button
              onClick={() => {
                resetMonthToInitialTasks(currentMonth);
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Rétablir les seules activités contractuelles initiales de ce mois"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span>Rétablir activités initiales ({MONTH_NAMES[currentMonth].split(' ')[0]})</span>
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

      {/* Règle COP d'Attribution des Scores : TERMINE = 1 pt (DE) · VALIDE = 1 pt (PDH) */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border border-blue-200/80 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-mono font-bold flex items-center justify-center shrink-0 shadow-xs text-sm">
            1
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Règle COP d'évaluation & d'attribution des scores
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                TERMINE (DE) = 1 pt
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                VALIDE (PDH) = 1 pt
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold border border-purple-200">
                PLANIFIER = 0 pt
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                EN COURS / NON TERMINE = 0 pt
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Lorsque le <strong>Directeur Exécutif (DE)</strong> choisit le statut <strong>TERMINE</strong>, cela lui donne droit à <strong>1 point</strong>. Lorsque la <strong>Présidente d'Honneur (PDH)</strong> vient valider (<strong>VALIDE</strong>), cela donne droit à <strong>1 point officiel</strong>. La prime validée est calculée strictement selon la formule COP : <code className="font-mono bg-white px-1 py-0.5 rounded text-amber-800 border border-slate-200 font-semibold">150 000 FCFA × Taux mensuel validé</code>.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-200/80 pt-2 md:pt-0 md:pl-4">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Bascule de profil :</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                if (role !== 'DIRECTEUR_EXECUTIF') toggleRole();
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                role === 'DIRECTEUR_EXECUTIF'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Passer en mode Directeur Exécutif (saisie des preuves et déclaration d'achèvement 1 pt DE)"
            >
              <span>👔 Dir. Exécutif</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (role !== 'PRESIDENTE') toggleRole();
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                role === 'PRESIDENTE'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Passer en mode Présidente du Conseil (pouvoir de validation officielle 1 pt PDH)"
            >
              <span>👑 Présidente (PDH)</span>
            </button>
          </div>
          <button
            type="button"
            onClick={toggleRole}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap"
            title="Basculer instantanément entre la vue Directeur Exécutif et la vue Présidente d'Honneur"
          >
            <span>⇄ Basculer</span>
          </button>
        </div>
      </div>

      {/* 2. Bandeau Métrique — Calcul des Scores, Taux et Prime */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Sous-Tâches */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Sous-Tâches Évaluées</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {monthlyStats.totalTasks}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Mois de {MONTH_NAMES[currentMonth].split(' ')[0]}
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

        {/* Prime à Payer — Formule COP : 150 000 * Taux Mensuel Validé */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 bg-slate-900 text-white">
          <div className="text-xs text-slate-300 font-medium flex items-center justify-between">
            <span>Prime Validée (FCFA)</span>
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {monthlyStats.officialBonus.toLocaleString('fr-FR')} F
          </div>
          <div className="text-[11px] text-slate-300 mt-1 font-mono">
            150 000 F × {monthlyStats.officialEvolutionRate}%
          </div>
          <div className="text-[10px] text-amber-300/80 font-sans mt-0.5">
            = 150 000 × Taux validé
          </div>
        </div>
      </div>

      {/* 3. Zone de Validation Présidence */}
      {role === 'PRESIDENTE' && monthlyStats.completedTasks > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-emerald-900">
                Espace Validation Présidence — {monthlyStats.completedTasks} sous-tâche(s) en attente d'approbation
              </div>
              <div className="text-xs text-emerald-700">
                Examinez les preuves puis validez les sous-tâches pour confirmer le score définitif (1 pt) et la prime du Directeur Exécutif.
              </div>
            </div>
          </div>
          <button
            onClick={() => validateAllMonthTasksByPresident(currentMonth)}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs shrink-0"
          >
            Valider le lot ({monthlyStats.completedTasks})
          </button>
        </div>
      )}

      {/* 4. Barre de Filtres, Recherche & Contrôles Dépliement */}
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
            <option value="ALL">Toutes les rubriques COP</option>
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
            <option value="PLANIFIER">PLANIFIER (0 pt)</option>
            <option value="NON TERMINE">NON TERMINE (0 pt)</option>
          </select>

          {/* Boutons Déplier / Replier Tout */}
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={expandAll}
              className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
              title="Déplier toutes les activités majeures du PTA"
            >
              Déplier tout
            </button>
            <button
              onClick={collapseAll}
              className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer"
              title="Replier toutes les activités majeures du PTA"
            >
              Replier tout
            </button>
          </div>

          {/* Ajustement de la prime mensuelle de base */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 ml-auto md:ml-2">
            <span>Base prime :</span>
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
            placeholder="Rechercher une sous-tâche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* 5. STRUCTURE HIÉRARCHIQUE : CATÉGORIES COP -> ACTIVITÉS MAJEURES PTA -> SOUS-TÂCHES DÉPLIABLES */}
      <div className="space-y-8 print-page">
        {COP_CATEGORIES.map((category) => {
          if (categoryFilter !== 'ALL' && categoryFilter !== category.key) return null;

          // Activités majeures du PTA de cette catégorie
          const majorActivities = PTA_MAJOR_ACTIVITIES.filter((a) => a.copCategory === category.key);

          // Sous-tâches de cette catégorie pour le mois
          const categorySubTasks = filteredTasks.filter((t) => t.copCategory === category.key);

          // Si aucune sous-tâche dans cette rubrique COP pour ce mois, masquer la section
          if (categorySubTasks.length === 0) return null;

          return (
            <div key={category.key} className="space-y-4">
              {/* Grand En-tête de la Rubrique COP */}
              <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-white text-slate-900 font-mono font-bold flex items-center justify-center text-sm">
                    {category.code}
                  </span>
                  <div>
                    <h2 className="text-base font-bold">{category.label}</h2>
                    <p className="text-xs text-slate-300 mt-0.5">{category.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
                  <span>
                    <strong className="text-white">{categorySubTasks.length}</strong> sous-tâche{categorySubTasks.length > 1 ? 's' : ''} au total ce mois
                  </span>
                  <span>·</span>
                  <span className="text-emerald-400 font-semibold">
                    {categorySubTasks.filter((t) => t.status === 'VALIDE').length} validée(s)
                  </span>
                </div>
              </div>

              {/* Liste des Activités Majeures PTA sous cette Rubrique COP */}
              <div className="space-y-4">
                {majorActivities.map((majorAct) => {
                  // Sous-tâches rattachées à cette activité majeure du PTA pour le mois
                  const subTasks = categorySubTasks.filter(
                    (t) =>
                      t.parentPtaId === majorAct.id ||
                      (t.parentPtaTitle && t.parentPtaTitle.toLowerCase().includes(majorAct.code.toLowerCase()))
                  );

                  // Masquer les activités majeures qui n'ont aucune sous-tâche pour ce mois
                  if (subTasks.length === 0) {
                    return null;
                  }

                  const isExpanded = isActivityExpanded(majorAct.id);
                  const validCount = subTasks.filter((t) => t.status === 'VALIDE').length;
                  const termCount = subTasks.filter((t) => t.status === 'TERMINE').length;

                  return (
                    <div
                      key={majorAct.id}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs transition-shadow"
                    >
                      {/* En-tête de l'Activité Majeure PTA (Cliquable pour déplier/replier) */}
                      <div
                        onClick={() => toggleActivityExpand(majorAct.id)}
                        className="p-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            className="mt-0.5 p-1 text-slate-500 hover:text-slate-900 rounded cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-200 text-slate-800 rounded">
                                {majorAct.code}
                              </span>
                              <h3 className="text-sm font-bold text-slate-900">
                                {majorAct.title}
                              </h3>
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                              <span>Programme : <strong>{majorAct.programmePta}</strong></span>
                              <span>·</span>
                              <span>{majorAct.operationalObjective}</span>
                            </div>
                          </div>
                        </div>

                        {/* Badges d'avancement de l'activité majeure */}
                        <div className="flex items-center gap-3 text-xs shrink-0 pl-7 md:pl-0 font-mono">
                          <span className="text-slate-700">
                            <strong>{subTasks.length}</strong> sous-tâche{subTasks.length > 1 ? 's' : ''}
                          </span>
                          {subTasks.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-emerald-700 font-semibold">
                                {validCount} validée{validCount > 1 ? 's' : ''}
                              </span>
                              {termCount > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="text-blue-700 font-semibold">
                                    {termCount} terminée{termCount > 1 ? 's' : ''}
                                  </span>
                                </>
                              )}
                            </>
                          )}
                          <span className="text-[11px] text-slate-400 font-sans">
                            {isExpanded ? 'Masquer' : 'Afficher'}
                          </span>
                        </div>
                      </div>

                      {/* Sous-tâches d'évaluation dépliables (Tableau Niveau 2) */}
                      {isExpanded && (
                        <div className="overflow-x-auto bg-white">
                          {subTasks.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 italic">
                              Aucune sous-tâche d'évaluation planifiée pour cette activité majeure au mois de {MONTH_NAMES[currentMonth]}.
                            </div>
                          ) : (
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-100/60 text-slate-700 font-semibold border-b border-slate-200">
                                  <th className="py-2.5 px-3 min-w-[280px]">Sous-Tâche d'Évaluation (DE)</th>
                                  <th className="py-2.5 px-2.5 min-w-[125px]">Date Initiale & Échéance</th>
                                  <th className="py-2.5 px-2.5 min-w-[130px]">Statut à date & Report</th>
                                  <th className="py-2.5 px-3 min-w-[200px]">Résultats Attendus</th>
                                  <th className="py-2.5 px-3 min-w-[130px] text-center">Statut</th>
                                  <th className="py-2.5 px-2 min-w-[75px] text-center font-mono" title="Le statut TERMINE donne droit à 1 pt DE">Score DE</th>
                                  <th className="py-2.5 px-2 min-w-[85px] text-center font-mono" title="La validation VALIDE de la Présidente donne droit à 1 pt officiel">Score PDH</th>
                                  <th className="py-2.5 px-3 min-w-[150px]">Preuve / Livrable</th>
                                  <th className="py-2.5 px-3 min-w-[140px]">Observations</th>
                                  <th className="py-2.5 px-2 w-20 text-center no-print">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {subTasks.map((task) => renderSubTaskRow(task))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Sous-tâches orphelines de la catégorie (non rattachées à un code PTA_MAJOR) */}
                {(() => {
                  const assignedPtaIds = new Set(majorActivities.map((a) => a.id));
                  const orphanTasks = categorySubTasks.filter(
                    (t) =>
                      !t.parentPtaId ||
                      (!assignedPtaIds.has(t.parentPtaId) &&
                        !majorActivities.some((a) => t.parentPtaTitle && t.parentPtaTitle.includes(a.code)))
                  );

                  if (orphanTasks.length === 0) return null;

                  const isOtherExpanded = isActivityExpanded(`other-${category.key}`);

                  return (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                      <div
                        onClick={() => toggleActivityExpand(`other-${category.key}`)}
                        className="p-3.5 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {isOtherExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          )}
                          <span className="text-xs font-bold text-slate-800">
                            Autres sous-activités de la catégorie {category.label} ({orphanTasks.length})
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {isOtherExpanded ? 'Masquer' : 'Afficher'}
                        </span>
                      </div>

                      {isOtherExpanded && (
                        <div className="overflow-x-auto bg-white">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                <th className="py-2.5 px-3 min-w-[280px]">Sous-Tâche d'Évaluation</th>
                                <th className="py-2.5 px-2.5 min-w-[125px]">Date Initiale & Échéance</th>
                                <th className="py-2.5 px-2.5 min-w-[130px]">Statut à date & Report</th>
                                <th className="py-2.5 px-3 min-w-[200px]">Résultats Attendus</th>
                                <th className="py-2.5 px-3 min-w-[130px] text-center">Statut</th>
                                <th className="py-2.5 px-2 min-w-[75px] text-center font-mono" title="Le statut TERMINE donne droit à 1 pt DE">Score DE</th>
                                <th className="py-2.5 px-2 min-w-[85px] text-center font-mono" title="La validation VALIDE de la Présidente donne droit à 1 pt officiel">Score PDH</th>
                                <th className="py-2.5 px-3 min-w-[150px]">Preuve / Livrable</th>
                                <th className="py-2.5 px-3 min-w-[140px]">Observations</th>
                                <th className="py-2.5 px-2 w-20 text-center no-print">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {orphanTasks.map((task) => renderSubTaskRow(task))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Pied de page de synthèse officielle */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-600">
          <strong>TOTAL SOUS-TÂCHES — {MONTH_NAMES[currentMonth].toUpperCase()} :</strong>{' '}
          <span className="font-mono font-bold text-slate-900">{monthlyStats.totalTasks}</span> activités |{' '}
          Taux mensuel validé :{' '}
          <span className="font-mono font-bold text-emerald-700">{monthlyStats.officialEvolutionRate}%</span> |{' '}
          Prime validée (150 000 F × {monthlyStats.officialEvolutionRate}%) :{' '}
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

      {/* Modal de Replanification rapide d'une tâche */}
      {replanModalTask && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Replanifier la sous-tâche vers le T4
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

      {/* Modal d'importation / collage du PTA & Évaluations */}
      <PtaImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultMonth={currentMonth}
      />
    </div>
  );
};
