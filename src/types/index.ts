/**
 * Executive Performance Tracker — Types & Interfaces
 * Fondation HYSTERESIS
 */

export type CopCategoryKey = 'A_ACTIVITES' | 'B_RH' | 'C_GOUVERNANCE' | 'D_FINANCES';

export interface CopCategory {
  key: CopCategoryKey;
  code: 'A' | 'B' | 'C' | 'D';
  label: string;
  description: string;
}

export type TaskStatus = 'TERMINE' | 'NON TERMINE' | 'EN COURS' | 'VALIDE' | 'PLANIFIE' | 'PLANIFIER';

export interface PtaMajorActivity {
  id: string;
  copCategory: CopCategoryKey;
  code: string; // Ex: 'A.1', 'A.2', 'B.1', 'C.1', 'D.1'
  title: string;
  programmePta: string;
  operationalObjective: string;
  strategicObjective: string;
}

export interface TaskItem {
  id: string;
  copCategory: CopCategoryKey;
  parentPtaId?: string; // ID de l'activité majeure parente du PTA
  parentPtaTitle?: string; // Titre de l'activité majeure du PTA
  strategicObjective: string;
  operationalObjective: string;
  programmePta: string;
  activity: string; // Libellé de la sous-tâche / sous-activité d'évaluation
  deadlineCop: string;
  month: number; // 3 = Mars, ..., 7 = Juillet, ..., 12 = Décembre
  report: string; // Historique de report ou observation de report
  expectedResult: string;
  status: TaskStatus;
  proof: string; // Lien Google Drive, référence document ou descriptif
  observations: string;
  replanifiedToMonth?: number;
  replanifiedReason?: string;
  validatedByPresident?: boolean;
  validatedAt?: string;
  initialDeadline?: string; // Date initiale fixée en début d'année (PTA/COP)
  initialMonth?: number; // Mois initial fixé en début d'année (PTA/COP)
  currentDeadline?: string; // Date révisée effective après report ou replanification
  statusToDate?: 'VALIDE' | 'TERMINE' | 'EN_COURS' | 'REPORTE' | 'REPLANIFIE' | 'A_PLANIFIER' | 'NON_TERMINE';
  statusToDateLabel?: string; // Libellé explicite à date
  financialAmount?: number; // Cible (en FCFA)
  financialAmountTarget?: number; // Cible de mobilisation
  financialAmountRealized?: number; // Montant effectivement encaissé (0 FCFA jusqu'ici)
}

export interface ObjectiveEvolutionStat {
  code: string;
  type: 'STRATEGIQUE' | 'OPERATIONNEL';
  title: string;
  category: CopCategoryKey;
  totalTasksInitial: number; // Nombre global en début d'année
  monthlyBreakdown: {
    [month: number]: {
      planned: number;
      validated: number;
      completed: number;
      rate: number;
      cumulativePlanned: number;
      cumulativeValidated: number;
      cumulativeRate: number;
      evolutionVsPrevMonth: number; // Progression en points de %
    };
  };
  globalValidated: number;
  globalRate: number;
}

export interface MonthlyStats {
  month: number;
  monthName: string;
  totalTasks: number;
  completedTasks: number; // TERMINE (score prov = 1)
  validatedTasks: number; // VALIDE (score def = 1)
  inProgressTasks: number; // EN COURS (score = 0)
  notCompletedTasks: number; // NON TERMINE (score = 0)
  plannedTasks?: number; // PLANIFIE / PLANIFIER (score = 0)
  provisionalScoreSum: number;
  officialScoreSum: number;
  provisionalEvolutionRate: number; // (completed + validated) / total * 100
  officialEvolutionRate: number; // validated / total * 100
  baseBonusAmount: number; // FCFA
  provisionalBonus: number; // FCFA
  officialBonus: number; // FCFA
  presidentNotes?: string;
  isSigned?: boolean;
}

export type UserRole = 'DIRECTEUR_EXECUTIF' | 'PRESIDENTE';

export interface PartnerContract {
  id: string;
  name: string;
  type: 'Technique' | 'Financier' | 'En nature' | 'Institutionnel';
  targetAmount?: number;
  securedAmount?: number;
  status: 'Prospection' | 'Négociation' | 'Signé' | 'Actif';
  signedMonth?: number;
  documentRef?: string;
}
