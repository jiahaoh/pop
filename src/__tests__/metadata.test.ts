import { describe, expect, it } from 'bun:test';
import appcast from '../../appcast.json';
import packageMetadata from '../../package.json';
import info from '../../public/info.json';
import { CONFIGURATION_GUIDE_URL } from '../config';
import { DEFAULT_MODEL, MODEL_CATALOG } from '../utils/model-capabilities';

type MenuOption = {
  defaultValue?: string;
  desc?: string;
  identifier: string;
  menuValues?: Array<{ title: string; value: string }>;
  textConfig?: {
    height?: unknown;
    keyWords?: string[];
    placeholderText?: string;
  };
};

type AppcastRelease = {
  desc: string;
  minBobVersion: string;
  sha256: string;
  timestamp: number;
  url: string;
  version: string;
};

const options = info.options as MenuOption[];
const getOption = (identifier: string): MenuOption => {
  const option = options.find((item) => item.identifier === identifier);
  if (!option) throw new Error(`Missing option: ${identifier}`);
  return option;
};

describe('info.json consistency', () => {
  it('uses the independent Pop release identity', () => {
    expect(packageMetadata).toMatchObject({
      homepage: 'https://github.com/jiahaoh/pop',
      name: 'pop-bobplugin',
    });
    expect(info).toMatchObject({
      appcast:
        'https://raw.githubusercontent.com/jiahaoh/pop/main/appcast.json',
      author: 'Jiahao Huang',
      homepage: 'https://github.com/jiahaoh/pop',
      identifier: 'jiahaoh.pop',
      name: 'Pop',
    });
    expect(appcast.identifier).toBe('jiahaoh.pop');
    const releases = appcast.versions as AppcastRelease[];
    expect(releases.length).toBeGreaterThan(0);
    expect(new Set(releases.map(({ version }) => version)).size).toBe(
      releases.length,
    );
    for (const release of releases) {
      expect(release.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(release.desc.trim().length).toBeGreaterThan(0);
      expect(release.sha256).toMatch(/^[a-f\d]{64}$/);
      expect(release.url).toBe(
        `https://github.com/jiahaoh/pop/releases/download/v${release.version}/pop-${release.version}.bobplugin`,
      );
      expect(release.minBobVersion).toBe(info.minBobVersion);
      expect(Number.isSafeInteger(release.timestamp)).toBe(true);
    }
    expect(JSON.stringify({ appcast, info, packageMetadata })).not.toContain(
      'yetone.openai.translator',
    );
  });

  it('matches the runtime model catalog', () => {
    expect(getOption('model').menuValues?.slice(1)).toEqual(
      MODEL_CATALOG.map(({ id }) => ({ title: id, value: id })),
    );
  });

  it('sorts menu values while keeping custom model first', () => {
    for (const option of options) {
      if (!option.menuValues) continue;
      const values = option.menuValues.map((item) => item.value);
      const sortable =
        option.identifier === 'model'
          ? values.slice(1)
          : option.identifier === 'reasoningMode'
            ? []
            : values;
      expect(sortable).toEqual(
        [...sortable].sort((left, right) =>
          left.localeCompare(right, 'en', { sensitivity: 'base' }),
        ),
      );
    }
    expect(getOption('model').menuValues?.[0]?.value).toBe('custom');
  });

  it('defaults to the API-key-only path', () => {
    const identifiers = options.map((option) => option.identifier);
    expect(identifiers).toEqual([
      'apiKeys',
      'model',
      'customModel',
      'apiUrl',
      'reasoningMode',
      'stream',
      'additionalRequirements',
      'customActionCommand',
      'customActionInstruction',
      'customActionUserTemplate',
    ]);
    expect(identifiers).not.toContain('serviceProvider');
    expect(identifiers).not.toContain('apiPath');
    expect(identifiers).not.toContain('endpoint');
    expect(identifiers).not.toContain('temperature');
    expect(identifiers).toContain('apiUrl');
    expect(identifiers).not.toContain('customSystemPrompt');
    expect(identifiers).not.toContain('customUserPrompt');
    expect(identifiers).toContain('additionalRequirements');
    expect(identifiers).toContain('customActionCommand');
    expect(identifiers).toContain('customActionInstruction');
    expect(identifiers).toContain('customActionUserTemplate');
    expect(identifiers).toContain('reasoningMode');
    expect(getOption('model').defaultValue).toBe(DEFAULT_MODEL);
    expect(getOption('reasoningMode').defaultValue).toBe('auto');
    expect(getOption('reasoningMode').menuValues).toEqual([
      { title: '自动（按任务）', value: 'auto' },
      { title: '模型默认', value: 'default' },
      { title: '快速', value: 'fast' },
      { title: '标准', value: 'standard' },
      { title: '深入', value: 'deep' },
    ]);
    expect(getOption('stream').defaultValue).toBe('enable');
    expect(getOption('customActionUserTemplate').defaultValue).toBe('$text');
    expect(info.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(packageMetadata.version).toBe(info.version);
  });

  it('uses numeric text heights required by the Bob schema', () => {
    for (const option of options) {
      if (option.textConfig?.height !== undefined) {
        expect(typeof option.textConfig.height).toBe('number');
      }
    }
    expect(getOption('apiKeys').textConfig?.height).toBe(
      getOption('apiUrl').textConfig?.height,
    );
  });

  it('keeps the configuration UI Chinese-first', () => {
    expect(JSON.stringify(info)).toContain('默认');
    expect(JSON.stringify(info)).toContain('额外要求');
    expect(JSON.stringify(info)).toContain('Custom 指令');
  });

  it('uses project and exact configuration-guide links', () => {
    expect(info.homepage).toBe('https://github.com/jiahaoh/pop');
    expect(CONFIGURATION_GUIDE_URL).toBe(
      'https://github.com/jiahaoh/pop/blob/main/docs/configuration_manual_CN.md#最快开始',
    );
    for (const option of options) {
      if (!option.desc) continue;
      expect(option.desc).not.toContain('http');
      for (const paragraph of option.desc.split('\n')) {
        expect(paragraph).not.toMatch(/[。.]\s*$/);
      }
    }
  });

  it('keeps Custom instruction and runtime text variables separated', () => {
    expect(getOption('customActionInstruction').textConfig?.keyWords).toEqual([
      '$sourceLang',
      '$targetLang',
    ]);
    expect(getOption('customActionUserTemplate').textConfig).toMatchObject({
      keyWords: ['$text', '$sourceLang', '$targetLang'],
      placeholderText: '$text',
    });
  });
});
