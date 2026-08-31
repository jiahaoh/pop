import type { ServiceError } from '@bob-translate/types';
import type { ActionId, ParsedCommand } from '../types';

const BUILTIN_COMMANDS = Object.freeze({
  '/ask': 'ask',
  '/c': 'custom',
  '/custom': 'custom',
  '/g': 'grammar',
  '/grammar': 'grammar',
  '/p': 'polish',
  '/polish': 'polish',
  '/q': 'ask',
  '/t': 'translate',
  '/translate': 'translate',
  '/w': 'wording',
  '/word': 'wording',
} satisfies Record<string, ActionId>);

export const BUILTIN_COMMAND_TOKENS = Object.freeze(
  Object.keys(BUILTIN_COMMANDS),
);

const commandError = (message: string, addition: string): ServiceError => ({
  type: 'param',
  message,
  addition,
});

export const normalizeCustomActionCommand = (value: string): string => {
  const command = value.trim();
  if (!command) return '';
  if (!/^\/[a-z][a-z\d_-]*$/i.test(command)) {
    throw commandError(
      '配置错误：自定义命令格式不正确',
      '自定义命令必须以 / 开头，后接英文字母，并且只能包含英文字母、数字、_ 或 -。',
    );
  }

  const normalized = command.toLowerCase();
  if (normalized in BUILTIN_COMMANDS) {
    throw commandError(
      '配置错误：自定义命令与内置命令冲突',
      `${command} 已由 Pop 内置 action 使用。`,
    );
  }
  return command;
};

const removeCommandSeparator = (value: string): string => {
  const withoutHorizontalWhitespace = value.replace(/^[ \t]*/, '');
  if (withoutHorizontalWhitespace.startsWith('\r\n')) {
    return withoutHorizontalWhitespace.slice(2);
  }
  if (withoutHorizontalWhitespace.startsWith('\n')) {
    return withoutHorizontalWhitespace.slice(1);
  }
  return withoutHorizontalWhitespace;
};

export const parseCommand = (
  input: string,
  customActionCommand = '',
): ParsedCommand => {
  const firstContentIndex = input.search(/\S/);
  if (firstContentIndex < 0 || input[firstContentIndex] !== '/') {
    return Object.freeze({ action: null, explicit: false, text: input });
  }

  if (input[firstContentIndex + 1] === '/') {
    return Object.freeze({
      action: null,
      explicit: false,
      text: `${input.slice(0, firstContentIndex)}${input.slice(firstContentIndex + 1)}`,
    });
  }

  let tokenEnd = firstContentIndex;
  while (tokenEnd < input.length && !/\s/.test(input[tokenEnd])) {
    tokenEnd += 1;
  }
  const token = input.slice(firstContentIndex, tokenEnd);
  const normalizedToken = token.toLowerCase();
  const normalizedCustom = customActionCommand.toLowerCase();
  const action =
    BUILTIN_COMMANDS[normalizedToken as keyof typeof BUILTIN_COMMANDS] ||
    (normalizedCustom && normalizedToken === normalizedCustom
      ? 'custom'
      : undefined);

  if (!action) {
    throw commandError(
      '命令错误：未知的 Pop action',
      `不支持的命令：${token}。如需把它作为普通文本处理，请使用 // 转义。`,
    );
  }

  const text = removeCommandSeparator(input.slice(tokenEnd));
  if (!text.trim()) {
    throw commandError('命令错误：缺少待处理正文', `${token} 后需要提供正文。`);
  }

  return Object.freeze({ action, explicit: true, text });
};
