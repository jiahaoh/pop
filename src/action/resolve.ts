import type { TextTranslateQuery } from '@bob-translate/types';
import { langMap } from '../lang';
import type { ActionId, ParsedCommand, ResolvedTask } from '../types';
import { getTaskProfile } from './profiles';

const CHINESE_LANGUAGE_CODES = new Set(['zh-Hans', 'zh-Hant', 'yue', 'wyw']);

const getDefaultAction = (query: TextTranslateQuery): ActionId =>
  query.detectFrom === query.detectTo ? 'polish' : 'translate';

const getTargetLanguage = (
  query: TextTranslateQuery,
  action: ActionId,
): string => {
  if (action !== 'translate') {
    return langMap.get(query.detectTo) || query.detectTo;
  }
  return CHINESE_LANGUAGE_CODES.has(query.detectFrom) ? 'en' : 'zh-CN';
};

export const resolveTask = (
  query: TextTranslateQuery,
  command: ParsedCommand,
): ResolvedTask => {
  const action = command.action || getDefaultAction(query);
  return Object.freeze({
    action,
    explicit: command.explicit,
    profile: getTaskProfile(action),
    sourceLanguage: langMap.get(query.detectFrom) || query.detectFrom,
    targetLanguage: getTargetLanguage(query, action),
    text: command.text,
  });
};
