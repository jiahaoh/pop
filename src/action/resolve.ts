import type { TextTranslateQuery } from '@bob-translate/types';
import { langMap } from '../lang';
import type { ActionId, ParsedCommand, ResolvedTask } from '../types';
import { getTaskProfile } from './profiles';

const getDefaultAction = (query: TextTranslateQuery): ActionId =>
  query.detectFrom === query.detectTo ? 'polish' : 'translate';

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
    targetLanguage: langMap.get(query.detectTo) || query.detectTo,
    text: command.text,
  });
};
