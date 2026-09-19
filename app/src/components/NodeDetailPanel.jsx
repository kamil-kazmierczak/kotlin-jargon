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
  onSelectConcept,
  onStartLesson,
  onClose,
  soundEnabled,
  useCategoryColors,
  isDark
}) {
  const [copiedLink, setCopiedLink] = useState(false);
  if (!concept) return null;

  const category = categories[concept.curriculum.categoryId] || {};
  const accentColor = useCategoryColors ? (category.color || '#7c3aed') : (isDark ? '#e2e8f0' : '#1e293b');
  const prerequisites = concept.relationships.prerequisites
    .map((id) => allConceptsMap[id])
    .filter(Boolean);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#${concept.id}`);
    setCopiedLink(true);
    soundEffects.toggle(soundEnabled);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isFocusedLesson = concept.profile === 'focused';
  const startLesson = () => {
    if (isFocusedLesson) {
      onStartLesson?.();
    } else {
      document.getElementById('lesson-start')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
            {isFocusedLesson ? 'Study focused lesson' : 'Study this concept'}
          </button>
        </section>

        {!isFocusedLesson && <section id="lesson-start" className="space-y-5 scroll-mt-4">
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
        </section>}

        {prerequisites.length > 0 && (
          <section>
            <h3 className="text-[10px] uppercase tracking-widest opacity-60 mb-2">Best understood after</h3>
            {prerequisites.map((prerequisite) => (
              <button key={prerequisite.id} onClick={() => onSelectConcept(prerequisite.id)} className="text-xs underline">
                {prerequisite.title}
              </button>
            ))}
          </section>
        )}

        {!isFocusedLesson && <section>
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
        </section>}
      </div>

      <div className={`p-3.5 border-t flex justify-between text-[10px] ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <span>Verified {concept.provenance.verifiedAt}</span>
        <span>{concept.provenance.baselineId}</span>
      </div>
    </aside>
  );
}
