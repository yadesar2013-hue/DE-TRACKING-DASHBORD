/**
 * TrackerContext — Moteur d'évaluation et de gestion d'état de performance
 * Fondation HYSTERESIS
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { TaskItem, TaskStatus, UserRole, MonthlyStats, CopCategoryKey } from '../types';
import { INITIAL_TASKS, MONTH_NAMES } from '../data/initialTasks';

interface TrackerContextType {
  tasks: TaskItem[];
  currentMonth: number;
  setCurrentMonth: (month: number) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  baseBonusAmount: number;
  setBaseBonusAmount: (amount: number) => void;
  monthlyStats: MonthlyStats;
  allMonthlyStats: { [key: number]: MonthlyStats };
  globalCumulativeRateProvisional: number;
  globalCumulativeRateOfficial: number;
  mobilizedTotalAmount: number;
  mobilizationTarget: number;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus, proof?: string, observations?: string) => void;
  updateTaskField: (taskId: string, field: keyof TaskItem, value: any) => void;
  validateTaskByPresident: (taskId: string) => void;
  validateAllMonthTasksByPresident: (month: number) => void;
  replanifyTask: (taskId: string, targetMonth: number, reason: string) => void;
  batchReplanifyUnfinishedToQ4: (distribution: { [taskId: string]: number }, defaultReason: string) => void;
  addNewTask: (task: Omit<TaskItem, 'id'>) => void;
  deleteTask: (taskId: string) => void;
  resetToInitialData: () => void;
  exportCsvData: () => string;
}

const LOCAL_STORAGE_KEY = 'fondation_hysteresis_ept_tasks_v2';
const LOCAL_STORAGE_BONUS_KEY = 'fondation_hysteresis_ept_bonus_base';

const TrackerContext = createContext<TrackerContextType | undefined>(undefined);

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erreur chargement localStorage:', e);
    }
    return INITIAL_TASKS;
  });

  const [currentMonth, setCurrentMonth] = useState<number>(7); // Par défaut Juillet 2026 (modèle d'évaluation)
  const [role, setRole] = useState<UserRole>('DIRECTEUR_EXECUTIF');
  const [baseBonusAmount, setBaseBonusAmount] = useState<number>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_BONUS_KEY);
    return saved ? parseInt(saved, 10) : 350000; // 350 000 FCFA base mensuelle
  });

  const mobilizationTarget = 100000000; // 100 000 000 FCFA

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Erreur sauvegarde localStorage:', e);
    }
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_BONUS_KEY, baseBonusAmount.toString());
  }, [baseBonusAmount]);

  // Calcul des statistiques mensuelles pour chaque mois
  const allMonthlyStats = useMemo(() => {
    const statsMap: { [key: number]: MonthlyStats } = {};

    for (let m = 3; m <= 12; m++) {
      const monthTasks = tasks.filter((t) => t.month === m);
      const totalTasks = monthTasks.length;

      let completedTasks = 0; // TERMINE (score prov = 1)
      let validatedTasks = 0; // VALIDE (score def = 1)
      let inProgressTasks = 0; // EN COURS (score = 0)
      let notCompletedTasks = 0; // NON TERMINE (score = 0)

      monthTasks.forEach((t) => {
        if (t.status === 'VALIDE') {
          validatedTasks += 1;
        } else if (t.status === 'TERMINE') {
          completedTasks += 1;
        } else if (t.status === 'EN COURS') {
          inProgressTasks += 1;
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

  // Montant total mobilisé sur l'année
  const mobilizedTotalAmount = useMemo(() => {
    return tasks.reduce((sum, t) => {
      if (t.copCategory === 'D_FINANCES' && (t.status === 'VALIDE' || t.status === 'TERMINE')) {
        return sum + (t.financialAmount || 0);
      }
      return sum;
    }, 0);
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
            month: targetMonth,
            replanifiedToMonth: targetMonth,
            replanifiedReason: reason,
            report: `Replanifié du mois ${MONTH_NAMES[t.month] || t.month} vers ${MONTH_NAMES[targetMonth] || targetMonth} : ${reason}`,
            status: t.status === 'VALIDE' ? 'VALIDE' : 'EN COURS',
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

  const resetToInitialData = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser les données au PTA 2026 d'origine ?")) {
      setTasks(INITIAL_TASKS);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
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
        baseBonusAmount,
        setBaseBonusAmount,
        monthlyStats,
        allMonthlyStats,
        globalCumulativeRateProvisional,
        globalCumulativeRateOfficial,
        mobilizedTotalAmount,
        mobilizationTarget,
        updateTaskStatus,
        updateTaskField,
        validateTaskByPresident,
        validateAllMonthTasksByPresident,
        replanifyTask,
        batchReplanifyUnfinishedToQ4,
        addNewTask,
        deleteTask,
        resetToInitialData,
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
