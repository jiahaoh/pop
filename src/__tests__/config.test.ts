import { describe, expect, it } from 'bun:test';
import { parseOptions } from '../config';

const options = (
  overrides: Partial<Record<string, string>> = {},
): Record<string, string> => ({
  apiKeys: 'key-one, key-two',
  apiUrl: '',
  customModel: '',
  customSystemPrompt: '',
  customUserPrompt: '',
  model: 'gpt-5.6-luna',
  reasoningMode: 'default',
  stream: 'enable',
  ...overrides,
});

describe('parseOptions', () => {
  it('needs only API keys for the default OpenAI configuration', () => {
    const config = parseOptions({ apiKeys: 'key-one, key-two' });
    expect(config.endpoint).toBe('https://api.openai.com/v1/responses');
    expect(config.provider).toBe('openai');
    expect(config.protocol).toBe('openai-responses');
    expect(config.apiKeys).toEqual(['key-one', 'key-two']);
    expect(config.reasoningMode).toBe('default');
    expect(config.stream).toBe(true);
    expect(config).toMatchObject({
      additionalRequirements: '',
      customActionCommand: '',
      customActionInstruction: '',
      customActionUserTemplate: '$text',
    });
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.apiKeys)).toBe(true);
  });

  it('infers official providers from the selected model', () => {
    const gemini = parseOptions(
      options({
        model: 'gemini-3.6-flash',
      }),
    );
    expect(gemini).toMatchObject({
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
      protocol: 'gemini-generate-content',
      provider: 'gemini',
    });

    const minimax = parseOptions(
      options({
        model: 'MiniMax-M3',
      }),
    );
    expect(minimax).toMatchObject({
      endpoint: 'https://api.minimax.io/v1/chat/completions',
      protocol: 'openai-chat-completions',
      provider: 'minimax',
    });
  });

  it('routes a complete custom API URL without a provider setting', () => {
    const compatible = parseOptions(
      options({
        apiUrl: 'gateway.example/v1/chat/completions',
      }),
    );
    expect(compatible).toMatchObject({
      endpoint: 'https://gateway.example/v1/chat/completions',
      protocol: 'openai-chat-completions',
      provider: 'openai-compatible',
    });

    const azure = parseOptions(
      options({
        apiUrl:
          'https://resource.openai.azure.com/openai/v1/responses?api-version=preview',
        customModel: 'translation-deployment',
        model: 'custom',
      }),
    );
    expect(azure).toMatchObject({
      protocol: 'openai-responses',
      provider: 'azure-openai',
    });

    const proxiedAzure = parseOptions(
      options({
        apiUrl:
          'https://azure-gateway.example/openai/deployments/translation/responses?api-version=preview',
      }),
    );
    expect(proxiedAzure.provider).toBe('azure-openai');

    const miniMaxChina = parseOptions(
      options({
        apiUrl: 'https://api.minimaxi.com/v1/chat/completions',
        model: 'MiniMax-M3',
      }),
    );
    expect(miniMaxChina).toMatchObject({
      protocol: 'openai-chat-completions',
      provider: 'minimax',
    });
  });

  it('keeps MiniMax official hosts with explicit ports on the MiniMax codec', () => {
    for (const apiUrl of [
      'https://api.minimax.io:443/v1/chat/completions',
      'https://api.minimaxi.com:443/v1/chat/completions',
    ]) {
      expect(
        parseOptions(options({ apiUrl, model: 'MiniMax-M3' })),
      ).toMatchObject({
        protocol: 'openai-chat-completions',
        provider: 'minimax',
      });
    }
  });

  it('rejects partial URLs, invalid menus, and empty keys', () => {
    expect(() =>
      parseOptions(options({ apiUrl: 'https://example.com/v1' })),
    ).toThrow();
    expect(() => parseOptions(options({ reasoningMode: 'minimal' }))).toThrow();
    expect(() => parseOptions(options({ reasoningMode: 'auto' }))).toThrow();
    expect(() => parseOptions(options({ reasoningMode: 'enable' }))).toThrow();
    expect(() => parseOptions(options({ stream: 'sometimes' }))).toThrow();
    expect(() => parseOptions(options({ apiKeys: ' , ' }))).toThrow();
  });

  it('requires the custom model value and infers known prefixes', () => {
    expect(() =>
      parseOptions(
        options({
          model: 'custom',
        }),
      ),
    ).toThrow();

    const custom = parseOptions(
      options({
        model: 'custom',
        customModel: 'gemini-experimental',
      }),
    );
    expect(custom.model).toBe('gemini-experimental');
    expect(custom.provider).toBe('gemini');
  });

  it('parses one optional Custom action without requiring it', () => {
    const customAction = parseOptions(
      options({
        additionalRequirements: 'Keep API names in English.',
        customActionCommand: ' /s ',
        customActionInstruction:
          'Summarize from $sourceLang for $targetLang readers.',
        customActionUserTemplate: 'Source:\n$text',
      }),
    );

    expect(customAction).toMatchObject({
      additionalRequirements: 'Keep API names in English.',
      customActionCommand: '/s',
      customActionInstruction:
        'Summarize from $sourceLang for $targetLang readers.',
      customActionUserTemplate: 'Source:\n$text',
    });
  });

  it('rejects unsafe or ambiguous Custom configuration', () => {
    for (const customActionCommand of ['/ask', '/Q', 'summary', '/two words']) {
      expect(() => parseOptions(options({ customActionCommand }))).toThrow();
    }
    expect(() =>
      parseOptions(
        options({ customActionInstruction: 'Summarize $text now.' }),
      ),
    ).toThrow();
    expect(() =>
      parseOptions(options({ customActionUserTemplate: 'No text variable' })),
    ).toThrow();
  });

  it('ignores legacy prompt fields without requiring them', () => {
    const withoutLegacyPrompts = parseOptions(options());
    const withLegacyPrompts = parseOptions(
      options({
        customSystemPrompt: 'Old system prompt',
        customUserPrompt: 'Old user prompt: $text',
      }),
    );

    expect(withLegacyPrompts).toEqual(withoutLegacyPrompts);
  });
});
