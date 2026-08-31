import { describe, expect, it } from 'bun:test';
import type { TextTranslateQuery } from '@bob-translate/types';
import { TASK_PROFILES } from '../profiles';
import { resolveTask } from '../resolve';

const query = (detectFrom: string, detectTo: string) =>
  ({
    text: 'Hello',
    detectFrom,
    detectTo,
  }) as unknown as TextTranslateQuery;

describe('TaskProfile registry', () => {
  it('defines all six frozen provider-neutral actions', () => {
    expect(Object.keys(TASK_PROFILES)).toEqual([
      'ask',
      'custom',
      'grammar',
      'polish',
      'translate',
      'wording',
    ]);
    expect(Object.isFrozen(TASK_PROFILES)).toBe(true);
    for (const profile of Object.values(TASK_PROFILES)) {
      expect(Object.isFrozen(profile)).toBe(true);
      expect(profile.recommendedReasoning).toBe('model-default');
    }
  });

  it('records the frozen language, output, and safety policies', () => {
    expect(TASK_PROFILES.translate).toMatchObject({
      languagePolicy: 'bob-target',
      outputPolicy: 'result-only',
      safetyPolicy: 'runtime-text-is-data',
    });
    expect(TASK_PROFILES.polish).toMatchObject({
      languagePolicy: 'input-language',
      outputPolicy: 'result-only',
      safetyPolicy: 'runtime-text-is-data',
    });
    expect(TASK_PROFILES.grammar).toMatchObject({
      languagePolicy: 'input-language',
      outputPolicy: 'grammar-with-notes',
      safetyPolicy: 'runtime-text-is-data',
    });
    expect(TASK_PROFILES.ask).toMatchObject({
      languagePolicy: 'user-request',
      outputPolicy: 'direct-answer',
      safetyPolicy: 'answer-question',
    });
    expect(TASK_PROFILES.wording).toMatchObject({
      languagePolicy: 'user-request',
      outputPolicy: 'wording-options',
      safetyPolicy: 'wording-request',
    });
    expect(TASK_PROFILES.custom).toMatchObject({
      languagePolicy: 'task-defined',
      outputPolicy: 'task-defined',
      safetyPolicy: 'runtime-text-is-data',
    });
  });
});

describe('default task resolver', () => {
  it('uses Translate when Bob source and target differ', () => {
    expect(
      resolveTask(query('en', 'zh-Hans'), {
        action: null,
        explicit: false,
        text: 'Hello',
      }),
    ).toMatchObject({
      action: 'translate',
      explicit: false,
      sourceLanguage: 'en',
      targetLanguage: 'zh-CN',
    });
  });

  it('uses Polish when Bob source and target match', () => {
    expect(
      resolveTask(query('en', 'en'), {
        action: null,
        explicit: false,
        text: 'Hello',
      }),
    ).toMatchObject({ action: 'polish', explicit: false });
  });

  it('lets an explicit command override the Bob language route', () => {
    expect(
      resolveTask(query('en', 'zh-Hans'), {
        action: 'ask',
        explicit: true,
        text: 'Why?',
      }),
    ).toMatchObject({ action: 'ask', explicit: true, text: 'Why?' });
  });
});
