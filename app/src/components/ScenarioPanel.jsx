import React, { useState } from 'react';
import { X } from 'lucide-react';
import { GROUP_ASSESSMENT_DEFINITIONS } from '../state/progress.mjs';

const GROUP_OPTIONS = GROUP_ASSESSMENT_DEFINITIONS.filter(({ durable }) => durable);

export default function ScenarioPanel({ group, assessment, isDark, onAssess, onClose }) {
  const [scratch, setScratch] = useState({});
  const [revealedCount, setRevealedCount] = useState(0);
  const { scenario } = group;
  const complete = revealedCount === scenario.stages.length;

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/45 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="scenario-heading"
        className={`flex max-h-[92vh] w-full max-w-3xl flex-col border shadow-2xl ${
          isDark ? 'border-white/20 bg-[#121212] text-[#f0f0ee]' : 'border-black/20 bg-[#eaeae8] text-[#1a1a19]'
        }`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-current/10 p-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">{group.name} · staged scenario</p>
            <h2 id="scenario-heading" className="mt-1 text-lg font-bold">{scenario.title}</h2>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed opacity-80">{scenario.context}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close scenario" className="border border-current/20 p-1.5">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {scenario.stages.slice(0, Math.min(revealedCount + 1, scenario.stages.length)).map((stage, index) => {
            const revealed = index < revealedCount;
            const active = index === revealedCount;
            return (
              <article key={stage.id} aria-label={`Stage ${index + 1}: ${stage.kind}`} className="border border-current/15 p-4">
                <p className="text-[10px] uppercase tracking-widest opacity-60">Stage {index + 1} · {stage.kind}</p>
                <h3 className="mt-2 text-sm font-semibold leading-relaxed">{stage.prompt}</h3>
                <label className="mt-4 block text-xs">
                  <span className="mb-2 block font-semibold">Your scratch work</span>
                  <textarea
                    aria-label={`Stage ${index + 1} scratch work`}
                    value={scratch[stage.id] || ''}
                    disabled={revealed}
                    onChange={(event) => setScratch((current) => ({ ...current, [stage.id]: event.target.value }))}
                    className="min-h-24 w-full resize-y border border-current/20 bg-transparent p-3 outline-none focus:border-current disabled:opacity-60"
                    placeholder="Commit to a prediction, diagnosis, or design choice before revealing feedback."
                  />
                </label>
                {active && (
                  <button
                    type="button"
                    disabled={!scratch[stage.id]?.trim()}
                    onClick={() => setRevealedCount((count) => count + 1)}
                    className="mt-3 border border-current/30 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Reveal stage {index + 1} feedback
                  </button>
                )}
                {revealed && (
                  <div className="mt-4 space-y-3 border-t border-current/10 pt-4 text-xs leading-relaxed">
                    <div>
                      <p className="mb-1 text-[10px] uppercase tracking-widest opacity-60">Focused feedback</p>
                      <p>{stage.feedback}</p>
                    </div>
                    <div className="border-l-2 border-amber-500 pl-3">
                      <p className="mb-1 text-[10px] uppercase tracking-widest text-amber-600">Next constraint</p>
                      <p>{stage.nextConstraint}</p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}

          {complete && (
            <section role="region" aria-labelledby="scenario-debrief-heading" className="border-2 border-current/30 p-4">
              <p className="text-[10px] uppercase tracking-widest opacity-60">Across the curriculum group</p>
              <h3 id="scenario-debrief-heading" className="mt-1 text-base font-bold">Final debrief</h3>
              <div className="mt-4 space-y-4 text-xs leading-relaxed">
                <div><h4 className="font-bold">How the decisions connect</h4><p className="mt-1">{scenario.debrief.connections}</p></div>
                <div><h4 className="font-bold">Trade-offs</h4><p className="mt-1">{scenario.debrief.tradeOffs}</p></div>
                <div>
                  <h4 className="font-bold">Group-level reasoning rubric</h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5">{scenario.debrief.rubric.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              </div>
              <div className="mt-5 border-t border-current/10 pt-4">
                <p className="text-xs font-bold">Set independent group readiness</p>
                <p className="mt-1 text-[11px] opacity-70">This does not change or average your concept assessments.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {GROUP_OPTIONS.map((option) => (
                    <button
                      key={option.status}
                      type="button"
                      aria-pressed={assessment?.status === option.status}
                      onClick={() => onAssess(option.status)}
                      className={`border px-3 py-2 text-xs ${assessment?.status === option.status ? 'border-amber-500 text-amber-600' : 'border-current/20'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[11px]" role="status">
                  {assessment ? `Assessed ${assessment.assessedAt} · ${GROUP_OPTIONS.find(({ status }) => status === assessment.status)?.label}` : 'Not attempted'}
                </p>
              </div>
            </section>
          )}
        </div>
      </section>
    </div>
  );
}
