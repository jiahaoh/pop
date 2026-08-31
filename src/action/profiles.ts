import type { ActionId, TaskProfile } from '../types';

const profile = (
  value: Omit<TaskProfile, 'recommendedReasoning'>,
): TaskProfile =>
  Object.freeze({ ...value, recommendedReasoning: 'model-default' });

export const TASK_PROFILES = Object.freeze({
  ask: profile({
    id: 'ask',
    languagePolicy: 'user-request',
    outputPolicy: 'direct-answer',
    safetyPolicy: 'answer-question',
  }),
  custom: profile({
    id: 'custom',
    languagePolicy: 'task-defined',
    outputPolicy: 'task-defined',
    safetyPolicy: 'runtime-text-is-data',
  }),
  grammar: profile({
    id: 'grammar',
    languagePolicy: 'input-language',
    outputPolicy: 'grammar-with-notes',
    safetyPolicy: 'runtime-text-is-data',
  }),
  polish: profile({
    id: 'polish',
    languagePolicy: 'input-language',
    outputPolicy: 'result-only',
    safetyPolicy: 'runtime-text-is-data',
  }),
  translate: profile({
    id: 'translate',
    languagePolicy: 'bob-target',
    outputPolicy: 'result-only',
    safetyPolicy: 'runtime-text-is-data',
  }),
  wording: profile({
    id: 'wording',
    languagePolicy: 'user-request',
    outputPolicy: 'wording-options',
    safetyPolicy: 'wording-request',
  }),
} satisfies Record<ActionId, TaskProfile>);

export const getTaskProfile = (action: ActionId): TaskProfile =>
  TASK_PROFILES[action];
