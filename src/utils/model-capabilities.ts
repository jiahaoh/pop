/**
 * Model capabilities for OpenAI and Gemini models.
 * Based on Vercel AI SDK: https://github.com/vercel/ai/blob/fad04b2e4ad6f927daebb5e7e342f0a98d35c3cd/packages/openai/src/openai-language-model-capabilities.ts
 */

interface ReasoningConfig {
  prefix: string;
  defaultEffort: string;
}

// Sorted by prefix length descending for longest-prefix matching.
// Reference: https://developers.openai.com/api/docs/guides/reasoning
const REASONING_CONFIGS: ReasoningConfig[] = [
  { prefix: 'gpt-5.4-pro', defaultEffort: 'medium' },
  { prefix: 'gpt-5.4', defaultEffort: 'low' },
  { prefix: 'gpt-5.2', defaultEffort: 'low' },
  { prefix: 'gpt-5.1', defaultEffort: 'low' },
  { prefix: 'gpt-5-', defaultEffort: 'minimal' },
  { prefix: 'gpt-5', defaultEffort: 'minimal' },
];

const findReasoningConfig = (model: string): ReasoningConfig | undefined => {
  return REASONING_CONFIGS.find((config) => model.startsWith(config.prefix));
};

// Based on Vercel AI SDK: https://github.com/vercel/ai/blob/main/packages/openai/src/openai-language-model-capabilities.ts
const isReasoningModel = (model: string): boolean => {
  const isGptChatModel = model.startsWith('gpt-') && model.includes('-chat');
  return !(
    model.startsWith('gpt-3') ||
    model.startsWith('gpt-4') ||
    model.startsWith('chatgpt-4o') ||
    isGptChatModel
  );
};

export const getDefaultReasoningEffort = (
  model: string,
): string | undefined => {
  if (!isReasoningModel(model)) return undefined;
  return findReasoningConfig(model)?.defaultEffort ?? 'low';
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
