import { describe, expect, it } from 'bun:test';
import {
  getCatalogModelProvider,
  MODEL_CATALOG,
  resolveModelControls,
} from '../model-capabilities';

describe('model catalog', () => {
  it('contains unique model ids', () => {
    const ids = MODEL_CATALOG.map((model) => model.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('maps every curated model to its provider', () => {
    for (const model of MODEL_CATALOG) {
      expect(getCatalogModelProvider(model.id)).toBe(model.provider);
    }
    expect(getCatalogModelProvider('custom-model')).toBeUndefined();
  });
});

describe('resolveModelControls', () => {
  it('omits all reasoning controls in default mode', () => {
    for (const model of MODEL_CATALOG) {
      expect(resolveModelControls(model.provider, model.id, 'default')).toEqual(
        {},
      );
    }
  });

  it('maps every curated model across all explicit profiles', () => {
    const expected = [
      {
        id: 'gemini-3.5-flash-lite',
        provider: 'gemini',
        controls: {
          fast: { geminiThinking: { thinkingLevel: 'minimal' } },
          standard: { geminiThinking: { thinkingLevel: 'medium' } },
          deep: { geminiThinking: { thinkingLevel: 'high' } },
        },
      },
      {
        id: 'gemini-3.6-flash',
        provider: 'gemini',
        controls: {
          fast: { geminiThinking: { thinkingLevel: 'minimal' } },
          standard: { geminiThinking: { thinkingLevel: 'medium' } },
          deep: { geminiThinking: { thinkingLevel: 'high' } },
        },
      },
      {
        id: 'gpt-5.4-mini',
        provider: 'openai',
        controls: {
          fast: { openAiReasoningEffort: 'none' },
          standard: { openAiReasoningEffort: 'medium' },
          deep: { openAiReasoningEffort: 'high' },
        },
      },
      {
        id: 'gpt-5.6-luna',
        provider: 'openai',
        controls: {
          fast: { openAiReasoningEffort: 'none' },
          standard: { openAiReasoningEffort: 'medium' },
          deep: { openAiReasoningEffort: 'high' },
        },
      },
      {
        id: 'gpt-5.6-terra',
        provider: 'openai',
        controls: {
          fast: { openAiReasoningEffort: 'none' },
          standard: { openAiReasoningEffort: 'medium' },
          deep: { openAiReasoningEffort: 'high' },
        },
      },
      {
        id: 'MiniMax-M2.7-highspeed',
        provider: 'minimax',
        controls: { fast: {}, standard: {}, deep: {} },
      },
      {
        id: 'MiniMax-M3',
        provider: 'minimax',
        controls: {
          fast: { miniMaxThinking: 'disabled' },
          standard: { miniMaxThinking: 'adaptive' },
          deep: { miniMaxThinking: 'enabled' },
        },
      },
    ] as const;

    expect(expected.map(({ id, provider }) => ({ id, provider }))).toEqual([
      ...MODEL_CATALOG,
    ]);
    for (const model of expected) {
      for (const profile of ['fast', 'standard', 'deep'] as const) {
        expect(resolveModelControls(model.provider, model.id, profile)).toEqual(
          model.controls[profile],
        );
      }
    }
  });

  it('maps current GPT models to supported reasoning efforts', () => {
    expect(resolveModelControls('openai', 'gpt-5.6-luna', 'fast')).toEqual({
      openAiReasoningEffort: 'none',
    });
    expect(resolveModelControls('openai', 'gpt-5.6-luna', 'standard')).toEqual({
      openAiReasoningEffort: 'medium',
    });
    expect(resolveModelControls('openai', 'gpt-5.6-luna', 'deep')).toEqual({
      openAiReasoningEffort: 'high',
    });
    expect(resolveModelControls('openai', 'gpt-5.6-terra', 'fast')).toEqual({
      openAiReasoningEffort: 'none',
    });
    expect(resolveModelControls('openai', 'gpt-5.6-terra', 'standard')).toEqual(
      {
        openAiReasoningEffort: 'medium',
      },
    );
    expect(resolveModelControls('openai', 'gpt-5.6-terra', 'deep')).toEqual({
      openAiReasoningEffort: 'high',
    });
    expect(resolveModelControls('openai', 'gpt-5.4-mini', 'fast')).toEqual({
      openAiReasoningEffort: 'none',
    });
    expect(
      resolveModelControls('openai-compatible', 'gpt-5.4-mini', 'deep'),
    ).toEqual({ openAiReasoningEffort: 'high' });
  });

  it('keeps the original GPT-5 family within its supported floor', () => {
    expect(resolveModelControls('openai', 'gpt-5', 'fast')).toEqual({
      openAiReasoningEffort: 'minimal',
    });
    expect(resolveModelControls('openai', 'gpt-5-pro', 'fast')).toEqual({
      openAiReasoningEffort: 'high',
    });
    expect(resolveModelControls('openai', 'gpt-5.3-codex', 'fast')).toEqual({
      openAiReasoningEffort: 'low',
    });
  });

  it('does not infer controls from model name prefixes', () => {
    expect(resolveModelControls('openai', 'gpt-4o', 'deep')).toEqual({});
    expect(
      resolveModelControls('openai-compatible', 'custom-model', 'deep'),
    ).toEqual({});
    expect(
      resolveModelControls('openai', 'gpt-5.3-codex-snapshot', 'deep'),
    ).toEqual({});
    expect(
      resolveModelControls('gemini', 'gemini-3.2-experimental', 'deep'),
    ).toEqual({});
    expect(
      resolveModelControls('minimax', 'MiniMax-M3-preview', 'deep'),
    ).toEqual({});
    expect(
      resolveModelControls('openai-compatible', 'constructor', 'deep'),
    ).toEqual({});
  });

  it('maps Gemini thinking without adding sampling parameters', () => {
    expect(resolveModelControls('gemini', 'gemini-3.6-flash', 'fast')).toEqual({
      geminiThinking: { thinkingLevel: 'minimal' },
    });
    expect(resolveModelControls('gemini', 'gemini-2.5-pro', 'fast')).toEqual({
      geminiThinking: { thinkingBudget: 128 },
    });
    expect(resolveModelControls('gemini', 'gemini-2.5-flash', 'fast')).toEqual({
      geminiThinking: { thinkingBudget: 0 },
    });
    expect(
      resolveModelControls('gemini', 'gemini-3.1-pro-preview', 'fast'),
    ).toEqual({
      geminiThinking: { thinkingLevel: 'low' },
    });
    expect(
      resolveModelControls('gemini', 'gemini-2.5-pro', 'standard'),
    ).toEqual({ geminiThinking: { thinkingBudget: 8192 } });
    expect(resolveModelControls('gemini', 'gemini-2.5-pro', 'deep')).toEqual({
      geminiThinking: { thinkingBudget: 24576 },
    });
    expect(
      resolveModelControls('gemini', 'gemini-3.6-flash', 'standard'),
    ).toEqual({ geminiThinking: { thinkingLevel: 'medium' } });
    expect(resolveModelControls('gemini', 'gemini-3.6-flash', 'deep')).toEqual({
      geminiThinking: { thinkingLevel: 'high' },
    });
  });

  it('maps MiniMax M3 thinking and omits unsupported M2 controls', () => {
    expect(resolveModelControls('minimax', 'MiniMax-M3', 'fast')).toEqual({
      miniMaxThinking: 'disabled',
    });
    expect(resolveModelControls('minimax', 'MiniMax-M3', 'standard')).toEqual({
      miniMaxThinking: 'adaptive',
    });
    expect(resolveModelControls('minimax', 'MiniMax-M3', 'deep')).toEqual({
      miniMaxThinking: 'enabled',
    });
    expect(
      resolveModelControls('minimax', 'MiniMax-M2.7-highspeed', 'deep'),
    ).toEqual({});
  });
});
