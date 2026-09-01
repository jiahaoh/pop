import type {
  HttpResponse,
  TextTranslateQuery,
  ValidationCompletion,
} from '@bob-translate/types';

export type ServiceProvider =
  | 'azure-openai'
  | 'gemini'
  | 'minimax'
  | 'openai'
  | 'openai-compatible';

export type ApiProtocol =
  | 'gemini-generate-content'
  | 'openai-chat-completions'
  | 'openai-responses';

export type ReasoningProfile = 'deep' | 'default' | 'fast' | 'standard';

export type ReasoningMode = 'auto' | ReasoningProfile;

export type ActionId =
  | 'ask'
  | 'custom'
  | 'grammar'
  | 'polish'
  | 'translate'
  | 'wording';

export type TaskLanguagePolicy =
  | 'chinese-english-default'
  | 'input-language'
  | 'task-defined'
  | 'user-request';

export type TaskOutputPolicy =
  | 'direct-answer'
  | 'grammar-with-notes'
  | 'result-only'
  | 'task-defined'
  | 'wording-options';

export type TaskSafetyPolicy =
  | 'answer-question'
  | 'runtime-text-is-data'
  | 'wording-request';

export interface TaskProfile {
  readonly id: ActionId;
  readonly languagePolicy: TaskLanguagePolicy;
  readonly outputPolicy: TaskOutputPolicy;
  readonly recommendedReasoning: ReasoningProfile;
  readonly safetyPolicy: TaskSafetyPolicy;
}

export interface ParsedCommand {
  readonly action: ActionId | null;
  readonly explicit: boolean;
  readonly text: string;
}

export interface ResolvedTask {
  readonly action: ActionId;
  readonly explicit: boolean;
  readonly profile: TaskProfile;
  readonly sourceLanguage: string;
  readonly targetLanguage: string;
  readonly text: string;
}

export interface PromptPair {
  readonly system: string;
  readonly user: string;
}

export interface PluginConfig {
  readonly additionalRequirements: string;
  readonly apiKeys: readonly string[];
  readonly customActionCommand: string;
  readonly customActionInstruction: string;
  readonly customActionUserTemplate: string;
  readonly endpoint: string;
  readonly model: string;
  readonly protocol: ApiProtocol;
  readonly provider: ServiceProvider;
  readonly reasoningMode: ReasoningMode;
  readonly stream: boolean;
}

export interface ProviderDefinition {
  readonly defaultEndpoint: string;
  readonly documentationUrl: string;
  readonly protocol: ApiProtocol;
}

export interface ServiceAdapter {
  buildHeaders(apiKey: string): Record<string, string>;
  buildRequestBody(
    prompts: PromptPair,
    reasoningProfile: ReasoningProfile,
  ): Record<string, unknown>;
  getTextGenerationUrl(): string;
  parseResponse(response: HttpResponse<unknown>): string;
  testApiConnection(
    apiKey: string,
    completion: ValidationCompletion,
  ): Promise<void>;
  translate(
    query: TextTranslateQuery,
    prompts: PromptPair,
    apiKey: string,
    reasoningProfile: ReasoningProfile,
  ): Promise<void>;
}
