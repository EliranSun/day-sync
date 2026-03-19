import { useState, useRef } from 'react';
import { exportAllData, parseImportFile, importData, getAllDayData, type ImportPreview } from '../lib/exportImport';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

type View = 'menu' | 'import-confirm';

export function DataManagementModal({ isOpen, onClose, onImportComplete }: DataManagementModalProps) {
  const [view, setView] = useState<View>('menu');
  const [exportedCount, setExportedCount] = useState<number | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const totalDays = getAllDayData().length;

  function handleClose() {
    setView('menu');
    setExportedCount(null);
    setImportPreview(null);
    setImportError(null);
    setImportSuccess(false);
    onClose();
  }

  function handleExport() {
    const count = exportAllData();
    setExportedCount(count);
  }

  function handleImportClick() {
    setImportError(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be selected again
    e.target.value = '';
    try {
      const preview = await parseImportFile(file);
      setImportPreview(preview);
      setImportMode('merge');
      setImportError(null);
      setView('import-confirm');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to read file');
    }
  }

  function handleImportConfirm() {
    if (!importPreview) return;
    importData(importPreview.days, importMode);
    setImportSuccess(true);
    onImportComplete();
    setTimeout(() => {
      handleClose();
    }, 1200);
  }

  function formatDate(date: string) {
    return new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-black/40"
      onClick={(e) => { if (e.target === backdropRef.current) handleClose(); }}
    >
      <div className="absolute bottom-0 inset-x-0 bg-white dark:bg-gray-800 rounded-t-2xl p-5 pb-8 shadow-xl">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4" />

        {view === 'menu' && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Data</h2>
              {totalDays > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">
                  {totalDays} {totalDays === 1 ? 'day' : 'days'} stored
                </span>
              )}
            </div>

            {/* Export row */}
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 active:bg-gray-100 dark:active:bg-gray-700 mb-3 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 14v3a1 1 0 001 1h12a1 1 0 001-1v-3" />
                  <path d="M10 3v10M6 9l4 4 4-4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Export all data</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {exportedCount !== null
                    ? `✓ Exported ${exportedCount} ${exportedCount === 1 ? 'day' : 'days'}`
                    : totalDays > 0
                    ? `Save ${totalDays} ${totalDays === 1 ? 'day' : 'days'} as a JSON file`
                    : 'Save your data as a JSON backup'}
                </div>
              </div>
              {exportedCount === null && (
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0">
                  <path d="M8 4l6 6-6 6" />
                </svg>
              )}
            </button>

            {/* Import row */}
            <button
              onClick={handleImportClick}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 active:bg-gray-100 dark:active:bg-gray-700 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 14v3a1 1 0 001 1h12a1 1 0 001-1v-3" />
                  <path d="M10 13V3M6 7l4-4 4 4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Import data</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Restore from a backup file</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0">
                <path d="M8 4l6 6-6 6" />
              </svg>
            </button>

            {importError && (
              <p className="mt-3 text-sm text-red-500 dark:text-red-400 text-center">{importError}</p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={handleClose}
              className="w-full mt-4 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 font-medium text-sm active:bg-gray-200 dark:active:bg-gray-600"
            >
              Cancel
            </button>
          </>
        )}

        {view === 'import-confirm' && importPreview && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setView('menu')}
                className="p-1.5 rounded-lg active:bg-gray-100 dark:active:bg-gray-700 text-gray-500 dark:text-gray-400"
                aria-label="Back"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4l-6 6 6 6" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import data</h2>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {importPreview.days.length} {importPreview.days.length === 1 ? 'day' : 'days'} found
                </span>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(importPreview.dateFrom)}
                  {importPreview.dateFrom !== importPreview.dateTo && ` → ${formatDate(importPreview.dateTo)}`}
                </span>
              </div>
            </div>

            {/* Mode toggle */}
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block font-medium">
              How to handle existing data?
            </label>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setImportMode('merge')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  importMode === 'merge'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                Merge
              </button>
              <button
                onClick={() => setImportMode('replace')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  importMode === 'replace'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                Replace all
              </button>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5 leading-relaxed">
              {importMode === 'merge'
                ? 'Imported days will be added. Days that already exist will be overwritten with imported data.'
                : 'All existing data will be permanently deleted and replaced with the imported data.'}
            </p>

            {importSuccess ? (
              <div className="w-full py-3 rounded-xl bg-green-500 text-white font-medium text-base text-center">
                ✓ Imported successfully
              </div>
            ) : (
              <button
                onClick={handleImportConfirm}
                className={`w-full py-3 rounded-xl text-white font-medium text-base active:opacity-80 ${
                  importMode === 'replace' ? 'bg-red-500' : 'bg-green-500'
                }`}
              >
                Import {importPreview.days.length} {importPreview.days.length === 1 ? 'day' : 'days'}
              </button>
            )}

            <button
              onClick={handleClose}
              className="w-full mt-3 py-2.5 rounded-xl text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 font-medium text-sm active:bg-gray-200 dark:active:bg-gray-600"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
