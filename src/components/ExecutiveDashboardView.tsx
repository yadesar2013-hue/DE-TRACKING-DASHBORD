/**
 * ExecutiveDashboardView — Tableau de bord de pilotage stratégique
 * Vue globale de la performance du Directeur Exécutif pour le Conseil d'Administration et la Présidence
 */

import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import { COP_CATEGORIES, MONTH_NAMES, REBALANCED_2027_PERSPECTIVES } from '../data/initialTasks';
import {
  Award,
  Users,
  Building2,
  TrendingUp,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CalendarRange,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Target,
} from 'lucide-react';

export const ExecutiveDashboardView: React.FC<{
  onNavigateToTab: (tab: 'canevas' | 'replanification' | 'mobilisation' | 'objectifs') => void;
}> = ({ onNavigateToTab }) => {
  const {
    tasks,
    allMonthlyStats,
    globalCumulativeRateOfficial,
    globalCumulativeRateProvisional,
    mobilizedTotalAmount,
    mobilizationTarget,
    initialAnnualTotalTasks,
    cumulativeMonthlyStats,
    setCurrentMonth,
  } = useTracker();

  const [activeRebalanceTab, setActiveRebalanceTab] = useState<'september' | 'august' | 'june' | 'q4' | 'perspectives2027'>('september');
  const [tableMode, setTableMode] = useState<'monthly' | 'cumulative'>('monthly');

  // Statistiques par catégorie COP
  const categoryStats = COP_CATEGORIES.map((cat) => {
    const catTasks = tasks.filter((t) => t.copCategory === cat.key);
    const total = catTasks.length;
    const validated = catTasks.filter((t) => t.status === 'VALIDE').length;
    const completed = catTasks.filter((t) => t.status === 'TERMINE').length;
    const inProgress = catTasks.filter((t) => t.status === 'EN COURS').length;
    const planned = catTasks.filter((t) => t.status === 'PLANIFIER' || t.status === 'PLANIFIE').length;
    const notCompleted = catTasks.filter((t) => t.status === 'NON TERMINE').length;
    const rate = total > 0 ? Math.round((validated / total) * 100) : 0;

    return {
      ...cat,
      total,
      validated,
      completed,
      inProgress,
      planned,
      notCompleted,
      rate,
    };
  });

  // Calcul du cumul des primes validées sur toute l'année
  const totalValidatedBonus = Object.values(allMonthlyStats).reduce(
    (sum, m) => sum + m.officialBonus,
    0
  );

  return (
    <div className="space-y-6">
      {/* 1. Bandeau de synthèse institutionnelle */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-800 rounded-md text-xs text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contrat d'Objectifs et de Performance (1er mars — 31 décembre 2026)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Tableau Exécutif de Performance
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Directeur Exécutif : <strong className="text-white">M. Arsène Jean de Dieu YADES</strong> · Présidente : <strong className="text-white">Mme Cheryle IDOSSOU</strong>. Pilotage des 4 domaines stratégiques et replanification opérationnelle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 shrink-0 font-mono">
            <div>
              <div className="text-xs text-slate-400">Total début d'année</div>
              <div className="text-3xl font-bold text-white mt-1">
                {initialAnnualTotalTasks}
              </div>
              <div className="text-[11px] text-slate-400">Tâches prévues PTA</div>
            </div>

            <div>
              <div className="text-xs text-slate-400">Taux Validé PDH</div>
              <div className="text-3xl font-bold text-emerald-400 mt-1">
                {globalCumulativeRateOfficial}%
              </div>
              <div className="text-[11px] text-slate-400">Score officiel cumulé</div>
            </div>

            <div>
              <div className="text-xs text-slate-400">Taux Déclaré (DE)</div>
              <div className="text-3xl font-bold text-blue-400 mt-1">
                {globalCumulativeRateProvisional}%
              </div>
              <div className="text-[11px] text-slate-400">Score prévisionnel</div>
            </div>

            <button
              onClick={() => onNavigateToTab('objectifs')}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-sans text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs self-center"
              title="Voir le cumul de mois en mois et l'évolution des objectifs stratégiques & opérationnels"
            >
              <span>Objectifs & Cumuls</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. État d'avancement par Domaine COP (A, B, C, D) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categoryStats.map((c) => {
          const icon =
            c.code === 'A' ? (
              <Award className="w-5 h-5 text-indigo-600" />
            ) : c.code === 'B' ? (
              <Users className="w-5 h-5 text-sky-600" />
            ) : c.code === 'C' ? (
              <Building2 className="w-5 h-5 text-amber-600" />
            ) : (
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            );

          return (
            <div key={c.key} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="p-2 bg-slate-50 rounded-lg">{icon}</span>
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {c.validated} / {c.total} validés
                  </span>
                </div>

                <h2 className="text-sm font-bold text-slate-900 leading-snug">
                  {c.label}
                </h2>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {c.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="text-slate-500">Taux d'exécution</span>
                  <span className="font-bold text-slate-900">{c.rate}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-900 h-full rounded-full transition-all"
                    style={{ width: `${c.rate}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Jalons Clés & Statuts Sanctuarisés */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Jalons Majeurs du Contrat d'Objectifs & de Performance
            </h2>
            <p className="text-xs text-slate-500">
              Événements structurants, programmes et plateformes de la Fondation HYSTERESIS en 2026.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('replanification')}
            className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Matrice de Replanification</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-800">28 - 30 Août 2026</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                VALIDE (Accompli)
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Journée de l'Excellence — Nouveau Standard
            </div>
            <p className="text-xs text-slate-600">
              Tenue à Parakou : 30 lauréats Borgou primés, 400 élèves dotés de kits scolaires, couverture médiatique nationale.
            </p>
          </div>

          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-800">6 Juin 2026</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                VALIDE (Accompli)
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Lancement 2e cohorte "Conversations Inspirantes"
            </div>
            <p className="text-xs text-slate-600">
              Lancement réussi avec 74 participants certifiés. Cadrage : validé par mail du sam. 30 mai à la Présidente (pdh).
            </p>
          </div>

          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-800">1er Septembre 2026</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                VALIDE (Accompli)
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Mise en Conformité — Portail National des Services
            </div>
            <p className="text-xs text-slate-600">
              1er dépôt le 30/06, 2e demande le 31/08. Attestation de mise en conformité au Registre des Associations obtenue le 01/09/2026.
            </p>
          </div>

          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-800">24 Octobre 2026</span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                EN COURS (T4)
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Sortie de la 2e Cohorte "Conversations Inspirantes"
            </div>
            <p className="text-xs text-slate-600">
              Cérémonie de remise des diplômes et certification de 50 nouveaux jeunes, bilan d'impact pédagogique.
            </p>
          </div>

          <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-indigo-800">26 Octobre 2026</span>
              <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                EN COURS (T4)
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Lancement 3e Cohorte "Conversations Inspirantes" (PCI3)
            </div>
            <p className="text-xs text-slate-600">
              Lancement de l'appel à candidatures officiel pour PCI3 le 26 octobre ; proclamation des résultats le 13 novembre 2026.
            </p>
          </div>

          <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-sky-800">31 Octobre 2026</span>
              <span className="text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                Statutaire (T4)
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Prochain Conseil d'Administration (CA)
            </div>
            <p className="text-xs text-slate-600">
              Session statutaire : examen des bilans intermédiaires, mise en conformité PNS et validation de la trajectoire financière T4.
            </p>
          </div>

          <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-purple-800">13 Novembre 2026</span>
              <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                Prévu (T4)
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Proclamation des Résultats PCI3
            </div>
            <p className="text-xs text-slate-600">
              Délibération du jury et publication officielle de la liste des lauréats retenus pour la cohorte 3.
            </p>
          </div>

          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-800">Octobre - Décembre 2026</span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                Étalement COP T4
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Mobilisation 100 000 000 FCFA
            </div>
            <p className="text-xs text-slate-600">
              0 FCFA mobilisé jusqu'ici. Étalement COP T4 : 25M en Octobre, 35M en Novembre et 40M en Décembre (Total 100M).
            </p>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-blue-800">Mensuel jusqu'en déc. 2026</span>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                2 séances / mois
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Programme Déclic Pro
            </div>
            <p className="text-xs text-slate-600">
              Ateliers et séances de coaching d'insertion professionnelle : 2 séances animées chaque mois jusqu'en décembre 2026.
            </p>
          </div>

          <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-teal-800">Dès Novembre 2026</span>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                2 séances / mois
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Hysteresis Academy — Sessions Étudiants
            </div>
            <p className="text-xs text-slate-600">
              Valorisation de la plateforme académique : 2 sessions d'information organisées au profit des étudiants chaque mois dès novembre.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Suivi des Primes de Performance et Historique Mensuel */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {tableMode === 'monthly'
                ? "Évolution Mensuelle & Primes de Performance de Mars à Décembre"
                : "Tableau Analytique de Cumul de Mois en Mois & Pourcentages d'Évolution"}
            </h2>
            <p className="text-xs text-slate-500">
              {tableMode === 'monthly'
                ? `Règle contractuelle COP : Prime Validée = 150 000 FCFA × Taux mensuel validé (cumul validé total : ${totalValidatedBonus.toLocaleString('fr-FR')} FCFA).`
                : `Nombre global au PTA en début d'année : ${initialAnnualTotalTasks} tâches · Cumul progressif des validations et progression mois après mois.`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-200 p-0.5 rounded-lg flex items-center text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTableMode('monthly')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  tableMode === 'monthly'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vue Mensuelle
              </button>
              <button
                type="button"
                onClick={() => setTableMode('cumulative')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  tableMode === 'cumulative'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vue Cumulée (Mois en Mois)
              </button>
            </div>

            <button
              onClick={() => onNavigateToTab('objectifs')}
              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer"
              title="Voir la trajectoire détaillée des Objectifs Stratégiques et Opérationnels"
            >
              <span>Objectifs & Cumuls</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigateToTab('canevas')}
              className="text-xs font-semibold text-slate-900 hover:text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer"
            >
              <span>Canevas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {tableMode === 'monthly' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Mois</th>
                  <th className="py-2.5 px-2.5 text-center">Tâches Prévues</th>
                  <th className="py-2.5 px-2.5 text-center text-emerald-800">Validées (1 pt)</th>
                  <th className="py-2.5 px-2.5 text-center text-blue-800">Terminées DE</th>
                  <th className="py-2.5 px-2.5 text-center text-amber-800">En cours (0 pt)</th>
                  <th className="py-2.5 px-2.5 text-center text-indigo-800">Planifiées (0 pt)</th>
                  <th className="py-2.5 px-2.5 text-center text-slate-500">Non terminées</th>
                  <th className="py-2.5 px-3 font-mono text-right text-emerald-700">Taux Validé</th>
                  <th className="py-2.5 px-3 font-mono text-right text-blue-700">Taux Déclaré (DE)</th>
                  <th className="py-2.5 px-4 font-mono text-right text-emerald-700">Prime Validée (150 000 F × Taux)</th>
                  <th className="py-2.5 px-4 font-mono text-right text-slate-500">Prime Prévisionnelle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                  const s = allMonthlyStats[m];
                  if (!s) return null;
                  const isQ4 = m >= 10;
                  const isJune = m === 6;
                  const isAugust = m === 8;
                  const isSeptember = m === 9;

                  return (
                    <tr
                      key={m}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSeptember
                          ? 'bg-blue-50/40 font-semibold'
                          : isAugust
                          ? 'bg-emerald-50/20'
                          : isJune
                          ? 'bg-indigo-50/20'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-900 flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            setCurrentMonth(m);
                            onNavigateToTab('canevas');
                          }}
                          className="hover:underline text-left font-bold flex items-center gap-1 text-slate-900 cursor-pointer"
                          title={`Voir le canevas d'évaluation de ${s.monthName}`}
                        >
                          <span>{s.monthName}</span>
                        </button>
                        {m === 9 && (
                          <span className="text-[10px] font-sans bg-blue-100 px-1.5 py-0.5 rounded font-bold text-blue-800">
                            17 tâches (4 val. · 8 planif.)
                          </span>
                        )}
                        {m === 8 && (
                          <span className="text-[10px] font-sans bg-emerald-100 px-1.5 py-0.5 rounded font-bold text-emerald-800">
                            29 tâches (16 val. · 55%)
                          </span>
                        )}
                        {m === 7 && (
                          <span className="text-[10px] font-sans bg-slate-200 px-1 py-0.5 rounded text-slate-800">
                            Modèle (22 val. / 23)
                          </span>
                        )}
                        {m === 6 && (
                          <span className="text-[10px] font-sans bg-indigo-100 px-1.5 py-0.5 rounded font-bold text-indigo-800">
                            51 tâches (6 val. · 11,76%)
                          </span>
                        )}
                        {m === 5 && (
                          <span className="text-[10px] font-sans bg-emerald-100 px-1 py-0.5 rounded font-bold text-emerald-800">
                            100% (46 / 46)
                          </span>
                        )}
                        {isQ4 && (
                          <span className="text-[10px] font-sans bg-amber-100 px-1 py-0.5 rounded text-amber-800">
                            Replanifié T4
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2.5 text-center text-slate-700 font-bold">
                        {s.totalTasks}
                      </td>
                      <td className="py-2.5 px-2.5 text-center text-emerald-700 font-bold">
                        {s.validatedTasks}
                      </td>
                      <td className="py-2.5 px-2.5 text-center text-blue-700 font-semibold">
                        {s.completedTasks}
                      </td>
                      <td className="py-2.5 px-2.5 text-center text-amber-700">
                        {s.inProgressTasks}
                      </td>
                      <td className="py-2.5 px-2.5 text-center text-indigo-700 font-semibold">
                        {s.plannedTasks || 0}
                      </td>
                      <td className="py-2.5 px-2.5 text-center text-slate-500">
                        {s.notCompletedTasks}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {s.officialEvolutionRate}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-blue-700 font-semibold">
                        {s.provisionalEvolutionRate}%
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                        {s.officialBonus.toLocaleString('fr-FR')} F
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-500">
                        {s.provisionalBonus.toLocaleString('fr-FR')} F
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Mois</th>
                  <th className="py-2.5 px-2.5 text-center">Tâches du Mois</th>
                  <th className="py-2.5 px-2.5 text-center font-bold text-indigo-900 bg-indigo-50/50">
                    Cumul Prévu (sur {initialAnnualTotalTasks})
                  </th>
                  <th className="py-2.5 px-2.5 text-center text-indigo-700">
                    % Cumul Annuel
                  </th>
                  <th className="py-2.5 px-2.5 text-center text-slate-600">
                    Évol. Volume Mois (%)
                  </th>
                  <th className="py-2.5 px-2.5 text-center text-emerald-800">Validées Mois</th>
                  <th className="py-2.5 px-2.5 text-center font-bold text-emerald-900 bg-emerald-50/50">
                    Cumul Validé
                  </th>
                  <th className="py-2.5 px-3 font-mono text-right">Taux Mensuel (%)</th>
                  <th className="py-2.5 px-3 font-mono text-right font-bold text-emerald-700 bg-emerald-50/30">
                    Taux Cumulé Officiel (%)
                  </th>
                  <th className="py-2.5 px-3 font-mono text-right">Évolution Delta (pts)</th>
                  <th className="py-2.5 px-3 font-mono text-right text-emerald-700">Prime Mois</th>
                  <th className="py-2.5 px-4 font-mono text-right font-bold text-slate-900">
                    Prime Cumulée
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {cumulativeMonthlyStats.map((s) => {
                  const isPositiveDelta = s.evolutionDeltaVsPrevMonth >= 0;
                  const isPositiveVol = s.volumeGrowthRateVsPrevMonth >= 0;
                  const isCurrent = s.month === 9;

                  return (
                    <tr
                      key={s.month}
                      className={`hover:bg-slate-50 transition-colors ${
                        isCurrent ? 'bg-blue-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                        <button
                          onClick={() => {
                            setCurrentMonth(s.month);
                            onNavigateToTab('canevas');
                          }}
                          className="hover:underline font-bold text-slate-900 cursor-pointer"
                        >
                          {s.monthName}
                        </button>
                      </td>
                      <td className="py-2.5 px-2.5 text-center text-slate-700 font-bold">
                        {s.plannedTasks}
                      </td>
                      <td className="py-2.5 px-2.5 text-center font-bold text-indigo-900 bg-indigo-50/30">
                        {s.cumulativePlannedTasks} / {initialAnnualTotalTasks}
                      </td>
                      <td className="py-2.5 px-2.5 text-center font-bold text-indigo-700">
                        {s.cumulativeShareOfAnnualTotal}%
                      </td>
                      <td
                        className={`py-2.5 px-2.5 text-center font-medium ${
                          s.month === 3
                            ? 'text-slate-400'
                            : isPositiveVol
                            ? 'text-emerald-700'
                            : 'text-rose-600'
                        }`}
                      >
                        {s.month === 3 ? 'Base' : `${isPositiveVol ? '+' : ''}${s.volumeGrowthRateVsPrevMonth}%`}
                      </td>
                      <td className="py-2.5 px-2.5 text-center text-emerald-700 font-bold">
                        {s.validatedTasks}
                      </td>
                      <td className="py-2.5 px-2.5 text-center font-bold text-emerald-900 bg-emerald-50/30">
                        {s.cumulativeValidatedTasks}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                        {s.monthlyOfficialRate}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700 bg-emerald-50/30">
                        {s.cumulativeOfficialRate}%
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-bold ${
                          isPositiveDelta ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {isPositiveDelta ? '+' : ''}
                        {s.evolutionDeltaVsPrevMonth}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-700">
                        {s.officialBonus.toLocaleString('fr-FR')} F
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        {s.cumulativeOfficialBonus.toLocaleString('fr-FR')} F
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Matrice Stratégique de Rééquilibrage & Déploiement Opérationnel */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
              <CalendarRange className="w-4 h-4" />
              <span>Pilotage Opérationnel COP 2026 & Perspectives 2027</span>
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Matrice de Rééquilibrage des Tâches & Séquençage Logique Sans Doublons
            </h2>
            <p className="text-xs text-slate-500">
              Ordonnancement raisonné des 51 activités de Juin, des 29 activités d'Août, déploiement cadencé du 4e trimestre (T4) et projection pluriannuelle 2027.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold shrink-0 flex-wrap">
            <button
              onClick={() => setActiveRebalanceTab('september')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                activeRebalanceTab === 'september'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Septembre (17)
            </button>
            <button
              onClick={() => setActiveRebalanceTab('august')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                activeRebalanceTab === 'august'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Août (29)
            </button>
            <button
              onClick={() => setActiveRebalanceTab('june')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                activeRebalanceTab === 'june'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Juin (51)
            </button>
            <button
              onClick={() => setActiveRebalanceTab('q4')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                activeRebalanceTab === 'q4'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Déploiement T4 (57)
            </button>
            <button
              onClick={() => setActiveRebalanceTab('perspectives2027')}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-all ${
                activeRebalanceTab === 'perspectives2027'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Perspectives 2027 (11)
            </button>
          </div>
        </div>

        {/* CONTENU ONGLET 1 : SEPTEMBRE (17) */}
        {activeRebalanceTab === 'september' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                      Mois de Septembre 2026 — Bilan Stratégique & Opérationnel
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                      4 validées · 5 non terminées · 8 à planifier
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    17 activités au total réparties sur les 4 axes COP (A: 8, B: 6, C: 1, D: 2) · Taux Validé : 23,53%
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setCurrentMonth(9);
                    onNavigateToTab('canevas');
                  }}
                  className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-blue-200 shadow-xs shrink-0"
                >
                  <span>Accéder au canevas de Septembre</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 4 Blocs représentatifs de Septembre */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                {/* 1. Validées */}
                <div className="bg-white p-3.5 rounded-lg border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      4 Activités Validées
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      100% Score
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-slate-600 text-[11px]">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Gouvernance :</strong> Attestation de mise en conformité au Registre des associations (Portail National des Services au 01/09).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>JE 2026 :</strong> Rapport final et capitalisation complet (Drive validé).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>BIEN :</strong> Élaboration des TDR (Discussion cadrée avec Julien).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Mobilisation :</strong> Soumission du projet 3 (PAEG + TEEMS).</span>
                    </li>
                  </ul>
                </div>

                {/* 2. Non Terminées */}
                <div className="bg-white p-3.5 rounded-lg border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 text-amber-700">
                      <AlertTriangle className="w-4 h-4" />
                      5 Non Terminées (Observations)
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      Actions à mener
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-slate-600 text-[11px]">
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-600 font-bold">•</span>
                      <span><strong>BIEN :</strong> Publication des TDR & sélection experts (suite à la concertation).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-600 font-bold">•</span>
                      <span><strong>Centre Nikki :</strong> Programmation architecturale, plans APS et Business Plan (réunions en cours).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-600 font-bold">•</span>
                      <span><strong>Mobilisation :</strong> Visite des 11 partenaires programmés en septembre.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-600 font-bold">•</span>
                      <span><strong>Déclic Pro :</strong> Sessions de formation 3 et 4 à finaliser.</span>
                    </li>
                  </ul>
                </div>

                {/* 3. À Planifier pour T4 */}
                <div className="bg-white p-3.5 rounded-lg border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5 text-indigo-700">
                      <Calendar className="w-4 h-4" />
                      8 Tâches "A Planifier"
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                      Cadencement T4
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-slate-600 text-[11px]">
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">→</span>
                      <span><strong>CI2 Clôture :</strong> TDR clôture reportés pour cérémonie du 24 octobre.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">→</span>
                      <span><strong>CI3 Cohorte 3 :</strong> TDR, appel candidatures (26 oct.) et sélection (13 nov.).</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">→</span>
                      <span><strong>Déclic Pro Parakou :</strong> Session 2 calée pour début novembre.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-indigo-600 font-bold">→</span>
                      <span><strong>Hysteresis Academy :</strong> 2 sessions d'information étudiants dès novembre.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 2 : AOÛT (29) */}
        {activeRebalanceTab === 'august' && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Mois d'Août 2026 — Fiche d'Évaluation Actualisée
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    29 activités au total · 16 validées / terminées (55,17%) · Prime validée : 82 759 FCFA
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setCurrentMonth(8);
                    onNavigateToTab('canevas');
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-emerald-300 shadow-xs shrink-0"
                >
                  <span>Accéder au canevas d'Août</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded border border-emerald-200">
                  <div className="font-bold text-slate-900">Journée de l'Excellence</div>
                  <div className="text-emerald-700 font-medium">7 tâches validées sur 7</div>
                  <div className="text-[11px] text-slate-500">TDR, graphisme, kits, impressions, logistique, tournée 28-30 août</div>
                </div>
                <div className="bg-white p-2.5 rounded border border-emerald-200">
                  <div className="font-bold text-slate-900">Centre Ibabi de Nikki</div>
                  <div className="text-emerald-700 font-medium">6 tâches validées sur 6</div>
                  <div className="text-[11px] text-slate-500">Informatique, art oratoire, anglais, évaluation, lauréats, suivi</div>
                </div>
                <div className="bg-white p-2.5 rounded border border-emerald-200">
                  <div className="font-bold text-slate-900">Déclic Pro & Com JE</div>
                  <div className="text-emerald-700 font-medium">2 tâches validées</div>
                  <div className="text-[11px] text-slate-500">Session 1 Déclic Pro (Facebook) & Couverture média JE (Drive)</div>
                </div>
                <div className="bg-white p-2.5 rounded border border-emerald-200">
                  <div className="font-bold text-slate-900">Centre Nikki & BTP</div>
                  <div className="text-emerald-700 font-medium">1 tâche validée</div>
                  <div className="text-[11px] text-slate-500">Réunions pour programme architectural (APS/BP différés)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 3 : JUIN (51) */}
        {activeRebalanceTab === 'june' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                    Mois de Juin 2026 — Fiche d'Évaluation Officielle
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    51 activités au total · 6 validées / terminées (11,76%) · Prime validée : 17 647 FCFA
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">
                    Répartition rubriques COP : <strong>Axe A Activités :</strong> 38 · <strong>Axe B RH :</strong> 3 · <strong>Axe C Gouvernance :</strong> 5 · <strong>Axe D Finances :</strong> 5
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCurrentMonth(6);
                    onNavigateToTab('canevas');
                  }}
                  className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-indigo-200 shadow-xs shrink-0"
                >
                  <span>Accéder au canevas de Juin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">Axe A / Nikki</span>
                  <div className="font-bold text-slate-900 mt-1">Centre Ibabi & Kokari Nikki</div>
                  <div className="text-[11px] text-slate-600">Points de suivi et réunions régulières validés (Preuve Drive).</div>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">Axe A / CI2</span>
                  <div className="font-bold text-slate-900 mt-1">Conversations Inspirantes 2</div>
                  <div className="text-[11px] text-slate-600">Rapport de suivi PCI2 et liste documents de clôture validés.</div>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">Axe C / Gouvernance</span>
                  <div className="font-bold text-slate-900 mt-1">Transversales Réseaux Sociaux</div>
                  <div className="text-[11px] text-slate-600">Diffusion sur tous canaux et analyse des 363 abonnés FB validées.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 2 : DÉPLOIEMENT T4 SANS DOUBLONS */}
        {activeRebalanceTab === 'q4' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Octobre */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-slate-900 text-sm">Octobre 2026 (27 tâches)</div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                    Démarrage T4
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">05/10</span>
                    <span className="text-slate-800 font-medium">KP - Rentrée académique Parakou</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">09-16/10</span>
                    <span className="text-slate-800 font-medium">CRV - TDR validés, Mobilisation & Tournée écoles</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">16-23/10</span>
                    <span className="text-slate-800 font-medium">RH - Recrutement et intégration des bénévoles</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">16-23/10</span>
                    <span className="text-slate-800 font-medium">KN - Plans PRO & Dépôt du permis de construire</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">24/10</span>
                    <span className="text-slate-800 font-bold text-indigo-700">CI2 - Cérémonie de clôture & Diplômes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">28/10</span>
                    <span className="text-slate-800 font-bold text-indigo-700">CI3 - Lancement officiel des inscriptions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">30/10</span>
                    <span className="text-slate-800 font-medium">KP - Livraison chantier & KN Avant-projet (APD)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">31/10</span>
                    <span className="text-slate-800 font-medium">MR - Soumission projet 4 & Tranche 1 25M</span>
                  </div>
                </div>
              </div>

              {/* Novembre */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-slate-900 text-sm">Novembre 2026 (15 tâches)</div>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">
                    Vitesse de croisière
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">04/11</span>
                    <span className="text-slate-800 font-bold text-emerald-700">DE - Lancement officiel des clubs Digit'Elles</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">06/11</span>
                    <span className="text-slate-800 font-medium">CI3 - Sélection et notification des résultats</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">07/11</span>
                    <span className="text-slate-800 font-medium">DP - Session 2 (Formation animateur du PAM)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">14/11</span>
                    <span className="text-slate-800 font-bold text-sky-700">GV - Réunion statutaire du CA</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">20/11</span>
                    <span className="text-slate-800 font-medium">KN - Validation commissions de sécurité</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">21/11</span>
                    <span className="text-slate-800 font-bold text-indigo-700">CI3 - Lancement officiel au Golden Tulip</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">27/11</span>
                    <span className="text-slate-800 font-medium">KN - Bouclier financier (budgets/partenariats)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">30/11</span>
                    <span className="text-slate-800 font-medium">HA - Sessions étudiants & MR Tranche 2 35M</span>
                  </div>
                </div>
              </div>

              {/* Décembre */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="font-bold text-slate-900 text-sm">Décembre 2026 (15 tâches)</div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    Clôture Annuelle
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">04/12</span>
                    <span className="text-slate-800 font-medium">KN - Consultation des entreprises (Appel d'offres)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">15/12</span>
                    <span className="text-slate-800 font-medium">CM - Bilan communication & visibilité annuel</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">18/12</span>
                    <span className="text-slate-800 font-medium">KN - Signature des contrats marchés travaux</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">31/12</span>
                    <span className="text-slate-800 font-bold text-emerald-700">KN - Installation de chantier Nikki</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">31/12</span>
                    <span className="text-slate-800 font-bold text-emerald-700">MR - Atteinte 15 contrats partenariats signés</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">31/12</span>
                    <span className="text-slate-800 font-medium">PTA - Rapport annuel global du Directeur Exécutif</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">31/12</span>
                    <span className="text-slate-800 font-bold text-sky-700">GV - Session annuelle ordinaire du CA</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono text-[11px] text-slate-500 shrink-0">31/12</span>
                    <span className="text-slate-800 font-medium">MR - Tranche 3 40M (Total 100M mobilisés)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 3 : PERSPECTIVES 2027 */}
        {activeRebalanceTab === 'perspectives2027' && (
          <div className="space-y-3">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 leading-relaxed">
              <strong>Perspectives Opérationnelles Pluriannuelles (COP 2026-2027) :</strong> Les 11 activités ci-dessous, planifiées pour l'exercice 2027, ne constituent pas des retards de 2026 mais s'inscrivent dans le cycle normal pluriannuel des programmes (BTP Kokari Nikki, suivi d'insertion à 6 et 12 mois pour CI2/CI3, cycle scolaire Digit'Elles).
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2 px-3">Date Prévue</th>
                    <th className="py-2 px-3">Programme</th>
                    <th className="py-2 px-4">Activité / Jalon 2027</th>
                    <th className="py-2 px-3">Preuve Attendue</th>
                    <th className="py-2 px-3">Statut</th>
                    <th className="py-2 px-3">Observations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {REBALANCED_2027_PERSPECTIVES.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 shrink-0">
                        {p.deadline}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">
                        {p.programme}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {p.activity}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                        {p.preuve}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {p.statut}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {p.observations}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
