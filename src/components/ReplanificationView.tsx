/**
 * ReplanificationView — Module exécutif de replanification T4 (Octobre - Décembre 2026)
 * Rebascule automatique et ordonnée de toutes les activités non finalisées au 30 septembre 2026
 */

import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import { MONTH_NAMES } from '../data/initialTasks';
import { TaskItem } from '../types';
import {
  CalendarRange,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Flag,
} from 'lucide-react';

export const ReplanificationView: React.FC = () => {
  const { tasks, replanifyTask, batchReplanifyUnfinishedToQ4 } = useTracker();

  const [selectedTargetMonth, setSelectedTargetMonth] = useState<{ [taskId: string]: number }>({});
  const [globalReason, setGlobalReason] = useState<string>(
    "Replanification d'office suite à la priorité accordée à la Journée de l'Excellence et aux jalons T3"
  );

  // Activités de Mars à Septembre non terminées (NON TERMINE ou EN COURS)
  const unfinishedTasksT1T3 = tasks.filter(
    (t) => t.month >= 3 && t.month <= 9 && t.status !== 'VALIDE' && t.status !== 'TERMINE'
  );

  // Activités déjà replanifiées vers T4
  const alreadyReplanifiedTasks = tasks.filter(
    (t) => t.month >= 10 && t.month <= 12 && t.replanifiedToMonth
  );

  // Jalons sanctuarisés et dates clés
  const lockedMilestones = [
    {
      title: "Lancement 2e cohorte 'Conversations Inspirantes'",
      date: '6 Juin 2026',
      status: 'Accompli & Validé',
      details: '74 participants certifiés. Cadrage préalable : mail du sam. 30 mai à la pdh et commentaires.',
    },
    {
      title: "Mise en conformité au Registre des Associations (Portail National des Services)",
      date: '30 Juin & 31 Août 2026 (Attestation : 1er Septembre 2026)',
      status: 'Accompli & Validé',
      details: '1er dépôt le 30/06, 2e demande le 31/08. Attestation officielle délivrée le 1er septembre 2026.',
    },
    {
      title: "Journée de l'Excellence — Nouveau Standard",
      date: '28 - 30 Août 2026',
      status: 'Accompli & Validé',
      details: 'Tenue effective à Parakou : 30 lauréats Borgou primés, 400 élèves dotés de kits scolaires.',
    },
    {
      title: "Sortie de la 2e Cohorte 'Conversations Inspirantes'",
      date: '24 Octobre 2026',
      status: 'Jalon Contractuel T4',
      details: 'Cérémonie de remise des diplômes, au moins 50 lauréats certifiés, parité femmes respectée.',
    },
    {
      title: "Lancement de la 3e Cohorte 'Conversations Inspirantes' (PCI3)",
      date: '26 Octobre 2026',
      status: 'Jalon Contractuel T4',
      details: 'Appel à candidatures officiel pour la cohorte 3 ; proclamation des résultats le 13 novembre 2026.',
    },
    {
      title: "Prochain Conseil d'Administration (CA)",
      date: '31 Octobre 2026',
      status: 'Session Statutaire T4',
      details: 'Examen des performances T1-T3, présentation de l\'Attestation du 01/09 et feuille de route T4.',
    },
    {
      title: "Proclamation des résultats de la 3e Cohorte (PCI3)",
      date: '13 Novembre 2026',
      status: 'Jalon Contractuel T4',
      details: 'Délibération du jury et proclamation officielle des lauréats sélectionnés pour PCI3.',
    },
    {
      title: "Mobilisation des 100M FCFA étalée sur le T4",
      date: 'Octobre à Décembre 2026',
      status: 'Trajectoire COP T4',
      details: '0 FCFA mobilisé jusqu\'ici. Étalement COP : 25M en Octobre, 35M en Novembre, 40M en Décembre.',
    },
  ];

  const handleBatchAutoReplan = () => {
    if (unfinishedTasksT1T3.length === 0) {
      alert("Toutes les activités de mars à septembre sont déjà finalisées ou replanifiées !");
      return;
    }

    const distribution: { [taskId: string]: number } = {};
    // Répartition équilibrée intelligente vers Octobre, Novembre, Décembre
    unfinishedTasksT1T3.forEach((t, idx) => {
      // 10 = Octobre, 11 = Novembre, 12 = Décembre
      const targetMonth = 10 + (idx % 3);
      distribution[t.id] = targetMonth;
    });

    batchReplanifyUnfinishedToQ4(distribution, globalReason);
  };

  const handleSingleReplan = (task: TaskItem) => {
    const target = selectedTargetMonth[task.id] || 10;
    replanifyTask(task.id, target, globalReason);
  };

  return (
    <div className="space-y-6">
      {/* 1. En-tête de la Replanification */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider">
              <CalendarRange className="w-4 h-4" />
              <span>Matrice de Replanification Stratégique T4</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Replanification de Mars à Décembre 2026
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Conformément aux directives de performance, l'ensemble des activités non finalisées jusqu'en fin septembre 2026 sont redirigées d'octobre à décembre 2026. Les jalons majeurs atteints (Journée de l'Excellence, Conversations Inspirantes) demeurent sanctuarisés.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchAutoReplan}
              disabled={unfinishedTasksT1T3.length === 0}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
                unfinishedTasksT1T3.length > 0
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replanifier automatiquement vers T4 ({unfinishedTasksT1T3.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Jalons Majeurs Sanctuarisés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {lockedMilestones.map((m, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${
              idx === 2
                ? 'bg-amber-50/60 border-amber-200'
                : 'bg-emerald-50/60 border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-bold text-slate-600">{m.date}</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  idx === 2
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-emerald-200 text-emerald-900'
                }`}
              >
                {m.status}
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 mt-2">{m.title}</h2>
            <p className="text-xs text-slate-600 mt-1">{m.details}</p>
          </div>
        ))}
      </div>

      {/* 3. Activités de Mars à Septembre à Replanifier */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Activités non réalisées au 30 septembre 2026 ({unfinishedTasksT1T3.length})
            </h2>
            <p className="text-xs text-slate-500">
              Activités en cours ou non terminées programmées initialement entre Mars et Septembre.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Motif par défaut :</span>
            <input
              type="text"
              value={globalReason}
              onChange={(e) => setGlobalReason(e.target.value)}
              className="text-xs px-2.5 py-1 border border-slate-200 rounded-lg w-72 bg-white text-slate-900"
            />
          </div>
        </div>

        {unfinishedTasksT1T3.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-900">
              Toutes les activités des mois de mars à septembre ont été traitées !
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Les activités reportées sont désormais planifiées sur le 4ème trimestre (Octobre - Décembre 2026).
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {unfinishedTasksT1T3.map((task) => (
              <div
                key={task.id}
                className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      Mois initial : {MONTH_NAMES[task.month]}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-medium text-slate-700">
                      {task.programmePta}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        task.status === 'EN COURS'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {task.activity}
                  </div>
                  <div className="text-xs text-slate-500">
                    Résultat attendu : {task.expectedResult}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={selectedTargetMonth[task.id] || 10}
                    onChange={(e) =>
                      setSelectedTargetMonth((prev) => ({
                        ...prev,
                        [task.id]: parseInt(e.target.value, 10),
                      }))
                    }
                    className="text-xs p-1.5 border border-slate-200 rounded-lg bg-white text-slate-900 font-medium"
                  >
                    <option value={10}>Octobre 2026</option>
                    <option value={11}>Novembre 2026</option>
                    <option value={12}>Décembre 2026</option>
                  </select>

                  <button
                    onClick={() => handleSingleReplan(task)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Déplacer vers T4</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Agenda Replanifié du 4ème Trimestre (Octobre, Novembre, Décembre) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[10, 11, 12].map((m) => {
          const q4Tasks = tasks.filter((t) => t.month === m);
          const completedCount = q4Tasks.filter((t) => t.status === 'VALIDE' || t.status === 'TERMINE').length;

          return (
            <div key={m} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
              <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{MONTH_NAMES[m]}</h3>
                  <div className="text-xs text-slate-500">
                    {q4Tasks.length} activités au total
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs text-slate-500">Progression</div>
                  <div className="text-sm font-bold text-slate-900">
                    {completedCount} / {q4Tasks.length}
                  </div>
                </div>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-96">
                {q4Tasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    Aucune activité programmée.
                  </p>
                ) : (
                  q4Tasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold text-slate-700">
                          {t.programmePta}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            t.status === 'VALIDE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'TERMINE'
                              ? 'bg-blue-100 text-blue-800'
                              : t.status === 'EN COURS'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-slate-900 leading-snug">
                        {t.activity}
                      </div>
                      {t.report && t.report !== 'Aucun' && (
                        <div className="text-[10px] text-amber-800 bg-amber-50 p-1 rounded">
                          {t.report}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
