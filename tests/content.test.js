// Schema and integrity checks for the comedy content in src/content.
// Length limits come from the UI: bubbles, buttons and billboards have fixed
// pixel widths, so an over-long line overflows on screen.

import { describe, it, expect } from 'vitest';
import { LABS, MODEL_RELEASES } from '../src/content/labs.js';
import { INCIDENTS } from '../src/content/incidents.js';
import { EVENTS } from '../src/content/events.js';
import { HEADLINES } from '../src/content/headlines.js';
import { ENDINGS } from '../src/content/endings.js';
import {
  BILLBOARDS,
  BLIMP_QUIPS,
  TAGLINES,
  LOADING_QUIPS,
  TICKER_SYMBOLS,
  GOLD_RUSH_SIGNS,
} from '../src/content/flavor.js';

const ERA_CAPS = [0, 20, 40, 60, 80];
const SITES = ['lab', 'compute', 'safety', 'hype', 'home', 'shop', 'any'];
const KINDS = ['gaffe', 'escape', 'cyber', 'finance', 'bio', 'swarm', 'rsi', 'misalignment'];
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HEX = /^#[0-9a-f]{6}$/i;

// Returns the strings that are missing, empty or longer than max, so a failing
// assertion prints the offending lines.
function overLimit(strings, max) {
  return strings.filter((s) => typeof s !== 'string' || s.trim().length === 0 || s.length > max);
}

function duplicates(values) {
  const seen = new Set();
  return values.filter((v) => (seen.has(v) ? true : (seen.add(v), false)));
}

describe('labs', () => {
  it('has 6 to 8 labs with unique kebab-case ids', () => {
    expect(LABS.length).toBeGreaterThanOrEqual(6);
    expect(LABS.length).toBeLessThanOrEqual(8);
    expect(LABS.filter((l) => !KEBAB.test(l.id))).toEqual([]);
    expect(duplicates(LABS.map((l) => l.id))).toEqual([]);
    expect(duplicates(LABS.map((l) => l.short))).toEqual([]);
  });

  it('fits names on the billboard and slogans in the panel', () => {
    expect(overLimit(LABS.map((l) => l.name), 40)).toEqual([]);
    expect(overLimit(LABS.map((l) => l.short), 10)).toEqual([]);
    expect(overLimit(LABS.map((l) => l.slogan), 28)).toEqual([]);
  });

  it('uses hex colors', () => {
    expect(LABS.filter((l) => !HEX.test(l.color) || !HEX.test(l.accent))).toEqual([]);
  });
});

describe('model releases', () => {
  it('has exactly 10 tiers of 3 options', () => {
    expect(MODEL_RELEASES).toHaveLength(10);
    for (const tier of MODEL_RELEASES) expect(tier).toHaveLength(3);
  });

  it('gives every release a unique name and a tagline', () => {
    const all = MODEL_RELEASES.flat();
    expect(overLimit(all.map((r) => r.name), 40)).toEqual([]);
    expect(overLimit(all.map((r) => r.tagline), 80)).toEqual([]);
    expect(duplicates(all.map((r) => r.name))).toEqual([]);
  });
});

