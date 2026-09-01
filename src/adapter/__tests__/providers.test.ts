import { describe, expect, it } from 'bun:test';
import { AzureOpenAiAdapter } from '../azure-openai';
import { GeminiAdapter } from '../gemini';
import { getServiceAdapter } from '../index';
import { MiniMaxAdapter } from '../minimax';
import { OpenAiAdapter } from '../openai';
import { createTestConfig } from './fixtures';

const prompts = Object.freeze({
  system: 'Translate from en to zh-CN. Return only the result.',
  user: 'Hello',
});

describe('provider dispatch', () => {
  it('derives the adapter from the model and optional API URL', () => {
    expect(getServiceAdapter(createTestConfig())).toBeInstanceOf(OpenAiAdapter);
    expect(
      getServiceAdapter(
        createTestConfig({
          model: 'custom',
          customModel: 'local',
          apiUrl: 'http://localhost:11434/v1/chat/completions',
        }),
      ),
    ).toBeInstanceOf(OpenAiAdapter);
    expect(
      getServiceAdapter(
        createTestConfig({
          model: 'custom',
          customModel: 'deployment',
          apiUrl: 'https://resource.openai.azure.com/openai/v1/responses',
        }),
      ),
    ).toBeInstanceOf(AzureOpenAiAdapter);
    expect(
      getServiceAdapter(
        createTestConfig({
          model: 'gemini-3.6-flash',
        }),
      ),
    ).toBeInstanceOf(GeminiAdapter);
    expect(
      getServiceAdapter(createTestConfig({ model: 'MiniMax-M3' })),
    ).toBeInstanceOf(MiniMaxAdapter);
  });
});

describe('OpenAI protocol codec', () => {
  it('builds a minimal Responses request and omits temperature', () => {
    const adapter = new OpenAiAdapter(createTestConfig());
    const body = adapter.buildRequestBody(prompts, 'default');
    expect(adapter.getTextGenerationUrl()).toBe(
      'https://api.openai.com/v1/responses',
    );
    expect(adapter.buildHeaders('key')).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer key',
    });
    expect(body.model).toBe('gpt-5.6-luna');
    expect(body.stream).toBe(true);
    expect(body.reasoning).toBeUndefined();
    expect(body.temperature).toBeUndefined();
    expect(body.instructions).toBe(prompts.system);
    expect(body.input).toBe(prompts.user);

    expect(adapter.buildRequestBody(prompts, 'fast').reasoning).toEqual({
      effort: 'none',
    });
    expect(adapter.buildRequestBody(prompts, 'standard').reasoning).toEqual({
      effort: 'medium',
    });
    expect(adapter.buildRequestBody(prompts, 'deep').reasoning).toEqual({
      effort: 'high',
    });
  });

  it('uses Chat Completions shape for a compatible endpoint', () => {
    const adapter = new OpenAiAdapter(
      createTestConfig({
        model: 'custom',
        customModel: 'local-model',
        apiUrl: 'http://localhost:11434/v1/chat/completions',
      }),
    );
    const body = adapter.buildRequestBody(prompts, 'deep');
    expect(body.messages).toEqual([
      { role: 'system', content: prompts.system },
      { role: 'user', content: prompts.user },
    ]);
    expect(body.instructions).toBeUndefined();
    expect(body.reasoning_effort).toBeUndefined();
    expect(body.temperature).toBeUndefined();
  });

  it('maps only exact verified OpenAI IDs through a compatible endpoint', () => {
    const verified = new OpenAiAdapter(
      createTestConfig({
        apiUrl: 'https://gateway.example/v1/chat/completions',
        customModel: 'gpt-5.6-luna',
        model: 'custom',
      }),
    );
    expect(verified.buildRequestBody(prompts, 'deep').reasoning_effort).toBe(
      'high',
    );

    const namespaced = new OpenAiAdapter(
      createTestConfig({
        apiUrl: 'https://gateway.example/v1/chat/completions',
        customModel: 'openai/gpt-5.6-luna',
        model: 'custom',
      }),
    );
    expect(
      namespaced.buildRequestBody(prompts, 'deep').reasoning_effort,
    ).toBeUndefined();
  });

  it('parses Responses and Chat Completions response shapes', () => {
    const responses = new OpenAiAdapter(createTestConfig());
    expect(
      responses.parseResponse({
        data: {
          output: [
            {
              type: 'message',
              content: [
                { type: 'output_text', text: '你' },
                { type: 'output_text', text: '好' },
              ],
            },
          ],
        },
      } as never),
    ).toBe('你好');

    const chat = new OpenAiAdapter(
      createTestConfig({
        model: 'custom',
        customModel: 'local-model',
        apiUrl: 'http://localhost:11434/v1/chat/completions',
      }),
    );
    expect(
      chat.parseResponse({
        data: { choices: [{ message: { content: '  你好  ' } }] },
      } as never),
    ).toBe('你好');
  });

  it('rejects incomplete Responses output instead of returning partial text', () => {
    const adapter = new OpenAiAdapter(createTestConfig());
    let error: unknown;

    try {
      adapter.parseResponse({
        data: {
          status: 'incomplete',
          incomplete_details: { reason: 'max_output_tokens' },
          output_text: 'partial',
        },
      } as never);
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({
      type: 'api',
      message: 'API 响应未完成：max_output_tokens',
    });
  });
});

