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

export type TaskStatus = 'TERMINE' | 'NON TERMINE' | 'EN COURS' | 'VALIDE';

export interface TaskItem {
  id: string;
  copCategory: CopCategoryKey;
  strategicObjective: string;
  operationalObjective: string;
  programmePta: string;
  activity: string;
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
  financialAmount?: number; // Pour les tâches liées à la mobilisation (en FCFA)
}

export interface MonthlyStats {
  month: number;
  monthName: string;
  totalTasks: number;
  completedTasks: number; // TERMINE (score prov = 1)
  validatedTasks: number; // VALIDE (score def = 1)
  inProgressTasks: number; // EN COURS (score = 0)
  notCompletedTasks: number; // NON TERMINE (score = 0)
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
