import { describe, it, expect } from 'vitest';
import { OVERSEAS, OVERSEAS_EVENTS, OVERSEAS_HEADLINES } from '../src/content/overseas.js';
import { CONTENT } from '../src/content/index.js';

const EFFECT_KEYS = new Set(['doom', 'hype', 'align', 'cap', 'revSecs', 'cashMult', 'buff', 'flag']);

describe('overseas open-weights content', () => {
  it('has a lab and a run of drops', () => {
    expect(OVERSEAS.lab.short.length).toBeLessThanOrEqual(10);
    expect(OVERSEAS.drops.length).toBeGreaterThanOrEqual(6);
    for (const d of OVERSEAS.drops) {
      expect(d.name.length).toBeGreaterThan(0);
      expect(d.tagline.length).toBeLessThanOrEqual(90);
    }
  });

  it('response cards follow the card schema and are trigger-only', () => {
    for (const e of OVERSEAS_EVENTS) {
      expect(e.trigger).toBe('overseas');
      expect(e.title.length).toBeLessThanOrEqual(32);
      expect(e.body.length).toBeLessThanOrEqual(220);
      expect(e.options.length).toBeGreaterThanOrEqual(2);
      for (const o of e.options) {
        expect(o.label.length).toBeLessThanOrEqual(34);
        expect(o.result.length).toBeLessThanOrEqual(140);
        for (const k of Object.keys(o.effects)) expect(EFFECT_KEYS.has(k)).toBe(true);
      }
    }
    const ids = CONTENT.events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('headlines fit the ticker', () => {
    for (const h of OVERSEAS_HEADLINES) expect(h.length).toBeLessThanOrEqual(110);
  });
});
