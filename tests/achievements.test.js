import { describe, it, expect } from 'vitest';
import { ENDING_IDS, endingId, ACHIEVEMENTS } from '../src/content/achievements.js';
import { ENDINGS } from '../src/content/endings.js';

describe('endings bookkeeping', () => {
  it('maps every ending the sim produces to an ending id with content', () => {
    expect(endingId({ type: 'collapse' })).toBe('dysentery');
    expect(endingId({ type: 'winter' })).toBe('winter');
    expect(endingId({ type: 'doom', cause: 'shoggoth' })).toBe('shoggoth');
    expect(endingId({ type: 'survive', flavor: 'utopia' })).toBe('utopia');
    for (const id of ENDING_IDS) expect(ENDINGS[id]).toBeTruthy();
    expect(ENDING_IDS.length).toBe(Object.keys(ENDINGS).length);
  });

  it('awards a trophy for dying of dysentery', () => {
    const a = ACHIEVEMENTS.find((x) => x.id === 'ending-dysentery');
    expect(a.check({}, { type: 'collapse' })).toBe(true);
    expect(a.check({}, { type: 'winter' })).toBe(false);
  });
});
