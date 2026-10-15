/**
 * FinancialMobilizationView — Trajectoire de mobilisation des 100 000 000 FCFA
 * Alignée sur le Domaine D du COP et le canevas de suivi financier
 * Mise à jour : Gestion 100% manuelle du Pipe des Partenariats Bailleurs (Objectif COP : ≥ 15 Contrats)
 * Liste des entreprises initiales effacée
 * Fondation HYSTERESIS
 */

import React, { useState, useEffect } from 'react';
import { useTracker } from '../context/TrackerContext';
import {
  TrendingUp,
  AlertCircle,
  Clock,
  Plus,
  Building,
  Edit2,
  Trash2,
  X,
  Check,
  RotateCcw,
  Handshake,
} from 'lucide-react';

export interface PartnerContractItem {
  id: string;
  partnerName: string;
  nature: string;
  targetAmount: number;
  realizedAmount: number;
  signedDate: string;
  status: 'Planifié' | 'Prospection' | 'En Négociation' | 'Convention Signée' | 'Signé & Encaissé';
  copLink?: string;
}

const STORAGE_KEY = 'fondation_hysteresis_partner_contracts_manual_v1';

export const FinancialMobilizationView: React.FC = () => {
  const { mobilizedTotalAmount, mobilizationTarget } = useTracker();

  // Initialisation 100% manuelle : liste par défaut vide (toutes les anciennes entreprises effacées)
  const [contracts, setContracts] = useState<PartnerContractItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Erreur lecture localStorage contrats:', e);
    }
    return [];
  });

  // Sauvegarde automatique à chaque modification
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
    } catch (e) {
      console.error('Erreur sauvegarde localStorage contrats:', e);
    }
  }, [contracts]);

  // État du modal d'ajout / modification manuelle
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    partnerName: string;
    nature: string;
    targetAmount: string;
    realizedAmount: string;
    status: 'Planifié' | 'Prospection' | 'En Négociation' | 'Convention Signée' | 'Signé & Encaissé';
    signedDate: string;
    copLink: string;
  }>({
    partnerName: '',
    nature: '',
    targetAmount: '',
    realizedAmount: '0',
    status: 'Prospection',
    signedDate: 'T4 2026',
    copLink: 'D/OS2 & OO2',
  });

  const [formError, setFormError] = useState<string | null>(null);

  const targetAmount = mobilizationTarget || 100000000; // 100 Millions FCFA
  const totalCollectedCash = mobilizedTotalAmount; // 0 FCFA à ce jour
  const remainingToMobilize = targetAmount - totalCollectedCash;
  const percentageSecured = targetAmount > 0 ? Math.round((totalCollectedCash / targetAmount) * 100) : 0;

  // Totaux calculés à partir des contrats saisis manuellement
  const totalManualTarget = contracts.reduce((acc, c) => acc + (Number(c.targetAmount) || 0), 0);
  const totalManualRealized = contracts.reduce((acc, c) => acc + (Number(c.realizedAmount) || 0), 0);
  const signedOrCollectedCount = contracts.filter(
    (c) => c.status === 'Convention Signée' || c.status === 'Signé & Encaissé'
  ).length;

  // Ouvrir le modal pour un nouvel ajout
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      partnerName: '',
      nature: 'Subvention financière',
      targetAmount: '',
      realizedAmount: '0',
      status: 'Prospection',
      signedDate: 'T4 2026',
      copLink: 'D/OS2 & OO2',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Ouvrir le modal pour modifier un partenaire existant
  const handleOpenEdit = (contract: PartnerContractItem) => {
    setEditingId(contract.id);
    setFormData({
      partnerName: contract.partnerName,
      nature: contract.nature,
      targetAmount: contract.targetAmount.toString(),
      realizedAmount: contract.realizedAmount.toString(),
      status: contract.status,
      signedDate: contract.signedDate,
      copLink: contract.copLink || 'D/OS2 & OO2',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Sauvegarder (créer ou modifier)
  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partnerName.trim()) {
      setFormError('Le nom du partenaire ou bailleur est requis.');
      return;
    }

    const targetVal = parseFloat(formData.targetAmount) || 0;
    const realizedVal = parseFloat(formData.realizedAmount) || 0;

    if (editingId) {
      setContracts((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? {
                ...c,
                partnerName: formData.partnerName.trim(),
                nature: formData.nature.trim() || 'Non spécifiée',
                targetAmount: targetVal,
                realizedAmount: realizedVal,
                status: formData.status,
                signedDate: formData.signedDate.trim() || 'T4 2026',
                copLink: formData.copLink.trim(),
              }
            : c
        )
      );
    } else {
      const newContract: PartnerContractItem = {
        id: `contract-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        partnerName: formData.partnerName.trim(),
        nature: formData.nature.trim() || 'Non spécifiée',
        targetAmount: targetVal,
        realizedAmount: realizedVal,
        status: formData.status,
        signedDate: formData.signedDate.trim() || 'T4 2026',
        copLink: formData.copLink.trim(),
      };
      setContracts((prev) => [...prev, newContract]);
    }

    setIsModalOpen(false);
  };

  // Supprimer un partenaire
  const handleDeleteContract = (id: string, name: string) => {
    if (window.confirm(`Confirmez-vous la suppression du partenaire « ${name} » du pipe ?`)) {
      setContracts((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Vider entièrement le pipe
  const handleClearAll = () => {
    if (window.confirm('Voulez-vous effacer l\'ensemble des partenaires du pipe ? Cette action remettra la liste à zéro.')) {
      setContracts([]);
    }
  };

  // Étalement prévisionnel réajusté avec bascule sur le 4ème trimestre (T4 : Octobre à Décembre sur la base du COP)
  const monthlyBreakdown = [
    { month: 'Mars 2026', target: 0, realized: 0, observation: 'Phase de cadrage initial — 0 FCFA encaissé' },
    { month: 'Avril 2026', target: 0, realized: 0, observation: 'Prospection bailleurs — 0 FCFA encaissé' },
    { month: 'Mai 2026', target: 0, realized: 0, observation: 'Cadrage budget DE — 0 FCFA encaissé' },
    { month: 'Juin 2026', target: 0, realized: 0, observation: 'Préparation conventions — 0 FCFA encaissé' },
    { month: 'Juillet 2026', target: 0, realized: 0, observation: 'Soutiens en nature kits scolaires — 0 FCFA en numéraire' },
    { month: 'Août 2026', target: 0, realized: 0, observation: 'Journée Excellence tenue (28-30 août) — 0 FCFA en numéraire' },
    { month: 'Septembre 2026', target: 0, realized: 0, observation: 'Soumission requêtes bailleurs — 0 FCFA encaissé' },
    { month: 'Octobre 2026 (T4)', target: 25000000, realized: 0, observation: 'Étalement COP T4 : Tranche 1 engagée (25 000 000 FCFA)' },
    { month: 'Novembre 2026 (T4)', target: 35000000, realized: 0, observation: 'Étalement COP T4 : Tranche 2 bilatérale (35 000 000 FCFA)' },
    { month: 'Décembre 2026 (T4)', target: 40000000, realized: 0, observation: 'Étalement COP T4 : Clôture objectif 100M COP (40 000 000 FCFA)' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Synthèse de l'Objectif COP D/OS2 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>Domaine D — Mobilisation Bailleurs & Partenaires</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Trajectoire de Mobilisation des 100 000 000 FCFA
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              État réel des ressources : <strong className="text-slate-900 font-mono">0 FCFA mobilisé à ce jour</strong>. Conformément aux arbitrages récents, l'ensemble des cibles de mobilisation financière est officiellement basculé et concentré sur le <strong>4ème trimestre 2026 (Octobre à Décembre)</strong>.
            </p>
          </div>

          <div className="text-right font-mono">
            <div className="text-xs text-slate-500 font-medium">Taux réalisé à ce jour</div>
            <div className="text-3xl font-bold text-slate-900 mt-0.5">
              {percentageSecured}%
            </div>
            <div className="text-[11px] text-amber-700 font-semibold font-sans">0 FCFA encaissé</div>
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
            <span>Encaissé réel : {totalCollectedCash.toLocaleString('fr-FR')} FCFA</span>
            <span>Objectif contractuel COP : 100 000 000 FCFA (Bascule T4)</span>
          </div>
        </div>
      </div>

      {/* 2. Cartouches d'indicateurs financiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Fonds Réellement Encaissés</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {totalCollectedCash.toLocaleString('fr-FR')} F
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Aucun encaissement sur Mars-Septembre
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-amber-700 font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Solde à mobiliser au T4</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-800 mt-1">
            {remainingToMobilize.toLocaleString('fr-FR')} F
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Concentré sur Octobre, Novembre, Décembre
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Pipe Partenariats Saisi</span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Manuel
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {contracts.length} <span className="text-sm font-normal text-slate-500">/ 15</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Objectif COP : ≥ 15 contrats formalisés
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 bg-slate-900 text-white">
          <div className="text-xs text-slate-300 font-medium flex items-center justify-between">
            <span>Prestations DE</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-amber-400 mt-1">
            Replanifié sur T4
          </div>
          <div className="text-xs text-slate-300 mt-1">
            Sécurisation liée au bouclage des levées T4
          </div>
        </div>
      </div>

      {/* 3. Tableau d'Étalement Réajusté avec Bascule T4 */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900">
            Trajectoire Réajustée de Mobilisation (Mars à Décembre 2026)
          </h2>
          <p className="text-xs text-slate-500">
            Constat de 0 FCFA mobilisé sur T1-T3 et plan de rattrapage intensif programmé pour le 4ème trimestre (T4).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-4">Période 2026</th>
                <th className="py-2.5 px-4 font-mono text-right">Cible Prévue (FCFA)</th>
                <th className="py-2.5 px-4 font-mono text-right">Encaissé Réel (FCFA)</th>
                <th className="py-2.5 px-4">Situation & Observations Opérationnelles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {monthlyBreakdown.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                    {row.month}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-700 font-mono">
                    {row.target.toLocaleString('fr-FR')} F
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono">
                    {row.realized.toLocaleString('fr-FR')} F
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-600">
                    {row.observation}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold border-t border-slate-200">
              <tr>
                <td className="py-3 px-4 font-sans text-slate-900">TOTAL OBJECTIF 2026</td>
                <td className="py-3 px-4 text-right font-mono text-slate-900">
                  100 000 000 F CFA
                </td>
                <td className="py-3 px-4 text-right font-mono text-slate-900">
                  {totalCollectedCash.toLocaleString('fr-FR')} F CFA
                </td>
                <td className="py-3 px-4 font-sans text-amber-800">
                  Effort de mobilisation intégralement transféré au T4
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 4. Suivi du Portefeuille des Partenariats Bailleurs (100% MANUEL) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Pipe des Partenariats Bailleurs (Objectif COP : ≥ 15 Contrats)
              </h2>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Saisie manuelle
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestion manuelle personnalisée des dossiers de partenariats, bailleurs et conventions de financement.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {contracts.length > 0 && (
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Effacer tous les partenaires pour réinitialiser le pipe"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Effacer tout</span>
              </button>
            )}

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un partenaire</span>
            </button>
          </div>
        </div>

        {/* Barre de synthèse si des contrats sont renseignés */}
        {contracts.length > 0 && (
          <div className="px-4 py-3 bg-indigo-50/50 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-500">Dossiers enregistrés : </span>
                <strong className="font-mono text-slate-900">{contracts.length}</strong>
                <span className="text-slate-500 font-mono"> / 15 visés</span>
              </div>
              <div>
                <span className="text-slate-500">Signés / Encaissés : </span>
                <strong className="font-mono text-emerald-700">{signedOrCollectedCount}</strong>
              </div>
            </div>
            <div className="flex items-center gap-4 font-mono">
              <div>
                <span className="text-slate-500 font-sans">Cible cumulée : </span>
                <strong className="text-slate-900">{totalManualTarget.toLocaleString('fr-FR')} F CFA</strong>
              </div>
              {totalManualRealized > 0 && (
                <div>
                  <span className="text-slate-500 font-sans">Encaissé réel : </span>
                  <strong className="text-emerald-700">{totalManualRealized.toLocaleString('fr-FR')} F CFA</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contenu : État vide ou tableau */}
        {contracts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
              <Handshake className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Aucun partenaire dans le pipe (Gestion Manuelle)
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              L'ensemble des entreprises a été effacé. Le suivi des partenariats et bailleurs est désormais entièrement sous votre contrôle manuel.
            </p>
            <div className="mt-4">
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter manuellement un premier partenaire</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-4">Partenaire / Bailleur</th>
                  <th className="py-2.5 px-4">Nature de l'intervention</th>
                  <th className="py-2.5 px-4 font-mono text-right">Cible Prévue (FCFA)</th>
                  <th className="py-2.5 px-4 font-mono text-right">Encaissé Réel (FCFA)</th>
                  <th className="py-2.5 px-4 text-center">Statut Actuel</th>
                  <th className="py-2.5 px-4 text-center">Échéance</th>
                  <th className="py-2.5 px-4 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{c.partnerName}</span>
                      </div>
                      {c.copLink && (
                        <span className="text-[10px] text-slate-400 font-normal ml-5 block">
                          Réf : {c.copLink}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.nature}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                      {c.targetAmount.toLocaleString('fr-FR')} F
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {c.realizedAmount.toLocaleString('fr-FR')} F
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                          c.status === 'Signé & Encaissé'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : c.status === 'Convention Signée'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : c.status === 'En Négociation'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : c.status === 'Planifié'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">
                      {c.signedDate}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteContract(c.id, c.partnerName)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-semibold border-t border-slate-200">
                <tr>
                  <td className="py-3 px-4 font-sans text-slate-900" colSpan={2}>
                    TOTAL PIPE MANUEL ({contracts.length} partenaires)
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900">
                    {totalManualTarget.toLocaleString('fr-FR')} F CFA
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900">
                    {totalManualRealized.toLocaleString('fr-FR')} F CFA
                  </td>
                  <td className="py-3 px-4 text-center font-sans text-slate-600" colSpan={3}>
                    {signedOrCollectedCount} convention(s) signée(s) ou encaissée(s)
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* MODAL D'AJOUT / MODIFICATION MANUELLE D'UN PARTENAIRE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                  <Building className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingId ? 'Modifier le Partenaire / Bailleur' : 'Ajouter un Partenaire au Pipe'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nom du Partenaire / Entreprise / Bailleur <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.partnerName}
                  onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                  placeholder="Ex : NSIA, MTN Bénin, Ambassade, Bailleurs..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nature de l'intervention
                </label>
                <input
                  type="text"
                  value={formData.nature}
                  onChange={(e) => setFormData({ ...formData, nature: e.target.value })}
                  placeholder="Ex : Subvention directe, Mécénat d'entreprise, Sponsoring, Dotation kits..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Cible Prévue (en FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="Ex : 10000000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Encaissé Réel (en FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formData.realizedAmount}
                    onChange={(e) => setFormData({ ...formData, realizedAmount: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Statut Actuel
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as PartnerContractItem['status'],
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
                  >
                    <option value="Planifié">Planifié</option>
                    <option value="Prospection">Prospection</option>
                    <option value="En Négociation">En Négociation</option>
                    <option value="Convention Signée">Convention Signée</option>
                    <option value="Signé & Encaissé">Signé & Encaissé</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Échéance / Période
                  </label>
                  <input
                    type="text"
                    value={formData.signedDate}
                    onChange={(e) => setFormData({ ...formData, signedDate: e.target.value })}
                    placeholder="Ex : Octobre 2026, T4 2026..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Référence COP (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.copLink}
                  onChange={(e) => setFormData({ ...formData, copLink: e.target.value })}
                  placeholder="Ex : D/OS2 & OO2"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'Mettre à jour' : 'Enregistrer le partenaire'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
