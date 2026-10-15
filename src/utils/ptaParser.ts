/**
 * Utilitaires d'analyse et de classification automatique du PTA 2026
 * et des sous-tâches d'évaluation mensuelle du DE dans les 4 rubriques COP :
 * A / ACTIVITÉS
 * B / RESSOURCES HUMAINES
 * C / BONNE GESTION ET GOUVERNANCE
 * D / MOBILISATION BAILLEURS ET PARTENAIRES
 * Fondation HYSTERESIS
 */

import { TaskItem, TaskStatus, CopCategoryKey, PtaMajorActivity } from '../types';
import { PTA_MAJOR_ACTIVITIES } from '../data/initialTasks';

export interface ParsedPtaRow {
  copCategory: CopCategoryKey;
  parentPtaId?: string;
  parentPtaTitle?: string;
  strategicObjective: string;
  operationalObjective: string;
  programmePta: string;
  activity: string;
  deadlineCop: string;
  month: number;
  report: string;
  expectedResult: string;
  status: TaskStatus;
  proof: string;
  observations: string;
  financialAmount?: number;
  financialAmountTarget?: number;
  financialAmountRealized?: number;
}

/**
 * Détecte la rubrique COP (A, B, C ou D) en fonction des mots-clés
 */
export function classifyCopCategory(text: string): CopCategoryKey {
  const t = text.toLowerCase();

  // Test Rubrique D : Finances, Bailleurs, Partenariats, Mobilisation 100M, Prestations DE
  if (
    t.includes('mobilis') ||
    t.includes('100m') ||
    t.includes('100 millions') ||
    t.includes('bailleur') ||
    t.includes('partenaire') ||
    t.includes('mécén') ||
    t.includes('sponsoring') ||
    t.includes('subvention') ||
    t.includes('prestation du de') ||
    t.includes('prestations de') ||
    t.includes('levée de fonds') ||
    t.includes('ressources en nature') ||
    t.includes('contrat de partenariat') ||
    t.startsWith('d ') ||
    t.startsWith('d/')
  ) {
    return 'D_FINANCES';
  }

  // Test Rubrique B : Ressources Humaines, Bénévoles, Organigramme, Organes gouvernance, Équipe, Conformité PNS
  if (
    t.includes('bénévole') ||
    t.includes('organigramme') ||
    t.includes('recrutement') ||
    t.includes('ressources humaines') ||
    t.includes('capital humain') ||
    t.includes('membres de la direction') ||
    t.includes('prise de fonction') ||
    t.includes('bénéficiaire') ||
    t.includes('équipe') ||
    t.includes('mise en conformité') ||
    t.includes('conformité') ||
    t.includes('registre des associations') ||
    t.includes('portail national des services') ||
    t.includes('attestation de mise en conformité') ||
    t.startsWith('b ') ||
    t.startsWith('b/')
  ) {
    return 'B_RH';
  }

  // Test Rubrique C : Bonne gestion, Gouvernance, CA, Procédures, Réseaux sociaux 5k, Planification 2027
  if (
    t.includes('conseil d\'administration') ||
    t.includes('prochain ca') ||
    t.includes('ca du 31 octobre') ||
    t.includes('31 octobre') ||
    t.includes('réunion statutaire') ||
    t.includes('procédure') ||
    t.includes('base documentaire') ||
    t.includes('tableau de bord') ||
    t.includes('réseaux sociaux') ||
    t.includes('communication institutionnelle') ||
    t.includes('planification 2027') ||
    t.includes('pta 2027') ||
    t.includes('légales') ||
    t.includes('statuts') ||
    t.includes('actes administratifs') ||
    t.includes('quitus') ||
    t.startsWith('c ') ||
    t.startsWith('c/')
  ) {
    return 'C_GOUVERNANCE';
  }

  // Test Rubrique A : Programmes et Activités phares (Journée Excellence, Kokari, Academia, Conversations Inspirantes PCI2/PCI3)
  if (
    t.includes('journée de l\'excellence') ||
    t.includes('conversations inspirantes') ||
    t.includes('pci3') ||
    t.includes('pci 3') ||
    t.includes('pci2') ||
    t.includes('proclamation des résultats') ||
    t.includes('kokari') ||
    t.includes('academia') ||
    t.includes('étudiant') ||
    t.includes('declic') ||
    t.includes('déclic') ||
    t.includes('insertion') ||
    t.includes('lauréat') ||
    t.includes('dotation') ||
    t.includes('scolaire') ||
    t.includes('cohorte') ||
    t.includes('formation') ||
    t.includes('webinaire') ||
    t.includes('centre bilingue') ||
    t.includes('activité') ||
    t.startsWith('a ') ||
    t.startsWith('a/')
  ) {
    return 'A_ACTIVITES';
  }

  return 'A_ACTIVITES';
}

