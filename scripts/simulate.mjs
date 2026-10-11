#!/usr/bin/env node
// Headless balance check. Plays many seeded runs with simple bot players and
// reports how runs end and how long they take.
//
// Use it after changing src/sim/balance.js, buildings, upgrades or event
// effects. Targets: idle bots lose, an attentive balanced bot usually reaches
// the singularity, and runs last roughly 8-14 minutes.
//
//   node scripts/simulate.mjs                 all bots, 40 seeds each
//   node scripts/simulate.mjs balanced 200    one bot, 200 seeds
//   node scripts/simulate.mjs balanced 1 -v   one run with a per-quarter trace

import { createSim } from '../src/sim/sim.js';
import { B } from '../src/sim/balance.js';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('usage: simulate.mjs [bot] [seeds] [-v]\nbots: idle clicker greedy balanced curator kingmaker safety');
  process.exit(0);
}
const verbose = args.includes('-v');
const positional = args.filter((a) => !a.startsWith('-'));
const onlyBot = positional[0];
const seeds = Number(positional[1] || 40);

async function loadContent() {
  try {
    return (await import('../src/content/index.js')).CONTENT;
  } catch (err) {
    if (err.code !== 'ERR_MODULE_NOT_FOUND') throw err;
    const { fixtureContent } = await import('../tests/fixtures.js');
    console.log('(content index missing: using test fixtures for incidents/events)');
    return fixtureContent;
  }
}

const content = await loadContent();
const sim = createSim(content);
const BUILDINGS = content.buildings;
const UPGRADES = content.upgrades;

// A human-ish clicker: notices incidents after a reaction delay, then clicks
// at a limited rate. attention is the chance per second the player is looking.
function makeHands({ attention, clicksPerSec, reaction }) {
  let budget = 0;
  return function clickStuff(s, dt, rand) {
    budget = Math.min(clicksPerSec, budget + clicksPerSec * dt);
    if (rand() > attention) return;
    const targets = [];
    if (s.boss) {
      for (const p of s.boss.parts) {
        if (p.kind === 'tentacle' && p.hp <= 0) continue;
        // Paperclips: keep piles under control, otherwise hit the core.
        targets.push(p);
      }
      if (s.boss.kind === 'paperclip') {
        const piles = targets.filter((p) => p.kind === 'pile');
        const core = targets.find((p) => p.kind === 'core');
        targets.length = 0;
        if (piles.length > 3) targets.push(...piles);
        else targets.push(core, ...piles);
      }
    }
    while (budget >= 1 && targets.length) {
      const p = targets[0];
      if (!s.boss) break;
      sim.clickBoss(s, p.id);
      budget -= 1;
      if (!s.boss || !s.boss.parts.includes(p) || (p.kind === 'tentacle' && p.hp <= 0)) targets.shift();
    }
    const ready = s.incidents
      .filter((i) => i.max - i.left >= reaction)
      .sort((a, b) => a.left - b.left);
    for (const inc of ready) {
      while (budget >= 1 && s.incidents.includes(inc)) {
        sim.clickIncident(s, inc.id);
        budget -= 1;
      }
    }
  };
}

function affordable(s, list, cost) {
  return list.filter((x) => sim.isUnlocked(s, x.minCap) && cost(x) <= s.cash);
}

function buyBestValue(s, cat, valueKey) {
  const list = BUILDINGS.filter((b) => b.cat === cat && sim.isUnlocked(s, b.minCap));
  let best = null;
  let bestScore = 0;
  for (const b of list) {
    const cost = sim.buildingCost(s, b.id);
    const score = (b.stats[valueKey] || 0) / cost;
    if (score > bestScore) {
      bestScore = score;
      best = b;
    }
  }
  if (best && sim.buildingCost(s, best.id) <= s.cash) return sim.buyBuilding(s, best.id);
  return false;
}

function buyUpgrades(s, filter = () => true) {
  for (const u of affordable(s, UPGRADES, (u) => u.cost)) {
    if (!s.upgrades[u.id] && filter(u) && u.cost < s.cash * 0.6) sim.buyUpgrade(s, u.id);
  }
}

