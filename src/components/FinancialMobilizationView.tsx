/**
 * FinancialMobilizationView — Trajectoire de mobilisation des 100 000 000 FCFA
 * Alignée sur le Domaine D du COP et le canevas de suivi financier
 */

import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import { MONTH_NAMES } from '../data/initialTasks';
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  FileText,
  CheckCircle,
  Plus,
  ShieldCheck,
  Building,
} from 'lucide-react';

interface PartnerContractItem {
  id: string;
  partnerName: string;
  nature: string;
  amount: number;
  signedDate: string;
  status: 'Signé & Encaissé' | 'Convention Signée' | 'En Négociation';
  copLink: string;
}

const INITIAL_CONTRACTS: PartnerContractItem[] = [
  {
    id: 'c1',
    partnerName: 'Fondation Éducation Sans Frontières',
    nature: 'Subvention directe',
    amount: 15000000,
    signedDate: 'Juin 2026',
    status: 'Signé & Encaissé',
    copLink: 'D/OS2 & OO2',
  },
  {
    id: 'c2',
    partnerName: 'Groupe Bâtisseurs du Futur',
    nature: 'Mécénat Journée de l’Excellence',
    amount: 12500000,
    signedDate: 'Juin 2026',
    status: 'Signé & Encaissé',
    copLink: 'D/OS2 & OO2',
  },
  {
    id: 'c3',
    partnerName: 'Librairies Unies Bénin',
    nature: 'Dotation 400 kits scolaires en nature',
    amount: 4000000,
    signedDate: 'Juillet 2026',
    status: 'Signé & Encaissé',
    copLink: 'D/OO1',
  },
  {
    id: 'c4',
    partnerName: 'Consortium Partenaires Borgou',
    nature: 'Appui événementiel & hébergement',
    amount: 11000000,
    signedDate: 'Août 2026',
    status: 'Signé & Encaissé',
    copLink: 'D/OS2 & OO2',
  },
  {
    id: 'c5',
    partnerName: 'Fonds d’Insertion Jeunesse & Numérique',
    nature: 'Subvention Conversations Inspirantes',
    amount: 9500000,
    signedDate: 'Septembre 2026',
    status: 'Signé & Encaissé',
    copLink: 'D/OS2 & OO2',
  },
  {
    id: 'c6',
    partnerName: 'Coopération Internationale pour l’Éducation',
    nature: 'Financement Centre Kokari Parakou',
    amount: 15000000,
    signedDate: 'Octobre 2026 (En cours)',
    status: 'Convention Signée',
    copLink: 'D/OS2 & OO2',
  },
  {
    id: 'c7',
    partnerName: 'Réseau Entreprises Solidaires Bénin',
    nature: 'Mécénat de compétences & stages',
    amount: 5000000,
    signedDate: 'Novembre 2026',
    status: 'En Négociation',
    copLink: 'D/OO2',
  },
  {
    id: 'c8',
    partnerName: 'Donateurs Privés & Mécènes Individuels',
    nature: 'Campagne de dons réguliers',
    amount: 6000000,
    signedDate: 'En continu',
    status: 'Signé & Encaissé',
    copLink: 'D/OS2',
  },
];

