import { describe, it, expect } from 'vitest';
import { SHOP_INFO, HOME_INFO, LOT_INFO, HQ_INFO } from '../src/content/places.js';
import { SHOP_SIGNS } from '../src/render/models/filler.js';
import { GOLD_RUSH_SIGNS } from '../src/content/flavor.js';

describe('place descriptions for the hover tooltips', () => {
  it('describe every shop sign the city can put up', () => {
    const missing = [...SHOP_SIGNS, ...GOLD_RUSH_SIGNS].filter((s) => !SHOP_INFO[s]);
    expect(missing).toEqual([]);
  });

  it('describe homes, lots and the HQ, briefly', () => {
    for (const t of [...HOME_INFO.house, ...HOME_INFO.apartment, LOT_INFO, HQ_INFO.text, ...Object.values(SHOP_INFO)]) {
      expect(t.length).toBeLessThanOrEqual(120);
    }
  });
});
