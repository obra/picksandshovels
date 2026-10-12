import { describe, it, expect } from 'vitest';
import { wrapForTest, textForTest } from '../src/ui/sharecard.js';

// A fake 2D context that records where text lands.
function fakeCtx() {
  const calls = [];
  return {
    calls,
    font: '',
    fillStyle: '',
    measureText: (t) => ({ width: t.length * 10 }),
    fillText: (t, x, y) => calls.push({ t, x, y }),
  };
}

describe('share card text', () => {
  it('draws single lines at a real position', () => {
    const ctx = fakeCtx();
    textForTest(ctx, 'PICKS & SHOVELS', 10, 50, '20px x', '#000');
    expect(ctx.calls).toEqual([{ t: 'PICKS & SHOVELS', x: 10, y: 50 }]);
  });

  it('wraps long lines and returns where the next line goes', () => {
    const ctx = fakeCtx();
    const next = textForTest(ctx, 'one two three four', 0, 100, '20px x', '#000', 100, 20);
    expect(ctx.calls.map((c) => c.y)).toEqual([100, 120]);
    expect(next).toBe(140);
    expect(wrapForTest(ctx, 'aa bb', 1000)).toEqual(['aa bb']);
  });
});

import { shareSummary } from '../src/ui/sharecard.js';

describe('share summary', () => {
  const E = { title: 'A World Of Paperclips', subtitle: 'The universe is now extremely well organized.', stamp: 'CLIPPED' };
  const state = { doom: 100, releases: 4, stats: { peakCash: 9.99e6 } };
  const date = { year: 2028, quarter: 1 };

  it('tells the story in plain text with the link', () => {
    const { text } = shareSummary({ ending: { type: 'doom', cause: 'paperclips' }, E, state, date });
    expect(text).toContain('A World Of Paperclips');
    expect(text).toContain('P(DOOM) HIT 100% IN 2028 Q1');
    expect(text).toContain('The universe is now extremely well organized.');
    expect(text).toContain('https://picksandshovels.org');
  });

  it('has an HTML version with a real hyperlink, escaped', () => {
    const { html } = shareSummary({ ending: { type: 'survive', roll: 97, doomAtRoll: 20 }, E: { ...E, title: 'Fish & <Chips>' }, state, date });
    expect(html).toContain('<a href="https://picksandshovels.org">picksandshovels.org</a>');
    expect(html).toContain('Fish &amp; &lt;Chips&gt;');
    expect(html).not.toContain('<Chips>');
  });
});
