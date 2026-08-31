import { describe, expect, it } from 'bun:test';
import { normalizeCustomActionCommand, parseCommand } from '../command';

describe('command parser', () => {
  it('recognizes every built-in long command and short alias', () => {
    const cases = [
      ['/ask', 'ask'],
      ['/q', 'ask'],
      ['/custom', 'custom'],
      ['/c', 'custom'],
      ['/grammar', 'grammar'],
      ['/g', 'grammar'],
      ['/polish', 'polish'],
      ['/p', 'polish'],
      ['/translate', 'translate'],
      ['/t', 'translate'],
      ['/word', 'wording'],
      ['/w', 'wording'],
    ] as const;

    for (const [command, action] of cases) {
      expect(parseCommand(`${command} text`)).toEqual({
        action,
        explicit: true,
        text: 'text',
      });
    }
  });

  it('matches ASCII command tokens without case sensitivity', () => {
    expect(parseCommand('/P Hello')).toMatchObject({
      action: 'polish',
      text: 'Hello',
    });
  });

  it('supports inline and multiline bodies after leading blank lines', () => {
    expect(parseCommand(' \n\t /ask   inline\nsecond')).toEqual({
      action: 'ask',
      explicit: true,
      text: 'inline\nsecond',
    });
    expect(parseCommand('/ask\nfirst\nsecond')).toMatchObject({
      text: 'first\nsecond',
    });
    expect(parseCommand('/ask\n\nfirst')).toMatchObject({ text: '\nfirst' });
  });

  it('requires an exact token and rejects unknown commands', () => {
    expect(() => parseCommand('/translatex text')).toThrow();
    expect(() => parseCommand('/unknown text')).toThrow();
  });

  it('escapes a leading slash and returns to default routing', () => {
    expect(parseCommand('//ask')).toEqual({
      action: null,
      explicit: false,
      text: '/ask',
    });
    expect(parseCommand('\n  //ask question')).toEqual({
      action: null,
      explicit: false,
      text: '\n  /ask question',
    });
  });

  it('leaves ordinary uncommanded text unchanged', () => {
    const text = '\n  ordinary text  \n';
    expect(parseCommand(text)).toEqual({
      action: null,
      explicit: false,
      text,
    });
  });

  it('rejects commands whose body is empty or whitespace only', () => {
    for (const text of ['/t', '/t ', '/t\n', '/t\n  \n']) {
      expect(() => parseCommand(text)).toThrow();
    }
  });

  it('matches one configured Custom alias after built-ins', () => {
    expect(parseCommand('/S text', '/s')).toEqual({
      action: 'custom',
      explicit: true,
      text: 'text',
    });
  });
});

describe('Custom alias validation', () => {
  it('accepts an empty alias and a compact ASCII token', () => {
    expect(normalizeCustomActionCommand('')).toBe('');
    expect(normalizeCustomActionCommand(' /summary-2 ')).toBe('/summary-2');
  });

  it('rejects invalid or conflicting aliases', () => {
    for (const value of ['summary', '/', '//s', '/two words', '/问']) {
      expect(() => normalizeCustomActionCommand(value)).toThrow();
    }
    for (const value of ['/ask', '/Q', '/translate', '/w']) {
      expect(() => normalizeCustomActionCommand(value)).toThrow();
    }
  });
});
