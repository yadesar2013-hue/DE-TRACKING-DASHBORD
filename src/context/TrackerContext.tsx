/**
 * TrackerContext — Moteur d'évaluation et de gestion d'état de performance
 * Fondation HYSTERESIS
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { TaskItem, TaskStatus, UserRole, MonthlyStats, CopCategoryKey } from '../types';
import { INITIAL_TASKS, MONTH_NAMES } from '../data/initialTasks';

import {
  getCloudShare,
  updateCloudShare,
  getSharedWorkspace,
  saveSharedWorkspace,
  ShareData,
  ShareMetadata,
  WorkspaceData,
  ApiError,
} from '../services/shareService';
import {
  calculateCumulativeMonthlyStats,
  calculateStrategicObjectivesEvolution,
  calculateOperationalObjectivesEvolution,
  MonthlyCumulativeStat,
  ObjectiveProgressItem,
} from '../utils/performanceStats';

export const FONDATION_DRIVE_OFFICIAL_URL =
  'https://drive.google.com/drive/folders/1h-vKuDGeu151t0r0N0EuYvgW8B92HKkM?usp=drive_link';
export const FONDATION_DRIVE_OFFICIAL_TITLE =
  'Executive Performance Tracker - Fondation HYSTERESIS';

interface TrackerContextType {
  tasks: TaskItem[];
  currentMonth: number;
  setCurrentMonth: (month: number) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  roleSwitchNotification: string | null;
  clearRoleSwitchNotification: () => void;
  baseBonusAmount: number;
  setBaseBonusAmount: (amount: number) => void;
  monthlyStats: MonthlyStats;
  allMonthlyStats: { [key: number]: MonthlyStats };
  globalCumulativeRateProvisional: number;
  globalCumulativeRateOfficial: number;
  mobilizedTotalAmount: number;
  mobilizationTarget: number;
  // Statistiques cumulées et analytiques demandées
  initialAnnualTotalTasks: number; // 235 tâches au PTA en début d'année
  cumulativeMonthlyStats: import('../utils/performanceStats').MonthlyCumulativeStat[];
  strategicObjectivesEvolution: import('../utils/performanceStats').ObjectiveProgressItem[];
  operationalObjectivesEvolution: import('../utils/performanceStats').ObjectiveProgressItem[];
  // Partage collaboratif en temps réel
  activeShare: ShareMetadata | null;
  isLoadingShare: boolean;
  isCollaborativeSyncActive: boolean;
  syncError: string | null;
  exportBackup: () => void;
  lastSyncedAt: string | null;
  lastSyncAuthor: string | null;
  syncNotification: string | null;
  clearSyncNotification: () => void;
  loadSharedSnapshot: (share: ShareData) => void;
  exitSharedView: () => void;
  syncNow: () => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus, proof?: string, observations?: string) => void;
  updateTaskField: (taskId: string, field: keyof TaskItem, value: any) => void;
  validateTaskByPresident: (taskId: string) => void;
  validateAllMonthTasksByPresident: (month: number) => void;
  replanifyTask: (taskId: string, targetMonth: number, reason: string) => void;
  batchReplanifyUnfinishedToQ4: (distribution: { [taskId: string]: number }, defaultReason: string) => void;
  addNewTask: (task: Omit<TaskItem, 'id'>) => void;
  deleteTask: (taskId: string) => void;
  importTasks: (newTasks: TaskItem[], targetMonth?: number, mode?: 'replace' | 'append') => void;
  resetToInitialData: () => void;
  resetMonthToInitialTasks: (month: number) => void;
  exportCsvData: () => string;
}

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Le cache n'est jamais une autorité : le serveur est chargé avant toute modification.
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);

  const [currentMonth, setCurrentMonth] = useState<number>(9); // Par défaut Septembre 2026 suite aux modifications intégrées
  const [role, setRole] = useState<UserRole>('DIRECTEUR_EXECUTIF');
  const [roleSwitchNotification, setRoleSwitchNotification] = useState<string | null>(null);
  const clearRoleSwitchNotification = () => setRoleSwitchNotification(null);

  const toggleRole = () => {
    setRole((prev) => {
      const next: UserRole = prev === 'DIRECTEUR_EXECUTIF' ? 'PRESIDENTE' : 'DIRECTEUR_EXECUTIF';
      const msg =
        next === 'PRESIDENTE'
          ? '👑 Mode actif : Présidente du Conseil (PDH) — Vous pouvez désormais viser officiellement les tâches (VALIDE) et valider le mois.'
          : "👔 Mode actif : Directeur Exécutif — Vous déclarez l'état d'avancement TERMINE (1 pt DE) et saisissez les preuves d'exécution.";
      setRoleSwitchNotification(msg);
      // Auto-clear notification after 6 seconds
      setTimeout(() => setRoleSwitchNotification(null), 6000);
      return next;
    });
  };

  const [baseBonusAmount, setBaseBonusAmount] = useState<number>(150000);
  const mobilizationTarget = 100000000;
  const initialAnnualTotalTasks = 235;
  const [activeShare, setActiveShare] = useState<ShareMetadata | null>(null);
  const [isLoadingShare, setIsLoadingShare] = useState(true);
  const [isCollaborativeSyncActive, setIsCollaborativeSyncActive] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastSyncAuthor, setLastSyncAuthor] = useState<string | null>(null);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const clearSyncNotification = () => setSyncNotification(null);
  const scope = React.useRef<string | null>(new URLSearchParams(window.location.search).get('share'));
  const revision = React.useRef(0);
  const initialized = React.useRef(false);
  const busy = React.useRef(false);
  const conflict = React.useRef(false);
  const generation = React.useRef(0);
  const cleanSignature = React.useRef('');
  const latest = React.useRef({ tasks, currentMonth, baseBonusAmount, role });
  latest.current = { tasks, currentMonth, baseBonusAmount, role };
  const signature = (value: { tasks: TaskItem[]; baseBonusAmount: number }) => JSON.stringify([value.tasks, value.baseBonusAmount]);
  const backup = () => {
    const payload = JSON.stringify({ ...latest.current, savedAt: new Date().toISOString(), shareId: scope.current }, null, 2);
    // Chaque récupération conserve une copie distincte des saisies en attente.
    try { localStorage.setItem(`ept_recovery_${Date.now()}`, payload); } catch (_) {}
    return payload;
  };
  const exportBackup = () => {
    const blob = new Blob([backup()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `sauvegarde-tracker-${Date.now()}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const applyRemote = (remote: WorkspaceData | ShareData, initial = false) => {
    if (!remote || !Array.isArray(remote.tasks) || !Number.isInteger(remote.revision)) throw new Error('Données partagées invalides.');
    revision.current = remote.revision;
    cleanSignature.current = signature(remote);
    latest.current = { ...latest.current, tasks: remote.tasks, baseBonusAmount: remote.baseBonusAmount,
      currentMonth: initial ? ('month' in remote ? remote.month : remote.currentMonth) : latest.current.currentMonth };
    setTasks(remote.tasks);
    setBaseBonusAmount(remote.baseBonusAmount);
    if (initial) setCurrentMonth(latest.current.currentMonth);
    if ('id' in remote) { const { tasks: _, ...meta } = remote; setActiveShare(meta); }
    setLastSyncedAt(new Date(remote.updatedAt || ('createdAt' in remote ? remote.createdAt : Date.now())).toLocaleTimeString('fr-FR'));
    setLastSyncAuthor(remote.lastModifiedBy || ('author' in remote ? remote.author : 'Collaborateur'));
    setIsCollaborativeSyncActive(true); setSyncError(null);
    initialized.current = true;
  };
  const fetchRemote = () => scope.current ? getCloudShare(scope.current) : getSharedWorkspace();
  const initialize = async () => {
    const version = ++generation.current;
    setIsLoadingShare(true);
    try {
      const remote = await fetchRemote();
      if (version !== generation.current) return;
      applyRemote(remote, true);
      conflict.current = false;
    } catch (error: any) {
      if (version !== generation.current) return;
      setSyncError(error.message || 'Chargement partagé impossible.');
      setIsCollaborativeSyncActive(false);
    } finally { if (version === generation.current) setIsLoadingShare(false); }
  };
  useEffect(() => { initialize(); return () => { generation.current++; }; }, []);

  const loadSharedSnapshot = (snapshot: ShareData) => {
    if (initialized.current && signature(latest.current) !== cleanSignature.current) backup();
    generation.current++;
    scope.current = snapshot.id; conflict.current = false;
    applyRemote(snapshot, true);
    const url = new URL(window.location.href); url.searchParams.set('share', snapshot.id);
    window.history.replaceState({}, '', url);
  };
  const exitSharedView = () => {
    if (signature(latest.current) !== cleanSignature.current && !window.confirm('Des modifications ne sont pas encore synchronisées. Conserver une copie locale et quitter ?')) return;
    backup(); generation.current++; initialized.current = false;
    scope.current = null; setActiveShare(null);
    const url = new URL(window.location.href); url.searchParams.delete('share');
    window.history.replaceState({}, '', url);
    initialize();
  };

  const syncCycle = async () => {
    if (!initialized.current || busy.current || conflict.current) return;
    busy.current = true;
    const version = generation.current;
    const id = scope.current;
    const state = latest.current;
    const sentSignature = signature(state);
    const dirty = sentSignature !== cleanSignature.current;
    try {
      if (dirty) {
        const author = state.role === 'PRESIDENTE' ? 'Présidence — Mme Cheryle IDOSSOU' : 'Directeur Exécutif — M. Arsène YADES';
        const params = { ...state, expectedRevision: revision.current, author, lastModifiedBy: author };
        const saved = id ? await updateCloudShare(id, params) : await saveSharedWorkspace(params);
        if (version !== generation.current) return;
        revision.current = saved.revision;
        cleanSignature.current = sentSignature;
        setLastSyncedAt(new Date().toLocaleTimeString('fr-FR')); setLastSyncAuthor('Moi');
        // Les modifications faites pendant la requête restent en attente, sans être remplacées.
      } else {
        const remote = await fetchRemote();
        if (version !== generation.current || signature(latest.current) !== sentSignature) return;
        if (remote.revision !== revision.current) applyRemote(remote);
      }
      setSyncError(null); setIsCollaborativeSyncActive(true);
    } catch (error: any) {
      if (version !== generation.current) return;
      if (error instanceof ApiError && error.status === 409) { backup(); conflict.current = true; }
      setSyncError(error.message || 'Synchronisation impossible.');
      setIsCollaborativeSyncActive(false);
    } finally { busy.current = false; }
  };
  const cycleRef = React.useRef(syncCycle); cycleRef.current = syncCycle;
  useEffect(() => {
    const interval = setInterval(() => cycleRef.current(), 5000);
    const focus = () => { cycleRef.current(); };
    window.addEventListener('focus', focus);
    return () => { clearInterval(interval); window.removeEventListener('focus', focus); };
  }, []);
  useEffect(() => {
    if (!initialized.current) return;
    try {
      const key = scope.current ? `ept_shared_cache_${scope.current}` : 'ept_workspace_cache_v18';
      localStorage.setItem(key, JSON.stringify({ tasks, baseBonusAmount, currentMonth }));
    } catch (_) {}
    const timeout = setTimeout(() => cycleRef.current(), 650);
    return () => clearTimeout(timeout);
  }, [tasks, baseBonusAmount]);
  const syncNow = async () => {
    if (!initialized.current) { await initialize(); return; }
    if (conflict.current) {
      if (!window.confirm('Une version plus récente existe. Exporter vos modifications en fichier JSON puis charger cette version ?')) return;
      exportBackup(); initialized.current = false; await initialize(); return;
    }
    await cycleRef.current();
  };

  // Calcul des statistiques mensuelles pour chaque mois
  const allMonthlyStats = useMemo(() => {
    const statsMap: { [key: number]: MonthlyStats } = {};

    for (let m = 3; m <= 12; m++) {
      const monthTasks = tasks.filter((t) => t.month === m);
      const totalTasks = monthTasks.length;

      let completedTasks = 0; // TERMINE (score prov = 1)
      let validatedTasks = 0; // VALIDE (score def = 1)
      let inProgressTasks = 0; // EN COURS (score = 0)
      let plannedTasks = 0; // PLANIFIER / PLANIFIE (score = 0)
      let notCompletedTasks = 0; // NON TERMINE (score = 0)

      monthTasks.forEach((t) => {
        if (t.status === 'VALIDE') {
          validatedTasks += 1;
        } else if (t.status === 'TERMINE') {
          completedTasks += 1;
        } else if (t.status === 'EN COURS') {
          inProgressTasks += 1;
        } else if (t.status === 'PLANIFIER' || t.status === 'PLANIFIE') {
          plannedTasks += 1;
          notCompletedTasks += 1;
        } else {
          notCompletedTasks += 1;
        }
      });

      const provisionalScoreSum = completedTasks + validatedTasks;
      const officialScoreSum = validatedTasks;

      const provisionalEvolutionRate = totalTasks > 0 ? (provisionalScoreSum / totalTasks) * 100 : 0;
      const officialEvolutionRate = totalTasks > 0 ? (officialScoreSum / totalTasks) * 100 : 0;

      const provisionalBonus = Math.round((baseBonusAmount * provisionalEvolutionRate) / 100);
      const officialBonus = Math.round((baseBonusAmount * officialEvolutionRate) / 100);

      statsMap[m] = {
        month: m,
        monthName: MONTH_NAMES[m] || `Mois ${m}`,
        totalTasks,
        completedTasks,
        validatedTasks,
        inProgressTasks,
        notCompletedTasks,
        plannedTasks,
        provisionalScoreSum,
        officialScoreSum,
        provisionalEvolutionRate: Math.round(provisionalEvolutionRate * 10) / 10,
        officialEvolutionRate: Math.round(officialEvolutionRate * 10) / 10,
        baseBonusAmount,
        provisionalBonus,
        officialBonus,
      };
    }

    return statsMap;
  }, [tasks, baseBonusAmount]);

  const monthlyStats = allMonthlyStats[currentMonth] || allMonthlyStats[7];

  // Calcul du taux cumulé global depuis Mars 2026 jusqu'au mois sélectionné
  const { globalCumulativeRateProvisional, globalCumulativeRateOfficial } = useMemo(() => {
    const tasksUpToCurrent = tasks.filter((t) => t.month >= 3 && t.month <= currentMonth);
    const total = tasksUpToCurrent.length;
    if (total === 0) return { globalCumulativeRateProvisional: 0, globalCumulativeRateOfficial: 0 };

    let provCount = 0;
    let offCount = 0;

    tasksUpToCurrent.forEach((t) => {
      if (t.status === 'VALIDE') {
        offCount += 1;
        provCount += 1;
      } else if (t.status === 'TERMINE') {
        provCount += 1;
      }
    });

    return {
      globalCumulativeRateProvisional: Math.round((provCount / total) * 1000) / 10,
      globalCumulativeRateOfficial: Math.round((offCount / total) * 1000) / 10,
    };
  }, [tasks, currentMonth]);

  // Montant total mobilisé effectivement sur l'année
  const mobilizedTotalAmount = useMemo(() => {
    return tasks.reduce((sum, t) => {
      if (t.copCategory === 'D_FINANCES') {
        if (t.financialAmountRealized !== undefined) {
          return sum + t.financialAmountRealized;
        }
        if (t.status === 'VALIDE') {
          return sum + (t.financialAmount || 0);
        }
      }
      return sum;
    }, 0);
  }, [tasks]);

  // Calculs analytiques demandés : Cumuls de mois en mois et progression des Objectifs Stratégiques et Opérationnels
  const cumulativeMonthlyStats = useMemo(() => {
    return calculateCumulativeMonthlyStats(tasks, baseBonusAmount, initialAnnualTotalTasks);
  }, [tasks, baseBonusAmount, initialAnnualTotalTasks]);

  const strategicObjectivesEvolution = useMemo(() => {
    return calculateStrategicObjectivesEvolution(tasks);
  }, [tasks]);

  const operationalObjectivesEvolution = useMemo(() => {
    return calculateOperationalObjectivesEvolution(tasks);
  }, [tasks]);

  const updateTaskStatus = (
    taskId: string,
    newStatus: TaskStatus,
    proof?: string,
    observations?: string
  ) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated: TaskItem = {
            ...t,
            status: newStatus,
            validatedByPresident: newStatus === 'VALIDE',
            validatedAt: newStatus === 'VALIDE' ? new Date().toISOString() : undefined,
          };
          if (proof !== undefined) updated.proof = proof;
          if (observations !== undefined) updated.observations = observations;
          return updated;
        }
        return t;
      })
    );
  };

  const updateTaskField = (taskId: string, field: keyof TaskItem, value: any) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, [field]: value } : t))
    );
  };

  const validateTaskByPresident = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'VALIDE',
            validatedByPresident: true,
            validatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
  };

  const validateAllMonthTasksByPresident = (month: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.month === month && t.status === 'TERMINE') {
          return {
            ...t,
            status: 'VALIDE',
            validatedByPresident: true,
            validatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
  };

  const replanifyTask = (taskId: string, targetMonth: number, reason: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            initialMonth: t.initialMonth || t.month,
            initialDeadline: t.initialDeadline || t.deadlineCop,
            replanifiedToMonth: targetMonth,
            replanifiedReason: reason,
            report: `Replanifié vers ${MONTH_NAMES[targetMonth] || targetMonth} (T4) : ${reason}`,
            observations: t.observations ? `${t.observations} · Replanifié vers ${MONTH_NAMES[targetMonth]}` : `Replanifié vers ${MONTH_NAMES[targetMonth]} (T4)`,
            status: t.status === 'VALIDE' ? 'VALIDE' : 'PLANIFIER',
          };
        }
        return t;
      })
    );
  };

  const batchReplanifyUnfinishedToQ4 = (
    distribution: { [taskId: string]: number },
    defaultReason: string
  ) => {
    setTasks((prev) =>
      prev.map((t) => {
        const targetMonth = distribution[t.id];
        if (targetMonth && targetMonth >= 10 && targetMonth <= 12) {
          return {
            ...t,
            month: targetMonth,
            replanifiedToMonth: targetMonth,
            replanifiedReason: defaultReason,
            report: `Replanifié vers ${MONTH_NAMES[targetMonth]} (T4) : ${defaultReason}`,
            status: 'EN COURS',
          };
        }
        return t;
      })
    );
  };

  const addNewTask = (newTaskData: Omit<TaskItem, 'id'>) => {
    const newTask: TaskItem = {
      ...newTaskData,
      id: `task-custom-${crypto.randomUUID()}`,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const deleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const importTasks = (
    newTasks: TaskItem[],
    targetMonth?: number,
    mode: 'replace' | 'append' = 'append'
  ) => {
    setTasks((prev) => {
      if (mode === 'replace' && targetMonth !== undefined) {
        // Supprime les tâches existantes du mois cible et injecte les nouvelles
        const otherMonthsTasks = prev.filter((t) => t.month !== targetMonth);
        return [...otherMonthsTasks, ...newTasks];
      }

      // Mode append : fusion par ID ou ajout
      const existingIds = new Set(prev.map((t) => t.id));
      const toUpdate = new Map(newTasks.map((t) => [t.id, t]));
      
      const updatedExisting = prev.map((t) => toUpdate.get(t.id) || t);
      const trulyNew = newTasks.filter((t) => !existingIds.has(t.id));

      return [...updatedExisting, ...trulyNew];
    });
  };

  const resetToInitialData = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser l'ensemble des données au PTA 2026 d'origine ?")) {
      setTasks(INITIAL_TASKS);
      try {
        backup();
      } catch (e) {
        // ignore
      }
    }
  };

  const resetMonthToInitialTasks = (month: number) => {
    const initialForMonth = INITIAL_TASKS.filter((t) => t.month === month);
    setTasks((prev) => {
      const otherMonthsTasks = prev.filter((t) => t.month !== month);
      const updated = [...otherMonthsTasks, ...initialForMonth];
      try {
        backup();
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  const exportCsvData = (): string => {
    const headers = [
      'Mois',
      'Catégorie COP',
      'Objectif Stratégique',
      'Objectif Opérationnel',
      'Programme PTA',
      'Activité / Tâche',
      'Deadline COP',
      'Report',
      'Résultats Attendus',
      'Statut',
      'Score Provisoire',
      'Score Officiel',
      'Preuve',
      'Observations',
    ];

    const rows = tasks.map((t) => [
      MONTH_NAMES[t.month] || `Mois ${t.month}`,
      t.copCategory,
      `"${t.strategicObjective.replace(/"/g, '""')}"`,
      `"${t.operationalObjective.replace(/"/g, '""')}"`,
      `"${t.programmePta.replace(/"/g, '""')}"`,
      `"${t.activity.replace(/"/g, '""')}"`,
      `"${t.deadlineCop.replace(/"/g, '""')}"`,
      `"${(t.report || '').replace(/"/g, '""')}"`,
      `"${(t.expectedResult || '').replace(/"/g, '""')}"`,
      t.status,
      t.status === 'VALIDE' || t.status === 'TERMINE' ? '1' : '0',
      t.status === 'VALIDE' ? '1' : '0',
      `"${(t.proof || '').replace(/"/g, '""')}"`,
      `"${(t.observations || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  };

  return (
    <TrackerContext.Provider
      value={{
        tasks,
        currentMonth,
        setCurrentMonth,
        role,
        setRole,
        toggleRole,
        roleSwitchNotification,
        clearRoleSwitchNotification,
        baseBonusAmount,
        setBaseBonusAmount,
        monthlyStats,
        allMonthlyStats,
        globalCumulativeRateProvisional,
        globalCumulativeRateOfficial,
        mobilizedTotalAmount,
        mobilizationTarget,
        initialAnnualTotalTasks,
        cumulativeMonthlyStats,
        strategicObjectivesEvolution,
        operationalObjectivesEvolution,
        activeShare,
        isLoadingShare,
        isCollaborativeSyncActive,
        syncError,
        exportBackup,
        lastSyncedAt,
        lastSyncAuthor,
        syncNotification,
        clearSyncNotification,
        loadSharedSnapshot,
        exitSharedView,
        syncNow,
        updateTaskStatus,
        updateTaskField,
        validateTaskByPresident,
        validateAllMonthTasksByPresident,
        replanifyTask,
        batchReplanifyUnfinishedToQ4,
        addNewTask,
        deleteTask,
        importTasks,
        resetToInitialData,
        resetMonthToInitialTasks,
        exportCsvData,
      }}
    >
      {children}
      {(!initialized.current || isLoadingShare) && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 flex items-center justify-center p-5">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full text-slate-900 space-y-4">
            <h2 className="text-lg font-bold">{isLoadingShare ? 'Chargement des données partagées…' : 'Données partagées indisponibles'}</h2>
            <p>{syncError || 'Récupération de la même version sur tous vos appareils.'}</p>
            {!isLoadingShare && <button onClick={syncNow} className="bg-indigo-700 text-white rounded px-4 py-2">Réessayer</button>}
            <p className="text-sm text-slate-500">Les anciennes données de ce navigateur sont conservées. Aucune sauvegarde locale ne sera annoncée comme une sauvegarde cloud.</p>
          </div>
        </div>
      )}
    </TrackerContext.Provider>
  );
};

export const useTracker = () => {
  const context = useContext(TrackerContext);
  if (!context) {
    throw new Error('useTracker doit être utilisé au sein d’un TrackerProvider');
  }
  return context;
};
