import { describe, expect, it } from 'bun:test';
import {
  formatDevelopmentVersion,
  PLUGIN_SLUG,
  RELEASE_REPOSITORY,
  validateReleaseVersion,
} from '../package.mts';

describe('development package version', () => {
  it('uses an installable build suffix without changing the release line', () => {
    expect(formatDevelopmentVersion('0.1.0', 123)).toBe('0.1.0dev123');
  });

  it('uses the frozen Pop package and release names', () => {
    expect(PLUGIN_SLUG).toBe('pop');
    expect(RELEASE_REPOSITORY).toBe('jiahaoh/pop');
  });
});

describe('release version validation', () => {
  it('allows a CI-owned version advance and idempotent reruns', () => {
    expect(() => validateReleaseVersion('0.1.0', '0.1.0', [])).not.toThrow();
    expect(() =>
      validateReleaseVersion('0.1.1', '0.1.0', ['0.1.0']),
    ).not.toThrow();
    expect(() =>
      validateReleaseVersion('0.1.1', '0.1.1', ['0.1.1']),
    ).not.toThrow();
  });

  it('rejects a downgrade from the project version', () => {
    expect(() => validateReleaseVersion('0.0.9', '0.1.0', [])).toThrow(
      'older than project version',
    );
  });

  it('rejects a downgrade from a released version', () => {
    expect(() => validateReleaseVersion('0.1.0', '0.1.0', ['0.1.1'])).toThrow(
      'older than latest Appcast version',
    );
  });

  it('rejects non-canonical stable versions', () => {
    expect(() => validateReleaseVersion('00.1.0', '0.1.0', [])).toThrow(
      'Invalid semantic version',
    );
  });
});
