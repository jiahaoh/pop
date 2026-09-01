import type { PluginValidate, TextTranslate } from '@bob-translate/types';
import { parseCommand } from './action/command';
import { resolveTaskReasoning } from './action/profiles';
import { resolveTask } from './action/resolve';
import { getServiceAdapter } from './adapter';
import { parseOptions, selectApiKey } from './config';
import { supportLanguageList } from './lang';
import { handleGeneralError, handleValidateError } from './utils/error';
import { createPrompts } from './utils/prompt';

export const translate: TextTranslate = (query) => {
  try {
    const config = parseOptions($option);
    const command = parseCommand(query.text, config.customActionCommand);
    const task = resolveTask(query, command);
    const reasoningProfile = resolveTaskReasoning(
      config.reasoningMode,
      task.profile.recommendedReasoning,
    );
    const prompts = createPrompts(task, config);
    const adapter = getServiceAdapter(config);
    void adapter
      .translate(query, prompts, selectApiKey(config.apiKeys), reasoningProfile)
      .catch((error: unknown) => handleGeneralError(query, error));
  } catch (error) {
    handleGeneralError(query, error);
  }
};

export const pluginValidate: PluginValidate = (completion) => {
  try {
    const config = parseOptions($option);
    const adapter = getServiceAdapter(config);
    void adapter
      .testApiConnection(selectApiKey(config.apiKeys), completion)
      .catch((error: unknown) => handleValidateError(completion, error));
  } catch (error) {
    handleValidateError(completion, error);
  }
};

export const pluginTimeoutInterval = () => 120;

export const supportLanguages = () =>
  supportLanguageList.map(([standardLang]) => standardLang);
