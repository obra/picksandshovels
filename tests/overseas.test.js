import { describe, it, expect } from 'vitest';
import { OVERSEAS, OVERSEAS_EVENTS, OVERSEAS_HEADLINES } from '../src/content/overseas.js';
import { CONTENT } from '../src/content/index.js';
import { FLOPS } from '../src/content/flops.js';

const EFFECT_KEYS = new Set(['doom', 'hype', 'align', 'cap', 'revSecs', 'cashMult', 'buff', 'flag']);

describe('overseas open-weights content', () => {
  it('has at least four open-weights labs, each with a run of drops', () => {
    expect(OVERSEAS.labs.length).toBeGreaterThanOrEqual(4);
    for (const lab of OVERSEAS.labs) {
      expect(lab.short.length).toBeLessThanOrEqual(10);
      expect(lab.drops.length).toBeGreaterThanOrEqual(3);
      for (const d of lab.drops) {
        expect(d.name.length).toBeGreaterThan(0);
        expect(d.tagline.length).toBeLessThanOrEqual(90);
      }
    }
  });

  it('flops have banner lines and ticker headlines', () => {
    expect(FLOPS.length).toBeGreaterThanOrEqual(8);
    for (const f of FLOPS) {
      expect(f.tagline.length).toBeLessThanOrEqual(90);
      expect(f.headline.length).toBeLessThanOrEqual(100);
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
