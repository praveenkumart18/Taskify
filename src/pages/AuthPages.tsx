import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MaterialIcon } from '../components/MaterialIcon';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login', onSuccess }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setError('Please provide email and password');
      return;
    }

    if (!isLogin && !name.trim()) {
      setError('Please provide your full name');
      return;
    }

    try {
      setLoading(true);
      if (isLogin) {
        await login(email.trim(), password);
        setSuccessMsg('Login successful! Redirecting to your dashboard...');
      } else {
        await register(name.trim(), email.trim(), password);
        setSuccessMsg('Account created successfully! Redirecting to your dashboard...');
      }

      // Allow the user to see the success notification before transitioning
      setTimeout(() => {
        onSuccess?.();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-3.5 sm:px-6 py-6 sm:py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 shadow-xl shadow-teal-500/20 mb-3">
            <MaterialIcon name="task_alt" className="text-slate-950 text-2xl font-bold" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isLogin ? 'Welcome Back to Taskify' : 'Create Your Account'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            {isLogin
              ? 'Enter your credentials to access your task lists and random picker'
              : 'Join Taskify to organize coursework, prep, and personal tasks'}
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 select-none">
          {/* Top Mode Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl sm:rounded-2xl mb-5 sm:mb-6">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
                setSuccessMsg('');
              }}
              className={`min-h-[38px] py-2 text-xs font-bold rounded-lg sm:rounded-xl transition-all active:scale-95 cursor-pointer ${
                isLogin
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
                setSuccessMsg('');
              }}
              className={`min-h-[38px] py-2 text-xs font-bold rounded-lg sm:rounded-xl transition-all active:scale-95 cursor-pointer ${
                !isLogin
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs sm:text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl animate-in fade-in">
                <MaterialIcon name="error" className="text-base shrink-0" />
                <span className="flex-1 break-words">{error}</span>
              </div>
            )}

            {/* Success Notification */}
            {successMsg && (
              <div className="flex items-center gap-2 p-3 text-xs sm:text-sm text-emerald-500 bg-emerald-500/15 border border-emerald-500/30 rounded-xl animate-in fade-in">
                <MaterialIcon name="check_circle" className="text-base shrink-0 text-emerald-500" filled />
                <span className="font-semibold flex-1 break-words">{successMsg}</span>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <MaterialIcon name="person" className="text-base text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <MaterialIcon name="mail" className="text-base text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <MaterialIcon name="lock" className="text-base text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !!successMsg}
              className="w-full min-h-[46px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-[0.98] transition-all shadow-lg shadow-teal-500/25 mt-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <MaterialIcon name="progress_activity" className="text-base animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Login to Taskify' : 'Register Account'}</span>
                  <MaterialIcon name="arrow_forward" className="text-base" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            {isLogin ? (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="font-semibold text-teal-600 dark:text-teal-400 hover:underline ml-1 cursor-pointer"
                >
                  Create account
                </button>
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="font-semibold text-teal-600 dark:text-teal-400 hover:underline ml-1 cursor-pointer"
                >
                  Login
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security badge footer */}
        <p className="text-center text-[11px] text-slate-400 mt-5 sm:mt-6 flex items-center justify-center gap-1.5 px-4 text-center">
          <MaterialIcon name="lock" className="text-xs text-slate-400 shrink-0" />
          <span>Protected with HTTP-Only Cookie Sessions & Password Hashing</span>
        </p>
      </div>
    </div>
  );
};
