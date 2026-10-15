/**
 * performanceStats.ts — Calculs analytiques du Contrat d'Objectifs et de Performance (COP)
 * Fondation HYSTERESIS
 */

import { TaskItem, CopCategoryKey } from '../types';
import { MONTH_NAMES } from '../data/initialTasks';

export interface MonthlyCumulativeStat {
  month: number;
  monthName: string;
  monthShortName: string;
  plannedTasks: number; // Tâches prévues sur ce mois
  cumulativePlannedTasks: number; // Cumul des tâches prévues depuis le début d'année (Mars -> M)
  validatedTasks: number; // Tâches validées sur ce mois (1 pt Présidence)
  cumulativeValidatedTasks: number; // Cumul des tâches validées depuis le début d'année
  completedTasks: number; // Tâches déclarées terminées DE
  cumulativeCompletedTasks: number;
  inProgressTasks: number;
  plannedStatusTasks: number; // Statut PLANIFIER
  notCompletedTasks: number;
  monthlyOfficialRate: number; // Taux validé du mois (%)
  monthlyProvisionalRate: number; // Taux déclaré du mois (%)
  cumulativeOfficialRate: number; // Taux cumulé officiel depuis le début d'année (%)
  cumulativeProvisionalRate: number; // Taux cumulé déclaré DE (%)
  evolutionDeltaVsPrevMonth: number; // Progression du taux cumulé (+/- pts de %)
  volumeShareOfAnnualTotal: number; // % du volume annuel initial (235 tâches)
  cumulativeShareOfAnnualTotal: number; // % cumulé des tâches prévues / total annuel (235)
  annualCompletionRate: number; // % validé à date / total annuel (235)
  volumeGrowthRateVsPrevMonth: number; // Taux de variation du volume vs mois précédent (%)
  officialBonus: number; // 150 000 FCFA × Taux mensuel validé
  cumulativeOfficialBonus: number; // Somme des primes validées
}

export interface ObjectiveProgressItem {
  id: string;
  title: string;
  category: CopCategoryKey;
  totalInitialTasks: number; // Nombre global en début d'année
  globalValidated: number;
  globalCompleted: number;
  globalRate: number; // % validé sur toute l'année
  monthlyBreakdown: {
    [month: number]: {
      monthName: string;
      planned: number;
      validated: number;
      completed: number;
      cumulativePlanned: number;
      cumulativeValidated: number;
      monthlyRate: number; // % validé du mois
      cumulativeRate: number; // % cumulé à ce mois
      evolutionDelta: number; // Progression en points de %
    };
  };
}

/**
 * Calcule le cumul de mois en mois et les taux d'évolution
 */
