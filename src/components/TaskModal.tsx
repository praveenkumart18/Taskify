import React, { useState, useEffect } from 'react';
import { MaterialIcon } from './MaterialIcon';
import { Task } from '../types';

interface ParsedTaskItem {
  id: string;
  number: number;
  name: string;
  description: string;
  rawText: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: {
    name: string;
    number?: number;
    description?: string;
  }) => Promise<void>;
  onSubmitBulk?: (tasks: Array<{
    name: string;
    number?: number;
    description?: string;
  }>) => Promise<void>;
  initialData?: Task | null;
  nextSuggestedNumber?: number;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSubmitBulk,
  initialData,
  nextSuggestedNumber = 1,
}) => {
  // Mode selection: 'manual' or 'paste'
  const [activeTab, setActiveTab] = useState<'manual' | 'paste'>('manual');

  // Manual Form State
  const [name, setName] = useState('');
  const [number, setNumber] = useState<string>('');
  const [description, setDescription] = useState('');

  // Paste / Bulk Import State
  const [rawPastedText, setRawPastedText] = useState('');
  const [useSequentialNumbers, setUseSequentialNumbers] = useState(true);
  const [analyzedTasks, setAnalyzedTasks] = useState<ParsedTaskItem[]>([]);

  // Feedback State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset and initialize state when opening modal
  useEffect(() => {
    if (initialData) {
      setActiveTab('manual');
      setName(initialData.name || initialData.title || '');
      setNumber(initialData.number ? initialData.number.toString() : '');
      setDescription(initialData.description || '');
    } else {
      setName('');
      setNumber(nextSuggestedNumber ? nextSuggestedNumber.toString() : '');
      setDescription('');
      setRawPastedText('');
      setAnalyzedTasks([]);
    }
    setError('');
  }, [initialData, isOpen, nextSuggestedNumber]);

  // Real-time Text Analyzer for Pasted Tasks (clean number, name, and optional description)
  useEffect(() => {
    if (!rawPastedText.trim()) {
      setAnalyzedTasks([]);
      return;
    }

    const lines = rawPastedText.split(/\r?\n/);
    const parsed: ParsedTaskItem[] = [];
    let currentAutoNumber = nextSuggestedNumber;

    lines.forEach((line, index) => {
      let trimmed = line.trim();
      if (!trimmed) return;

      // 1. Remove leading bullets/checkboxes (e.g., "- ", "* ", "• ", "[ ] ", "[x] ")
      trimmed = trimmed.replace(/^(\s*[-*•+>]+\s*|\s*\[[ xX]\]\s*)/, '').trim();

      // 2. Check for explicit number prefix (e.g., "1. ", "1) ", "#1 ", "1: ")
      let explicitNumber: number | null = null;
      const numMatch = trimmed.match(/^#?(\d+)[\.\)\:\-\s]\s*/);
      if (numMatch) {
        explicitNumber = parseInt(numMatch[1], 10);
        trimmed = trimmed.substring(numMatch[0].length).trim();
      }

      // 3. Remove any brackets or leftover priority tags e.g. [high], [medium], [low], (urgent)
      trimmed = trimmed.replace(/\[(?:high|urgent|medium|med|low|p[1-3])\]/gi, '').trim();
      trimmed = trimmed.replace(/\((?:high|urgent|medium|med|low|p[1-3])\)/gi, '').trim();
      trimmed = trimmed.replace(/!(?:high|urgent|medium|med|low|p[1-3])/gi, '').trim();

      // Clean up lingering empty brackets or symbols
      trimmed = trimmed.replace(/[\[\]]/g, ' ').replace(/\s{2,}/g, ' ').trim();

      // 4. Detect description separator (e.g., "Title - Description", "Title // Description", "Title :: Description")
      let taskName = trimmed;
      let taskDesc = '';

      const sepMatch = trimmed.match(/\s+(?:[-–—]{1,2}|\/\/|::)\s+/);
      if (sepMatch && sepMatch.index !== undefined) {
        taskName = trimmed.substring(0, sepMatch.index).trim();
        taskDesc = trimmed.substring(sepMatch.index + sepMatch[0].length).trim();
      }

      if (!taskName) return;

      // Determine task number
      const finalNumber = useSequentialNumbers
        ? currentAutoNumber++
        : explicitNumber && explicitNumber >= 1
        ? explicitNumber
        : currentAutoNumber++;

      parsed.push({
        id: `parsed-${index}-${Date.now()}`,
        number: finalNumber,
        name: taskName,
        description: taskDesc,
        rawText: line,
      });
    });

    setAnalyzedTasks(parsed);
  }, [rawPastedText, nextSuggestedNumber, useSequentialNumbers]);

  // Handle single manual submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Task name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const parsedNum = number ? parseInt(number, 10) : undefined;
      await onSubmit({
        name: name.trim(),
        number: parsedNum && parsedNum >= 1 ? parsedNum : undefined,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  // Handle bulk submission
  const handleBulkSubmit = async () => {
    if (analyzedTasks.length === 0) {
      setError('No tasks detected. Please paste one or more tasks into the box.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const tasksToCreate = analyzedTasks.map((t) => ({
        name: t.name,
        number: t.number,
        description: t.description || undefined,
      }));

      if (onSubmitBulk) {
        await onSubmitBulk(tasksToCreate);
      } else {
        // Fallback: sequential creates if bulk handler is not provided
        for (const item of tasksToCreate) {
          await onSubmit(item);
        }
      }

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add bulk tasks');
    } finally {
      setLoading(false);
    }
  };

  // Remove an item from the analyzed list
  const handleRemoveAnalyzedItem = (idToRemove: string) => {
    setAnalyzedTasks((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  // Load sample text for instant testing
  const handleLoadSample = () => {
    const sample = `1. Practice LeetCode Two Sum
2. Read system design documentation - Chapter 3 on Caching
- Setup database backup cron job
• Fix navbar mobile responsive layout
[ ] Update package dependencies and audit
Conduct weekly team sprint review`;
    setRawPastedText(sample);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className={`w-full ${activeTab === 'paste' ? 'max-w-2xl' : 'max-w-md'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto select-none transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title and Mode Switcher */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-500 shrink-0">
                <MaterialIcon name={activeTab === 'paste' ? 'playlist_add' : 'task_alt'} className="text-base" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                  {initialData ? 'Edit Task' : 'Add Tasks'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {initialData ? 'Update task details' : 'Choose manual single entry or paste multiple tasks'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              aria-label="Close modal"
            >
              <MaterialIcon name="close" className="text-lg" />
            </button>
          </div>

          {/* Segmented Mode Switcher (Hidden when editing existing task) */}
          {!initialData && (
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MaterialIcon name="edit_note" className="text-base" />
                <span>Manual Entry</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <MaterialIcon name="content_paste" className="text-base" />
                <span>Paste & Analyze (Bulk)</span>
              </button>
            </div>
          )}
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mx-4 sm:mx-5 mt-4 flex items-center gap-2 p-3 text-xs sm:text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <MaterialIcon name="error" className="text-base shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: MANUAL SINGLE ENTRY */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="p-4 sm:p-5 space-y-4">
            {/* Number & Name Inputs */}
            <div className="flex gap-2.5 sm:gap-3">
              <div className="w-20 sm:w-24 shrink-0">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <MaterialIcon name="tag" className="text-sm text-slate-400" />
                  No.
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full min-h-[44px] px-2.5 sm:px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-base sm:text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                />
              </div>

              <div className="flex-1 min-w-0">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Task Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  autoFocus
                  placeholder="e.g. Practice LeetCode Two Sum"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            {/* Optional Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Description / Notes <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Add additional context, references, or instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center gap-1.5 min-h-[42px] px-5 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-95 rounded-xl transition-all shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading && <MaterialIcon name="progress_activity" className="text-sm animate-spin" />}
                <span>{initialData ? 'Save Changes' : 'Add Task'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: PASTE & ANALYZE (BULK ENTRY) */}
        {activeTab === 'paste' && (
          <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Input Header & Controls */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MaterialIcon name="content_paste" className="text-sm text-teal-500" />
                  Paste Tasks One by One (One line per task)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <MaterialIcon name="auto_fix_high" className="text-xs" />
                    Load Example
                  </button>
                  {rawPastedText && (
                    <button
                      type="button"
                      onClick={() => setRawPastedText('')}
                      className="text-[11px] font-semibold text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Textarea for Pasting Tasks */}
              <div className="relative">
                <textarea
                  rows={5}
                  value={rawPastedText}
                  onChange={(e) => setRawPastedText(e.target.value)}
                  placeholder={`Paste your task list here, for example:
1. Practice LeetCode Two Sum
2. Read system design documentation - Chapter 3
- Fix navbar mobile responsive layout
• Review weekly team pull requests
Buy groceries for dinner`}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-y leading-relaxed"
                />
              </div>
            </div>

            {/* Smart Detection Preferences */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block">Auto-Numbering</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {useSequentialNumbers ? `Sequential numbering from #${nextSuggestedNumber}` : 'Keep numbers from pasted text'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUseSequentialNumbers(!useSequentialNumbers)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    useSequentialNumbers ? 'bg-teal-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                  aria-label="Toggle numbering mode"
                >
                  <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>
            </div>

            {/* Real-Time Analyzed Tasks Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Analyzed Tasks ({analyzedTasks.length})
                  </span>
                  {analyzedTasks.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      Ready to Add
                    </span>
                  )}
                </div>
              </div>

              {/* Analyzed Tasks Preview List */}
              {analyzedTasks.length === 0 ? (
                <div className="p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center">
                  <MaterialIcon name="find_in_page" className="text-3xl text-slate-400 mb-1" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    No tasks analyzed yet
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Paste your task list above or click "Load Example" to preview.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {analyzedTasks.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 hover:border-teal-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          #{item.number}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.name}
                          </p>
                          {item.description && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Remove line */}
                      <button
                        type="button"
                        onClick={() => handleRemoveAnalyzedItem(item.id)}
                        className="w-7 h-7 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Remove this task"
                      >
                        <MaterialIcon name="delete" className="text-sm" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                {analyzedTasks.length > 0
                  ? `${analyzedTasks.length} task${analyzedTasks.length > 1 ? 's' : ''} ready to import`
                  : 'Paste text to analyze'}
              </span>

              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[42px] px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={loading || analyzedTasks.length === 0}
                  onClick={handleBulkSubmit}
                  className="flex items-center justify-center gap-1.5 min-h-[42px] px-5 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 active:scale-95 rounded-xl transition-all shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {loading && <MaterialIcon name="progress_activity" className="text-sm animate-spin" />}
                  <span>
                    {analyzedTasks.length > 0
                      ? `Add ${analyzedTasks.length} Tasks to List`
                      : 'Add Tasks'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
