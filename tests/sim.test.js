import { describe, it, expect } from 'vitest';
import { createSim, cumFromPoints } from '../src/sim/sim.js';
import { B } from '../src/sim/balance.js';
import { fixtureContent } from './fixtures.js';

const sim = createSim(fixtureContent);

function newGame(seed = 1) {
  const s = sim.newGame(seed);
  // Most tests want a quiet world; individual tests opt back in.
  s.cardTimer = 1e9;
  s.blimpTimer = 1e9;
  s.incidentTimer = 1e9;
  return s;
}

function setCap(s, points) {
  s.cumTrain = cumFromPoints(points, B.capC0);
  s.capBonus = 0;
  s.cap = points;
  s.releases = Math.floor(points / 10);
  s.era = Math.min(4, Math.floor(points / 20));
  s.bossesStarted = B.bosses.filter((b) => b.at <= points).map((b) => b.kind);
}

function setAlign(s, points) {
  s.cumSafety = cumFromPoints(points, B.alignS0);
  s.alignBonus = 0;
  s.align = points;
}

function run(s, seconds) {
  for (let i = 0; i < seconds * 10; i++) sim.tick(s, 0.1);
}

// Plays on, taking the first option of any decision card that opens.
function runPlaying(s, seconds) {
  for (let i = 0; i < seconds * 10; i++) {
    if (s.phase === 'card') sim.chooseCard(s, 0);
    sim.tick(s, 0.1);
  }
}

function fxOf(s, type) {
  return sim.drainFx(s).filter((f) => f.type === type);
}

describe('a new game', () => {
  it('starts in play at 2023 Q1 with a starter GPU rack already placed', () => {
    const s = newGame();
    expect(s.phase).toBe('play');
    expect(sim.date(s)).toEqual({ year: 2023, quarter: 1 });
    expect(s.owned.rack).toBe(1);
    expect(s.plots.filter((p) => p.bId === 'rack').length).toBe(1);
    expect(s.cash).toBe(B.start.cash);
    expect(s.hype).toBe(B.start.hype);
  });
});

describe('economy', () => {
  it('earns compute x price x hype multiplier per second', () => {
    const s = newGame();
    const d = sim.derived(s);
    const expected = d.compute * B.price * (B.hypeRevenueBase + s.hype / 100);
    expect(d.revenue).toBeCloseTo(expected, 6);
    const before = s.cash;
    run(s, 1);
    expect(s.cash - before).toBeGreaterThan(expected * 0.95);
    expect(s.cash - before).toBeLessThan(expected * 1.05);
  });

  it('buys a building onto an empty plot and raises the next price by 15%', () => {
    const s = newGame();
    s.cash = 1000;
    const cost = sim.buildingCost(s, 'basement');
    expect(sim.buyBuilding(s, 'basement')).toBe(true);
    expect(s.cash).toBeCloseTo(1000 - cost, 6);
    expect(s.owned.basement).toBe(1);
    const plot = s.plots.find((p) => p.bId === 'basement');
    expect(plot.filler).toBe(null);
    expect(sim.buildingCost(s, 'basement')).toBeCloseTo(cost * 1.15, 6);
    expect(fxOf(s, 'built')[0]).toMatchObject({ plot: plot.id, bId: 'basement' });
  });

  it('refuses purchases it cannot afford or that are still locked', () => {
    const s = newGame();
    s.cash = 5;
    expect(sim.buyBuilding(s, 'rack')).toBe(false);
    s.cash = 1e9;
    expect(sim.buyBuilding(s, 'dyson')).toBe(false);
    expect(sim.drainFx(s).some((f) => f.type === 'error')).toBe(true);
  });

  it('bulldozes unprotected homes once empty plots run out, then builds upward', () => {
    const s = newGame();
    s.cash = 1e15;
    const empty = s.plots.filter((p) => !p.filler && !p.bId).length;
    for (let i = 0; i < empty; i++) sim.buyBuilding(s, 'basement');
    expect(s.plots.filter((p) => !p.filler && !p.bId).length).toBe(0);
    sim.drainFx(s);
    sim.buyBuilding(s, 'basement');
    const demolished = fxOf(s, 'demolished');
    expect(demolished.length).toBe(1);
    const unprotected = s.plots.filter((p) => p.filler && !p.protected).length;
    for (let i = 0; i < unprotected; i++) sim.buyBuilding(s, 'basement');
    expect(s.plots.filter((p) => p.protected).every((p) => p.filler && !p.bId)).toBe(true);
    sim.buyBuilding(s, 'basement');
    expect(s.plots.some((p) => p.level > 1)).toBe(true);
  });

  it('applies one-time upgrades', () => {
    const s = newGame();
    s.cash = 1e6;
    const before = sim.derived(s).compute;
    expect(sim.buyUpgrade(s, 'cooling')).toBe(true);
    expect(sim.derived(s).compute).toBeCloseTo(before * 1.25, 6);
    expect(sim.buyUpgrade(s, 'cooling')).toBe(false);
  });
});

