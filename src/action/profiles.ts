import type {
  ActionId,
  ReasoningMode,
  ReasoningProfile,
  TaskProfile,
} from '../types';

const profile = (value: TaskProfile): TaskProfile => Object.freeze(value);

export const TASK_PROFILES = Object.freeze({
  ask: profile({
    id: 'ask',
    languagePolicy: 'user-request',
    outputPolicy: 'direct-answer',
    recommendedReasoning: 'standard',
    safetyPolicy: 'answer-question',
  }),
  custom: profile({
    id: 'custom',
    languagePolicy: 'task-defined',
    outputPolicy: 'task-defined',
    recommendedReasoning: 'standard',
    safetyPolicy: 'runtime-text-is-data',
  }),
  grammar: profile({
    id: 'grammar',
    languagePolicy: 'input-language',
    outputPolicy: 'grammar-with-notes',
    recommendedReasoning: 'standard',
    safetyPolicy: 'runtime-text-is-data',
  }),
  polish: profile({
    id: 'polish',
    languagePolicy: 'input-language',
    outputPolicy: 'result-only',
    recommendedReasoning: 'standard',
    safetyPolicy: 'runtime-text-is-data',
  }),
  translate: profile({
    id: 'translate',
    languagePolicy: 'bob-target',
    outputPolicy: 'result-only',
    recommendedReasoning: 'fast',
    safetyPolicy: 'runtime-text-is-data',
  }),
  wording: profile({
    id: 'wording',
    languagePolicy: 'user-request',
    outputPolicy: 'wording-options',
    recommendedReasoning: 'standard',
    safetyPolicy: 'wording-request',
  }),
} satisfies Record<ActionId, TaskProfile>);

export const getTaskProfile = (action: ActionId): TaskProfile =>
  TASK_PROFILES[action];

export const resolveTaskReasoning = (
  mode: ReasoningMode,
  recommended: ReasoningProfile,
): ReasoningProfile => (mode === 'auto' ? recommended : mode);
