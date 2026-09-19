import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { marked } from 'marked';
import CodeBlock from './CodeBlock';

marked.use({ gfm: true, breaks: true });

const SECTIONS = [
  ['mental-model', 'Mental model'],
  ['semantics', 'Semantics'],
  ['worked-example', 'Worked example'],
  ['java-comparison', 'Java comparison'],
  ['common-mistakes', 'Common mistakes'],
  ['decision-guidance', 'Decision guidance'],
  ['knowledge-check', 'Knowledge check'],
  ['interview-question', 'Interview question'],
  ['model-reasoning', 'Model reasoning'],
  ['sources', 'Sources']
];

function Markdown({ children }) {
  const html = useMemo(() => marked.parse((children || '').replace(/```[^\n]*\n[\s\S]*?```/g, '')), [children]);
  return <div className="prose-fp prose-selectable text-sm leading-7" dangerouslySetInnerHTML={{ __html: html }} />;
}

function Section({ id, title, children }) {
  return <section id={id} data-lesson-section className="scroll-mt-8 border-b border-current/10 pb-10 last:border-0">
    <h2 className="mb-4 text-lg font-bold tracking-tight">{title}</h2>
    {children}
  </section>;
}

export default function FocusedLesson({ concept, studyPaths, onBack, onNavigate, isDark, soundEnabled }) {
  const [activeSection, setActiveSection] = useState('mental-model');
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);
  const readingColumn = useRef(null);
  const sections = concept.lesson.sections;
  const studyPath = studyPaths.find((path) => path.conceptIds.includes(concept.id));
  const position = studyPath?.conceptIds.indexOf(concept.id) ?? -1;
  const previousId = position > 0 ? studyPath.conceptIds[position - 1] : null;
  const nextId = position >= 0 && position < studyPath.conceptIds.length - 1 ? studyPath.conceptIds[position + 1] : null;

  useEffect(() => {
    const root = readingColumn.current;
    if (!root) return undefined;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { root, threshold: [0.25, 0.6] });
    root.querySelectorAll('[data-lesson-section]').forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [concept.id]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  const codeBlock = (index) => {
    const block = concept.lesson.codeBlocks[index];
    return block && <CodeBlock {...block} isDark={isDark} soundEnabled={soundEnabled} showLineNumbers />;
  };

  return (
    <section aria-label={`${concept.title} focused lesson`} className={`pointer-events-none fixed inset-0 z-40 flex justify-center pt-[58px] font-mono ${isDark ? 'text-[#f0f0ee]' : 'text-[#1a1a19]'}`}>
      <aside aria-label="Lesson navigation" className={`pointer-events-auto absolute inset-y-[58px] left-0 w-72 border-r p-5 ${isDark ? 'bg-[#121212]/95 border-white/10' : 'bg-[#eaeae8]/95 border-black/10'}`}>
        <button type="button" onClick={onBack} className="mb-8 flex items-center gap-2 text-xs underline underline-offset-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to graph
        </button>
        <p className="mb-2 text-[10px] uppercase tracking-widest opacity-60">Lesson outline</p>
        <nav aria-label="Lesson outline">
          <ol className="space-y-1">
            {SECTIONS.map(([id, label]) => <li key={id}>
              <button type="button" onClick={() => scrollTo(id)} aria-current={activeSection === id ? 'location' : undefined} className={`w-full px-2 py-1.5 text-left text-xs ${activeSection === id ? 'border-l-2 border-current font-bold' : 'opacity-60 hover:opacity-100'}`}>{label}</button>
            </li>)}
          </ol>
        </nav>
      </aside>

      <div ref={readingColumn} className={`pointer-events-auto ml-72 w-[min(900px,calc(100vw-22rem))] overflow-y-auto border-x ${isDark ? 'bg-[#181817]/95 border-white/10' : 'bg-[#f4f4f2]/95 border-black/10'}`}>
        <article className="mx-auto max-w-3xl px-10 py-12">
          <p className="text-[10px] uppercase tracking-widest opacity-60">Focused lesson · {concept.curriculum.depth}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">{concept.title}</h1>
          <div className="mt-6 space-y-10">
            <Section id="mental-model" title="Mental model"><Markdown>{sections['Mental model']}</Markdown></Section>
            <Section id="semantics" title="Semantics"><Markdown>{sections.Semantics}</Markdown></Section>
            <Section id="worked-example" title="Worked example"><Markdown>{sections['Worked example']}</Markdown>{codeBlock(0)}<div className="mt-4">{codeBlock(1)}</div></Section>
            <Section id="java-comparison" title="Java comparison"><Markdown>{sections['Java comparison']}</Markdown>{codeBlock(2)}</Section>
            <Section id="common-mistakes" title="Common mistakes"><Markdown>{sections['Common mistakes']}</Markdown></Section>
            <Section id="decision-guidance" title="Decision guidance"><Markdown>{sections['Decision guidance']}</Markdown></Section>
            <Section id="knowledge-check" title="Knowledge check"><Markdown>{sections['Knowledge check']}</Markdown></Section>
            <Section id="interview-question" title="Interview question"><Markdown>{sections['Interview question']}</Markdown></Section>
            <Section id="model-reasoning" title="Model reasoning"><Markdown>{sections['Model reasoning']}</Markdown></Section>
            <section className="border-b border-current/10 pb-10">
              <button type="button" onClick={() => setDeepDiveOpen((open) => !open)} aria-expanded={deepDiveOpen} className="flex w-full items-center justify-between text-left text-lg font-bold"><span>Deep Dive (version-sensitive)</span><ChevronDown className={`h-5 w-5 transition-transform ${deepDiveOpen ? 'rotate-180' : ''}`} /></button>
              {deepDiveOpen && <div className="mt-4"><Markdown>{sections['Deep Dive']}</Markdown></div>}
            </section>
            <Section id="sources" title="Sources"><Markdown>{sections.Sources}</Markdown></Section>
          </div>
          <nav aria-label="Study path navigation" className="mt-10 flex justify-between gap-4">
            <button type="button" disabled={!previousId} onClick={() => onNavigate(previousId)} className="flex items-center gap-1 border px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft className="h-4 w-4" /> Previous</button>
            <button type="button" disabled={!nextId} onClick={() => onNavigate(nextId)} className="flex items-center gap-1 border px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-30">Next <ChevronRight className="h-4 w-4" /></button>
          </nav>
        </article>
      </div>
    </section>
  );
}
