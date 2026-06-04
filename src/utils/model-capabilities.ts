/**
 * Model capabilities for OpenAI and Gemini models.
 * Based on Vercel AI SDK: https://github.com/vercel/ai/blob/fad04b2e4ad6f927daebb5e7e342f0a98d35c3cd/packages/openai/src/openai-language-model-capabilities.ts
 */

interface ReasoningConfig {
  prefix: string;
  // Effort floor when Thinking Mode is off (a low-latency minimum, not the model's API default).
  defaultEffort: string;
  // Floor for this family's '-pro' variant, which rejects 'low'/'minimal'. Omitted when the
  // family has no pro variant.
  proEffort?: string;
}

// Reasoning floors per GPT-5 family, applied when Thinking Mode is off. Matched by longest prefix
// first, so bare 'gpt-5' stays last and never shadows the more specific rules.
// - Dotted minor versions (GPT-5.1+): non-pro 'low', pro 'medium' (5.x-pro accepts
//   medium/high/xhigh). One 'gpt-5.' rule covers every minor version and its pro variant.
// - Original GPT-5 family ('gpt-5', 'gpt-5-mini', 'gpt-5-pro'): non-pro 'minimal',
//   'gpt-5-pro' is high-only.
// Refs: https://developers.openai.com/api/docs/guides/reasoning,
//       https://developers.openai.com/api/docs/models/gpt-5-pro (high-only).
const REASONING_CONFIGS: ReasoningConfig[] = [
  { prefix: 'gpt-5.', defaultEffort: 'low', proEffort: 'medium' },
  { prefix: 'gpt-5-', defaultEffort: 'minimal', proEffort: 'high' },
  { prefix: 'gpt-5', defaultEffort: 'minimal' },
];

const findReasoningConfig = (model: string): ReasoningConfig | undefined => {
  return REASONING_CONFIGS.find((config) => model.startsWith(config.prefix));
};

const isReasoningModel = (model: string): boolean => {
  return findReasoningConfig(model) !== undefined;
};

// '-pro' matched on segment boundaries (a trailing '-pro', or '-pro-' before a dated snapshot
// like 'gpt-5.5-pro-2026-01-15') so 'gpt-5-proto' is not misread as pro.
const isProVariant = (model: string): boolean => {
  return model.endsWith('-pro') || model.includes('-pro-');
};

export const getDefaultReasoningEffort = (
  model: string,
): string | undefined => {
  // findReasoningConfig is the allowlist gate: a third-party '...-pro' model has no GPT-5 family
  // config, so it returns undefined here and never reaches the pro branch.
  const config = findReasoningConfig(model);
  if (!config) return undefined;
  return isProVariant(model)
    ? (config.proEffort ?? config.defaultEffort)
    : config.defaultEffort;
};

// Reasoning effort levels ordered low to high, for picking the higher of two efforts.
const EFFORT_RANK = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh'];

// Effort to use when Thinking Mode is on: at least 'medium', but never below the model's floor,
// since some models reject lower values (gpt-5-pro is high-only, so it stays 'high'). Non-reasoning
// models have no floor and get 'medium', preserving the prior always-'medium' behavior.
export const getThinkingReasoningEffort = (model: string): string => {
  const floor = getDefaultReasoningEffort(model);
  if (!floor) return 'medium';
  return EFFORT_RANK.indexOf(floor) > EFFORT_RANK.indexOf('medium')
    ? floor
    : 'medium';
};

export const supportsTemperature = (
  model: string,
  reasoningEffort?: string,
): boolean => {
  if (!isReasoningModel(model)) return true;
  // GPT-5.1+ support temperature only when reasoning effort is explicitly 'none'
  // GPT-5 (original) never supports temperature
  return reasoningEffort === 'none';
};

const geminiSupportsThinking = (model: string): boolean => {
  return (
    model.includes('thinking') ||
    model.includes('gemini-2.5') ||
    model.includes('gemini-3')
  );
};

export const getGeminiMinimalThinkingConfig = (
  model: string,
): Record<string, unknown> | undefined => {
  if (!geminiSupportsThinking(model)) {
    return undefined;
  }

  // Gemini 3 series uses thinkingLevel, Gemini 2.5 series uses thinkingBudget
  if (model.includes('gemini-3')) {
    return { thinkingLevel: 'minimal' };
  }

  return { thinkingBudget: 0 };
};
