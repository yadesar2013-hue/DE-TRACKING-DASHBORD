/**
 * Navbar — Top Bar Contract (Zone 1: Wordmark, Zone 2: Nav links, Zone 3: Action)
 */

import React from 'react';
import { useTracker } from '../context/TrackerContext';
import { User, ShieldCheck, HardDrive, Printer } from 'lucide-react';

interface NavbarProps {
  currentTab: 'canevas' | 'replanification' | 'mobilisation' | 'dashboard' | 'drive';
  setCurrentTab: (tab: 'canevas' | 'replanification' | 'mobilisation' | 'dashboard' | 'drive') => void;
  onOpenDriveModal: () => void;
  driveUser: any | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenDriveModal,
  driveUser,
}) => {
  const { role, setRole } = useTracker();

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Wordmark épuré */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setCurrentTab('canevas')}
              className="text-left group cursor-pointer focus-visible:outline-none"
            >
              <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-slate-700 transition-colors whitespace-nowrap block">
                Fondation HYSTERESIS
              </span>
              <span className="text-xs text-slate-500 whitespace-nowrap block font-medium">
                Executive Performance Tracker 2026
              </span>
            </button>
          </div>

          {/* Zone 2: Liens de navigation textuels épurés */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setCurrentTab('canevas')}
              className={`transition-colors whitespace-nowrap py-1 relative cursor-pointer ${
                currentTab === 'canevas'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              Canevas Mensuel
            </button>
            <button
              onClick={() => setCurrentTab('replanification')}
              className={`transition-colors whitespace-nowrap py-1 relative cursor-pointer ${
                currentTab === 'replanification'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              Replanification T4
            </button>
            <button
              onClick={() => setCurrentTab('mobilisation')}
              className={`transition-colors whitespace-nowrap py-1 relative cursor-pointer ${
                currentTab === 'mobilisation'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              Mobilisation 100M
            </button>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`transition-colors whitespace-nowrap py-1 relative cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              Tableau Exécutif
            </button>
            <button
              onClick={() => setCurrentTab('drive')}
              className={`transition-colors whitespace-nowrap py-1 relative cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'drive'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              Google Drive
            </button>
          </nav>

          {/* Zone 3: Action & Sélecteur de rôle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handlePrint}
              title="Imprimer ou exporter en PDF la fiche officielle"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Rôle Switcher (Directeur Exécutif vs Présidente) */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                onClick={() => setRole('DIRECTEUR_EXECUTIF')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  role === 'DIRECTEUR_EXECUTIF'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Directeur Exécutif</span>
              </button>
              <button
                onClick={() => setRole('PRESIDENTE')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  role === 'PRESIDENTE'
                    ? 'bg-emerald-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Présidence</span>
              </button>
            </div>

            {/* Connecteur Google Drive */}
            <button
              onClick={onOpenDriveModal}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                driveUser
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-blue-500" />
              <span>{driveUser ? 'Drive Connecté' : 'Google Drive'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
