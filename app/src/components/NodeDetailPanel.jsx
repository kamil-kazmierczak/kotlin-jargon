import React, { useMemo, useState } from 'react';
import { BookOpen, Check, ExternalLink, Link2, X } from 'lucide-react';
import { marked } from 'marked';
import { soundEffects } from '../utils/audio';
import CodeBlock from './CodeBlock';

marked.use({ gfm: true, breaks: true });

function Markdown({ children }) {
  const html = useMemo(() => marked.parse(children || ''), [children]);
  return (
    <div
      className="prose-fp prose-selectable text-xs leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function formatDepth(depth) {
  const label = depth.replace('-', ' ');
  return `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
}

export default function NodeDetailPanel({
  concept,
  categories,
  allConceptsMap,
  connectionPreview,
  onPreviewConcept,
  onStudyPreview,
  onReturnAlongTrail,
  trail,
  onClose,
  soundEnabled,
  useCategoryColors,
  isDark,
  assessment,
  assessmentOptions,
  onAssess
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [interviewReached, setInterviewReached] = useState(false);
  const [scratchAnswer, setScratchAnswer] = useState('');
  const [reasoningRevealed, setReasoningRevealed] = useState(false);
  if (!concept) return null;

  const category = categories[concept.curriculum.categoryId] || {};
  const accentColor = useCategoryColors ? (category.color || '#7c3aed') : (isDark ? '#e2e8f0' : '#1e293b');
  const prerequisites = concept.relationships.prerequisites
    .map((id) => allConceptsMap[id])
    .filter(Boolean);
  const related = concept.relationships.related.map((id) => allConceptsMap[id]).filter(Boolean);
  const previewedConcept = connectionPreview && allConceptsMap[connectionPreview.conceptId];
  const isPrerequisitePreview = connectionPreview?.relationship === 'prerequisite';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${concept.id}`);
    setCopiedLink(true);
    soundEffects.toggle(soundEnabled);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const startLesson = () => {
    document.getElementById('lesson-start')?.scrollIntoView({ behavior: 'smooth' });
  };

  const reachInterview = () => {
    setInterviewReached(true);
    setTimeout(() => document.getElementById('interview-practice')?.scrollIntoView({ behavior: 'smooth' }));
  };

  const assessmentLabel = assessmentOptions.find(({ status }) => status === assessment?.status)?.label;

  return (
    <aside
      aria-label={`${concept.title} concept`}
      className={`fixed inset-y-0 right-0 w-[500px] lg:w-[560px] backdrop-blur-md border-l z-50 flex flex-col font-mono shadow-2xl ${
        isDark
          ? 'bg-[#121212]/95 border-[rgba(240,240,238,0.15)] text-[#f0f0ee]'
          : 'bg-[#eaeae8]/98 border-[rgba(26,26,25,0.15)] text-[#1a1a19]'
      }`}
    >
      <div className={`p-5 border-b flex items-start justify-between gap-4 ${
        isDark ? 'border-[rgba(240,240,238,0.1)] bg-[#1a1a19]/60' : 'border-[rgba(26,26,25,0.1)] bg-[#dededb]/60'
      }`}>
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
            <span style={{ color: accentColor }}>{category.name}</span>
            <span className="opacity-45">#{concept.id}</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">{concept.title}</h2>
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleCopyLink} aria-label="Copy stable concept URL" className="px-2 py-1 text-xs border border-current/20 flex items-center gap-1">
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            {copiedLink ? 'Copied' : 'Share'}
          </button>
          <button onClick={onClose} aria-label="Close concept" className="px-2 py-1 text-xs border border-current/20 flex items-center gap-1">
            <span>[ Esc ]</span><X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        <section role="region" aria-labelledby="concept-overview-heading" className={`p-4 border space-y-4 ${
          isDark ? 'bg-[#1a1a19] border-white/10' : 'bg-[#dededb] border-black/10'
        }`}>
          <h3 id="concept-overview-heading" className="text-xs uppercase tracking-widest flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" /> Concept Overview
          </h3>
          <p className="text-xs leading-relaxed">{concept.lesson.overview}</p>
          <div>
            <h4 className="text-[10px] uppercase tracking-widest opacity-60 mb-1">For a Java developer</h4>
            <p className="text-xs leading-relaxed">{concept.lesson.javaDeveloperRelevance}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-[10px] uppercase tracking-wider opacity-60">Depth</dt>
              <dd>{formatDepth(concept.curriculum.depth)}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider opacity-60">Prerequisites</dt>
              <dd>{prerequisites.length === 0 ? 'None' : prerequisites.map((item) => item.title).join(', ')}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={startLesson}
            className="w-full px-3 py-2 text-xs font-semibold border text-white"
            style={{ backgroundColor: accentColor, borderColor: accentColor }}
          >
            Study this concept
          </button>
        </section>

        <section id="lesson-start" className="space-y-5 scroll-mt-4">
          <div>
            <h3 className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Semantics</h3>
            <Markdown>{concept.lesson.semantics}</Markdown>
          </div>
          <div>
            <h3 className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Example</h3>
            {concept.lesson.codeBlocks.map((block, index) => (
              <CodeBlock
                key={`${block.language}-${index}`}
                code={block.code}
                language={block.language}
                isDark={isDark}
                soundEnabled={soundEnabled}
                showLineNumbers={true}
              />
            ))}
          </div>
          <div>
            <h3 className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Connections</h3>
            <Markdown>{concept.lesson.connections}</Markdown>
          </div>
          {concept.interview && !interviewReached && (
            <button
              type="button"
              onClick={reachInterview}
              className="w-full border border-current/20 px-3 py-2 text-xs font-semibold"
            >
              Continue to interview practice
            </button>
          )}
        </section>

        {concept.interview && interviewReached && (
          <section
            id="interview-practice"
            role="region"
            aria-labelledby="interview-practice-heading"
            className={`scroll-mt-4 border p-4 space-y-4 ${isDark ? 'border-white/15 bg-[#1a1a19]' : 'border-black/15 bg-[#dededb]'}`}
          >
            <div>
              <p className="text-[10px] uppercase tracking-widest opacity-60">Reason it through</p>
              <h3 id="interview-practice-heading" className="mt-1 text-sm font-bold">Interview practice</h3>
            </div>
            <Markdown>{concept.interview.question}</Markdown>
            <label className="block text-xs">
              <span className="block mb-2 font-semibold">Optional scratch answer</span>
              <textarea
                aria-label="Optional scratch answer"
                value={scratchAnswer}
                onChange={(event) => setScratchAnswer(event.target.value)}
                rows={5}
                placeholder="Think in your own words. This is not saved."
                className="w-full resize-y border border-current/20 bg-transparent p-3 text-xs"
              />
            </label>
            <button
              type="button"
              onClick={() => setReasoningRevealed(true)}
              className="border border-current/20 px-3 py-2 text-xs font-semibold"
            >
              Reveal reasoning
            </button>

            {reasoningRevealed && (
              <div className="space-y-4 border-t border-current/10 pt-4">
                {[
                  ['Essential points', concept.interview.essentialPoints],
                  ['Trade-offs', concept.interview.tradeOffs],
                  ['Common traps', concept.interview.commonTraps],
                  ['Likely follow-up probes', concept.interview.followUpProbes]
                ].map(([heading, content]) => (
                  <div key={heading}>
                    <h4 className="mb-1 text-xs font-bold">{heading}</h4>
                    <Markdown>{content}</Markdown>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 border-t border-current/10 pt-4">
              <div>
                <h4 className="text-xs font-bold">Assess your understanding</h4>
                <p className="mt-1 text-[11px] opacity-70">
                  These are your own judgments, not scores or certification.
                </p>
              </div>
              <p className="text-xs">
                {assessment
                  ? `Assessed ${assessment.assessedAt} · ${assessmentLabel}`
                  : 'Not assessed'}
              </p>
              <div className="flex flex-wrap gap-2">
                {assessmentOptions.map(({ status, label }) => (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={assessment?.status === status}
                    onClick={() => onAssess(status)}
                    className="border border-current/20 px-3 py-2 text-xs"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {prerequisites.length > 0 && (
          <section>
            <h3 className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Best understood after</h3>
            {prerequisites.map((prerequisite) => (
              <button key={prerequisite.id} onClick={() => onPreviewConcept({ conceptId: prerequisite.id, relationship: 'prerequisite' })} className="text-xs underline">
                {prerequisite.title}
              </button>
            ))}
          </section>
        )}

        {related.length > 0 && (
          <section>
            <h3 className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Related concepts</h3>
            <p className="text-xs opacity-70 mb-2">Related concepts provide context; they are not a required order.</p>
            {related.map((item) => <button key={item.id} onClick={() => onPreviewConcept({ conceptId: item.id, relationship: 'related' })} className="text-xs underline mr-3">{item.title}</button>)}
          </section>
        )}

        {trail.length > 0 && (
          <button type="button" onClick={onReturnAlongTrail} className="text-xs underline">
            Return to {allConceptsMap[trail.at(-1).conceptId]?.title} lesson
          </button>
        )}

        <section>
          <h3 className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Sources</h3>
          <ul className="space-y-1.5">
            {concept.provenance.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex gap-1.5 text-xs hover:underline">
                  <ExternalLink className="w-3 h-3 shrink-0" /> {source.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {previewedConcept && (
        <section
          role="dialog"
          aria-label={`Concept preview: ${previewedConcept.title}`}
          className={`absolute inset-x-4 top-24 z-10 border p-5 shadow-xl ${
            isDark ? 'bg-[#1a1a19] border-white/20' : 'bg-[#dededb] border-black/20'
          }`}
        >
          <p className="text-[10px] uppercase tracking-widest opacity-60">
            {isPrerequisitePreview ? 'Prerequisite concept' : 'Related concept'}
          </p>
          <h3 className="mt-1 text-lg font-bold">{previewedConcept.title}</h3>
          <p className="mt-3 text-xs leading-relaxed">{previewedConcept.lesson.overview}</p>
          <p className="mt-3 text-xs opacity-70">
            This is {isPrerequisitePreview ? 'a prerequisite for' : 'related to'} {concept.title}.
          </p>
          <div className="mt-4 flex gap-3 text-xs">
            <button type="button" onClick={() => onPreviewConcept(null)} className="border border-current/20 px-3 py-2">
              Return to {concept.title} lesson
            </button>
            <button type="button" onClick={() => onStudyPreview(previewedConcept.id)} className="border border-current/20 px-3 py-2 font-semibold">
              Study {previewedConcept.title}
            </button>
          </div>
        </section>
      )}

      <div className={`p-3.5 border-t flex justify-between text-[10px] ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <span>Verified {concept.provenance.verifiedAt}</span>
        <span>{concept.provenance.baselineId}</span>
      </div>
    </aside>
  );
}
