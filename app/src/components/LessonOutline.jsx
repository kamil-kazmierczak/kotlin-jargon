import React, { useEffect, useState } from 'react';

export default function LessonOutline({ sections, readingColumn, onBack }) {
  const [activeSection, setActiveSection] = useState(sections[0]?.[0]);
  useEffect(() => {
    const root = readingColumn.current;
    const trackSection = () => {
      const top = root.getBoundingClientRect().top;
      let current = sections[0]?.[0];
      for (const [id] of sections) {
        const section = root.querySelector(`#${id}`);
        if (section && section.getBoundingClientRect().top <= top + 48) current = id;
      }
      setActiveSection(current);
    };
    trackSection();
    root.addEventListener('scroll', trackSection);
    return () => root.removeEventListener('scroll', trackSection);
  }, [sections, readingColumn]);

  return <nav aria-label="Lesson outline" className="w-56 shrink-0 overflow-y-auto border-r border-current/15 p-5 text-xs">
    <button type="button" onClick={onBack} className="mb-6 underline">Back to graph</button>
    <p className="mb-3 font-bold">Lesson outline</p>
    <ol className="space-y-1">
      {sections.map(([id, label]) => <li key={id}>
        <button type="button" aria-current={activeSection === id ? 'location' : undefined}
          className={`w-full border-l-2 px-2 py-2 text-left ${activeSection === id ? 'border-current font-bold' : 'border-transparent opacity-60'}`}
          onClick={() => readingColumn.current.querySelector(`#${id}`)?.scrollIntoView({ block: 'start' })}>
          {label}
        </button>
      </li>)}
    </ol>
  </nav>;
}