describe('scaling laws', () => {
  it('grows capability with training compute, faster with more compute', () => {
    const a = newGame();
    const b = newGame();
    b.owned.rack = 30;
    run(a, 30);
    run(b, 30);
    expect(a.cap).toBeGreaterThan(0);
    expect(b.cap).toBeGreaterThan(a.cap);
  });

  it('grows alignment from safety research', () => {
    const s = newGame();
    s.owned.evals = 5;
    run(s, 20);
    expect(s.align).toBeGreaterThan(5);
  });

  it('pausing training freezes capability for its duration', () => {
    const s = newGame();
    setCap(s, 20);
    expect(sim.useAbility(s, 'pause')).toBe(true);
    const cap = s.cap;
    run(s, B.pause.duration - 1);
    expect(s.cap).toBeCloseTo(cap, 6);
    run(s, 3);
    expect(s.cap).toBeGreaterThan(cap);
    expect(sim.useAbility(s, 'pause')).toBe(false); // cooling down
  });
});

describe('p(doom)', () => {
  it('rises while capability outruns alignment', () => {
    const s = newGame();
    setCap(s, 30);
    s.doom = 10;
    run(s, 10);
    expect(s.doom).toBeGreaterThan(11);
  });

  it('recovers when alignment leads but never drops below the capability floor', () => {
    const s = newGame();
    setCap(s, 50);
    setAlign(s, 80);
    s.owned.billboard = 40; // keep the winter away for the long wait
    s.doom = 40;
    run(s, 10);
    expect(s.doom).toBeLessThan(40);
    run(s, 400);
    expect(s.cap).toBeLessThan(s.align);
    expect(s.doom).toBeCloseTo(s.cap * B.doomFloorPerCap, 0);
  });

  it('ends the run in apocalypse at 100, flavored by the biggest cause', () => {
    const s = newGame();
    s.doomCause.engagement = 50;
    s.doom = 99.99;
    setCap(s, 40);
    run(s, 2);
    expect(s.phase).toBe('over');
    expect(s.ending).toMatchObject({ type: 'doom', cause: 'engagement' });
  });
});

describe('hype', () => {
  it('decays and ends the run in an AI winter at zero', () => {
    const s = newGame();
    s.owned.rack = 0;
    s.hype = 3;
    run(s, 60);
    expect(s.phase).toBe('over');
    expect(s.ending.type).toBe('winter');
  });

  it('vague-tweeting adds hype, then cools down', () => {
    const s = newGame();
    s.hype = 40;
    expect(sim.useAbility(s, 'tweet')).toBe(true);
    expect(s.hype).toBeCloseTo(40 + B.tweet.hype * sim.derived(s).relevance, 6);
    expect(sim.useAbility(s, 'tweet')).toBe(false);
    run(s, B.tweet.cooldown + 0.5);
    expect(sim.useAbility(s, 'tweet')).toBe(true);
  });
});

