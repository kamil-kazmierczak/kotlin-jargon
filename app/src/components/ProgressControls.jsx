import React, { useRef, useState } from 'react';
import { Download, RotateCcw, Upload, X } from 'lucide-react';

export default function ProgressControls({ isDark, onExport, onImport, onReset }) {
  const inputRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [message, setMessage] = useState('');

  const close = () => {
    setIsOpen(false);
    setConfirmingReset(false);
    setMessage('');
  };

  const importFile = async (event) => {
    const [file] = event.target.files;
    event.target.value = '';
    if (!file) return;

    try {
      await onImport(await file.text());
      setMessage('Progress restored.');
    } catch (error) {
      setMessage(`Import failed: ${error.message}`);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Manage progress"
        className={`px-2 py-1 border backdrop-blur-md transition ${
          isDark
            ? 'bg-[#1a1a19]/90 border-white/15 text-white/80'
            : 'bg-[#eaeae8]/95 border-black/15 text-black/80'
        }`}
      >
        Progress
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="progress-heading"
            className={`w-full max-w-md border p-5 shadow-2xl ${
              isDark ? 'bg-[#1a1a19] border-white/20' : 'bg-[#eaeae8] border-black/20'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="progress-heading" className="text-sm font-bold">Your learning progress</h2>
                <p className="mt-1 text-[11px] opacity-70">
                  Assessments stay in this browser unless you export them.
                </p>
              </div>
              <button type="button" onClick={close} aria-label="Close progress" className="border border-current/20 p-1">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-5 grid gap-2">
              <button type="button" onClick={onExport} className="flex items-center gap-2 border border-current/20 px-3 py-2 text-xs">
                <Download className="h-3.5 w-3.5" /> Export progress JSON
              </button>
              <button type="button" onClick={() => inputRef.current?.click()} className="flex items-center gap-2 border border-current/20 px-3 py-2 text-xs">
                <Upload className="h-3.5 w-3.5" /> Import progress JSON
              </button>
              <input ref={inputRef} type="file" accept="application/json,.json" onChange={importFile} className="hidden" aria-label="Progress JSON file" />
            </div>

            <div className="mt-5 border-t border-current/10 pt-4">
              {confirmingReset ? (
                <div role="alertdialog" aria-label="Confirm reset progress">
                  <p className="text-xs">Reset every assessment in this browser? This cannot be undone unless you exported a backup.</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onReset();
                        setConfirmingReset(false);
                        setMessage('Progress reset.');
                      }}
                      className="border border-red-600 px-3 py-2 text-xs text-red-600"
                    >
                      Yes, reset all progress
                    </button>
                    <button type="button" onClick={() => setConfirmingReset(false)} className="border border-current/20 px-3 py-2 text-xs">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmingReset(true)} className="flex items-center gap-2 text-xs text-red-600">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset all progress
                </button>
              )}
            </div>

            {message && <p role="status" className="mt-4 text-xs">{message}</p>}
          </section>
        </div>
      )}
    </>
  );
}