describe('Azure OpenAI codec', () => {
  it('uses the configured full endpoint, Azure auth, and deployment model', () => {
    const adapter = new AzureOpenAiAdapter(
      createTestConfig({
        model: 'custom',
        customModel: 'translation-deployment',
        apiUrl: 'https://resource.openai.azure.com/openai/v1/responses',
      }),
    );
    const body = adapter.buildRequestBody(prompts, 'deep');
    expect(adapter.getTextGenerationUrl()).toBe(
      'https://resource.openai.azure.com/openai/v1/responses',
    );
    expect(adapter.buildHeaders('key')['api-key']).toBe('key');
    expect(body.model).toBe('translation-deployment');
    expect(body.temperature).toBeUndefined();
  });
});

describe('Gemini codec', () => {
  it('uses native GenerateContent and model defaults without temperature', () => {
    const adapter = new GeminiAdapter(
      createTestConfig({
        model: 'gemini-3.6-flash',
      }),
    );
    const body = adapter.buildRequestBody(prompts, 'default');
    expect(adapter.getTextGenerationUrl()).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?alt=sse',
    );
    expect(adapter.buildHeaders('key')['x-goog-api-key']).toBe('key');
    expect(body.generationConfig).toBeUndefined();
    expect(body.system_instruction).toEqual({
      parts: [{ text: prompts.system }],
    });
    expect(body.contents).toEqual([
      { role: 'user', parts: [{ text: prompts.user }] },
    ]);

    expect(adapter.buildRequestBody(prompts, 'fast').generationConfig).toEqual({
      thinkingConfig: { thinkingLevel: 'minimal' },
    });
    expect(
      adapter.buildRequestBody(prompts, 'standard').generationConfig,
    ).toEqual({
      thinkingConfig: { thinkingLevel: 'medium' },
    });
    expect(adapter.buildRequestBody(prompts, 'deep').generationConfig).toEqual({
      thinkingConfig: { thinkingLevel: 'high' },
    });
  });

  it('concatenates all returned text parts', () => {
    const adapter = new GeminiAdapter(
      createTestConfig({
        model: 'gemini-3.5-flash-lite',
      }),
    );
    expect(
      adapter.parseResponse({
        data: {
          candidates: [
            { content: { parts: [{ text: '你' }, { text: '好' }] } },
          ],
        },
      } as never),
    ).toBe('你好');
  });
});

describe('MiniMax codec', () => {
  it('uses Chat Completions and separates reasoning by default', () => {
    const adapter = new MiniMaxAdapter(
      createTestConfig({ model: 'MiniMax-M3' }),
    );
    const body = adapter.buildRequestBody(prompts, 'default');
    expect(adapter.getTextGenerationUrl()).toBe(
      'https://api.minimax.io/v1/chat/completions',
    );
    expect(body.reasoning_split).toBe(true);
    expect(body.messages).toEqual([
      { role: 'system', content: prompts.system },
      { role: 'user', content: prompts.user },
    ]);
    expect(body.thinking).toBeUndefined();
    expect(body.temperature).toBeUndefined();
  });

  it('disables reasoning for supported models', () => {
    const adapter = new MiniMaxAdapter(
      createTestConfig({ model: 'MiniMax-M3' }),
    );
    expect(adapter.buildRequestBody(prompts, 'fast').thinking).toEqual({
      type: 'disabled',
    });
    expect(adapter.buildRequestBody(prompts, 'standard').thinking).toEqual({
      type: 'adaptive',
    });
    expect(adapter.buildRequestBody(prompts, 'deep').thinking).toEqual({
      type: 'enabled',
    });
  });

  it('omits thinking controls for MiniMax M2.x', () => {
    const adapter = new MiniMaxAdapter(
      createTestConfig({ model: 'MiniMax-M2.7-highspeed' }),
    );
    expect(adapter.buildRequestBody(prompts, 'deep').thinking).toBeUndefined();
  });
});
