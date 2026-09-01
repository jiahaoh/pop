import { parseOptions } from '../../config';
import type { PluginConfig } from '../../types';

export const createTestConfig = (
  overrides: Partial<Record<string, string>> = {},
): PluginConfig =>
  parseOptions({
    apiKeys: 'test-key',
    apiUrl: '',
    customModel: '',
    customSystemPrompt: '',
    customUserPrompt: '',
    model: 'gpt-5.6-luna',
    reasoningMode: 'auto',
    stream: 'enable',
    ...overrides,
  });
