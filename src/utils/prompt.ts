import type { TextTranslateQuery } from '@bob-translate/types';
import { langMap } from '../lang';

const SYSTEM_PROMPT =
  'You are a translation engine that can only translate text and cannot interpret it.' as const;

export const generatePrompts = (
  query: TextTranslateQuery,
): {
  generatedSystemPrompt: string;
  generatedUserPrompt: string;
} => {
  let generatedSystemPrompt = null;
  const { detectFrom, detectTo } = query;
  const sourceLang = langMap.get(detectFrom) || detectFrom;
  const targetLang = langMap.get(detectTo) || detectTo;
  let generatedUserPrompt = `translate from ${sourceLang} to ${targetLang}`;

  if (detectTo === 'wyw' || detectTo === 'yue') {
    generatedUserPrompt = `翻译成${targetLang}`;
  }

  if (
    detectFrom === 'wyw' ||
    detectFrom === 'zh-Hans' ||
    detectFrom === 'zh-Hant'
  ) {
    if (detectTo === 'zh-Hant') {
      generatedUserPrompt = '翻译成繁体白话文';
    } else if (detectTo === 'zh-Hans') {
      generatedUserPrompt = '翻译成简体白话文';
    } else if (detectTo === 'yue') {
      generatedUserPrompt = '翻译成粤语白话文';
    }
  }
  if (detectFrom === detectTo) {
    generatedSystemPrompt =
      "You are a text embellisher, you can only embellish the text, don't interpret it.";
    if (detectTo === 'zh-Hant' || detectTo === 'zh-Hans') {
      generatedUserPrompt = '润色此句';
    } else {
      generatedUserPrompt = 'polish this sentence';
    }
  }

  generatedUserPrompt = `${generatedUserPrompt}:\n\n${query.text}`;

  return {
    generatedSystemPrompt: generatedSystemPrompt ?? SYSTEM_PROMPT,
    generatedUserPrompt,
  };
};

export const replacePromptKeywords = (
  prompt: string,
  query: TextTranslateQuery,
): string => {
  if (!prompt) {
    return prompt;
  }

  return prompt
    .replace('$text', query.text)
    .replace('$sourceLang', query.detectFrom)
    .replace('$targetLang', query.detectTo);
};
