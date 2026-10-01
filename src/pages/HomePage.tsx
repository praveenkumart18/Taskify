import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TaskList } from '../types';
import { taskListApi } from '../services/api';
import { MaterialIcon } from '../components/MaterialIcon';
import { TaskListModal } from '../components/TaskListModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { RandomTaskModal } from '../components/RandomTaskModal';

interface HomePageProps {
  onSelectList: (listId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectList }) => {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<TaskList | null>(null);
  const [listToDelete, setListToDelete] = useState<TaskList | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Random task modal triggered directly from card icon
  const [randomizingList, setRandomizingList] = useState<TaskList | null>(null);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const isDraggingRef = useRef(false);

  const fetchLists = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await taskListApi.getAll();
      setTaskLists(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load task lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const totalTasksCount = useMemo(() => {
    return taskLists.reduce((acc, curr) => acc + (curr.taskCount || 0), 0);
  }, [taskLists]);

  const handleCreateOrUpdate = async (name: string, description: string) => {
    if (editingList) {
      await taskListApi.update(editingList._id, name, description);
    } else {
      await taskListApi.create(name, description);
    }
    await fetchLists();
  };

  const confirmDeleteList = async () => {
    if (!listToDelete) return;
    try {
      setDeletingId(listToDelete._id);
      await taskListApi.delete(listToDelete._id);
      setTaskLists((prev) => prev.filter((l) => l._id !== listToDelete._id));
      setListToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete task list');
    } finally {
      setDeletingId(null);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    isDraggingRef.current = true;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reordered = [...taskLists];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, moved);

    // Optimistic UI update
    setTaskLists(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      setIsSavingOrder(true);
      await taskListApi.reorder(reordered.map((l) => l._id));
    } catch (err: any) {
      console.error('Failed to save reorder:', err);
      fetchLists(); // Revert on error
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  const formatRelativeDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 animate-in fade-in duration-300">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              My Task Lists
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              {taskLists.length} {taskLists.length === 1 ? 'List' : 'Lists'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Categorize coursework, project sprints, interview prep, and personal goals.
            </p>
            {taskLists.length > 1 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                <MaterialIcon name="drag_indicator" className="text-xs text-teal-500" />
                Drag cards to reorder
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {isSavingOrder && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-semibold animate-pulse">
              <MaterialIcon name="sync" className="text-sm animate-spin" />
              <span>Saving order...</span>
            </span>
          )}

          {/* New Task List Button */}
          <button
            onClick={() => {
              setEditingList(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-[0.98] transition-all shadow-md shadow-teal-500/20 cursor-pointer w-full sm:w-auto shrink-0 select-none"
          >
            <MaterialIcon name="create_new_folder" className="text-lg" />
            <span>New Task List</span>
          </button>
        </div>
      </div>

      {/* Quick Overview Stats Strip for mobile & laptop */}
      {!loading && taskLists.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
              <MaterialIcon name="folder" className="text-xl" filled />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 block truncate">Total Lists</span>
              <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums leading-tight">
                {taskLists.length}
              </span>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <MaterialIcon name="checklist" className="text-xl" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 block truncate">Total Tasks</span>
              <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums leading-tight">
                {totalTasksCount}
              </span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <MaterialIcon name="casino" className="text-xl" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 block truncate">Smart Picker</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block truncate">
                Click 🎲 on any list card
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-3.5 sm:p-4 text-xs sm:text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-2xl mb-6">
          <MaterialIcon name="error" className="text-base shrink-0" />
          <span className="flex-1 break-words">{error}</span>
          <button
            onClick={fetchLists}
            className="underline font-semibold hover:text-rose-400 shrink-0 cursor-pointer ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse space-y-4"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-8 w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
            </div>
          ))}
        </div>
      ) : taskLists.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 sm:py-16 px-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 mx-auto mb-4">
            <MaterialIcon name="folder_open" className="text-3xl" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
            No Task Lists Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
            Get started by creating your first task list — such as "Interview Preparation" or "College Work".
          </p>
          <button
            onClick={() => {
              setEditingList(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-95 transition-all shadow-md shadow-teal-500/20 cursor-pointer"
          >
            <MaterialIcon name="create_new_folder" className="text-lg" />
            <span>Create Your First List</span>
          </button>
        </div>
      ) : (
        /* Task Lists Grid with Drag and Drop */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {taskLists.map((list, index) => {
            const isDeleting = deletingId === list._id;
            const isCurrentDragging = draggedIndex === index;
            const isCurrentOver = dragOverIndex === index;

            return (
              <div
                key={list._id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  if (isDraggingRef.current) return;
                  onSelectList(list._id);
                }}
                className={`group p-5 sm:p-6 rounded-2xl sm:rounded-3xl border bg-white dark:bg-slate-900/70 active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden select-none ${
                  isCurrentDragging
                    ? 'opacity-40 border-dashed border-teal-500 scale-[0.98]'
                    : isCurrentOver
                    ? 'border-teal-500 ring-2 ring-teal-500/40 shadow-xl scale-[1.02]'
                    : 'border-slate-200/90 dark:border-slate-800/80 hover:border-teal-500/40 hover:shadow-xl hover:shadow-teal-500/5'
                }`}
              >
                {/* Accent Top Bar */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {/* Drag Handle Indicator */}
                      <div
                        className="w-7 h-7 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                        title="Drag to change order"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MaterialIcon name="drag_indicator" className="text-lg" />
                      </div>

                      <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 group-hover:scale-105 transition-transform shrink-0">
                        <MaterialIcon name="folder" className="text-xl" filled />
                      </div>
                    </div>

                    {/* Action buttons with Randomise, Edit, and Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Randomise Task button near Edit button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRandomizingList(list);
                        }}
                        className="w-9 h-9 sm:w-8 sm:h-8 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-500/15 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                        title="Pick Random Task from this list"
                        aria-label="Pick Random Task"
                      >
                        <MaterialIcon name="casino" className="text-base sm:text-sm" />
                      </button>

                      {/* Edit List button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingList(list);
                          setIsModalOpen(true);
                        }}
                        className="w-9 h-9 sm:w-8 sm:h-8 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                        title="Edit List"
                        aria-label="Edit List"
                      >
                        <MaterialIcon name="edit" className="text-base sm:text-sm" />
                      </button>

                      {/* Delete List button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setListToDelete(list);
                        }}
                        disabled={isDeleting}
                        className="w-9 h-9 sm:w-8 sm:h-8 text-slate-500 dark:text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                        title="Delete List"
                        aria-label="Delete List"
                      >
                        {isDeleting ? (
                          <MaterialIcon name="progress_activity" className="text-base sm:text-sm animate-spin text-rose-500" />
                        ) : (
                          <MaterialIcon name="delete" className="text-base sm:text-sm" />
                        )}
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight group-hover:text-teal-500 transition-colors line-clamp-1">
                    {list.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 mb-4 min-h-[32px] sm:min-h-[38px] leading-relaxed">
                    {list.description || 'No description provided'}
                  </p>
                </div>

                {/* Footer details */}
                <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] sm:text-xs">
                      {list.taskCount || 0} {list.taskCount === 1 ? 'Task' : 'Tasks'}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MaterialIcon name="schedule" className="text-xs text-slate-400" />
                      {formatRelativeDate(list.updatedAt)}
                    </span>
                  </div>

                  <span className="text-teal-500 font-semibold flex items-center text-xs group-hover:translate-x-1 transition-transform">
                    <MaterialIcon name="chevron_right" className="text-base" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <TaskListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialData={editingList}
      />

      {/* Delete List Confirmation Modal */}
      <ConfirmModal
        isOpen={!!listToDelete}
        onClose={() => setListToDelete(null)}
        onConfirm={confirmDeleteList}
        title="Delete Task List"
        message={`Are you sure you want to delete "${listToDelete?.name || ''}" and all its tasks? This action cannot be undone.`}
        confirmText="Delete List"
        loading={!!deletingId}
      />

      {/* Random Task Modal triggered from tasklist card icon */}
      {randomizingList && (
        <RandomTaskModal
          isOpen={!!randomizingList}
          onClose={() => setRandomizingList(null)}
          listId={randomizingList._id}
          listName={randomizingList.name}
        />
      )}
    </div>
  );
};