export const FinancialMobilizationView: React.FC = () => {
  const { tasks } = useTracker();
  const [contracts, setContracts] = useState<PartnerContractItem[]>(INITIAL_CONTRACTS);

  const targetAmount = 100000000; // 100 Millions FCFA

  // Calcul du montant total mobilisé par les contrats validés
  const securedAmount = contracts
    .filter((c) => c.status === 'Signé & Encaissé' || c.status === 'Convention Signée')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalCollectedCash = contracts
    .filter((c) => c.status === 'Signé & Encaissé')
    .reduce((sum, c) => sum + c.amount, 0);

  const percentageSecured = Math.round((securedAmount / targetAmount) * 100);
  const remainingToMobilize = targetAmount - securedAmount;

  // Étalement prévisionnel par mois de Mars à Décembre
  const monthlyBreakdown = [
    { month: 'Mars', target: 5000000, realized: 3000000, cumTarget: 5000000, cumReal: 3000000 },
    { month: 'Avril', target: 7000000, realized: 5000000, cumTarget: 12000000, cumReal: 8000000 },
    { month: 'Mai', target: 8000000, realized: 7000000, cumTarget: 20000000, cumReal: 15000000 },
    { month: 'Juin', target: 12000000, realized: 12500000, cumTarget: 32000000, cumReal: 27500000 },
    { month: 'Juillet', target: 15000000, realized: 15000000, cumTarget: 47000000, cumReal: 42500000 },
    { month: 'Août', target: 11000000, realized: 11000000, cumTarget: 58000000, cumReal: 53500000 },
    { month: 'Septembre', target: 10000000, realized: 9500000, cumTarget: 68000000, cumReal: 63000000 },
    { month: 'Octobre', target: 12000000, realized: 15000000, cumTarget: 80000000, cumReal: 78000000 },
    { month: 'Novembre', target: 10000000, realized: 0, cumTarget: 90000000, cumReal: 78000000 },
    { month: 'Décembre', target: 10000000, realized: 0, cumTarget: 100000000, cumReal: 78000000 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Synthèse de l'Objectif COP D/OS2 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>Domaine D — Mobilisation Bailleurs & Partenaires</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Trajectoire de Mobilisation des 100 000 000 FCFA
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Suivi de l'étalement budgétaire jusqu'au 31 décembre 2026, couverture des prestations du Directeur Exécutif (juin-décembre), et concrétisation des 15 partenariats contractuels.
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">Taux d'engagement global</div>
            <div className="text-3xl font-bold font-mono text-emerald-700 mt-0.5">
              {percentageSecured}%
            </div>
            <div className="text-[11px] text-slate-500">du cap des 100M sécurisé</div>
          </div>
        </div>

        {/* Barre de progression visuelle */}
        <div className="mt-6">
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-600 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, percentageSecured)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-600 mt-2">
            <span>Sécurisé : {securedAmount.toLocaleString('fr-FR')} FCFA</span>
            <span>Objectif COP : 100 000 000 FCFA</span>
          </div>
        </div>
      </div>

      {/* 2. Cartouches d'indicateurs financiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Fonds Sécurisés / Engagés</div>
          <div className="text-2xl font-bold font-mono text-emerald-800 mt-1">
            {securedAmount.toLocaleString('fr-FR')} F
          </div>
          <div className="text-xs text-emerald-600 mt-1">
            Dont {totalCollectedCash.toLocaleString('fr-FR')} F déjà encaissés
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Solde à mobiliser T4</div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {Math.max(0, remainingToMobilize).toLocaleString('fr-FR')} F
          </div>
          <div className="text-xs text-slate-500 mt-1">
            À boucler avant le 31 décembre 2026
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Contrats de Partenariats Signés</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {contracts.filter((c) => c.status !== 'En Négociation').length} / 15
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Objectif COP Article 2.D.OO2 ($\ge 15$ contrats)
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 bg-slate-900 text-white">
          <div className="text-xs text-slate-300 font-medium flex items-center justify-between">
            <span>Prestations DE (Juin-Déc.)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            Sécurisées & Validées
          </div>
          <div className="text-xs text-slate-300 mt-1">
            Conformément à l'échéance Mai 2026 du COP
          </div>
        </div>
      </div>

      {/* 3. Tableau d'Étalement Mensuel et Trimestriel de Mars à Décembre */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            Étalement Prévisionnel & Réalisations Mensuelles (Mars à Décembre 2026)
          </h2>
          <p className="text-xs text-slate-500">
            Ventilation progressive de la mobilisation financière et cumul par trimestre.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Mois 2026</th>
                <th className="py-2.5 px-4 font-mono text-right">Objectif du Mois (FCFA)</th>
                <th className="py-2.5 px-4 font-mono text-right">Réalisé / Engagé (FCFA)</th>
                <th className="py-2.5 px-4 font-mono text-right">Objectif Cumulé</th>
                <th className="py-2.5 px-4 font-mono text-right">Réalisé Cumulé</th>
                <th className="py-2.5 px-4 text-center">Statut Trimestre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {monthlyBreakdown.map((row, idx) => {
                const isReached = row.cumReal >= row.cumTarget;
                const isCurrentQ = idx >= 7;

                return (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                      {row.month} 2026
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-600">
                      {row.target.toLocaleString('fr-FR')} F
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-800">
                      {row.realized.toLocaleString('fr-FR')} F
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-500">
                      {row.cumTarget.toLocaleString('fr-FR')} F
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                      {row.cumReal.toLocaleString('fr-FR')} F
                    </td>
                    <td className="py-2.5 px-4 text-center font-sans">
                      {idx < 7 ? (
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          Jalon validé
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 font-semibold">
                          En cours (T4)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Répertoire des Contrats de Partenariat Signés & en Cours */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Registre des Partenariats & Mécénats (Objectif COP : $\ge 15$)
            </h2>
            <p className="text-xs text-slate-500">
              Conventions signées pour les activités, le projet Kokari et les fournitures scolaires.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {contracts.map((c) => (
            <div
              key={c.id}
              className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{c.partnerName}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500 font-mono">{c.signedDate}</span>
                </div>
                <div className="text-slate-600">
                  {c.nature} (Réf COP : {c.copLink})
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 font-mono">
                <div className="text-right">
                  <div className="font-bold text-slate-900">
                    {c.amount.toLocaleString('fr-FR')} FCFA
                  </div>
                  <div
                    className={`text-[10px] font-sans font-semibold ${
                      c.status === 'Signé & Encaissé'
                        ? 'text-emerald-700'
                        : c.status === 'Convention Signée'
                        ? 'text-blue-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {c.status}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
