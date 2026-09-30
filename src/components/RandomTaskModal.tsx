import React, { useState, useEffect } from 'react';
import { MaterialIcon } from './MaterialIcon';
import { Task } from '../types';
import { taskApi } from '../services/api';

interface RandomTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  listName: string;
  onTaskStatusToggled: (taskId: string, newStatus: string) => void;
}

export const RandomTaskModal: React.FC<RandomTaskModalProps> = ({
  isOpen,
  onClose,
  listId,
  listName,
  onTaskStatusToggled,
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [allCompleted, setAllCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [tickerTitle, setTickerTitle] = useState('Shuffling tasks...');
  const [error, setError] = useState('');
  const [markingComplete, setMarkingComplete] = useState(false);

  const sampleTitles = [
    'Refactoring code...',
    'Reviewing system design...',
    'Writing test suites...',
    'Optimizing queries...',
    'Reviewing documentation...',
    'Practicing algorithm...',
  ];

  const rollTask = async () => {
    try {
      setLoading(true);
      setAnimating(true);
      setError('');

      // Play short roulette ticker animation (~800ms)
      let count = 0;
      const interval = setInterval(() => {
        setTickerTitle(sampleTitles[count % sampleTitles.length]);
        count++;
      }, 130);

      const res = await taskApi.getRandomTask(listId);

      setTimeout(() => {
        clearInterval(interval);
        setAnimating(false);
        setLoading(false);

        if (res.data) {
          setSelectedTask(res.data);
          setAllCompleted(!!res.allCompleted);
        } else {
          setSelectedTask(null);
          setAllCompleted(false);
        }
      }, 800);
    } catch (err: any) {
      setAnimating(false);
      setLoading(false);
      setError(err.message || 'Failed to select random task');
    }
  };

  useEffect(() => {
    if (isOpen) {
      rollTask();
    } else {
      setSelectedTask(null);
      setError('');
    }
  }, [isOpen, listId]);

  const handleToggleStatus = async () => {
    if (!selectedTask) return;
    try {
      setMarkingComplete(true);
      const newStatus = selectedTask.status === 'pending' ? 'completed' : 'pending';
      await taskApi.toggleStatus(selectedTask._id, newStatus);
      setSelectedTask({ ...selectedTask, status: newStatus as any });
      onTaskStatusToggled(selectedTask._id, newStatus);
    } catch (err: any) {
      setError(err.message || 'Failed to update task status');
    } finally {
      setMarkingComplete(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden relative my-auto select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 inset-x-0 h-28 sm:h-32 bg-gradient-to-b from-teal-500/15 via-teal-500/5 to-transparent pointer-events-none" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-9 h-9 sm:w-10 sm:h-10 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all z-10 flex items-center justify-center cursor-pointer"
          aria-label="Close"
        >
          <MaterialIcon name="close" className="text-xl" />
        </button>

        <div className="p-5 sm:p-7 text-center relative z-0 overflow-y-auto">
          {/* Dice Badge */}
          <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/30 mb-3 sm:mb-4 transform hover:rotate-12 transition-transform">
            <MaterialIcon 
              name="casino" 
              className={`text-slate-950 text-2xl sm:text-3xl font-bold ${animating ? 'animate-spin' : ''}`} 
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
            <MaterialIcon name="auto_awesome" className="text-sm" />
            <span>Random Task Picker</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 sm:mb-6 truncate">
            From: <span className="font-semibold text-slate-700 dark:text-slate-300">{listName}</span>
          </p>

          {/* Animation / Shuffling View */}
          {animating ? (
            <div className="py-10 sm:py-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 mb-5 sm:mb-6">
              <MaterialIcon name="casino" className="text-3xl text-teal-500 mx-auto mb-3 animate-bounce block" />
              <p className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200 animate-pulse">
                {tickerTitle}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Selecting next task...</p>
            </div>
          ) : error ? (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs sm:text-sm flex items-center gap-2 mb-5 sm:mb-6">
              <MaterialIcon name="error" className="text-base shrink-0" />
              <span className="flex-1 break-words">{error}</span>
            </div>
          ) : selectedTask ? (
            /* Selected Task Card */
            <div className="text-left p-4 sm:p-6 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 shadow-inner mb-5 sm:mb-6 relative group">
              {allCompleted && (
                <div className="mb-3 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-semibold flex items-center gap-2">
                  <MaterialIcon name="check_circle" className="text-base shrink-0" filled />
                  <span>All tasks completed! Selected a review task:</span>
                </div>
              )}

              {/* Number and Name */}
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                {selectedTask.number !== undefined && selectedTask.number !== null && (
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shrink-0">
                    #{selectedTask.number}
                  </span>
                )}
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug break-words">
                  {selectedTask.name || selectedTask.title}
                </h4>
              </div>

              {/* Description */}
              {selectedTask.description ? (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3 sm:mb-4 break-words">
                  {selectedTask.description}
                </p>
              ) : (
                <p className="text-xs text-slate-400 italic mb-3 sm:mb-4">No additional description</p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                {/* Status */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold uppercase text-[10px] tracking-wider ${
                    selectedTask.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <MaterialIcon name="check_circle" className="text-sm" filled={selectedTask.status === 'completed'} />
                  {selectedTask.status}
                </span>

                {/* Due Date */}
                {selectedTask.dueDate && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px]">
                    <MaterialIcon name="calendar_today" className="text-xs" />
                    {new Date(selectedTask.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="py-8 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-center mb-5 sm:mb-6">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                No tasks found in this list
              </p>
              <p className="text-xs text-slate-400">
                Create some tasks in this list to enable random task selection!
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
            {selectedTask && (
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={markingComplete}
                className={`w-full sm:w-auto flex-1 min-h-[44px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm active:scale-95 transition-all shadow-md cursor-pointer ${
                  selectedTask.status === 'pending'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                {markingComplete ? (
                  <MaterialIcon name="progress_activity" className="text-base animate-spin" />
                ) : (
                  <MaterialIcon name="check_circle" className="text-base" filled />
                )}
                <span>
                  {selectedTask.status === 'pending' ? 'Mark as Completed' : 'Mark as Pending'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={rollTask}
              disabled={loading || animating}
              className="w-full sm:w-auto flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
            >
              <MaterialIcon name="casino" className="text-base" />
              <span>Roll Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
