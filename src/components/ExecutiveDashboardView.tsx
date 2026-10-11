/**
 * ExecutiveDashboardView — Tableau de bord de pilotage stratégique
 * Vue globale de la performance du Directeur Exécutif pour le Conseil d'Administration et la Présidence
 */

import React from 'react';
import { useTracker } from '../context/TrackerContext';
import { COP_CATEGORIES, MONTH_NAMES } from '../data/initialTasks';
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
} from 'lucide-react';

export const ExecutiveDashboardView: React.FC<{
  onNavigateToTab: (tab: 'canevas' | 'replanification' | 'mobilisation') => void;
}> = ({ onNavigateToTab }) => {
  const {
    tasks,
    allMonthlyStats,
    globalCumulativeRateOfficial,
    globalCumulativeRateProvisional,
    mobilizedTotalAmount,
    mobilizationTarget,
  } = useTracker();

  // Statistiques par catégorie COP
  const categoryStats = COP_CATEGORIES.map((cat) => {
    const catTasks = tasks.filter((t) => t.copCategory === cat.key);
    const total = catTasks.length;
    const validated = catTasks.filter((t) => t.status === 'VALIDE').length;
    const completed = catTasks.filter((t) => t.status === 'TERMINE').length;
    const inProgress = catTasks.filter((t) => t.status === 'EN COURS').length;
    const notCompleted = catTasks.filter((t) => t.status === 'NON TERMINE').length;
    const rate = total > 0 ? Math.round((validated / total) * 100) : 0;

    return {
      ...cat,
      total,
      validated,
      completed,
      inProgress,
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

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 shrink-0 font-mono">
            <div>
              <div className="text-xs text-slate-400">Taux Validé Présidence</div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-800">27 - 30 Août 2026</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                VALIDE (Accompli)
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Journée de l'Excellence — Nouveau Standard
            </div>
            <p className="text-xs text-slate-600">
              30 lauréats Borgou primés, 400 élèves dotés en fournitures (Nikki, Kalalé, Sinendé, Bembèrèkè), couverture médias nationale.
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
              Lancement "Conversations Inspirantes"
            </div>
            <p className="text-xs text-slate-600">
              Lancement solennel, 74 participants certifiés pour la cohorte 1, forte participation féminine ({'>'}40%).
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
              Sortie de la Cohorte 2 "Conversations Inspirantes"
            </div>
            <p className="text-xs text-slate-600">
              Certification de 50 nouveaux jeunes, rapport d'impact et évaluation de la satisfaction.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-700">T4 (Novembre 2026)</span>
              <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                Replanifié
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Plateforme Hystérésis Academia
            </div>
            <p className="text-xs text-slate-600">
              Lancement public et objectif contractuel de générer au moins 750 000 FCFA de revenus à la Fondation.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-700">T4 (Oct-Déc 2026)</span>
              <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                Replanifié
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Projet Kokari — Centre Bilingue Parakou
            </div>
            <p className="text-xs text-slate-600">
              Mise en état du site, modèle d'exploitation, recrutement pédagogique et inauguration.
            </p>
          </div>

          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-800">Décembre 2026</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                En bonne voie
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              Mobilisation 100 000 000 FCFA
            </div>
            <p className="text-xs text-slate-600">
              78 000 000 FCFA sécurisés à ce jour, solde de 22M à finaliser sur les accords de fin d'année.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Suivi des Primes de Performance et Historique Mensuel */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Évolution Mensuelle & Primes de Performance de Mars à Décembre
            </h2>
            <p className="text-xs text-slate-500">
              Tableau synoptique des pourcentages d'avancement mensuels et primes associées.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('canevas')}
            className="text-xs font-semibold text-slate-900 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Accéder au Canevas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Mois</th>
                <th className="py-2.5 px-3 text-center">Tâches Prévues</th>
                <th className="py-2.5 px-3 text-center">Validées (1 pt)</th>
                <th className="py-2.5 px-3 text-center">Terminées DE</th>
                <th className="py-2.5 px-3 font-mono text-right">Taux Validé</th>
                <th className="py-2.5 px-3 font-mono text-right">Taux Provisoire</th>
                <th className="py-2.5 px-4 font-mono text-right">Prime Validée (FCFA)</th>
                <th className="py-2.5 px-4 font-mono text-right">Prime Prévisionnelle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                const s = allMonthlyStats[m];
                if (!s) return null;
                const isQ4 = m >= 10;

                return (
                  <tr key={m} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-900 flex items-center gap-1.5">
                      <span>{s.monthName}</span>
                      {m === 7 && (
                        <span className="text-[10px] font-sans bg-slate-200 px-1 py-0.5 rounded text-slate-800">
                          Modèle
                        </span>
                      )}
                      {isQ4 && (
                        <span className="text-[10px] font-sans bg-amber-100 px-1 py-0.5 rounded text-amber-800">
                          Replanifié T4
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-600 font-bold">
                      {s.totalTasks}
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">
                      {s.validatedTasks}
                    </td>
                    <td className="py-2.5 px-3 text-center text-blue-700">
                      {s.completedTasks}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      {s.officialEvolutionRate}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600">
                      {s.provisionalEvolutionRate}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
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
      </div>
    </div>
  );
};