const BOTS = {
  idle: () => ({ hands: null, act() {} }),
  clicker: () => ({ hands: makeHands({ attention: 0.75, clicksPerSec: 3, reaction: 2 }), act() {} }),
  greedy: () => ({
    hands: makeHands({ attention: 0.75, clicksPerSec: 3, reaction: 2 }),
    act(s) {
      while (buyBestValue(s, 'compute', 'compute'));
      if (s.hype < 40) sim.useAbility(s, 'tweet');
      buyUpgrades(s, (u) => u.effect.computeMult);
    },
  }),
  balanced: () => ({
    hands: makeHands({ attention: 0.75, clicksPerSec: 3, reaction: 2 }),
    act(s) {
      const d = sim.derived(s);
      if (s.hype < 60) sim.useAbility(s, 'tweet');
      if (s.doom > 70 && s.cap > s.align) sim.useAbility(s, 'pause');
      if (s.incidents.length >= 5 || (s.boss && s.boss.ttl < 6)) sim.useAbility(s, 'red');
      buyUpgrades(s, (u) => !u.effect.doomNow || u.effect.doomNow < 0);
      for (let i = 0; i < 20; i++) {
        let bought = false;
        if (s.hype < 40) bought = buyBestValue(s, 'hype', 'hype');
        if (!bought && s.align < s.cap - 2) bought = buyBestValue(s, 'safety', 'research');
        if (!bought) bought = buyBestValue(s, 'compute', 'compute');
        if (!bought) break;
      }
    },
  }),
  // Balanced, plus steering: favor the most careful lab, embargo the two most reckless.
  curator: () => {
    const base = BOTS.balanced();
    let steered = false;
    return {
      hands: base.hands,
      act(s) {
        if (!steered) {
          steered = true;
          const byReck = content.labs.slice().sort((a, b) => a.reckless - b.reckless);
          sim.setLabStance(s, byReck[0].id, 'favored');
          sim.setLabStance(s, byReck[byReck.length - 1].id, 'embargo');
          sim.setLabStance(s, byReck[byReck.length - 2].id, 'embargo');
        }
        base.act(s);
      },
    };
  },
  // Balanced, but sells everything to the single most reckless lab.
  kingmaker: () => {
    const base = BOTS.balanced();
    let steered = false;
    return {
      hands: base.hands,
      act(s) {
        if (!steered) {
          steered = true;
          const worst = content.labs.slice().sort((a, b) => b.reckless - a.reckless)[0];
          for (const l of content.labs) if (l.id !== worst.id) sim.setLabStance(s, l.id, 'embargo');
        }
        base.act(s);
      },
    };
  },
  safety: () => ({
    hands: makeHands({ attention: 0.75, clicksPerSec: 3, reaction: 2 }),
    act(s) {
      if (s.hype < 50) sim.useAbility(s, 'tweet');
      buyUpgrades(s);
      while (buyBestValue(s, 'safety', 'research') || buyBestValue(s, 'hype', 'hype'));
    },
  }),
};

function playOne(botName, seed) {
  const s = sim.newGame(seed);
  const bot = BOTS[botName]();
  let r = seed * 9301 + 49297;
  const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const dt = 0.1;
  let lastQ = -1;
  while (s.phase !== 'over' && s.t < 3600) {
    if (s.phase === 'card') {
      const opts = content.events.find((e) => e.id === s.card.id).options;
      sim.chooseCard(s, Math.floor(rand() * opts.length));
      continue;
    }
    sim.tick(s, dt);
    sim.drainFx(s);
    bot.hands?.(s, dt, rand);
    if (Math.round(s.t * 10) % 5 === 0) bot.act(s);
    const q = Math.floor(s.t / B.QUARTER_SECONDS);
    if (verbose && q !== lastQ) {
      lastQ = q;
      const d = sim.derived(s);
      console.log(
        `${sim.date(s).year} Q${sim.date(s).quarter}  t=${s.t.toFixed(0).padStart(4)}  cash=${fmt(s.cash).padStart(7)}` +
          `  compute=${fmt(d.compute).padStart(7)}  cap=${s.cap.toFixed(1).padStart(5)}  align=${s.align.toFixed(1).padStart(5)}` +
          `  doom=${s.doom.toFixed(1).padStart(5)}  hype=${s.hype.toFixed(0).padStart(3)}  inc=${s.incidents.length}` +
          `  res=${s.stats.incidentsResolved} fail=${s.stats.incidentsFailed}${s.boss ? '  BOSS ' + s.boss.kind : ''}`,
      );
    }
  }
  return s;
}

function fmt(n) {
  const units = ['', 'K', 'M', 'B', 'T', 'Qa'];
  let i = 0;
  while (Math.abs(n) >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(n < 10 ? 1 : 0) + units[i];
}

function summarize(botName) {
  const outcomes = {};
  let minutes = 0;
  let doomSum = 0;
  let bossesWon = 0;
  let bossesLost = 0;
  let firstRelease = 0;
  const endTimes = [];
  for (let seed = 1; seed <= seeds; seed++) {
    const s = playOne(botName, seed);
    const e = s.ending;
    const key = e ? (e.type === 'survive' ? `survive:${e.flavor}` : e.type === 'doom' ? `doom:${e.cause}${e.singularity ? '@roll' : ''}` : e.type) : 'timeout';
    outcomes[key] = (outcomes[key] || 0) + 1;
    minutes += s.t / 60;
    endTimes.push(s.t / 60);
    doomSum += s.doom;
    bossesWon += s.stats.bossesDefeated;
    bossesLost += s.stats.bossesFailed;
  }
  endTimes.sort((a, b) => a - b);
  const pct = (k) => endTimes[Math.floor((endTimes.length - 1) * k)].toFixed(1);
  console.log(`\n== ${botName} (${seeds} runs)`);
  console.log(`  length min: median ${pct(0.5)}  p10 ${pct(0.1)}  p90 ${pct(0.9)}   avg doom at end ${(doomSum / seeds).toFixed(0)}`);
  console.log(`  bosses won/lost: ${bossesWon}/${bossesLost}`);
  for (const [k, v] of Object.entries(outcomes).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(28)} ${String(v).padStart(4)}  ${((100 * v) / seeds).toFixed(0)}%`);
  }
}

if (verbose) {
  const s = playOne(onlyBot || 'balanced', seeds);
  console.log('ending:', JSON.stringify(s.ending), 'stats:', JSON.stringify(s.stats));
} else {
  for (const name of onlyBot ? [onlyBot] : Object.keys(BOTS)) summarize(name);
}
