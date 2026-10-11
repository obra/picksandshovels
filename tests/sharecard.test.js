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