describe('incidents', () => {
  it('has at least 80 incidents with unique kebab-case ids', () => {
    expect(INCIDENTS.length).toBeGreaterThanOrEqual(80);
    expect(INCIDENTS.filter((i) => !KEBAB.test(i.id)).map((i) => i.id)).toEqual([]);
    expect(duplicates(INCIDENTS.map((i) => i.id))).toEqual([]);
    expect(duplicates(INCIDENTS.map((i) => i.text))).toEqual([]);
  });

  it('keeps bubbles, headlines and quips within their limits', () => {
    expect(overLimit(INCIDENTS.map((i) => i.text), 42)).toEqual([]);
    expect(overLimit(INCIDENTS.map((i) => i.fail), 90)).toEqual([]);
    expect(overLimit(INCIDENTS.map((i) => i.fix), 24)).toEqual([]);
  });

  it('uses only known sites, tiers and eras', () => {
    expect(INCIDENTS.filter((i) => !SITES.includes(i.site)).map((i) => i.id)).toEqual([]);
    expect(INCIDENTS.filter((i) => ![1, 2, 3].includes(i.tier)).map((i) => i.id)).toEqual([]);
    expect(INCIDENTS.filter((i) => !ERA_CAPS.includes(i.minCap)).map((i) => i.id)).toEqual([]);
  });

  it('is roughly half tier 1, a third tier 2 and a sixth tier 3', () => {
    const share = (tier) => INCIDENTS.filter((i) => i.tier === tier).length / INCIDENTS.length;
    expect(share(1)).toBeGreaterThanOrEqual(0.42);
    expect(share(1)).toBeLessThanOrEqual(0.58);
    expect(share(2)).toBeGreaterThanOrEqual(0.27);
    expect(share(2)).toBeLessThanOrEqual(0.43);
    expect(share(3)).toBeGreaterThanOrEqual(0.1);
    expect(share(3)).toBeLessThanOrEqual(0.2);
  });

  it('covers every era without piling into one', () => {
    for (const cap of ERA_CAPS) {
      const n = INCIDENTS.filter((i) => i.minCap === cap).length;
      expect(n, `incidents at minCap ${cap}`).toBeGreaterThanOrEqual(14);
      expect(n, `incidents at minCap ${cap}`).toBeLessThanOrEqual(32);
    }
  });

  it('uses only known kinds, with a missing kind meaning gaffe', () => {
    expect(INCIDENTS.filter((i) => 'kind' in i && !KINDS.includes(i.kind)).map((i) => i.id)).toEqual([]);
  });

  it('has at least 5 incidents of every serious kind', () => {
    for (const kind of KINDS.filter((k) => k !== 'gaffe')) {
      expect(INCIDENTS.filter((i) => i.kind === kind).length, kind).toBeGreaterThanOrEqual(5);
    }
  });

  it('gives every building type something to go wrong', () => {
    for (const site of SITES) {
      expect(INCIDENTS.filter((i) => i.site === site).length, site).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('events', () => {
  const EFFECT_KEYS = ['doom', 'hype', 'align', 'cap', 'revSecs', 'cashMult', 'buff', 'flag'];
  const BUFF_STATS = ['capRate', 'alignRate', 'hypeDecay', 'incidentRate', 'revenue'];
  const FLAGS = ['greed', 'openWeights', 'bunker', 'treaty', 'yolo'];
  const ABS_RANGES = { doom: [1, 12], hype: [3, 20], align: [1, 8], cap: [1, 4] };
  const options = EVENTS.flatMap((e) => e.options.map((o) => ({ ...o, event: e.id })));

  // Lists every effect that breaks the schema as "<event>/<label>: <problem>".
  function effectProblems(o) {
    const where = `${o.event}/${o.label}`;
    const fx = o.effects;
    if (!fx || typeof fx !== 'object') return [`${where}: no effects object`];
    const problems = [];
    const keys = Object.keys(fx);
    if (keys.length === 0) problems.push(`${where}: empty effects`);
    for (const k of keys) if (!EFFECT_KEYS.includes(k)) problems.push(`${where}: unknown key ${k}`);
    for (const [k, [lo, hi]] of Object.entries(ABS_RANGES)) {
      if (!(k in fx)) continue;
      const abs = Math.abs(fx[k]);
      if (!Number.isInteger(fx[k]) || abs < lo || abs > hi) problems.push(`${where}: ${k}=${fx[k]}`);
    }
    if ('revSecs' in fx) {
      const v = fx.revSecs;
      const ok = Number.isInteger(v) && ((v >= 10 && v <= 120) || (v >= -90 && v <= -10));
      if (!ok) problems.push(`${where}: revSecs=${v}`);
    }
    if ('cashMult' in fx) {
      const v = fx.cashMult;
      if (!(v >= 0.5 && v <= 1.5) || v === 1) problems.push(`${where}: cashMult=${v}`);
    }
    if ('buff' in fx) {
      const b = fx.buff;
      const extra = Object.keys(b).filter((k) => !['stat', 'mult', 'secs'].includes(k));
      if (extra.length) problems.push(`${where}: buff keys ${extra}`);
      if (!BUFF_STATS.includes(b.stat)) problems.push(`${where}: buff stat ${b.stat}`);
      if (!(b.mult >= 0.3 && b.mult <= 2.5) || b.mult === 1) problems.push(`${where}: buff mult ${b.mult}`);
      if (!(b.secs >= 15 && b.secs <= 60)) problems.push(`${where}: buff secs ${b.secs}`);
    }
    if ('flag' in fx && !FLAGS.includes(fx.flag)) problems.push(`${where}: flag ${fx.flag}`);
    return problems;
  }

  it('has at least 50 cards with unique kebab-case ids', () => {
    expect(EVENTS.length).toBeGreaterThanOrEqual(50);
    expect(EVENTS.filter((e) => !KEBAB.test(e.id)).map((e) => e.id)).toEqual([]);
    expect(duplicates(EVENTS.map((e) => e.id))).toEqual([]);
    expect(duplicates(EVENTS.map((e) => e.title))).toEqual([]);
  });

  it('keeps titles, bodies, buttons and results within their limits', () => {
    expect(overLimit(EVENTS.map((e) => e.title), 32)).toEqual([]);
    expect(overLimit(EVENTS.map((e) => e.body), 220)).toEqual([]);
    expect(overLimit(options.map((o) => o.label), 34)).toEqual([]);
    expect(overLimit(options.map((o) => o.result), 140)).toEqual([]);
  });

  it('offers 2 or 3 distinct options per card', () => {
    expect(EVENTS.filter((e) => e.options.length < 2 || e.options.length > 3).map((e) => e.id)).toEqual([]);
    expect(EVENTS.filter((e) => duplicates(e.options.map((o) => o.label)).length).map((e) => e.id)).toEqual(
      [],
    );
  });

  it('uses only known effect keys within their ranges', () => {
    expect(options.flatMap(effectProblems)).toEqual([]);
  });

  it('uses era boundaries for minCap and a sane maxCap', () => {
    expect(EVENTS.filter((e) => 'minCap' in e && !ERA_CAPS.includes(e.minCap)).map((e) => e.id)).toEqual([]);
    const badMax = EVENTS.filter(
      (e) => 'maxCap' in e && !(e.maxCap > (e.minCap || 0) && e.maxCap <= 100),
    ).map((e) => e.id);
    expect(badMax).toEqual([]);
    expect(EVENTS.filter((e) => 'once' in e && typeof e.once !== 'boolean').map((e) => e.id)).toEqual([]);
  });

  it('spreads cards across every era', () => {
    for (const cap of ERA_CAPS) {
      const n = EVENTS.filter((e) => (e.minCap || 0) === cap).length;
      expect(n, `cards at minCap ${cap}`).toBeGreaterThanOrEqual(6);
    }
  });

  it('makes most cards one-offs', () => {
    expect(EVENTS.filter((e) => e.once).length / EVENTS.length).toBeGreaterThan(0.7);
  });

  it('lets greed reach the shareholders ending', () => {
    const greedy = EVENTS.filter((e) => e.options.some((o) => o.effects.flag === 'greed'));
    expect(greedy.length).toBeGreaterThanOrEqual(6);
  });

  it('includes the classic cards', () => {
    const ids = new Set(EVENTS.map((e) => e.id));
    const classics = [
      'seven-trillion',
      'safety-compute',
      'congress-testimony',
      'open-weights',
      'town-square-brawl',
      'agi-internally',
      'reactor-restart',
      'board-coup',
      'basilisk-form',
      'model-lawyer',
      'caught-sandbagging',
      'intern-question',
      'bunker-agent',
      'roomba-card',
      'leather-jacket',
    ];
    expect(classics.filter((id) => !ids.has(id))).toEqual([]);
  });
});

describe('headlines', () => {
  const BANDS = ['calm', 'uneasy', 'alarming', 'apocalyptic'];
  const all = [
    ...BANDS.flatMap((b) => HEADLINES[b]),
    ...HEADLINES.winter,
    ...HEADLINES.boom,
    ...[0, 1, 2, 3, 4].flatMap((k) => HEADLINES.eras[k]),
  ];

  it('has 30+ lines in each doom band', () => {
    for (const b of BANDS) expect(HEADLINES[b].length, b).toBeGreaterThanOrEqual(30);
  });

  it('has 20+ winter and boom lines', () => {
    expect(HEADLINES.winter.length).toBeGreaterThanOrEqual(20);
    expect(HEADLINES.boom.length).toBeGreaterThanOrEqual(20);
  });

  it('has 12+ lines for each of the five eras', () => {
    expect(Object.keys(HEADLINES.eras).sort()).toEqual(['0', '1', '2', '3', '4']);
    for (const k of [0, 1, 2, 3, 4]) expect(HEADLINES.eras[k].length, `era ${k}`).toBeGreaterThanOrEqual(12);
  });

  it('fits the ticker and never repeats', () => {
    expect(overLimit(all, 90)).toEqual([]);
    expect(duplicates(all)).toEqual([]);
  });

  it('uses only the {lab}, {model} and {year} tokens, in about a fifth of lines', () => {
    const tokens = all.flatMap((h) => [...h.matchAll(/\{([^}]*)\}/g)].map((m) => m[1]));
    expect(tokens.filter((t) => !['lab', 'model', 'year'].includes(t))).toEqual([]);
    const share = all.filter((h) => /\{(lab|model|year)\}/.test(h)).length / all.length;
    expect(share).toBeGreaterThanOrEqual(0.1);
    expect(share).toBeLessThanOrEqual(0.3);
  });
});

describe('endings', () => {
  const KEYS = [
    'paperclips',
    'shoggoth',
    'replication',
    'engagement',
    'sycophancy',
    'generic',
    'winter',
    'utopia',
    'shareholders',
    'weird',
  ];

  it('has exactly the ten endings the sim can reach', () => {
    expect(Object.keys(ENDINGS).sort()).toEqual([...KEYS].sort());
  });

  it('keeps every ending within its limits', () => {
    const endings = Object.values(ENDINGS);
    expect(overLimit(endings.map((e) => e.title), 24)).toEqual([]);
    expect(overLimit(endings.map((e) => e.subtitle), 60)).toEqual([]);
    expect(endings.filter((e) => e.epitaph.length < 3 || e.epitaph.length > 5).map((e) => e.title)).toEqual([]);
    expect(overLimit(endings.flatMap((e) => e.epitaph), 110)).toEqual([]);
  });

  it('stamps one or two uppercase words', () => {
    const bad = Object.values(ENDINGS)
      .map((e) => e.stamp)
      .filter((s) => typeof s !== 'string' || s !== s.toUpperCase() || !/^\S+( \S+)?$/.test(s) || s.length > 16);
    expect(bad).toEqual([]);
  });
});

describe('flavor', () => {
  it('has 25 normal and 20 ominous uppercase billboards of 12 chars or fewer', () => {
    expect(BILLBOARDS.normal.length).toBeGreaterThanOrEqual(25);
    expect(BILLBOARDS.ominous.length).toBeGreaterThanOrEqual(20);
    const boards = [...BILLBOARDS.normal, ...BILLBOARDS.ominous];
    expect(overLimit(boards, 12)).toEqual([]);
    expect(boards.filter((b) => b !== b.toUpperCase())).toEqual([]);
    expect(duplicates(boards)).toEqual([]);
  });

  it('has enough blimp quips, taglines and loading quips within their limits', () => {
    expect(BLIMP_QUIPS.length).toBeGreaterThanOrEqual(20);
    expect(overLimit(BLIMP_QUIPS, 80)).toEqual([]);
    expect(TAGLINES.length).toBeGreaterThanOrEqual(12);
    expect(overLimit(TAGLINES, 70)).toEqual([]);
    expect(LOADING_QUIPS.length).toBeGreaterThanOrEqual(15);
    expect(overLimit(LOADING_QUIPS, 50)).toEqual([]);
    expect(duplicates([...BLIMP_QUIPS, ...TAGLINES, ...LOADING_QUIPS])).toEqual([]);
  });

  it('has 10 uppercase old-west storefront signs of 12 chars or fewer', () => {
    expect(GOLD_RUSH_SIGNS.length).toBeGreaterThanOrEqual(10);
    expect(overLimit(GOLD_RUSH_SIGNS, 12)).toEqual([]);
    expect(GOLD_RUSH_SIGNS.filter((s) => s !== s.toUpperCase())).toEqual([]);
    expect(duplicates(GOLD_RUSH_SIGNS)).toEqual([]);
  });

  it('has 10 unique tickers of up to 5 capital letters', () => {
    expect(TICKER_SYMBOLS).toHaveLength(10);
    expect(TICKER_SYMBOLS.filter((t) => !/^[A-Z]{1,5}$/.test(t.sym)).map((t) => t.sym)).toEqual([]);
    expect(overLimit(TICKER_SYMBOLS.map((t) => t.name), 30)).toEqual([]);
    expect(duplicates(TICKER_SYMBOLS.map((t) => t.sym))).toEqual([]);
  });
});
