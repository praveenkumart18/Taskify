import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MaterialIcon } from './MaterialIcon';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onNavigateHome?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigateHome }) => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  // Generate consistent initials from name
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors pt-safe">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand Zone */}
        <div 
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none shrink-0"
        >
          {/* Professional App Icon */}
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-md shadow-teal-500/20 group-hover:scale-105 active:scale-95 transition-all border border-teal-500/30 shrink-0 bg-slate-900 flex items-center justify-center">
            {!logoError ? (
              <img
                src="/app-logo.png"
                alt="Taskify App Logo"
                onError={() => setLogoError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center">
                <MaterialIcon name="task_alt" className="text-slate-950 text-xl font-bold" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-teal-500/10 to-transparent pointer-events-none" />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Taskify
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/25">
              PRO
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

          {/* Professional User Profile Dropdown */}
          {user && (
            <div className="relative pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 active:scale-95 transition-all cursor-pointer group"
                aria-label="User profile menu"
                aria-expanded={isProfileOpen}
              >
                {/* Avatar with online status */}
                <div className="relative">
                  <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-400 p-[1.5px] shadow-sm group-hover:shadow-teal-500/25 transition-all">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-teal-400 font-bold text-xs select-none">
                      {initials}
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-950 rounded-full absolute -bottom-0.5 -right-0.5" />
                </div>

                {/* Name & Role (desktop) */}
                <div className="hidden md:block text-left max-w-[110px] lg:max-w-[140px]">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold truncate">
                    Personal Account
                  </p>
                </div>

                <MaterialIcon 
                  name="expand_more" 
                  className={`text-slate-400 text-sm hidden sm:block transition-transform duration-200 ${isProfileOpen ? 'rotate-180 text-teal-500' : ''}`} 
                />
              </button>

              {/* Profile Dropdown Popover */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-150 z-50">
                  {/* Popover Header */}
                  <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-[2px] shadow-md shadow-teal-500/20 shrink-0">
                      <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-teal-400 font-extrabold text-base select-none">
                        {initials}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {user.name}
                        </h4>
                        <MaterialIcon name="verified" className="text-teal-500 text-sm shrink-0" filled />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Active Workspace
                      </span>
                    </div>
                  </div>

                  {/* Account Overview Strip */}
                  <div className="py-3 border-b border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <MaterialIcon name="security" className="text-sm text-teal-500" />
                        Account Security
                      </span>
                      <span className="font-semibold text-emerald-500">Protected</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <MaterialIcon name="sync_alt" className="text-sm text-teal-500" />
                        Cloud Sync
                      </span>
                      <span className="font-semibold text-teal-500">Real-time</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 space-y-1.5">
                    {/* Home Navigation button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onNavigateHome?.();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-98 transition-all cursor-pointer"
                    >
                      <MaterialIcon name="dashboard" className="text-base text-slate-400" />
                      <span>Task Lists Dashboard</span>
                    </button>

                    {/* Quick Theme Switch */}
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-98 transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <MaterialIcon 
                          name={theme === 'dark' ? 'light_mode' : 'dark_mode'} 
                          className={`text-base ${theme === 'dark' ? 'text-amber-400' : 'text-slate-600'}`} 
                        />
                        <span>Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Toggle</span>
                    </button>

                    {/* Logout Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-98 transition-all cursor-pointer mt-1"
                    >
                      <MaterialIcon name="logout" className="text-base" />
                      <span>Sign Out from Taskify</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
