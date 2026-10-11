/**
 * Executive Performance Tracker — App entry component
 * Fondation HYSTERESIS
 */

import React, { useState, useEffect } from 'react';
import { TrackerProvider, useTracker } from './context/TrackerContext';
import { Navbar } from './components/Navbar';
import { MonthlyEvaluationView } from './components/MonthlyEvaluationView';
import { ReplanificationView } from './components/ReplanificationView';
import { FinancialMobilizationView } from './components/FinancialMobilizationView';
import { ExecutiveDashboardView } from './components/ExecutiveDashboardView';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { TaskEditModal } from './components/TaskEditModal';
import { initAuth } from './services/googleDriveService';
import { TaskItem } from './types';

const MainContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<
    'canevas' | 'replanification' | 'mobilisation' | 'dashboard' | 'drive'
  >('canevas');
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);
  const [driveUser, setDriveUser] = useState<any | null>(null);

  const { currentMonth, addNewTask, updateTaskField } = useTracker();

  useEffect(() => {
    // Initialisation de l'écouteur d'authentification Google Workspace
    const unsubscribe = initAuth(
      (user) => setDriveUser(user),
      () => setDriveUser(null)
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleOpenAddTaskModal = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: TaskItem) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData: any) => {
    if (taskData.id) {
      // Modification
      Object.keys(taskData).forEach((key) => {
        if (key !== 'id') {
          updateTaskField(taskData.id, key as keyof TaskItem, taskData[key]);
        }
      });
    } else {
      // Ajout
      addNewTask(taskData);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'drive') {
            setIsDriveModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        driveUser={driveUser}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'canevas' && (
          <MonthlyEvaluationView
            onOpenAddTaskModal={handleOpenAddTaskModal}
            onEditTask={handleEditTask}
            onOpenDriveModal={() => setIsDriveModalOpen(true)}
          />
        )}

        {currentTab === 'replanification' && <ReplanificationView />}

        {currentTab === 'mobilisation' && <FinancialMobilizationView />}

        {currentTab === 'dashboard' && (
          <ExecutiveDashboardView
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        )}
      </main>

      {/* Footer sobre et institutionnel */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <strong className="text-slate-800">Fondation HYSTERESIS</strong> — Association à but non lucratif · Abomey-Calavi, Bénin
          </div>
          <div>
            Contrat d'Objectifs et de Performance 2026 · Direction Exécutive & Présidence
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GoogleDriveModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        currentUser={driveUser}
        onUserChange={(user) => setDriveUser(user)}
      />

      <TaskEditModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        defaultMonth={currentMonth}
        onSave={handleSaveTask}
      />
    </div>
  );
};

export default function App() {
  return (
    <TrackerProvider>
      <MainContent />
    </TrackerProvider>
  );
}
