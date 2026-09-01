import type { ReasoningProfile, ServiceProvider } from '../types';

export const DEFAULT_MODEL = 'gpt-5.6-luna';

export const MODEL_CATALOG = Object.freeze([
  {
    id: 'gemini-3.5-flash-lite',
    provider: 'gemini',
  },
  {
    id: 'gemini-3.6-flash',
    provider: 'gemini',
  },
  {
    id: 'gpt-5.4-mini',
    provider: 'openai',
  },
  {
    id: 'gpt-5.6-luna',
    provider: 'openai',
  },
  {
    id: 'gpt-5.6-terra',
    provider: 'openai',
  },
  {
    id: 'MiniMax-M2.7-highspeed',
    provider: 'minimax',
  },
  {
    id: 'MiniMax-M3',
    provider: 'minimax',
  },
] as const);

export type OpenAiReasoningEffort =
  | 'high'
  | 'low'
  | 'medium'
  | 'minimal'
  | 'none';

export type GeminiThinkingConfig =
  | { readonly thinkingBudget: number }
  | {
      readonly thinkingLevel: 'high' | 'low' | 'medium' | 'minimal';
    };

export interface ModelControls {
  readonly geminiThinking?: GeminiThinkingConfig;
  readonly miniMaxThinking?: 'adaptive' | 'disabled' | 'enabled';
  readonly openAiReasoningEffort?: OpenAiReasoningEffort;
}

export const getCatalogModelProvider = (
  model: string,
): ServiceProvider | undefined =>
  MODEL_CATALOG.find((entry) => entry.id === model)?.provider;

type ReasoningMapping<T> = Readonly<
  Record<Exclude<ReasoningProfile, 'default'>, T>
>;

const OPENAI_REASONING = new Map<
  string,
  ReasoningMapping<OpenAiReasoningEffort>
>([
  ['gpt-5', { fast: 'minimal', standard: 'medium', deep: 'high' }],
  ['gpt-5-pro', { fast: 'high', standard: 'high', deep: 'high' }],
  ['gpt-5.3-codex', { fast: 'low', standard: 'medium', deep: 'high' }],
  ['gpt-5.4-mini', { fast: 'none', standard: 'medium', deep: 'high' }],
  ['gpt-5.6', { fast: 'none', standard: 'medium', deep: 'high' }],
  ['gpt-5.6-luna', { fast: 'none', standard: 'medium', deep: 'high' }],
  ['gpt-5.6-sol', { fast: 'none', standard: 'medium', deep: 'high' }],
  ['gpt-5.6-terra', { fast: 'none', standard: 'medium', deep: 'high' }],
]);

const budget = (thinkingBudget: number): GeminiThinkingConfig => ({
  thinkingBudget,
});
const level = (
  thinkingLevel: 'high' | 'low' | 'medium' | 'minimal',
): GeminiThinkingConfig => ({ thinkingLevel });

const GEMINI_THINKING = new Map<string, ReasoningMapping<GeminiThinkingConfig>>(
  [
    [
      'gemini-2.5-flash',
      { fast: budget(0), standard: budget(8192), deep: budget(24576) },
    ],
    [
      'gemini-2.5-flash-lite',
      { fast: budget(0), standard: budget(8192), deep: budget(24576) },
    ],
    [
      'gemini-2.5-pro',
      { fast: budget(128), standard: budget(8192), deep: budget(24576) },
    ],
    [
      'gemini-3-flash-preview',
      {
        fast: level('minimal'),
        standard: level('medium'),
        deep: level('high'),
      },
    ],
    [
      'gemini-3-pro-preview',
      { fast: level('low'), standard: level('high'), deep: level('high') },
    ],
    [
      'gemini-3.1-pro-preview',
      { fast: level('low'), standard: level('medium'), deep: level('high') },
    ],
    [
      'gemini-3.5-flash',
      {
        fast: level('minimal'),
        standard: level('medium'),
        deep: level('high'),
      },
    ],
    [
      'gemini-3.5-flash-lite',
      {
        fast: level('minimal'),
        standard: level('medium'),
        deep: level('high'),
      },
    ],
    [
      'gemini-3.6-flash',
      {
        fast: level('minimal'),
        standard: level('medium'),
        deep: level('high'),
      },
    ],
    [
      'gemini-3.7-flash',
      { fast: level('low'), standard: level('medium'), deep: level('high') },
    ],
  ],
);

const MINIMAX_M3_THINKING: ReasoningMapping<
  NonNullable<ModelControls['miniMaxThinking']>
> = {
  fast: 'disabled',
  standard: 'adaptive',
  deep: 'enabled',
};

export const resolveModelControls = (
  provider: ServiceProvider,
  model: string,
  profile: ReasoningProfile,
): ModelControls => {
  if (profile === 'default') return {};

  if (
    provider === 'openai' ||
    provider === 'azure-openai' ||
    provider === 'openai-compatible'
  ) {
    const effort = OPENAI_REASONING.get(model)?.[profile];
    return effort ? { openAiReasoningEffort: effort } : {};
  }
  if (provider === 'gemini') {
    const thinking = GEMINI_THINKING.get(model)?.[profile];
    return thinking ? { geminiThinking: thinking } : {};
  }
  if (provider === 'minimax' && model === 'MiniMax-M3') {
    return { miniMaxThinking: MINIMAX_M3_THINKING[profile] };
  }
  return {};
};