describe('incidents', () => {
  it('spawn over time, only from their era, at a fitting site', () => {
    const s = newGame();
    s.incidentTimer = 0;
    s.hype = 100;
    run(s, 90);
    expect(s.stats.incidentsSpawned).toBeGreaterThanOrEqual(6);
    const all = sim.drainFx(s).filter((f) => f.type === 'incident');
    expect(all.every((f) => f.templateId !== 'late')).toBe(true);
  });

  it('take their tier in clicks, and resolving lowers doom and adds alignment', () => {
    const s = newGame();
    s.doom = 20;
    const inc = sim.spawnIncident(s, 'glue');
    expect(inc.clicksLeft).toBe(3);
    sim.clickIncident(s, inc.id);
    sim.clickIncident(s, inc.id);
    expect(s.incidents.length).toBe(1);
    sim.clickIncident(s, inc.id);
    expect(s.incidents.length).toBe(0);
    expect(s.doom).toBeLessThan(20);
    expect(s.alignBonus).toBeGreaterThan(0);
    expect(s.stats.incidentsResolved).toBe(1);
  });

  it('need one fewer click on big incidents after RLHF', () => {
    const s = newGame();
    s.upgrades.rlhf = true;
    expect(sim.spawnIncident(s, 'glue').clicksLeft).toBe(2);
    expect(sim.spawnIncident(s, 'ducks').clicksLeft).toBe(1);
  });

  it('fail when ignored: doom up, hype down, a headline, smoke over the site', () => {
    const s = newGame();
    s.doom = 20;
    s.hype = 50;
    const inc = sim.spawnIncident(s, 'lab');
    sim.drainFx(s);
    run(s, B.incidentTime[3] + 1);
    expect(s.incidents.find((i) => i.id === inc.id)).toBeUndefined();
    expect(s.doom).toBeGreaterThan(20 + B.incidentFailDoom[3] - 1);
    const failed = fxOf(s, 'incidentFailed');
    expect(failed[0]).toMatchObject({ headline: 'Lab', at: inc.at });
    expect(s.stats.incidentsFailed).toBe(1);
  });

  it('the Big Red Button clears every open incident and spends a charge', () => {
    const s = newGame();
    setCap(s, 30);
    s.redCharges = 1;
    sim.spawnIncident(s, 'ducks');
    sim.spawnIncident(s, 'glue');
    expect(sim.useAbility(s, 'red')).toBe(true);
    expect(s.incidents.length).toBe(0);
    expect(s.redCharges).toBe(0);
    expect(sim.useAbility(s, 'red')).toBe(false);
  });
});

describe('model releases', () => {
  it('fire at every 10 capability with a lab, a model name and a hype spike', () => {
    const s = newGame();
    setCap(s, 9.99);
    s.releases = 0;
    s.hype = 40;
    s.cumTrain = cumFromPoints(10.5, B.capC0);
    sim.tick(s, 0.1);
    const rel = fxOf(s, 'release');
    expect(rel.length).toBe(1);
    expect(rel[0].model).toBe('Glorp-1');
    expect(fixtureContent.labs.map((l) => l.name)).toContain(rel[0].lab);
    expect(s.hype).toBeGreaterThan(40 + B.hypeOnRelease - 1);
  });
});

describe('decision cards', () => {
  it('open on a timer and freeze time until the player chooses', () => {
    const s = newGame();
    s.cardTimer = 0.05;
    sim.tick(s, 0.1);
    expect(s.phase).toBe('card');
    expect(['money', 'buffy']).toContain(s.card.id);
    const t = s.t;
    run(s, 5);
    expect(s.t).toBe(t);
  });

  it('apply effects and flags, and one-off cards never come back', () => {
    const s = newGame();
    s.cash = 100;
    s.doom = 10;
    sim.openCard(s, 'money');
    const rev = sim.derived(s).revenue;
    expect(sim.chooseCard(s, 0)).toBe(true);
    expect(s.phase).toBe('play');
    expect(s.cash).toBeCloseTo(100 + rev * 30, 4);
    expect(s.doom).toBeCloseTo(15, 6);
    expect(s.flags.greed).toBe(1);
    for (let i = 0; i < 20; i++) {
      s.cardTimer = 0;
      sim.tick(s, 0.1);
      expect(s.card.id).not.toBe('money');
      expect(s.card.id).not.toBe('late');
      sim.chooseCard(s, 1);
    }
  });

  it('timed buffs multiply their stat, then wear off', () => {
    const s = newGame();
    const base = sim.derived(s).revenue;
    sim.openCard(s, 'buffy');
    sim.chooseCard(s, 0);
    expect(sim.derived(s).revenue).toBeCloseTo(base * 2, 4);
    run(s, 11);
    expect(sim.derived(s).revenue).toBeLessThan(base * 1.5);
  });
});

describe('the VC blimp', () => {
  it('drifts by and pays out when clicked', () => {
    const s = newGame();
    s.blimpTimer = 0.05;
    sim.tick(s, 0.1);
    expect(s.blimp).not.toBe(null);
    const before = s.cash;
    expect(sim.clickBlimp(s)).toBe(true);
    expect(s.cash).toBeGreaterThanOrEqual(before + B.blimpMinCash);
    expect(s.blimp).toBe(null);
  });

  it('leaves if ignored', () => {
    const s = newGame();
    s.blimpTimer = 0.05;
    run(s, B.blimpTtl + 1);
    expect(s.blimp).toBe(null);
  });
});