/**
 * Associe une sous-tâche à l'activité majeure parente du PTA correspondante
 */
export function detectParentPtaActivity(
  text: string,
  category: CopCategoryKey
): { parentPtaId: string; parentPtaTitle: string; programmePta: string } {
  const t = text.toLowerCase();

  if (category === 'A_ACTIVITES') {
    if (t.includes('declic') || t.includes('déclic') || t.includes('a.6')) {
      return { parentPtaId: 'pta-a6', parentPtaTitle: "A.6 : Programme Déclic Pro (2 séances/mois)", programmePta: "Programme Déclic Pro" };
    }
    if (t.includes('excellence') || t.includes('lauréat') || t.includes('nikki') || t.includes('dotation') || t.includes('scolaire') || t.includes('a.1')) {
      return { parentPtaId: 'pta-a1', parentPtaTitle: "A.1 : Journée de l'Excellence 2026", programmePta: "Journée de l'Excellence" };
    }
    if (t.includes('conversations') || t.includes('pci') || t.includes('mentor') || t.includes('cohorte') || t.includes('webinaire') || t.includes('proclamation') || t.includes('a.2')) {
      return { parentPtaId: 'pta-a2', parentPtaTitle: "A.2 : Programme Conversations Inspirantes", programmePta: "Conversations Inspirantes" };
    }
    if (t.includes('kokari') || t.includes('bilingue') || t.includes('a.3')) {
      return { parentPtaId: 'pta-a3', parentPtaTitle: "A.3 : Projet Kokari (Centre Bilingue Parakou)", programmePta: "Projet Kokari Parakou" };
    }
    if (t.includes('academia') || t.includes('plateforme') || t.includes('numérique') || t.includes('e-learning') || t.includes('étudiant') || t.includes('a.4')) {
      return { parentPtaId: 'pta-a4', parentPtaTitle: "A.4 : Plateforme Numérique Hystérésis Academia", programmePta: "Hystérésis Academia" };
    }
    return { parentPtaId: 'pta-a5', parentPtaTitle: "A.5 : Pilotage & Rapport Annuel Global PTA 2026", programmePta: "Bilan Annuel PTA" };
  }

  if (category === 'B_RH') {
    if (t.includes('conformité') || t.includes('portail') || t.includes('registre') || t.includes('attestation') || t.includes('b.2')) {
      return { parentPtaId: 'pta-b2', parentPtaTitle: "B.2 : Organes de Gouvernance & Textes Statutaires", programmePta: "Gouvernance Institutionnelle" };
    }
    if (t.includes('bénévole') || t.includes('recrutement') || t.includes('candidat') || t.includes('b.1')) {
      return { parentPtaId: 'pta-b1', parentPtaTitle: "B.1 : Réseau et Cohorte des Bénévoles de la Fondation", programmePta: "Gestion du Capital Humain" };
    }
    if (t.includes('bénéficiaire') || t.includes('base de données') || t.includes('b.3')) {
      return { parentPtaId: 'pta-b3', parentPtaTitle: "B.3 : Base de Données Unifiée des Bénéficiaires", programmePta: "Données & Impact Bénéficiaires" };
    }
    return { parentPtaId: 'pta-b2', parentPtaTitle: "B.2 : Organes de Gouvernance & Textes Statutaires", programmePta: "Gouvernance Institutionnelle" };
  }

  if (category === 'C_GOUVERNANCE') {
    if (t.includes('conseil') || t.includes('ca ') || t.includes('ca-') || t.includes('statutaire') || t.includes('c.1')) {
      return { parentPtaId: 'pta-c1', parentPtaTitle: "C.1 : Sessions Statutaires du Conseil d'Administration", programmePta: "Gouvernance Statutaire" };
    }
    if (t.includes('réseaux') || t.includes('abonnés') || t.includes('communication') || t.includes('facebook') || t.includes('c.2')) {
      return { parentPtaId: 'pta-c2', parentPtaTitle: "C.2 : Communication Institutionnelle & Audience Réseaux", programmePta: "Communication Institutionnelle" };
    }
    if (t.includes('2027') || t.includes('budget') || t.includes('c.4')) {
      return { parentPtaId: 'pta-c4', parentPtaTitle: "C.4 : Planification Stratégique 2027 (PTA & Budget)", programmePta: "Planification Stratégique 2027" };
    }
    return { parentPtaId: 'pta-c3', parentPtaTitle: "C.3 : Base Documentaire, Tableaux de Bord et Manuels", programmePta: "Administration & Procédures" };
  }

  if (category === 'D_FINANCES') {
    if (t.includes('prestation') || t.includes('rémunération') || t.includes('d.1')) {
      return { parentPtaId: 'pta-d1', parentPtaTitle: "D.1 : Sécurisation Budgétaire des Prestations du DE", programmePta: "Pérennisation & Fonctionnement" };
    }
    if (t.includes('nature') || t.includes('kits') || t.includes('d.3')) {
      return { parentPtaId: 'pta-d3', parentPtaTitle: "D.3 : Mobilisation des Dons et Ressources en Nature", programmePta: "Ressources en nature" };
    }
    return { parentPtaId: 'pta-d2', parentPtaTitle: "D.2 : Mobilisation du Fonds 100M & Partenariats Bailleurs", programmePta: "Levée de fonds & Bailleurs" };
  }

  return { parentPtaId: 'pta-a5', parentPtaTitle: "A.5 : Pilotage & Rapport Annuel Global PTA 2026", programmePta: "Bilan Annuel PTA" };
}

