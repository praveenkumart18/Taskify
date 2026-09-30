import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MaterialIcon } from './MaterialIcon';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateHome }) => {
  const { user, logout, theme, toggleTheme } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors pt-safe">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand Zone */}
        <div 
          onClick={onNavigateHome}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none shrink-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:scale-105 active:scale-95 transition-transform">
            <MaterialIcon name="task_alt" className="text-slate-950 text-lg sm:text-xl font-bold" />
          </div>
          <div className="flex items-center">
            <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Taskify
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              v1.0
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* In-App PWA Install Button */}
          <PWAInstallButton />

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <MaterialIcon name="light_mode" className="text-lg text-amber-400" />
            ) : (
              <MaterialIcon name="dark_mode" className="text-lg text-slate-700" />
            )}
          </button>

          {/* User Profile & Logout */}
          {user && (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2.5 border-l border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div 
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-xs select-none"
                  title={`${user.name} (${user.email})`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[130px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="min-h-[38px] min-w-[38px] sm:min-h-[40px] sm:min-w-[40px] p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-95"
                title="Logout"
                aria-label="Logout"
              >
                <MaterialIcon name="logout" className="text-lg" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