describe('bosses', () => {
  it('the Shoggoth rises at 35 and sinks once every tentacle wears a smiley mask', () => {
    const s = newGame();
    setCap(s, 34);
    s.bossesStarted = [];
    s.cumTrain = cumFromPoints(35.2, B.capC0);
    sim.tick(s, 0.1);
    expect(s.boss.kind).toBe('shoggoth');
    s.doom = 50;
    for (const part of [...s.boss.parts]) for (let i = 0; i < B.shoggoth.hp; i++) sim.clickBoss(s, part.id);
    expect(s.boss).toBe(null);
    expect(s.doom).toBeLessThan(50);
    expect(s.stats.bossesDefeated).toBe(1);
  });

  it('a Shoggoth left alone spikes doom and gets the blame', () => {
    const s = newGame();
    setCap(s, 36);
    setAlign(s, 60);
    sim.startBoss(s, 'shoggoth');
    s.doom = 20;
    run(s, B.shoggoth.ttl + 1);
    expect(s.boss).toBe(null);
    expect(s.doom).toBeGreaterThan(20 + B.shoggoth.failDoom - 5);
    expect(s.doomCause.shoggoth).toBeGreaterThan(0);
  });

  it('rogue weights copy themselves when ignored and lose when all copies are deleted', () => {
    const s = newGame();
    setCap(s, 56);
    sim.startBoss(s, 'replication');
    expect(s.boss.parts.length).toBe(B.replication.start);
    run(s, B.replication.every + 0.5);
    expect(s.boss.parts.length).toBeGreaterThan(B.replication.start);
    while (s.boss && s.boss.parts.length) sim.clickBoss(s, s.boss.parts[0].id);
    expect(s.boss).toBe(null);
    expect(s.stats.bossesDefeated).toBe(1);
  });

  it('the paperclip maximizer piles up clips until its core is smashed', () => {
    const s = newGame();
    setCap(s, 76);
    sim.startBoss(s, 'paperclip');
    run(s, B.paperclip.pileEvery * 2.5);
    const piles = s.boss.parts.filter((p) => p.kind === 'pile');
    expect(piles.length).toBeGreaterThanOrEqual(2);
    sim.clickBoss(s, piles[0].id);
    expect(s.boss.parts.filter((p) => p.kind === 'pile').length).toBe(piles.length - 1);
    const core = s.boss.parts.find((p) => p.kind === 'core');
    for (let i = 0; i < B.paperclip.coreHp; i++) sim.clickBoss(s, core.id);
    expect(s.boss).toBe(null);
  });
});

describe('the singularity', () => {
  it('rolls a d100 against p(doom) when capability reaches 100', () => {
    const outcomes = new Set();
    for (let seed = 1; seed <= 40; seed++) {
      const s = newGame(seed);
      setCap(s, 99.9);
      setAlign(s, 99.9);
      s.doom = 50;
      s.cumTrain = cumFromPoints(100.5, B.capC0);
      sim.tick(s, 0.1);
      expect(s.phase).toBe('over');
      expect(s.ending.roll).toBeGreaterThanOrEqual(1);
      expect(s.ending.roll).toBeLessThanOrEqual(100);
      expect(s.ending.type).toBe(s.ending.roll <= 50 ? 'doom' : 'survive');
      outcomes.add(s.ending.type);
    }
    expect([...outcomes].sort()).toEqual(['doom', 'survive']);
  });

  it('picks the survival flavor from how you played', () => {
    expect(sim.survivalFlavor({ flags: { greed: 3 }, align: 120, doom: 5 })).toBe('shareholders');
    expect(sim.survivalFlavor({ flags: { greed: 0 }, align: 105, doom: 20 })).toBe('utopia');
    expect(sim.survivalFlavor({ flags: { greed: 0 }, align: 70, doom: 40 })).toBe('weird');
  });
});

describe('saving', () => {
  it('round-trips through JSON and replays identically', () => {
    const a = sim.newGame(7);
    runPlaying(a, 45);
    expect(a.t).toBeGreaterThan(40);
    const b = sim.deserialize(sim.serialize(a));
    runPlaying(a, 60);
    runPlaying(b, 60);
    expect(a.stats.incidentsSpawned).toBeGreaterThan(0);
    expect(sim.serialize(b)).toBe(sim.serialize(a));
  });
});