/**
 * Normalise le statut de tâche
 */
export function normalizeStatus(statusText: string): TaskStatus {
  const s = statusText.trim().toUpperCase();
  if (s.includes('PLANIF')) return 'PLANIFIER';
  if (s.includes('VALIDE') || s.includes('VALIDÉ')) return 'VALIDE';
  if (s.includes('TERMINE') || s.includes('TERMINÉ') || s === 'FAIT' || s === 'REALISE' || s === 'RÉALISÉ') return 'TERMINE';
  if (s.includes('EN COURS') || s === 'EN_COURS') return 'EN COURS';
  return 'NON TERMINE';
}

/**
 * Parse un texte copié depuis Excel, Google Sheets, Word ou texte structuré
 */
export function parsePtaImportText(
  rawText: string,
  fallbackMonth: number = 7
): ParsedPtaRow[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const parsedRows: ParsedPtaRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Ignorer les en-têtes types de tableaux Excel
    if (
      line.toLowerCase().includes('activité') &&
      line.toLowerCase().includes('statut')
    ) {
      continue;
    }
    if (line.toLowerCase().startsWith('réf cop') || line.toLowerCase().startsWith('ref cop')) {
      continue;
    }

    // Détection des séparateurs : Tabulation prioritaire, puis point-virgule, puis pipe |
    let cols: string[] = [];
    if (line.includes('\t')) {
      cols = line.split('\t').map((c) => c.trim());
    } else if (line.includes(';')) {
      cols = line.split(';').map((c) => c.trim());
    } else if (line.includes('|')) {
      cols = line.split('|').map((c) => c.trim()).filter((c) => c.length > 0);
    } else {
      cols = [line];
    }

    if (cols.length === 0) continue;

    let copCategory: CopCategoryKey = 'A_ACTIVITES';
    let strategicObjective = '';
    let operationalObjective = '';
    let programmePta = 'PTA 2026';
    let activity = '';
    let deadlineCop = '2026';
    let month = fallbackMonth;
    let report = 'Aucun';
    let expectedResult = 'Livrable conforme aux exigences';
    let status: TaskStatus = 'EN COURS';
    let proof = '';
    let observations = '';

    if (cols.length >= 8) {
      const refCol = cols[0];
      if (refCol.includes('A')) copCategory = 'A_ACTIVITES';
      else if (refCol.includes('B')) copCategory = 'B_RH';
      else if (refCol.includes('C')) copCategory = 'C_GOUVERNANCE';
      else if (refCol.includes('D')) copCategory = 'D_FINANCES';
      else copCategory = classifyCopCategory(cols.join(' '));

      operationalObjective = cols[1] || '';
      strategicObjective = cols[1] || '';
      programmePta = cols[2] || 'Programme PTA 2026';
      activity = cols[3] || cols[1];
      deadlineCop = cols[4] || '2026';
      report = cols[5] || 'Aucun';
      expectedResult = cols[6] || 'Livrable conforme';
      status = normalizeStatus(cols[7] || 'EN COURS');
      
      if (cols.length >= 10) {
        proof = cols[9] || '';
        observations = cols[10] || '';
      } else {
        proof = cols[8] || '';
        observations = cols[9] || '';
      }
    } else if (cols.length >= 4) {
      activity = cols[0];
      programmePta = cols[1] || 'Programme PTA';
      operationalObjective = cols[1] || 'Objectif PTA 2026';
      strategicObjective = cols[1] || 'Alignement COP 2026';
      status = normalizeStatus(cols[2] || 'EN COURS');
      proof = cols[3] || '';
      observations = cols[4] || '';
      copCategory = classifyCopCategory(activity + ' ' + programmePta);
    } else {
      activity = cols[0].replace(/^[-*•]\s*/, '');
      copCategory = classifyCopCategory(activity);
      status = normalizeStatus(activity);
      programmePta = 'Programme PTA';
      operationalObjective = 'Mise en œuvre du PTA 2026';
      strategicObjective = 'Contrat d\'Objectifs et de Performance 2026';
    }

    // Détection de l'activité majeure PTA parente
    const parentPta = detectParentPtaActivity(activity + ' ' + programmePta, copCategory);

    // Extraction éventuelle de montant financier
    let financialAmount: number | undefined;
    let financialAmountTarget: number | undefined;
    let financialAmountRealized: number = 0; // Réalisé = 0 FCFA par défaut

    const amountMatch = activity.match(/(\d[\d\s.,]{3,})\s*(fcfa|f cfa|f|francs)/i);
    if (amountMatch) {
      const cleanNum = parseInt(amountMatch[1].replace(/[\s.,]/g, ''), 10);
      if (!isNaN(cleanNum) && cleanNum > 0) {
        financialAmount = cleanNum;
        financialAmountTarget = cleanNum;
        financialAmountRealized = 0; // 0 FCFA réalisé
      }
    }

    parsedRows.push({
      copCategory,
      parentPtaId: parentPta.parentPtaId,
      parentPtaTitle: parentPta.parentPtaTitle,
      strategicObjective: strategicObjective || getDefaultStrategicObjective(copCategory),
      operationalObjective: operationalObjective || getDefaultOperationalObjective(copCategory),
      programmePta: parentPta.programmePta || programmePta,
      activity,
      deadlineCop: deadlineCop || '2026',
      month,
      report: report || 'Aucun',
      expectedResult,
      status,
      proof,
      observations,
      financialAmount,
      financialAmountTarget,
      financialAmountRealized,
    });
  }

  return parsedRows;
}

function getDefaultStrategicObjective(category: CopCategoryKey): string {
  switch (category) {
    case 'A_ACTIVITES':
      return "OS 1 : Organiser la Journée de l'Excellence et les programmes d'impact";
    case 'B_RH':
      return "OS 1 : Constituer les équipes des organes de gouvernance";
    case 'C_GOUVERNANCE':
      return "OS 2 : Élaborer les outils de gestion, tableaux de bord et communication";
    case 'D_FINANCES':
      return "OS 2 : Mobiliser 100 millions FCFA pour financer les activités";
  }
}

function getDefaultOperationalObjective(category: CopCategoryKey): string {
  switch (category) {
    case 'A_ACTIVITES':
      return "OO 1 : Réaliser les activités phares du PTA 2026";
    case 'B_RH':
      return "OO 1 : Finaliser le recrutement et l'organisation des équipes";
    case 'C_GOUVERNANCE':
      return "OO 1 : Mettre en ordre la gestion, la communication et la gouvernance";
    case 'D_FINANCES':
      return "OO 2 : Rencontrer les bailleurs et signer des contrats de partenariat";
  }
}
