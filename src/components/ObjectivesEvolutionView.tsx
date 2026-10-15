/**
 * ObjectivesEvolutionView.tsx — Analyse de l'évolution mois après mois des Objectifs Stratégiques (OS)
 * et Opérationnels (OO), cumul de mois en mois et statut à date des tâches (reports / replanifications).
 * Fondation HYSTERESIS
 */

import React, { useState, useMemo } from 'react';
import { useTracker } from '../context/TrackerContext';
import { COP_CATEGORIES, MONTH_NAMES } from '../data/initialTasks';
import { CopCategoryKey, TaskItem } from '../types';
import { getTaskDateAndStatusInfo } from '../utils/performanceStats';
import {
  Target,
  Layers,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CalendarRange,
  RotateCcw,
  ShieldCheck,
  Award,
} from 'lucide-react';

export const ObjectivesEvolutionView: React.FC<{
  onNavigateToMonth?: (month: number) => void;
}> = ({ onNavigateToMonth }) => {
  const {
    tasks,
    initialAnnualTotalTasks,
    cumulativeMonthlyStats,
    strategicObjectivesEvolution,
    operationalObjectivesEvolution,
    setCurrentMonth,
    role,
    toggleRole,
    isCollaborativeSyncActive,
    lastSyncedAt,
    lastSyncAuthor,
  } = useTracker();

  const [activeViewMode, setActiveViewMode] = useState<'cumulative' | 'strategic' | 'operational' | 'tasksDateStatus'>('cumulative');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedItems, setExpandedItems] = useState<{ [id: string]: boolean }>({});

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtrage des OS
  const filteredStrategic = useMemo(() => {
    return strategicObjectivesEvolution.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [strategicObjectivesEvolution, selectedCategory, searchQuery]);

  // Filtrage des OO
  const filteredOperational = useMemo(() => {
    return operationalObjectivesEvolution.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [operationalObjectivesEvolution, selectedCategory, searchQuery]);

  // Filtrage des tâches avec date initiale et statut à date
  const filteredTasksWithDateStatus = useMemo(() => {
    return tasks
      .map((t) => ({ task: t, dateInfo: getTaskDateAndStatusInfo(t) }))
      .filter(({ task, dateInfo }) => {
        if (selectedCategory !== 'ALL' && task.copCategory !== selectedCategory) return false;
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'REPORTE' && dateInfo.statusToDate !== 'REPORTE') return false;
          if (statusFilter === 'REPLANIFIE' && dateInfo.statusToDate !== 'REPLANIFIE') return false;
          if (statusFilter === 'VALIDE' && dateInfo.statusToDate !== 'VALIDE') return false;
          if (statusFilter === 'TERMINE' && dateInfo.statusToDate !== 'TERMINE') return false;
          if (statusFilter === 'NON_TERMINE' && dateInfo.statusToDate !== 'NON_TERMINE') return false;
          if (statusFilter === 'A_PLANIFIER' && dateInfo.statusToDate !== 'A_PLANIFIER') return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            task.activity.toLowerCase().includes(q) ||
            task.programmePta.toLowerCase().includes(q) ||
            task.strategicObjective.toLowerCase().includes(q) ||
            (task.report && task.report.toLowerCase().includes(q)) ||
            (task.observations && task.observations.toLowerCase().includes(q))
          );
        }
        return true;
      });
  }, [tasks, selectedCategory, statusFilter, searchQuery]);

  // Statistiques globales de synthèse
  const totalTasksNow = tasks.length;
  const totalValidatedNow = tasks.filter((t) => t.status === 'VALIDE').length;
  const totalCompletedNow = tasks.filter((t) => t.status === 'TERMINE').length;
  const totalReportedNow = tasks.filter((t) => {
    const info = getTaskDateAndStatusInfo(t);
    return info.statusToDate === 'REPORTE' || info.statusToDate === 'REPLANIFIE';
  }).length;
  const globalValidatedRate = Math.round((totalValidatedNow / totalTasksNow) * 1000) / 10;

  return (
    <div className="space-y-6">
      {/* 1. Bandeau Institutionnel — Nombre global en début d'année et synchronisation */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-800 rounded-md text-xs text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contrat d'Objectifs & de Performance · Cadrage Initial PTA 2026</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Progression Cumulée & Évolution des Objectifs (OS / OO)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Pilotage plurimensuel : <strong>Nombre global de tâches en début d'année (235 tâches)</strong>, cumul de mois en mois, trajectoire d'exécution des Objectifs Stratégiques & Opérationnels, et suivi rigoureux des reports et replanifications.
            </p>
          </div>

          {/* Cartes Métriques Début d'année & Cumul */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 font-mono">
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <div className="text-[11px] text-slate-400">Total début d'année</div>
              <div className="text-2xl font-bold text-white mt-0.5">
                {initialAnnualTotalTasks}
              </div>
              <div className="text-[10px] text-slate-400">Tâches prévues PTA</div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <div className="text-[11px] text-slate-400">Validées à date</div>
              <div className="text-2xl font-bold text-emerald-400 mt-0.5">
                {totalValidatedNow}
              </div>
              <div className="text-[10px] text-emerald-500">Taux global : {globalValidatedRate}%</div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <div className="text-[11px] text-slate-400">Terminées DE</div>
              <div className="text-2xl font-bold text-blue-400 mt-0.5">
                {totalCompletedNow}
              </div>
              <div className="text-[10px] text-blue-300">Visas attendus</div>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <div className="text-[11px] text-slate-400">Reports / Replanifiés</div>
              <div className="text-2xl font-bold text-amber-400 mt-0.5">
                {totalReportedNow}
              </div>
              <div className="text-[10px] text-amber-300">Ajustements T4</div>
            </div>
          </div>
        </div>

        {/* Barre de statut collaboratif en direct */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Synchronisation collaborative active :{' '}
              <strong className="text-white">
                {lastSyncAuthor ? `Dernier ajustement par ${lastSyncAuthor}` : 'Tous les collaborateurs synchronisés'}
              </strong>
              {lastSyncedAt ? ` à ${lastSyncedAt}` : ''}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleRole}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              role === 'PRESIDENTE'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title="Cliquer pour basculer rapidement entre la vue Directeur Exécutif et Présidente"
          >
            <span>{role === 'PRESIDENTE' ? '👑 Mode Présidente (PDH)' : '👔 Mode Dir. Exécutif'}</span>
            <span className="text-[10px] underline font-normal">(Basculer)</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation par Onglets Spécialisés */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveViewMode('cumulative')}
            className={`px-3 py-1.5 rounded-md cursor-pointer transition-all whitespace-nowrap ${
              activeViewMode === 'cumulative'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cumul de Mois en Mois (Mars - Déc)
          </button>
          <button
            onClick={() => setActiveViewMode('strategic')}
            className={`px-3 py-1.5 rounded-md cursor-pointer transition-all whitespace-nowrap ${
              activeViewMode === 'strategic'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Objectifs Stratégiques (OS)
          </button>
          <button
            onClick={() => setActiveViewMode('operational')}
            className={`px-3 py-1.5 rounded-md cursor-pointer transition-all whitespace-nowrap ${
              activeViewMode === 'operational'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Objectifs Opérationnels (OO)
          </button>
          <button
            onClick={() => setActiveViewMode('tasksDateStatus')}
            className={`px-3 py-1.5 rounded-md cursor-pointer transition-all whitespace-nowrap ${
              activeViewMode === 'tasksDateStatus'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Date Initiale & Statut à Date ({filteredTasksWithDateStatus.length})
          </button>
        </div>

        {/* Filtres de catégorie COP */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700 text-xs focus:outline-none"
          >
            <option value="ALL">Tous les domaines COP (A, B, C, D)</option>
            {COP_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.code} — {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* --- VUE 1 : CUMUL DE MOIS EN MOIS (MARS À DÉCEMBRE) --- */}
      {activeViewMode === 'cumulative' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Tableau Analytique de Cumul de Mois en Mois & Pourcentages d'Évolution
              </h2>
              <p className="text-xs text-slate-500">
                Suivi du volume prévu au budget initial (235 tâches), du cumul progressif des validations et de la progression mensuelle.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200">
              Base de prime mensuelle : 150 000 FCFA
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Mois</th>
                  <th className="py-2.5 px-2.5 text-center">Tâches Prévues</th>
                  <th className="py-2.5 px-2.5 text-center font-bold text-indigo-900 bg-indigo-50/50">
                    Cumul Prévu (sur {initialAnnualTotalTasks})
                  </th>
                  <th className="py-2.5 px-2.5 text-center text-indigo-700">
                    % Cumul Annuel
                  </th>
                  <th className="py-2.5 px-2.5 text-center text-slate-600">
                    Évol. Volume Mois (%)
                  </th>
                  <th className="py-2.5 px-2.5 text-center text-emerald-800">Validées (1 pt)</th>
                  <th className="py-2.5 px-2.5 text-center font-bold text-emerald-900 bg-emerald-50/50">
                    Cumul Validé
                  </th>
                  <th className="py-2.5 px-2.5 text-center text-blue-700">Terminées DE</th>
                  <th className="py-2.5 px-3 font-mono text-right text-slate-900">Taux Mois (%)</th>
                  <th className="py-2.5 px-3 font-mono text-right font-bold text-emerald-700 bg-emerald-50/30">
                    Taux Cumulé (%)
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
                  const isCurrent = s.month === 9;
                  const isPositiveDelta = s.evolutionDeltaVsPrevMonth >= 0;
                  const isPositiveVol = s.volumeGrowthRateVsPrevMonth >= 0;

                  return (
                    <tr
                      key={s.month}
                      className={`hover:bg-slate-50 transition-colors ${
                        isCurrent ? 'bg-blue-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-900 flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setCurrentMonth(s.month);
                            if (onNavigateToMonth) onNavigateToMonth(s.month);
                          }}
                          className="hover:underline text-left font-bold text-slate-900 cursor-pointer"
                        >
                          {s.monthName}
                        </button>
                        {isCurrent && (
                          <span className="text-[10px] font-sans bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                            Actuel
                          </span>
                        )}
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
                      <td className="py-2.5 px-2.5 text-center text-blue-700">
                        {s.completedTasks}
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
        </div>
      )}

      {/* --- VUE 2 : PROGRESSION MOIS APRÈS MOIS DES OBJECTIFS STRATÉGIQUES (OS) --- */}
      {activeViewMode === 'strategic' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Évolution Mois après Mois par Objectif Stratégique (OS)
              </h2>
              <p className="text-xs text-slate-500">
                Trajectoire d'avancement, volume de tâches initial en début d'année et progression mensuelle de chaque axe stratégique.
              </p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher un OS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-md focus:outline-none w-56"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredStrategic.map((os) => {
              const isExpanded = expandedItems[os.id] !== false; // Déplié par défaut

              return (
                <div key={os.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div
                    onClick={() => toggleExpand(os.id)}
                    className="p-4 bg-slate-50/70 hover:bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="space-y-1 max-w-3xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {os.category}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {os.totalInitialTasks} tâches prévues au budget
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {os.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 font-mono">
                      <div>
                        <div className="text-[11px] text-slate-500 text-right">Taux Exécution</div>
                        <div className="text-lg font-bold text-emerald-700 text-right">
                          {os.globalRate}%
                        </div>
                      </div>
                      <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden shrink-0 hidden sm:block">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{ width: `${os.globalRate}%` }}
                        />
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 space-y-3 overflow-x-auto">
                      <div className="text-xs font-bold text-slate-700 mb-2">
                        Grille d'évolution mois après mois (Mars à Décembre 2026) :
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 text-center text-xs">
                        {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                          const mb = os.monthlyBreakdown[m];
                          if (!mb) return null;
                          const hasPlanned = mb.planned > 0;
                          const hasVal = mb.validated > 0;

                          return (
                            <div
                              key={m}
                              className={`p-2 rounded-lg border font-mono ${
                                m === 9
                                  ? 'bg-blue-50/70 border-blue-300'
                                  : hasVal
                                  ? 'bg-emerald-50/40 border-emerald-200'
                                  : hasPlanned
                                  ? 'bg-slate-50 border-slate-200'
                                  : 'bg-white border-slate-100 text-slate-400'
                              }`}
                            >
                              <div className="font-sans font-bold text-[11px] text-slate-800">
                                {mb.monthName}
                              </div>
                              <div className="text-[11px] font-bold text-slate-900 mt-1">
                                {mb.validated} / {mb.planned}
                              </div>
                              <div className="text-[10px] text-emerald-700 font-bold">
                                {mb.monthlyRate}%
                              </div>
                              <div className="text-[9px] text-slate-500 mt-1 pt-1 border-t border-slate-200/60">
                                Cumul : {mb.cumulativeRate}%
                              </div>
                              {mb.evolutionDelta !== 0 && (
                                <div className={`text-[9px] font-bold ${mb.evolutionDelta > 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
                                  Δ {mb.evolutionDelta > 0 ? '+' : ''}{mb.evolutionDelta}%
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- VUE 3 : PROGRESSION MOIS APRÈS MOIS DES OBJECTIFS OPÉRATIONNELS (OO) --- */}
      {activeViewMode === 'operational' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Évolution Détaillée par Objectif Opérationnel (OO)
              </h2>
              <p className="text-xs text-slate-500">
                Suivi fin des {operationalObjectivesEvolution.length} objectifs opérationnels du PTA 2026.
              </p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher un OO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-md focus:outline-none w-56"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredOperational.map((oo) => (
              <div key={oo.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                      {oo.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {oo.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 font-mono shrink-0">
                    <span className="text-xs text-slate-600">
                      {oo.globalValidated} / {oo.totalInitialTasks} validés
                    </span>
                    <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {oo.globalRate}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 text-center text-xs">
                  {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                    const mb = oo.monthlyBreakdown[m];
                    if (!mb) return null;
                    return (
                      <div
                        key={m}
                        className={`p-1.5 rounded border font-mono ${
                          mb.validated > 0
                            ? 'bg-emerald-50 border-emerald-200'
                            : mb.planned > 0
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-white border-slate-100 text-slate-400'
                        }`}
                      >
                        <div className="text-[10px] font-sans font-bold text-slate-700">
                          {mb.monthName}
                        </div>
                        <div className="text-[11px] font-bold text-slate-900">
                          {mb.validated}/{mb.planned}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-bold">
                          {mb.monthlyRate}%
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5 pt-0.5 border-t border-slate-200/60">
                          Cumul {mb.cumulativeRate}%
                        </div>
                        {mb.evolutionDelta !== 0 && (
                          <div className={`text-[9px] font-bold ${mb.evolutionDelta > 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
                            Δ {mb.evolutionDelta > 0 ? '+' : ''}{mb.evolutionDelta}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- VUE 4 : DATE INITIALE & STATUT À DATE (REPORT OU REPLANIFIÉ) --- */}
      {activeViewMode === 'tasksDateStatus' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Registre des Dates Initiales & Statuts à Date (Reports & Replanifications)
              </h2>
              <p className="text-xs text-slate-500">
                Permet de voir la date initiale prévue en début d'année pour chaque tâche et son statut à date (reporté, replanifié T4, etc.).
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Sélecteur de statut */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 text-xs focus:outline-none"
              >
                <option value="ALL">Tous les statuts à date</option>
                <option value="REPORTE">Reporté à date</option>
                <option value="REPLANIFIE">Replanifié T4</option>
                <option value="VALIDE">Validé PDH (1 pt)</option>
                <option value="TERMINE">Terminé DE (1 pt DE)</option>
                <option value="A_PLANIFIER">À planifier</option>
                <option value="NON_TERMINE">Non terminé</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrer tâche, motif..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-md focus:outline-none w-52"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4 min-w-[260px]">Tâche / Activité PTA</th>
                  <th className="py-2.5 px-3 min-w-[130px]">Programme PTA</th>
                  <th className="py-2.5 px-3 min-w-[120px] font-mono">Date Initiale (Début d'année)</th>
                  <th className="py-2.5 px-3 min-w-[140px] font-mono">Échéance à Date</th>
                  <th className="py-2.5 px-3 min-w-[150px] text-center">Statut à Date</th>
                  <th className="py-2.5 px-4 min-w-[240px]">Motif du Report / Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasksWithDateStatus.map(({ task, dateInfo }) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900 leading-snug">
                        {task.activity.replace(/^Sous-tâche\s*:\s*/i, '')}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Mois d'origine : {MONTH_NAMES[task.month]} · Catégorie : {task.copCategory}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {task.programmePta}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-800 font-bold">
                      {dateInfo.initialDate}
                    </td>

                    <td className="py-2.5 px-3 font-mono">
                      {dateInfo.hasChangedDate ? (
                        <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {dateInfo.currentDate}
                        </span>
                      ) : (
                        <span className="text-slate-600">{dateInfo.currentDate}</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] border ${dateInfo.statusBadge.bgClass} ${dateInfo.statusBadge.textClass} ${dateInfo.statusBadge.borderClass}`}
                      >
                        {dateInfo.statusBadge.label}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-slate-600 text-[11px] leading-tight">
                      {dateInfo.details || 'Aucune observation particulière.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