export function calculateCumulativeMonthlyStats(
  tasks: TaskItem[],
  baseBonus = 150000,
  initialAnnualTotal = 235
): MonthlyCumulativeStat[] {
  const result: MonthlyCumulativeStat[] = [];
  let cumPlanned = 0;
  let cumValidated = 0;
  let cumCompleted = 0;
  let prevCumOfficialRate = 0;
  let prevPlanned = 0;
  let cumBonus = 0;

  for (let m = 3; m <= 12; m++) {
    const monthTasks = tasks.filter((t) => t.month === m);
    const plannedTasks = monthTasks.length;
    const validatedTasks = monthTasks.filter((t) => t.status === 'VALIDE').length;
    const completedTasks = monthTasks.filter((t) => t.status === 'TERMINE').length;
    const inProgressTasks = monthTasks.filter((t) => t.status === 'EN COURS').length;
    const plannedStatusTasks = monthTasks.filter(
      (t) => t.status === 'PLANIFIER' || t.status === 'PLANIFIE'
    ).length;
    const notCompletedTasks = monthTasks.filter((t) => t.status === 'NON TERMINE').length;

    cumPlanned += plannedTasks;
    cumValidated += validatedTasks;
    cumCompleted += (validatedTasks + completedTasks);

    const monthlyOfficialRate = plannedTasks > 0 ? Math.round((validatedTasks / plannedTasks) * 1000) / 10 : 0;
    const monthlyProvisionalRate =
      plannedTasks > 0
        ? Math.round(((validatedTasks + completedTasks) / plannedTasks) * 1000) / 10
        : 0;

    const cumulativeOfficialRate =
      cumPlanned > 0 ? Math.round((cumValidated / cumPlanned) * 1000) / 10 : 0;
    const cumulativeProvisionalRate =
      cumPlanned > 0 ? Math.round((cumCompleted / cumPlanned) * 1000) / 10 : 0;

    const evolutionDeltaVsPrevMonth =
      m === 3
        ? cumulativeOfficialRate
        : Math.round((cumulativeOfficialRate - prevCumOfficialRate) * 10) / 10;
    prevCumOfficialRate = cumulativeOfficialRate;

    // Pourcentages par rapport au total de début d'année (235 tâches)
    const volumeShareOfAnnualTotal =
      initialAnnualTotal > 0 ? Math.round((plannedTasks / initialAnnualTotal) * 1000) / 10 : 0;
    const cumulativeShareOfAnnualTotal =
      initialAnnualTotal > 0 ? Math.round((cumPlanned / initialAnnualTotal) * 1000) / 10 : 0;
    const annualCompletionRate =
      initialAnnualTotal > 0 ? Math.round((cumValidated / initialAnnualTotal) * 1000) / 10 : 0;

    // Taux d'évolution du volume planifié mois après mois
    const volumeGrowthRateVsPrevMonth =
      prevPlanned > 0
        ? Math.round(((plannedTasks - prevPlanned) / prevPlanned) * 1000) / 10
        : 0;
    prevPlanned = plannedTasks;

    const officialBonus = Math.round((baseBonus * (monthlyOfficialRate / 100)));
    cumBonus += officialBonus;

    result.push({
      month: m,
      monthName: MONTH_NAMES[m] || `Mois ${m}`,
      monthShortName: (MONTH_NAMES[m] || `M${m}`).split(' ')[0],
      plannedTasks,
      cumulativePlannedTasks: cumPlanned,
      validatedTasks,
      cumulativeValidatedTasks: cumValidated,
      completedTasks,
      cumulativeCompletedTasks: cumCompleted,
      inProgressTasks,
      plannedStatusTasks,
      notCompletedTasks,
      monthlyOfficialRate,
      monthlyProvisionalRate,
      cumulativeOfficialRate,
      cumulativeProvisionalRate,
      evolutionDeltaVsPrevMonth,
      volumeShareOfAnnualTotal,
      cumulativeShareOfAnnualTotal,
      annualCompletionRate,
      volumeGrowthRateVsPrevMonth,
      officialBonus,
      cumulativeOfficialBonus: cumBonus,
    });
  }

  return result;
}

/**
 * Calcule l'évolution mois après mois des Objectifs Stratégiques (OS)
 */
export function calculateStrategicObjectivesEvolution(tasks: TaskItem[]): ObjectiveProgressItem[] {
  // Regrouper par OS
  const osMap = new Map<string, { category: CopCategoryKey; tasks: TaskItem[] }>();

  tasks.forEach((t) => {
    const rawOs = t.strategicObjective?.trim() || "Objectif Stratégique Non Spécifié";
    if (!osMap.has(rawOs)) {
      osMap.set(rawOs, { category: t.copCategory, tasks: [] });
    }
    osMap.get(rawOs)!.tasks.push(t);
  });

  const list: ObjectiveProgressItem[] = [];

  osMap.forEach(({ category, tasks: osTasks }, osTitle) => {
    let cumPlanned = 0;
    let cumValidated = 0;
    let prevCumRate = 0;
    const monthlyBreakdown: ObjectiveProgressItem['monthlyBreakdown'] = {};

    for (let m = 3; m <= 12; m++) {
      const mt = osTasks.filter((t) => t.month === m);
      const planned = mt.length;
      const validated = mt.filter((t) => t.status === 'VALIDE').length;
      const completed = mt.filter((t) => t.status === 'TERMINE').length;

      cumPlanned += planned;
      cumValidated += validated;

      const monthlyRate = planned > 0 ? Math.round((validated / planned) * 1000) / 10 : 0;
      const cumulativeRate = cumPlanned > 0 ? Math.round((cumValidated / cumPlanned) * 1000) / 10 : 0;
      const evolutionDelta =
        m === 3 ? cumulativeRate : Math.round((cumulativeRate - prevCumRate) * 10) / 10;
      prevCumRate = cumulativeRate;

      monthlyBreakdown[m] = {
        monthName: (MONTH_NAMES[m] || `M${m}`).split(' ')[0],
        planned,
        validated,
        completed,
        cumulativePlanned: cumPlanned,
        cumulativeValidated: cumValidated,
        monthlyRate,
        cumulativeRate,
        evolutionDelta,
      };
    }

    const totalInitialTasks = osTasks.length;
    const globalValidated = osTasks.filter((t) => t.status === 'VALIDE').length;
    const globalCompleted = osTasks.filter((t) => t.status === 'TERMINE').length;
    const globalRate =
      totalInitialTasks > 0 ? Math.round((globalValidated / totalInitialTasks) * 1000) / 10 : 0;

    list.push({
      id: osTitle,
      title: osTitle,
      category,
      totalInitialTasks,
      globalValidated,
      globalCompleted,
      globalRate,
      monthlyBreakdown,
    });
  });

  return list.sort((a, b) => b.totalInitialTasks - a.totalInitialTasks);
}

