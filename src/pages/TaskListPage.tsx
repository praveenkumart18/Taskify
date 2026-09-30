import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskList } from '../types';
import { taskListApi, taskApi } from '../services/api';
import { MaterialIcon } from '../components/MaterialIcon';
import { TaskModal } from '../components/TaskModal';
import { RandomTaskModal } from '../components/RandomTaskModal';
import { ConfirmModal } from '../components/ConfirmModal';

interface TaskListPageProps {
  listId: string;
  onBack: () => void;
}

export const TaskListPage: React.FC<TaskListPageProps> = ({ listId, onBack }) => {
  const [list, setList] = useState<TaskList | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortOption, setSortOption] = useState<'number' | 'newest' | 'oldest' | 'dueDate'>('number');

  // Modals & Actions
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  // Pagination state
  const [page] = useState(1);
  const [, setTotalPages] = useState(1);
  const [, setTotalCount] = useState(0);

  // Fetch list details and tasks
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [listRes, tasksRes] = await Promise.all([
        taskListApi.getById(listId),
        taskApi.getByList(listId, {
          search,
          status: statusFilter,
          sort: sortOption as any,
          page,
          limit: 100,
        }),
      ]);

      if (listRes.data) {
        setList(listRes.data);
      }
      if (tasksRes.data) {
        setTasks(tasksRes.data);
        setTotalPages(tasksRes.pages || 1);
        setTotalCount(tasksRes.total || tasksRes.data.length);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load task list data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [listId, statusFilter, sortOption, page]);

  // Handle Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Calculate completion stats
  const completedCount = useMemo(() => {
    return tasks.filter((t) => t.status === 'completed').length;
  }, [tasks]);

  const progressPercentage = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((completedCount / tasks.length) * 100);
  }, [completedCount, tasks.length]);

  // Create or Update task
  const handleSaveTask = async (taskData: {
    name: string;
    number?: number;
    description?: string;
  }) => {
    if (editingTask) {
      const res = await taskApi.update(editingTask._id, {
        name: taskData.name,
        title: taskData.name,
        number: taskData.number,
      });
      if (res.data) {
        setTasks((prev) => prev.map((t) => (t._id === editingTask._id ? res.data! : t)));
      }
    } else {
      const res = await taskApi.create(listId, {
        name: taskData.name,
        title: taskData.name,
        number: taskData.number,
      });
      if (res.data) {
        setTasks((prev) => [...prev, res.data!]);
        setTotalCount((c) => c + 1);
      }
    }
  };

  // Toggle task status
  const handleToggleStatus = async (taskId: string) => {
    try {
      setTogglingTaskId(taskId);
      const res = await taskApi.toggleStatus(taskId);
      if (res.data) {
        setTasks((prev) =>
          prev.map((t) => (t._id === taskId ? { ...t, status: res.data!.status } : t))
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to toggle status');
    } finally {
      setTogglingTaskId(null);
    }
  };

  // Delete task confirmation action
  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      setDeletingTaskId(taskToDelete._id);
      await taskApi.delete(taskToDelete._id);
      setTasks((prev) => prev.filter((t) => t._id !== taskToDelete._id));
      setTotalCount((c) => Math.max(0, c - 1));
      setTaskToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    } finally {
      setDeletingTaskId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 animate-in fade-in duration-300">
      {/* Top Navigation & Action Row (Responsive buttons with clean hitboxes) */}
      <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 min-h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all select-none cursor-pointer"
        >
          <MaterialIcon name="arrow_back" className="text-lg" />
          <span>Home</span>
        </button>

        {/* Randomise Task Primary Button */}
        <button
          type="button"
          onClick={() => setIsRandomModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 min-h-[42px] px-3.5 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 active:scale-[0.98] transition-all shadow-md shadow-teal-500/25 cursor-pointer shrink-0 select-none"
        >
          <MaterialIcon name="casino" className="text-lg" />
          <span>Randomise Task</span>
        </button>
      </div>

      {/* List Header & Progress Bar */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm mb-5 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 mb-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white break-words">
              {list?.name || 'Task List'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 break-words leading-relaxed">
              {list?.description || 'No description provided'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-[40px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-95 transition-all shadow-md shadow-teal-500/20 shrink-0 w-full sm:w-auto cursor-pointer select-none"
          >
            <MaterialIcon name="add" className="text-lg" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Completed: <strong className="font-mono tabular-nums">{completedCount}</strong> / <span className="font-mono tabular-nums">{tasks.length}</span>
            </span>
            <span className="font-bold text-teal-600 dark:text-teal-400 font-mono tabular-nums">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Search, Filter & Sort Controls */}
      <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm mb-5 sm:mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <MaterialIcon name="search" className="text-lg text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-h-[44px] pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative w-full sm:w-auto">
              <div className="absolute left-3 top-3 pointer-events-none text-slate-400">
                <MaterialIcon name="swap_vert" className="text-lg" />
              </div>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="w-full sm:w-auto min-h-[44px] pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 font-medium cursor-pointer appearance-none"
              >
                <option value="number">Task Number (#1, #2...)</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="dueDate">Due Date</option>
              </select>
              <div className="absolute right-2.5 top-3 pointer-events-none text-slate-400">
                <MaterialIcon name="expand_more" className="text-base" />
              </div>
            </div>
          </div>
        </div>

        {/* Status Filter Pills (Horizontal scroll on small mobile) */}
        <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-slate-400 text-[11px] font-semibold uppercase mr-1 shrink-0">Status:</span>
          {(['all', 'pending', 'completed'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-xl capitalize font-semibold transition-all shrink-0 active:scale-95 cursor-pointer ${
                statusFilter === s
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-3.5 sm:p-4 text-xs sm:text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-2xl mb-5 sm:mb-6">
          <MaterialIcon name="error" className="text-base shrink-0" />
          <span className="flex-1 break-words">{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-auto underline font-semibold hover:text-rose-400 shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tasks List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse flex items-center gap-3 sm:gap-4"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        /* Empty state */
        <div className="text-center py-12 sm:py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 mx-auto mb-4">
            <MaterialIcon name="checklist" className="text-3xl" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
            No tasks yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
            Create your first task or clear your search to view tasks.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-95 transition-all shadow-md shadow-teal-500/20 cursor-pointer"
          >
            <MaterialIcon name="add" className="text-lg" />
            <span>Add Task</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-2.5">
          {tasks.map((task, index) => {
            const isCompleted = task.status === 'completed';
            const isToggling = togglingTaskId === task._id;
            const isDeleting = deletingTaskId === task._id;

            return (
              <div
                key={task._id}
                onClick={() => handleToggleStatus(task._id)}
                className={`group p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-150 flex items-center gap-2.5 sm:gap-3.5 cursor-pointer active:scale-[0.99] select-none ${
                  isCompleted
                    ? 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60 opacity-80'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-500/30 hover:shadow-md'
                }`}
              >
                {/* Checkbox (Comfortable 40px tap target for thumbs) */}
                <button
                  type="button"
                  disabled={isToggling}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleStatus(task._id);
                  }}
                  className="w-10 h-10 sm:w-9 sm:h-9 text-slate-400 hover:text-teal-500 active:scale-90 transition-all shrink-0 flex items-center justify-center cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                >
                  {isToggling ? (
                    <MaterialIcon name="progress_activity" className="text-xl animate-spin text-teal-500" />
                  ) : isCompleted ? (
                    <MaterialIcon name="check_circle" className="text-2xl text-emerald-500" filled />
                  ) : (
                    <MaterialIcon name="radio_button_unchecked" className="text-2xl hover:text-teal-400 text-slate-400 dark:text-slate-500" />
                  )}
                </button>

                {/* Content: Task Number and Task Name (Multiline resilient) */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="font-mono text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shrink-0">
                    #{task.number !== undefined && task.number !== null ? task.number : index + 1}
                  </span>

                  <span
                    className={`text-xs sm:text-sm font-semibold tracking-tight transition-all break-words line-clamp-2 sm:line-clamp-none ${
                      isCompleted
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {task.name || task.title}
                  </span>
                </div>

                {/* Actions: Edit and Delete (Accessible tap targets on mobile) */}
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTask(task);
                      setIsTaskModalOpen(true);
                    }}
                    className="w-9 h-9 sm:w-8 sm:h-8 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all flex items-center justify-center cursor-pointer"
                    title="Edit Task"
                    aria-label="Edit Task"
                  >
                    <MaterialIcon name="edit" className="text-base sm:text-sm" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTaskToDelete(task);
                    }}
                    disabled={isDeleting}
                    className="w-9 h-9 sm:w-8 sm:h-8 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-90 transition-all cursor-pointer flex items-center justify-center"
                    title="Delete Task"
                    aria-label="Delete Task"
                  >
                    {isDeleting ? (
                      <MaterialIcon name="progress_activity" className="text-base sm:text-sm animate-spin text-rose-500" />
                    ) : (
                      <MaterialIcon name="delete" className="text-base sm:text-sm" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleSaveTask}
        initialData={editingTask}
        nextSuggestedNumber={tasks.length + 1}
      />

      {/* Custom Confirmation Modal for Deletion */}
      <ConfirmModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete task #${taskToDelete?.number ?? ''} "${taskToDelete?.name || taskToDelete?.title || ''}"? This action cannot be undone.`}
        confirmText="Delete Task"
        loading={!!deletingTaskId}
      />

      {/* Random Task Modal */}
      <RandomTaskModal
        isOpen={isRandomModalOpen}
        onClose={() => setIsRandomModalOpen(false)}
        listId={listId}
        listName={list?.name || 'Task List'}
        onTaskStatusToggled={(taskId, newStatus) => {
          setTasks((prev) =>
            prev.map((t) => (t._id === taskId ? { ...t, status: newStatus as any } : t))
          );
        }}
      />
    </div>
  );
};
