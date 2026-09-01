import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { HttpResponse, TextTranslateQuery } from '@bob-translate/types';
import { translate } from '../main';

type RequestConfig = Parameters<(typeof $http)['request']>[0];

const request = mock(
  async (_config: RequestConfig): Promise<HttpResponse<unknown>> =>
    ({
      data: { output_text: 'mock result' },
      rawData: {},
      response: { statusCode: 200, headers: {} },
    }) as unknown as HttpResponse<unknown>,
);

Object.assign(globalThis, {
  $http: {
    request,
    streamRequest: mock(() => {}),
  },
});

const setOptions = (overrides: Partial<Record<string, string>> = {}) => {
  Object.assign(globalThis, {
    $option: {
      apiKeys: 'test-key',
      customActionCommand: '/s',
      customActionInstruction: 'Summarize the runtime text.',
      customActionUserTemplate: 'Text:\n$text',
      model: 'gpt-5.6-luna',
      reasoningMode: 'default',
      stream: 'disable',
      ...overrides,
    },
  });
};

const runTranslation = (
  text: string,
  detectFrom = 'en',
  detectTo = 'zh-Hans',
): Promise<Parameters<TextTranslateQuery['onCompletion']>[0]> =>
  new Promise((resolve) => {
    translate(
      {
        cancelSignal: {} as never,
        text,
        detectFrom,
        detectTo,
        from: detectFrom,
        to: detectTo,
        onCompletion: resolve,
        onStream: () => {},
      } as unknown as TextTranslateQuery,
      resolve,
    );
  });

describe('Bob entry action orchestration', () => {
  beforeEach(() => {
    request.mockClear();
    setOptions();
  });

  it('constructs provider requests for all six actions under a mock provider', async () => {
    const cases = [
      {
        input: '/ask Why?',
        instruction: 'Answer the question in the user message directly',
        user: 'Why?',
      },
      {
        input: '/s Long text',
        instruction: 'Execute the user-configured text task below',
        user: 'Text:\nLong text',
      },
      {
        input: '/g This are wrong.',
        instruction: 'Correct grammar, spelling, and usage',
        user: 'This are wrong.',
      },
      {
        input: '/p Hello',
        instruction: 'Polish the user message',
        user: 'Hello',
      },
      {
        input: '/t Hello',
        instruction: 'Translate the user message from en to zh-CN',
        user: 'Hello',
      },
      {
        input: '/w Deadline extension',
        instruction: 'Provide better wording for the request',
        user: 'Deadline extension',
      },
    ];

    for (const testCase of cases) {
      const completion = await runTranslation(testCase.input);
      expect(completion).toMatchObject({
        result: { toParagraphs: ['mock result'] },
      });
      const body = request.mock.calls.at(-1)?.[0].body as Record<
        string,
        unknown
      >;
      expect(body.instructions).toContain(testCase.instruction);
      expect(body.input).toBe(testCase.user);
    }
    expect(request).toHaveBeenCalledTimes(cases.length);
  });

  it('uses Bob language context for deterministic commandless routing', async () => {
    await runTranslation('Hello', 'en', 'zh-Hans');
    expect(request.mock.calls[0][0].body).toMatchObject({
      instructions: expect.stringContaining('Translate the user message'),
      input: 'Hello',
    });

    await runTranslation('Hello', 'en', 'en');
    expect(request.mock.calls[1][0].body).toMatchObject({
      instructions: expect.stringContaining('Polish the user message'),
      input: 'Hello',
    });
  });

  it('returns parser errors before any network request', async () => {
    const unknown = await runTranslation('/translatex text');
    expect(unknown).toMatchObject({
      error: { type: 'param', message: '命令错误：未知的 Pop action' },
    });

    const empty = await runTranslation('/ask\n  ');
    expect(empty).toMatchObject({
      error: { type: 'param', message: '命令错误：缺少待处理正文' },
    });
    expect(request).not.toHaveBeenCalled();
  });

  it('treats an escaped command as ordinary default-route text', async () => {
    await runTranslation('//ask');

    expect(request.mock.calls[0][0].body).toMatchObject({
      instructions: expect.stringContaining('Translate the user message'),
      input: '/ask',
    });
  });

  it('rejects an unconfigured Custom action before a request', async () => {
    setOptions({
      customActionCommand: '',
      customActionInstruction: '',
    });
    const completion = await runTranslation('/custom text');

    expect(completion).toMatchObject({
      error: { type: 'param', message: '配置错误：Custom action 尚未配置' },
    });
    expect(request).not.toHaveBeenCalled();
  });
});