/**
 * Calcule l'évolution mois après mois des Objectifs Opérationnels (OO)
 */
export function calculateOperationalObjectivesEvolution(tasks: TaskItem[]): ObjectiveProgressItem[] {
  // Regrouper par OO
  const ooMap = new Map<string, { category: CopCategoryKey; tasks: TaskItem[] }>();

  tasks.forEach((t) => {
    const rawOo = t.operationalObjective?.trim() || "Objectif Opérationnel Non Spécifié";
    if (!ooMap.has(rawOo)) {
      ooMap.set(rawOo, { category: t.copCategory, tasks: [] });
    }
    ooMap.get(rawOo)!.tasks.push(t);
  });

  const list: ObjectiveProgressItem[] = [];

  ooMap.forEach(({ category, tasks: ooTasks }, ooTitle) => {
    let cumPlanned = 0;
    let cumValidated = 0;
    let prevCumRate = 0;
    const monthlyBreakdown: ObjectiveProgressItem['monthlyBreakdown'] = {};

    for (let m = 3; m <= 12; m++) {
      const mt = ooTasks.filter((t) => t.month === m);
      const planned = mt.length;
      const validated = mt.filter((t) => t.status === 'VALIDE').length;
      const completed = mt.filter((t) => t.status === 'TERMINE').length;

      cumPlanned += planned;
      cumValidated += validated;

      const monthlyRate = planned > 0 ? Math.round((validated / planned) * 1000) / 10 : 0;
      const cumulativeRate = cumPlanned > 0 ? Math.round((cumValidated / cumPlanned) * 1000) / 10 : 0;
      const evolutionDelta =
        m === 3 ? cumulativeRate : Math.round((cumulativeRate - prevCumRate) * 10) / 10;
      prevCumRate = cumulativeRate;

      monthlyBreakdown[m] = {
        monthName: (MONTH_NAMES[m] || `M${m}`).split(' ')[0],
        planned,
        validated,
        completed,
        cumulativePlanned: cumPlanned,
        cumulativeValidated: cumValidated,
        monthlyRate,
        cumulativeRate,
        evolutionDelta,
      };
    }

    const totalInitialTasks = ooTasks.length;
    const globalValidated = ooTasks.filter((t) => t.status === 'VALIDE').length;
    const globalCompleted = ooTasks.filter((t) => t.status === 'TERMINE').length;
    const globalRate =
      totalInitialTasks > 0 ? Math.round((globalValidated / totalInitialTasks) * 1000) / 10 : 0;

    list.push({
      id: ooTitle,
      title: ooTitle,
      category,
      totalInitialTasks,
      globalValidated,
      globalCompleted,
      globalRate,
      monthlyBreakdown,
    });
  });

  return list.sort((a, b) => b.totalInitialTasks - a.totalInitialTasks);
}

/**
 * Détermine la date initiale, la date révisée et le statut à date pour chaque tâche
 */
