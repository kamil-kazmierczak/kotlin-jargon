# Decide how learners practise and judge progress

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Assignee: Codex
Parent: [Plan a Kotlin interview learning app for an experienced Java developer](../map.md)
Blocked by: 03, 06

## Question

How should the focused interview questions and group-ending scenarios be practised, answered, and evaluated, and what—if anything—should the app remember as evidence of progress?

Decide whether practice is entirely self-assessed or needs structured feedback, how revealable answers support reasoning rather than memorisation, whether progress exists only at concept level or also at curriculum-group level, and whether any state must persist across visits. Use the agreed understanding criteria and the interaction model chosen for deep concept reading. Do not write the question bank, implement persistence, or design a general certification system.

## Answer

Practice is structured self-assessment. The app does not automatically grade free-form reasoning and makes no certification claim. It helps the learner compare their answer with an authored reasoning rubric containing the essential points, trade-offs, common traps, and likely follow-up probes.

### Focused interview questions

Each focused interview question provides optional scratch space. The learner may write an answer before choosing `Considered my answer—show reasoning`, but input is never required because lessons must remain useful as reference material. Scratch answers exist only for the current interaction and are not persisted.

Revealing an answer shows the reasoning rubric rather than a short response to memorize. Answers and rubrics begin hidden on every new visit. The app does not remember reveal state, and revealing an answer never changes progress.

After comparing their reasoning with the rubric, the learner may explicitly assess the concept as:

- **Needs review**: the learner identified gaps that require more study;
- **Can explain**: the learner can explain the core purpose, semantics, and representative examples; or
- **Interview-ready**: the learner can additionally reason about trade-offs, common mistakes, design choices, and follow-up probes.

A concept without an explicit assessment is **Not assessed**. These states are learner-owned judgments, not scores. Reading a lesson, reaching its end, or revealing its answer does not imply any state.

The rubric may present the detailed understanding criteria—such as predicting behavior, comparing with Java, diagnosing a mistake, or choosing when to use a feature—but the app does not persist a checklist of those facets. It stores only the concept's latest overall assessment and assessment date.

### Group-ending scenarios

Each curriculum group ends with a staged scenario rather than one large prompt followed by one model answer. At each stage, the learner predicts behavior, diagnoses a problem, or makes a design choice before deliberately revealing brief feedback. The next stage can then introduce another constraint. A final debrief connects the decisions across concepts, explains the important trade-offs, and provides the rubric for group-level self-assessment.

Group readiness is independent evidence rather than an average of concept states. A group has one of these learner-declared scenario states:

- **Not attempted**;
- **Needs review**; or
- **Scenario-ready**.

Concept coverage may be summarized beside the scenario state, but it does not automatically determine that state.

### Persistence and visibility

Concept assessments and group-scenario assessments persist locally in the browser across visits. The initial app has no account, backend, or cross-device synchronization. Reassessment replaces the current state and updates its assessment date; the learner may promote or downgrade a state freely. The initial app keeps no assessment-history timeline.

The learner can reset all progress and export or import it as versioned JSON. Import must validate the data before replacing current progress. This provides backup and manual device transfer without introducing identity or synchronization infrastructure.

The graph uses subtle markers for concept assessment states. Curriculum groups show a compact summary of concept assessments alongside their independent scenario state, and learners may filter for states such as **Needs review**. Progress markers and filters do not hide prerequisites or change the meaning of graph edges. The app does not use completion percentages, streaks, points, or celebratory gamification, because those would reward traversal rather than deep understanding.
