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

const LOCAL_STORAGE_KEY = 'fondation_hysteresis_ept_tasks_v17_august_official_integrated';
const PREVIOUS_STORAGE_KEYS = [
  'fondation_hysteresis_ept_tasks_v16_june_rebalanced_dashboard',
  'fondation_hysteresis_ept_tasks_v15_june_august_september_integrated',
  'fondation_hysteresis_ept_tasks_v14_september_cop_integrated',
  'fondation_hysteresis_ept_tasks_v13_august_cop_integrated',
  'fondation_hysteresis_ept_tasks_v12_july_evaluation_clean_june',
  'fondation_hysteresis_ept_tasks_v11_june_cop_integrated',
  'fondation_hysteresis_ept_tasks_v10_mai_cop_integrated',
  'fondation_hysteresis_ept_tasks_v9_differentiated_drive_links',
  'fondation_hysteresis_ept_tasks_v8_pure_july_evaluation',
  'fondation_hysteresis_ept_tasks_v7_declic_academy_scores',
  'fondation_hysteresis_ept_tasks_v6',
  'fondation_hysteresis_ept_tasks_v5',
  'fondation_hysteresis_ept_tasks',
];
const LOCAL_STORAGE_BONUS_KEY = 'fondation_hysteresis_ept_bonus_base_150k';

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const initialJuneTasks = INITIAL_TASKS.filter((t) => t.month === 6);
    const initialAugustTasks = INITIAL_TASKS.filter((t) => t.month === 8);
    const initialSeptemberTasks = INITIAL_TASKS.filter((t) => t.month === 9);

    try {
      // 1. Purge proactive de tous les anciens stockages obsolètes
      for (const oldKey of PREVIOUS_STORAGE_KEYS) {
        try {
          localStorage.removeItem(oldKey);
        } catch (_) {}
      }

      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: TaskItem[] = JSON.parse(saved);

        const storedJuneTasks = parsed.filter((t) => t.month === 6);
        const storedAugustTasks = parsed.filter((t) => t.month === 8);
        const storedSeptemberTasks = parsed.filter((t) => t.month === 9);

        let currentTasks = parsed;

        // Contrôle d'intégrité pour Juin (51 tâches)
        if (storedJuneTasks.length !== initialJuneTasks.length) {
          const nonJuneTasks = currentTasks.filter((t) => t.month !== 6);
          currentTasks = [...nonJuneTasks, ...initialJuneTasks];
        }

        // Contrôle d'intégrité pour Août (29 tâches)
        if (storedAugustTasks.length !== initialAugustTasks.length) {
          const nonAugustTasks = currentTasks.filter((t) => t.month !== 8);
          currentTasks = [...nonAugustTasks, ...initialAugustTasks];
        }

        // Contrôle d'intégrité pour Septembre (17 tâches)
        if (storedSeptemberTasks.length !== initialSeptemberTasks.length) {
          const nonSeptemberTasks = currentTasks.filter((t) => t.month !== 9);
          currentTasks = [...nonSeptemberTasks, ...initialSeptemberTasks];
        }

        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentTasks));
        return currentTasks;
      }
    } catch (e) {
      console.error('Erreur chargement localStorage:', e);
    }

    // Premier chargement ou absence de sauvegarde propre : charger les tâches initiales officielles
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_TASKS));
    } catch (_) {}
    return INITIAL_TASKS;
  });

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

  const [baseBonusAmount, setBaseBonusAmount] = useState<number>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_BONUS_KEY);
    return saved ? parseInt(saved, 10) : 150000; // 150 000 FCFA base mensuelle
  });

  const mobilizationTarget = 100000000; // 100 000 000 FCFA
  const initialAnnualTotalTasks = 235; // Nombre global de tâches au PTA/COP en début d'année

  const [activeShare, setActiveShare] = useState<ShareMetadata | null>(null);
  const [isLoadingShare, setIsLoadingShare] = useState<boolean>(false);
  const [isCollaborativeSyncActive, setIsCollaborativeSyncActive] = useState<boolean>(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastSyncAuthor, setLastSyncAuthor] = useState<string | null>(null);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);
  const clearSyncNotification = () => setSyncNotification(null);

  // Ref pour éviter les boucles infinies de synchronisation
  const lastLocalUpdateTimestampRef = React.useRef<number>(Date.now());
  const isUpdatingFromRemoteRef = React.useRef<boolean>(false);

  // Détection d'un paramètre ?share= dans l'URL au chargement
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const shareId = params.get('share');
      if (shareId) {
        setIsLoadingShare(true);
        getCloudShare(shareId)
          .then((snapshot) => {
            if (snapshot && Array.isArray(snapshot.tasks)) {
              isUpdatingFromRemoteRef.current = true;
              setTasks(snapshot.tasks);
              if (snapshot.month) setCurrentMonth(snapshot.month);
              if (snapshot.baseBonusAmount) setBaseBonusAmount(snapshot.baseBonusAmount);
              const { tasks: _, ...meta } = snapshot;
              setActiveShare(meta);
              setLastSyncedAt(new Date().toLocaleTimeString('fr-FR'));
              setLastSyncAuthor(snapshot.author || 'Collaborateur');
            }
          })
          .catch((err) => {
            console.error('Erreur chargement partage URL:', err);
          })
          .finally(() => {
            setIsLoadingShare(false);
            setTimeout(() => {
              isUpdatingFromRemoteRef.current = false;
            }, 500);
          });
      } else {
        // Tenter de charger l'espace de travail partagé global si disponible
        getSharedWorkspace()
          .then((ws) => {
            if (ws && Array.isArray(ws.tasks) && ws.tasks.length > 0) {
              // Vérifier si le workspace partagé a été mis à jour récemment
              const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
              if (!saved) {
                isUpdatingFromRemoteRef.current = true;
                setTasks(ws.tasks);
                if (ws.currentMonth) setCurrentMonth(ws.currentMonth);
                setLastSyncedAt(new Date(ws.updatedAt).toLocaleTimeString('fr-FR'));
                setLastSyncAuthor(ws.lastModifiedBy || 'Collaborateur');
                setTimeout(() => {
                  isUpdatingFromRemoteRef.current = false;
                }, 500);
              }
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      console.error('Erreur lecture paramètres URL:', e);
    }
  }, []);

  const loadSharedSnapshot = (snapshot: ShareData) => {
    if (snapshot && Array.isArray(snapshot.tasks)) {
      isUpdatingFromRemoteRef.current = true;
      setTasks(snapshot.tasks);
      if (snapshot.month) setCurrentMonth(snapshot.month);
      if (snapshot.baseBonusAmount) setBaseBonusAmount(snapshot.baseBonusAmount);
      const { tasks: _, ...meta } = snapshot;
      setActiveShare(meta);
      setLastSyncedAt(new Date().toLocaleTimeString('fr-FR'));
      setLastSyncAuthor(snapshot.author || 'Collaborateur');
      // Mettre à jour l'URL sans rechargement
      const url = new URL(window.location.href);
      url.searchParams.set('share', snapshot.id);
      window.history.replaceState({}, '', url.toString());
      setTimeout(() => {
        isUpdatingFromRemoteRef.current = false;
      }, 500);
    }
  };

  const exitSharedView = () => {
    setActiveShare(null);
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setTasks(JSON.parse(saved));
      } else {
        setTasks(INITIAL_TASKS);
      }
      const savedBonus = localStorage.getItem(LOCAL_STORAGE_BONUS_KEY);
      if (savedBonus) {
        setBaseBonusAmount(parseInt(savedBonus, 10));
      }
    } catch (e) {
      setTasks(INITIAL_TASKS);
    }
    // Nettoyer l'URL
    const url = new URL(window.location.href);
    url.searchParams.delete('share');
    window.history.replaceState({}, '', url.pathname);
  };

  // Synchronisation automatique vers le Cloud et localStorage dès qu'un utilisateur fait un ajustement
  useEffect(() => {
    if (isUpdatingFromRemoteRef.current) return;

    lastLocalUpdateTimestampRef.current = Date.now();

    // 1. Sauvegarde locale persistante
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Erreur sauvegarde localStorage:', e);
    }

    const currentAuthor =
      role === 'PRESIDENTE' ? 'Présidence — Mme Cheryle IDOSSOU' : 'Directeur Exécutif — M. Arsène YADES';

    // 2. Si un lien partagé est actif, mettre à jour la session dans le Cloud
    if (activeShare && activeShare.id) {
      updateCloudShare(activeShare.id, {
        tasks,
        currentMonth,
        baseBonusAmount,
        author: currentAuthor,
        role,
      }).then(() => {
        setLastSyncedAt(new Date().toLocaleTimeString('fr-FR'));
        setLastSyncAuthor('Moi');
      });
    }

    // 3. Sauvegarder également dans le workspace collaboratif partagé
    saveSharedWorkspace({
      tasks,
      currentMonth,
      baseBonusAmount,
      role,
      lastModifiedBy: currentAuthor,
    }).catch(() => {});
  }, [tasks, currentMonth, baseBonusAmount, role, activeShare]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_BONUS_KEY, baseBonusAmount.toString());
  }, [baseBonusAmount]);

  // Synchronisation manuelle déclenchable par l'utilisateur
  const syncNow = async () => {
    try {
      if (activeShare && activeShare.id) {
        const remoteShare = await getCloudShare(activeShare.id);
        if (remoteShare && Array.isArray(remoteShare.tasks)) {
          isUpdatingFromRemoteRef.current = true;
          setTasks(remoteShare.tasks);
          setLastSyncedAt(new Date().toLocaleTimeString('fr-FR'));
          setLastSyncAuthor(remoteShare.lastModifiedBy || remoteShare.author || 'Collaborateur');
          setSyncNotification(
            `Synchronisation réussie avec ${remoteShare.lastModifiedBy || remoteShare.author || 'le cloud'} (${new Date().toLocaleTimeString('fr-FR')})`
          );
          setTimeout(() => {
            isUpdatingFromRemoteRef.current = false;
          }, 500);
        }
      } else {
        const ws = await getSharedWorkspace();
        if (ws && Array.isArray(ws.tasks) && ws.tasks.length > 0) {
          isUpdatingFromRemoteRef.current = true;
          setTasks(ws.tasks);
          setLastSyncedAt(new Date(ws.updatedAt).toLocaleTimeString('fr-FR'));
          setLastSyncAuthor(ws.lastModifiedBy || 'Collaborateur');
          setSyncNotification(
            `Espace collaboratif synchronisé avec succès (${new Date(ws.updatedAt).toLocaleTimeString('fr-FR')})`
          );
          setTimeout(() => {
            isUpdatingFromRemoteRef.current = false;
          }, 500);
        }
      }
    } catch (e) {
      console.warn('Erreur lors de la synchronisation manuelle:', e);
    }
  };

  // Polling collaboratif périodique : vérifie toutes les 2.5 secondes si un autre collaborateur a fait un ajustement
  useEffect(() => {
    const checkRemoteSync = async () => {
      // Ne pas écraser si l'utilisateur vient de faire une modification locale il y a moins de 1.5 secondes
      if (Date.now() - lastLocalUpdateTimestampRef.current < 1500) {
        return;
      }

      try {
        if (activeShare && activeShare.id) {
          const remoteShare = await getCloudShare(activeShare.id);
          if (remoteShare && Array.isArray(remoteShare.tasks)) {
            const remoteTasksStr = JSON.stringify(remoteShare.tasks);
            const currentTasksStr = JSON.stringify(tasks);
            if (remoteTasksStr !== currentTasksStr) {
              isUpdatingFromRemoteRef.current = true;
              setTasks(remoteShare.tasks);
              setLastSyncedAt(new Date().toLocaleTimeString('fr-FR'));
              setLastSyncAuthor(remoteShare.lastModifiedBy || remoteShare.author || 'Collaborateur');
              setSyncNotification(
                `Ajustement en direct reçu de ${remoteShare.lastModifiedBy || remoteShare.author || 'votre collaborateur'} (${new Date().toLocaleTimeString('fr-FR')})`
              );
              setTimeout(() => {
                isUpdatingFromRemoteRef.current = false;
              }, 500);
            }
          }
        } else {
          // Hors session de partage explicite, vérifier le workspace global
          const ws = await getSharedWorkspace();
          if (ws && Array.isArray(ws.tasks)) {
            const remoteTasksStr = JSON.stringify(ws.tasks);
            const currentTasksStr = JSON.stringify(tasks);
            if (remoteTasksStr !== currentTasksStr) {
              const remoteTime = new Date(ws.updatedAt).getTime();
              if (remoteTime > lastLocalUpdateTimestampRef.current + 800) {
                isUpdatingFromRemoteRef.current = true;
                setTasks(ws.tasks);
                setLastSyncedAt(new Date(ws.updatedAt).toLocaleTimeString('fr-FR'));
                setLastSyncAuthor(ws.lastModifiedBy || 'Collaborateur');
                setSyncNotification(
                  `Ajustement synchronisé reçu de ${ws.lastModifiedBy || 'votre collaborateur'} (${new Date(ws.updatedAt).toLocaleTimeString('fr-FR')})`
                );
                setTimeout(() => {
                  isUpdatingFromRemoteRef.current = false;
                }, 500);
              }
            }
          }
        }
      } catch (err) {
        // ignore polling errors
      }
    };

    const interval = setInterval(checkRemoteSync, 2500);
    window.addEventListener('focus', checkRemoteSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkRemoteSync);
    };
  }, [tasks, activeShare]);

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
      id: `task-custom-${Date.now()}`,
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
        localStorage.removeItem(LOCAL_STORAGE_KEY);
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
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
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