export function getTaskDateAndStatusInfo(task: TaskItem): {
  initialDate: string;
  currentDate: string;
  hasChangedDate: boolean;
  statusToDate: 'VALIDE' | 'TERMINE' | 'EN_COURS' | 'REPORTE' | 'REPLANIFIE' | 'A_PLANIFIER' | 'NON_TERMINE';
  statusBadge: {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
  };
  details: string;
} {
  // Date initiale fixée en début d'année
  const initialDate = task.initialDeadline || task.deadlineCop || 'Non définie';

  let currentDate = initialDate;
  let hasChangedDate = false;
  let statusToDate: 'VALIDE' | 'TERMINE' | 'EN_COURS' | 'REPORTE' | 'REPLANIFIE' | 'A_PLANIFIER' | 'NON_TERMINE' = 'NON_TERMINE';
  let details = '';

  const reportLower = (task.report || '').toLowerCase();
  const obsLower = (task.observations || '').toLowerCase();

  if (task.status === 'VALIDE') {
    statusToDate = 'VALIDE';
    details = 'Validé officiel Présidence (1 pt)';
  } else if (task.status === 'TERMINE') {
    statusToDate = 'TERMINE';
    details = 'Déclaré DE (1 pt DE) · Visa PDH attendu';
  } else if (task.replanifiedToMonth) {
    statusToDate = 'REPLANIFIE';
    hasChangedDate = true;
    currentDate = `${MONTH_NAMES[task.replanifiedToMonth]?.split(' ')[0] || 'Mois ' + task.replanifiedToMonth} 2026`;
    details = task.replanifiedReason || `Replanifié au mois de ${MONTH_NAMES[task.replanifiedToMonth]}`;
  } else if (
    reportLower.includes('report') ||
    reportLower.includes('bascule') ||
    obsLower.includes('report') ||
    obsLower.includes('bascul')
  ) {
    statusToDate = 'REPORTE';
    hasChangedDate = true;
    details = task.report || task.observations;
    // Si une date cible est mentionnée
    if (reportLower.includes('octobre') || obsLower.includes('octobre')) {
      currentDate = 'Octobre 2026';
    } else if (reportLower.includes('septembre') || obsLower.includes('septembre')) {
      currentDate = 'Septembre 2026';
    } else if (reportLower.includes('t4')) {
      currentDate = 'T4 2026';
    }
  } else if (task.status === 'PLANIFIER' || task.status === 'PLANIFIE') {
    statusToDate = 'A_PLANIFIER';
    details = 'À planifier pour le 4e trimestre (T4)';
  } else if (task.status === 'EN COURS') {
    statusToDate = 'EN_COURS';
    details = 'En cours d\'exécution';
  } else {
    statusToDate = 'NON_TERMINE';
    details = task.observations || 'Non terminé';
  }

  // Badges visuels
  let statusBadge = {
    label: 'Non Terminé',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-300',
  };

  switch (statusToDate) {
    case 'VALIDE':
      statusBadge = {
        label: '✓ Validé PDH',
        bgClass: 'bg-emerald-100',
        textClass: 'text-emerald-800 font-bold',
        borderClass: 'border-emerald-300',
      };
      break;
    case 'TERMINE':
      statusBadge = {
        label: 'Terminé (DE)',
        bgClass: 'bg-blue-100',
        textClass: 'text-blue-800 font-bold',
        borderClass: 'border-blue-300',
      };
      break;
    case 'REPLANIFIE':
      statusBadge = {
        label: `Replanifié (${currentDate})`,
        bgClass: 'bg-purple-100',
        textClass: 'text-purple-800 font-bold',
        borderClass: 'border-purple-300',
      };
      break;
    case 'REPORTE':
      statusBadge = {
        label: 'Reporté à date',
        bgClass: 'bg-amber-100',
        textClass: 'text-amber-900 font-bold',
        borderClass: 'border-amber-300',
      };
      break;
    case 'A_PLANIFIER':
      statusBadge = {
        label: 'À planifier (T4)',
        bgClass: 'bg-indigo-100',
        textClass: 'text-indigo-800 font-bold',
        borderClass: 'border-indigo-300',
      };
      break;
    case 'EN_COURS':
      statusBadge = {
        label: 'En cours',
        bgClass: 'bg-sky-100',
        textClass: 'text-sky-800 font-bold',
        borderClass: 'border-sky-300',
      };
      break;
    default:
      statusBadge = {
        label: 'Non terminé',
        bgClass: 'bg-rose-50',
        textClass: 'text-rose-700 font-medium',
        borderClass: 'border-rose-200',
      };
      break;
  }

  return {
    initialDate,
    currentDate,
    hasChangedDate,
    statusToDate,
    statusBadge,
    details,
  };
}
