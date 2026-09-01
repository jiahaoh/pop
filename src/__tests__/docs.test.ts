import { describe, expect, it } from 'bun:test';
import info from '../../public/info.json';
import { MODEL_CATALOG } from '../utils/model-capabilities';

const read = (relativePath: string): Promise<string> =>
  Bun.file(new URL(`../../${relativePath}`, import.meta.url)).text();

describe('documentation consistency', () => {
  it('keeps both configuration manuals aligned with the model catalog', async () => {
    const manuals = await Promise.all([
      read('docs/configuration_manual_CN.md'),
      read('docs/configuration_manual_EN.md'),
    ]);

    for (const manual of manuals) {
      for (const model of MODEL_CATALOG) {
        expect(manual).toContain(`\`${model.id}\``);
      }
      for (const action of [
        'Ask',
        'Custom',
        'Grammar',
        'Polish',
        'Translate',
        'Wording',
      ]) {
        expect(manual).toContain(action);
      }
      for (const legacySetting of [
        'apiKeys',
        'apiUrl',
        'customModel',
        'customSystemPrompt',
        'customUserPrompt',
        'model',
        'reasoningMode',
        'stream',
      ]) {
        expect(manual).toContain(`\`${legacySetting}\``);
      }
      expect(manual).toContain('/responses');
      expect(manual).toContain('/chat/completions');
      expect(manual).toContain('temperature');
      expect(manual).not.toMatch(/Upgrad|升级|4\.x/);
    }
    expect(manuals[0]).not.toContain('| 开启 |');
    expect(manuals[1]).not.toContain('| Enable |');
  });

  it('keeps both READMEs on the API-key-first user path', async () => {
    const [chinese, english] = await Promise.all([
      read('README.md'),
      read('docs/README_EN.md'),
    ]);

    for (const readme of [chinese, english]) {
      for (const action of [
        'Ask',
        'Custom',
        'Grammar',
        'Polish',
        'Translate',
        'Wording',
      ]) {
        expect(readme).toContain(action);
      }
      expect(readme).toContain(info.minBobVersion);
      expect(readme).toMatch(/API [Kk]ey/);
      expect(readme).toContain('API URL');
      expect(readme).toContain('configuration_manual_');
      expect(readme).not.toContain('temperature');
      expect(readme).not.toMatch(/Upgrading|升级说明|4\.x/);
    }
    expect(chinese.indexOf('API Key')).toBeLessThan(chinese.indexOf('API URL'));
    expect(english.indexOf('API key')).toBeLessThan(english.indexOf('API URL'));
    expect(chinese).toContain('configuration_manual_CN.md#命令与默认路由');
    expect(chinese).toContain(
      'configuration_manual_CN.md#从-openai-translator-迁移',
    );
    expect(chinese).toContain('configuration_manual_CN.md#隐私与本地日志');
    expect(english).toContain(
      'configuration_manual_EN.md#commands-and-default-routing',
    );
    expect(english).toContain(
      'configuration_manual_EN.md#migrate-from-openai-translator',
    );
    expect(english).toContain(
      'configuration_manual_EN.md#privacy-and-local-logs',
    );
  });

  it('documents the Bob-owned host log boundary in both manuals', async () => {
    const [chinese, english] = await Promise.all([
      read('docs/configuration_manual_CN.md'),
      read('docs/configuration_manual_EN.md'),
    ]);

    for (const manual of [chinese, english]) {
      expect(manual).toContain('Bob 1.20.0 (255)');
      expect(manual).toContain('MMKit');
      expect(manual).toContain('Authorization');
      expect(manual).toContain('api-key');
    }
    expect(chinese).toContain('输入原文');
    expect(english).toContain('source text');
  });
});
