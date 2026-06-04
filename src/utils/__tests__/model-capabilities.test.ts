import { describe, expect, it } from 'bun:test';
import {
  getDefaultReasoningEffort,
  getThinkingReasoningEffort,
} from '../model-capabilities';

describe('getDefaultReasoningEffort (Thinking Mode off floor)', () => {
  it('returns high for the original gpt-5-pro, which is high-only', () => {
    expect(getDefaultReasoningEffort('gpt-5-pro')).toBe('high');
    expect(getDefaultReasoningEffort('gpt-5-pro-2026-01-15')).toBe('high');
  });

  it('returns medium for dotted pro variants', () => {
    expect(getDefaultReasoningEffort('gpt-5.4-pro')).toBe('medium');
    expect(getDefaultReasoningEffort('gpt-5.5-pro')).toBe('medium');
  });

  it('returns low for dotted non-pro versions', () => {
    expect(getDefaultReasoningEffort('gpt-5.5')).toBe('low');
    expect(getDefaultReasoningEffort('gpt-5.4-mini')).toBe('low');
    expect(getDefaultReasoningEffort('gpt-5.1')).toBe('low');
  });

  it('returns minimal for the original gpt-5 family', () => {
    expect(getDefaultReasoningEffort('gpt-5')).toBe('minimal');
    expect(getDefaultReasoningEffort('gpt-5-mini')).toBe('minimal');
    expect(getDefaultReasoningEffort('gpt-5-nano')).toBe('minimal');
  });

  it('does not misread gpt-5-proto as a pro variant', () => {
    expect(getDefaultReasoningEffort('gpt-5-proto')).toBe('minimal');
  });

  it('returns undefined for non-reasoning and third-party models', () => {
    expect(getDefaultReasoningEffort('gpt-4o')).toBeUndefined();
    expect(getDefaultReasoningEffort('MiniMax-M3')).toBeUndefined();
    expect(getDefaultReasoningEffort('claude-3-pro')).toBeUndefined();
  });
});

describe('getThinkingReasoningEffort (Thinking Mode on)', () => {
  it('keeps gpt-5-pro at high instead of downgrading below its floor', () => {
    // Regression guard: a flat 'medium' here is rejected by gpt-5-pro (high-only).
    expect(getThinkingReasoningEffort('gpt-5-pro')).toBe('high');
    expect(getThinkingReasoningEffort('gpt-5-pro-2026-01-15')).toBe('high');
  });

  it('bumps lower-floor reasoning models up to medium', () => {
    expect(getThinkingReasoningEffort('gpt-5')).toBe('medium'); // floor minimal
    expect(getThinkingReasoningEffort('gpt-5.4-mini')).toBe('medium'); // floor low
    expect(getThinkingReasoningEffort('gpt-5.4-pro')).toBe('medium'); // floor medium
  });

  it('returns medium for non-reasoning models', () => {
    expect(getThinkingReasoningEffort('gpt-4o')).toBe('medium');
  });
});
