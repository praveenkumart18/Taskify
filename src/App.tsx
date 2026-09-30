import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthPage } from './pages/AuthPages';
import { HomePage } from './pages/HomePage';
import { TaskListPage } from './pages/TaskListPage';
import { MaterialIcon } from './components/MaterialIcon';

function MainApp() {
  const { user, loading, theme } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'list'>('home');
  const [selectedListId, setSelectedListId] = useState<string | null>(() => {
    return localStorage.getItem('taskify_last_list') || null;
  });

  // Sync theme with HTML document class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Navigate to list view
  const handleSelectList = (listId: string) => {
    setSelectedListId(listId);
    setCurrentView('list');
    localStorage.setItem('taskify_last_list', listId);
  };

  // Navigate to home view
  const handleNavigateHome = () => {
    setCurrentView('home');
    setSelectedListId(null);
    localStorage.removeItem('taskify_last_list');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white px-4">
        <MaterialIcon name="progress_activity" className="text-3xl text-teal-500 animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
          Loading Taskify...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-teal-500/20 selection:text-teal-400">
      {/* Top Navigation */}
      <Navbar onNavigateHome={handleNavigateHome} />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {!user ? (
          <AuthPage onSuccess={handleNavigateHome} />
        ) : currentView === 'list' && selectedListId ? (
          <TaskListPage listId={selectedListId} onBack={handleNavigateHome} />
        ) : (
          <HomePage onSelectList={handleSelectList} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
