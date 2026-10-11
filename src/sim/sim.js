// PICKS & SHOVELS game simulation. Pure and deterministic: all randomness
// comes from the seeded generator stored in the state, and nothing here
// touches the DOM. The renderer, UI and audio read the state and drain the
// fx queue; player actions come back in through the exported functions.

import { B } from './balance.js';
import { generateMap } from './map.js';
import { nextRandom, randRange, randInt, pick } from './rng.js';

export const MAP = generateMap();

export function pointsFromCum(cum, c0) {
  return B.pointsPerDecade * Math.log10(1 + Math.max(0, cum) / c0);
}

export function cumFromPoints(points, c0) {
  return c0 * (Math.pow(10, points / B.pointsPerDecade) - 1);
}

export const ERAS = ['Chatbot Era', 'Copilot Era', 'Agent Era', 'AGI-ish Era', 'Superintelligence Imminent'];

const DOOM_CAUSES = ['generic', 'paperclips', 'shoggoth', 'replication', 'engagement', 'sycophancy'];
// Doom from the capability gap takes the shape of the era's failure mode.
const ERA_CAUSE = ['sycophancy', 'sycophancy', 'engagement', 'replication', 'paperclips'];
const SITE_CAUSE = { hype: 'engagement', home: 'sycophancy', shop: 'sycophancy', compute: 'paperclips' };
// Serious incident kinds point at the ending they foreshadow.
const KIND_CAUSE = { escape: 'replication', swarm: 'replication', misalignment: 'shoggoth', rsi: 'paperclips', finance: 'engagement' };

export function createSim(content) {
  const BUILDING = Object.fromEntries(content.buildings.map((b) => [b.id, b]));
  const UPGRADE = Object.fromEntries(content.upgrades.map((u) => [u.id, u]));
  const INCIDENT = Object.fromEntries(content.incidents.map((i) => [i.id, i]));
  const EVENT = Object.fromEntries(content.events.map((e) => [e.id, e]));

  function emit(s, type, data = {}) {
    s.fx.push({ type, ...data });
  }

  // ── setup ────────────────────────────────────────────────

  function newGame(seed = (Date.now() & 0x7fffffff) || 1) {
    const s = {
      v: 1,
      seed,
      rng: seed | 0,
      t: 0,
      phase: 'play',
      cash: B.start.cash,
      hype: B.start.hype,
      doom: B.start.doom,
      cumTrain: 0,
      cumSafety: 0,
      capBonus: 0,
      alignBonus: 0,
      cap: 0,
      align: 0,
      releases: 0,
      era: 0,
      lastModel: null,
      lastLab: null,
      owned: {},
      upgrades: {},
      labs: content.labs.map((l) => ({
        id: l.id,
        cumTrain: 0,
        capBonus: 0,
        cap: 0,
        tokens: 0,
        stance: 'normal',
        lastModel: null,
        releases: 0,
      })),
      plots: MAP.plots.map((p) => ({ id: p.id, filler: p.filler, protected: p.protected, bId: null, level: 0 })),
      incidents: [],
      nextId: 1,
      incidentTimer: 5,
      boss: null,
      bossesStarted: [],
      bossesWon: [],
      card: null,
      cardTimer: B.firstCardAt,
      usedCards: [],
      recentCards: [],
      buffs: [],
      cooldowns: { tweet: 0, pause: 0 },
      pauseLeft: 0,
      pauseUnlocked: false,
      redUnlocked: false,
      redCharges: 0,
      blimp: null,
      blimpTimer: B.firstBlimpAt,
      flags: { greed: 0 },
      doomCause: Object.fromEntries(DOOM_CAUSES.map((c) => [c, 0])),
      stats: {
        incidentsSpawned: 0,
        incidentsResolved: 0,
        incidentsAuto: 0,
        incidentsFailed: 0,
        cardsChosen: 0,
        blimps: 0,
        tweets: 0,
        pauses: 0,
        redButtons: 0,
        bossesDefeated: 0,
        bossesFailed: 0,
        buildingsBought: 0,
        upgradesBought: 0,
        demolished: 0,
        totalEarned: 0,
        peakCash: B.start.cash,
        peakDoom: B.start.doom,
        minHype: B.start.hype,
        clickStreakBest: 0,
      },
      ending: null,
      fx: [],
    };
    for (const [id, n] of Object.entries(B.startOwned)) {
      for (let i = 0; i < n; i++) {
        s.owned[id] = (s.owned[id] || 0) + 1;
        placeBuilding(s, id, { silent: true });
      }
    }
    return s;
  }

  function serialize(s) {
    return JSON.stringify({ ...s, fx: [] });
  }

  function deserialize(str) {
    const s = JSON.parse(str);
    s.fx = [];
    return s;
  }

  function drainFx(s) {
    const out = s.fx;
    s.fx = [];
    return out;
  }

  // ── derived numbers ──────────────────────────────────────

  function buffMult(s, stat) {
    let m = 1;
    for (const b of s.buffs) if (b.stat === stat) m *= b.mult;
    return m;
  }

  function upgradeProduct(s, key) {
    let m = 1;
    for (const id of Object.keys(s.upgrades)) {
      const v = UPGRADE[id]?.effect[key];
      if (v !== undefined) m *= v;
    }
    return m;
  }

  function upgradeSum(s, key) {
    let m = 0;
    for (const id of Object.keys(s.upgrades)) m += UPGRADE[id]?.effect[key] || 0;
    return m;
  }

  function statSum(s, key) {
    let total = 0;
    for (const [id, n] of Object.entries(s.owned)) total += (BUILDING[id]?.stats[key] || 0) * n;
    return total;
  }

  function statDecay(s, key) {
    let m = 1;
    for (const [id, n] of Object.entries(s.owned)) {
      const v = BUILDING[id]?.stats[key];
      if (v) m *= Math.pow(1 - v, n);
    }
    return m;
  }

  // Who buys your GPUs: natural appetite, nudged by your favor or embargo,
  // and the leader gets a little extra (everyone wants to sell to the winner).
  function labMarket(s) {
    const weights = [];
    const base = [];
    let total = 0;
    let baseTotal = 0;
    let leader = 0;
    let embargoes = 0;
    s.labs.forEach((lab, i) => {
      const prof = content.labs[i] || {};
      const appetite = prof.appetite ?? 1;
      const stance = lab.stance === 'favored' ? B.favorMult : lab.stance === 'embargo' ? 0 : 1;
      if (lab.stance === 'embargo') embargoes++;
      const w = appetite * stance * (1 + lab.cap / 50);
      weights.push(w);
      base.push(appetite);
      total += w;
      baseTotal += appetite;
      if (lab.cap > s.labs[leader].cap) leader = i;
    });
    return {
      shares: weights.map((w) => (total > 0 ? w / total : 0)),
      base: base.map((b) => b / baseTotal),
      leader,
      embargoes,
    };
  }

  function derived(s) {
    const compute = statSum(s, 'compute') * upgradeProduct(s, 'computeMult');
    const labCompute = B.labBase * Math.exp(B.labGrowth * s.t);
    const labShare = labCompute / (compute + labCompute);
    const { shares: labShares, base: labBaseShares, leader, embargoes } = labMarket(s);
    const sold = labShares.some((x) => x > 0) ? 1 : 0;
    const hypeMult = B.hypeRevenueBase + s.hype / 100;
    const revenue =
      compute * B.price * hypeMult * buffMult(s, 'revenue') * sold * Math.max(0, 1 - B.embargoRevenueCut * embargoes);
    const leaderReck = content.labs[leader]?.reckless ?? 0.5;
    const research = statSum(s, 'research') * upgradeProduct(s, 'researchMult') * buffMult(s, 'alignRate');
    const paused = s.pauseLeft > 0;
    const capMult = paused ? 0 : upgradeProduct(s, 'capMult') * buffMult(s, 'capRate');
    const trainRate = (compute + labCompute) * capMult;
    // Investors grow harder to impress, and nobody listens to a vendor
    // with no market share.
    const relevance = 1 - B.irrelevanceGainCut * labShare;
    const hypeGain = (statSum(s, 'hype') / (1 + s.t / B.hypeDecayTimeScale)) * relevance;
    const hypeDecay =
      (B.hypeDecayBase + B.hypeDecayPerHype * s.hype) *
      (1 + s.t / B.hypeDecayTimeScale) *
      (1 + B.irrelevanceK * labShare) *
      upgradeProduct(s, 'hypeDecayMult') *
      buffMult(s, 'hypeDecay');
    const incidentRate =
      (B.incidentRateBase + B.incidentRatePerCap * s.cap) *
      Math.max(0.35, statDecay(s, 'incidentReduce')) *
      buffMult(s, 'incidentRate') *
      (s.boss ? B.bossIncidentRateMult : 1) *
      (paused ? 0.5 : 1);
    const incidentTimeMult = 1 + Math.min(1, statSum(s, 'incidentTime')) + upgradeSum(s, 'incidentTimeAdd');
    const autoResolve = Math.min(B.internAutoMax, B.internAutoPerSec * statSum(s, 'autoResolve'));
    const doomDamp = statDecay(s, 'doomDamp') * upgradeProduct(s, 'doomGapMult');
    const gap = s.cap - s.align;
    const recklessness = B.recklessBase + B.recklessScale * leaderReck;
    const doomRate =
      gap > 0 ? B.doomGapK * gap * doomDamp * recklessness : -B.doomRecover * Math.min(1, -gap / 10);
    return {
      compute,
      revenue,
      research,
      trainRate,
      labCompute,
      paused,
      hypeGain,
      hypeDecay,
      hypeRate: hypeGain - hypeDecay,
      incidentRate,
      incidentTimeMult,
      autoResolve,
      doomDamp,
      doomRate,
      doomFloor: s.cap * B.doomFloorPerCap * upgradeProduct(s, 'floorMult'),
      labShare,
      labShares,
      labBaseShares,
      leader,
      recklessness,
      relevance,
      era: s.era,
      eraName: ERAS[s.era],
    };
  }

  function date(s) {
    const q = Math.floor(s.t / B.QUARTER_SECONDS);
    return { year: B.START_YEAR + Math.floor(q / 4), quarter: (q % 4) + 1 };
  }

  // ── doom/hype bookkeeping ────────────────────────────────

  function addDoom(s, amount, cause = 'generic') {
    s.doom = Math.min(100, Math.max(0, s.doom + amount));
    if (amount > 0) s.doomCause[cause] = (s.doomCause[cause] || 0) + amount;
    s.stats.peakDoom = Math.max(s.stats.peakDoom, s.doom);
  }

  function addHype(s, amount) {
    s.hype = Math.min(100, Math.max(0, s.hype + amount));
    s.stats.minHype = Math.min(s.stats.minHype, s.hype);
  }

  function addCash(s, amount) {
    s.cash = Math.max(0, s.cash + amount);
    if (amount > 0) s.stats.totalEarned += amount;
    s.stats.peakCash = Math.max(s.stats.peakCash, s.cash);
  }

  function recomputeMeters(s) {
    let frontier = 0;
    for (const lab of s.labs) {
      lab.cap = Math.max(0, pointsFromCum(lab.cumTrain, B.labC0) + lab.capBonus);
      frontier = Math.max(frontier, lab.cap);
    }
    s.cap = Math.min(100, frontier + s.capBonus);
    s.align = Math.max(0, pointsFromCum(s.cumSafety, B.alignS0) + s.alignBonus);
  }

  // ── buildings & plots ────────────────────────────────────

  function buildingCost(s, id) {
    return BUILDING[id].cost * Math.pow(B.costGrowth, s.owned[id] || 0);
  }

  function isUnlocked(s, minCap) {
    return s.cap >= (minCap || 0);
  }

  function placeBuilding(s, id, { silent = false } = {}) {
    const empty = s.plots.filter((p) => !p.filler && !p.bId);
    let plot;
    if (empty.length) {
      plot = pick(s, empty);
    } else {
      const doomed = s.plots.filter((p) => p.filler && !p.protected);
      if (doomed.length) {
        plot = pick(s, doomed);
        if (!silent) emit(s, 'demolished', { plot: plot.id, was: plot.filler });
        plot.filler = null;
        s.stats.demolished++;
      }
    }
    if (plot) {
      plot.bId = id;
      plot.level = 1;
    } else {
      // Out of land: build upward, preferring this building's own plots.
      const built = s.plots.filter((p) => p.bId);
      const same = built.filter((p) => p.bId === id);
      const pool = same.length ? same : built;
      plot = pool.reduce((a, b) => (b.level < a.level ? b : a));
      plot.level++;
    }
    if (!silent) emit(s, 'built', { plot: plot.id, bId: plot.bId, level: plot.level });
    return plot;
  }

  function buyBuilding(s, id) {
    const b = BUILDING[id];
    if (!b || s.phase !== 'play') return false;
    if (!isUnlocked(s, b.minCap)) {
      emit(s, 'error', { reason: 'locked' });
      return false;
    }
    const cost = buildingCost(s, id);
    if (s.cash < cost) {
      emit(s, 'error', { reason: 'cash' });
      return false;
    }
    const revenueBefore = derived(s).revenue;
    s.cash -= cost;
    s.owned[id] = (s.owned[id] || 0) + 1;
    s.stats.buildingsBought++;
    placeBuilding(s, id);
    if (b.cat === 'compute') {
      // Announcing a new datacenter is good for the stock, if it was a real expense.
      addHype(s, B.hypeOnComputeBuy * Math.min(1, cost / Math.max(1, revenueBefore * 20)));
    }
    return true;
  }

  function buyUpgrade(s, id) {
    const u = UPGRADE[id];
    if (!u || s.upgrades[id] || s.phase !== 'play') return false;
    if (!isUnlocked(s, u.minCap) || s.cash < u.cost) {
      emit(s, 'error', { reason: s.cash < u.cost ? 'cash' : 'locked' });
      return false;
    }
    s.cash -= u.cost;
    s.upgrades[id] = true;
    s.stats.upgradesBought++;
    const e = u.effect;
    if (e.doomNow) addDoom(s, e.doomNow);
    if (e.alignNow) s.alignBonus += e.alignNow;
    if (e.redCharge) {
      s.redUnlocked = true;
      s.redCharges = Math.min(B.red.maxCharges, s.redCharges + e.redCharge);
    }
    if (e.flag) s.flags[e.flag] = (s.flags[e.flag] || 0) + 1;
    recomputeMeters(s);
    emit(s, 'upgrade', { id });
    return true;
  }

  // ── incident sites ───────────────────────────────────────

  function siteBusy(s, at) {
    if (s.incidents.some((i) => i.at.kind === at.kind && i.at.id === at.id)) return true;
    if (s.boss) return s.boss.parts.some((p) => p.at && p.at.kind === at.kind && p.at.id === at.id);
    return false;
  }

  function sitesFor(s, site) {
    const plotSites = (pred) => s.plots.filter(pred).map((p) => ({ kind: 'plot', id: p.id }));
    const labSites = () => MAP.labs.filter((l, i) => i < s.labs.length).map((l) => ({ kind: 'lab', id: l.id }));
    switch (site) {
      case 'lab':
        return labSitesWeighted(s);
      case 'compute':
      case 'safety':
      case 'hype':
        return plotSites((p) => p.bId && BUILDING[p.bId]?.cat === site);
      case 'home':
      case 'shop':
        return plotSites((p) => p.filler === site);
      default:
        return [...plotSites((p) => p.bId || p.filler), ...labSites()];
    }
  }

  // Reckless and capable labs have more incidents.
  function labSitesWeighted(s) {
    const out = [];
    MAP.labs.forEach((l, i) => {
      if (i >= s.labs.length) return;
      const reck = content.labs[i]?.reckless ?? 0.5;
      const lead = s.cap > 0 ? s.labs[i].cap / s.cap : 1;
      const n = 1 + Math.round(4 * reck * (0.5 + lead));
      for (let k = 0; k < n; k++) out.push({ kind: 'lab', id: l.id });
    });
    return out;
  }

  function setLabStance(s, labId, stance) {
    const i = content.labs.findIndex((l) => l.id === labId);
    if (i < 0 || !['normal', 'favored', 'embargo'].includes(stance)) return false;
    const lab = s.labs[i];
    if (lab.stance === stance) return false;
    if (stance === 'embargo') addHype(s, -B.embargoHype);
    lab.stance = stance;
    emit(s, 'labStance', { lab: content.labs[i].name, stance });
    return true;
  }

  function chooseSite(s, site) {
    let options = sitesFor(s, site).filter((at) => !siteBusy(s, at));
    if (!options.length) options = sitesFor(s, 'any').filter((at) => !siteBusy(s, at));
    if (!options.length) options = sitesFor(s, 'any');
    return pick(s, options);
  }

  // ── incidents ────────────────────────────────────────────

  function spawnIncident(s, templateId) {
    const tpl = INCIDENT[templateId];
    const d = derived(s);
    const reduce = tpl.tier >= 2 ? upgradeSum(s, 'clickReduce') : 0;
    const clicks = Math.max(1, B.incidentClicks[tpl.tier] - reduce);
    const time = B.incidentTime[tpl.tier] * d.incidentTimeMult;
    const inc = {
      id: s.nextId++,
      templateId,
      tier: tpl.tier,
      clicksLeft: clicks,
      clicksMax: clicks,
      left: time,
      max: time,
      at: chooseSite(s, tpl.site),
    };
    s.incidents.push(inc);
    s.stats.incidentsSpawned++;
    emit(s, 'incident', { id: inc.id, templateId, tier: inc.tier, kind: tpl.kind || 'gaffe', at: inc.at });
    return inc;
  }

  function spawnRandomIncident(s) {
    const recent = new Set(s.incidents.map((i) => i.templateId));
    let pool = content.incidents.filter(
      (i) => s.cap >= (i.minCap || 0) && s.cap <= (i.maxCap ?? 101) && !recent.has(i.id),
    );
    if (!pool.length) pool = content.incidents.filter((i) => s.cap >= (i.minCap || 0));
    if (!pool.length) return null;
    // Favor the current era's incidents so the late game feels late.
    const eraFloor = s.era * 20;
    const weighted = [];
    for (const i of pool) {
      const w = (i.minCap || 0) >= eraFloor - 20 ? 3 : 1;
      for (let k = 0; k < w; k++) weighted.push(i);
    }
    return spawnIncident(s, pick(s, weighted).id);
  }

  function resolveIncident(s, inc, auto) {
    s.incidents = s.incidents.filter((i) => i !== inc);
    const scale = auto ? 0.5 : 1;
    addDoom(s, -B.incidentFixDoom[inc.tier] * scale);
    s.alignBonus += B.incidentFixAlign[inc.tier] * scale;
    addHype(s, B.incidentFixHype[inc.tier] * scale);
    recomputeMeters(s);
    if (auto) s.stats.incidentsAuto++;
    else s.stats.incidentsResolved++;
    emit(s, 'incidentResolved', {
      id: inc.id,
      at: inc.at,
      tier: inc.tier,
      templateId: inc.templateId,
      fix: INCIDENT[inc.templateId]?.fix,
      auto,
    });
  }

  function failIncident(s, inc) {
    s.incidents = s.incidents.filter((i) => i !== inc);
    const tpl = INCIDENT[inc.templateId];
    addDoom(s, B.incidentFailDoom[inc.tier], KIND_CAUSE[tpl?.kind] || SITE_CAUSE[tpl?.site] || ERA_CAUSE[s.era]);
    addHype(s, -B.incidentFailHype[inc.tier]);
    s.stats.incidentsFailed++;
    emit(s, 'incidentFailed', {
      id: inc.id,
      at: inc.at,
      tier: inc.tier,
      templateId: inc.templateId,
      kind: tpl?.kind || 'gaffe',
      headline: tpl?.fail,
    });
  }

  function clickIncident(s, id) {
    if (s.phase !== 'play') return false;
    const inc = s.incidents.find((i) => i.id === id);
    if (!inc) return false;
    inc.clicksLeft--;
    if (inc.clicksLeft <= 0) resolveIncident(s, inc, false);
    else emit(s, 'incidentHit', { id, at: inc.at, clicksLeft: inc.clicksLeft, clicksMax: inc.clicksMax });
    return true;
  }

  // ── releases, eras, unlocks ──────────────────────────────

  function release(s) {
    s.releases++;
    const options = content.releases[s.releases - 1] || [{ name: `Model-${s.releases}`, tagline: '' }];
    const model = pick(s, options);
    const leader = derived(s).leader;
    const lab = content.labs[leader];
    s.labs[leader].lastModel = model.name;
    s.labs[leader].releases++;
    s.lastModel = model.name;
    s.lastLab = lab.name;
    addHype(s, B.hypeOnRelease * upgradeProduct(s, 'releaseHypeMult'));
    addCash(s, derived(s).revenue * B.releaseRevenueSecs);
    addDoom(s, B.releaseDoom, ERA_CAUSE[s.era]);
    emit(s, 'release', { n: s.releases, lab: lab.name, labId: lab.id, model: model.name, tagline: model.tagline });
    for (let i = 0; i < B.releaseIncidents; i++) {
      if (s.incidents.length < B.incidentMax) spawnRandomIncident(s);
    }
  }

  function checkProgression(s) {
    while (s.releases < 9 && Math.floor(s.cap / 10) > s.releases) release(s);
    const era = Math.min(4, Math.floor(s.cap / 20));
    if (era > s.era) {
      s.era = era;
      emit(s, 'era', { era, name: ERAS[era] });
      if (s.redUnlocked) s.redCharges = Math.min(B.red.maxCharges, s.redCharges + 1);
    }
    if (!s.pauseUnlocked && s.cap >= B.pause.unlockCap) {
      s.pauseUnlocked = true;
      emit(s, 'unlock', { what: 'pause' });
    }
    if (!s.redUnlocked && s.cap >= B.red.unlockCap) {
      s.redUnlocked = true;
      s.redCharges = Math.max(1, s.redCharges);
      emit(s, 'unlock', { what: 'red' });
    }
    if (!s.boss) {
      for (const def of B.bosses) {
        if (s.cap >= def.at && !s.bossesStarted.includes(def.kind)) {
          startBoss(s, def.kind);
          break;
        }
      }
    }
  }

  // ── bosses ───────────────────────────────────────────────

  function startBoss(s, kind) {
    if (!s.bossesStarted.includes(kind)) s.bossesStarted.push(kind);
    const boss = { kind, t: 0, parts: [], nextPart: 1, timer: 0 };
    s.boss = boss;
    if (kind === 'shoggoth') {
      boss.ttl = B.shoggoth.ttl;
      for (let i = 0; i < B.shoggoth.tentacles; i++) {
        boss.parts.push({ id: boss.nextPart++, kind: 'tentacle', index: i, hp: B.shoggoth.hp, max: B.shoggoth.hp });
      }
    } else if (kind === 'replication') {
      boss.ttl = B.replication.ttl;
      for (let i = 0; i < B.replication.start; i++) addCopy(s, boss, null);
    } else if (kind === 'paperclip') {
      boss.ttl = B.paperclip.ttl;
      boss.timer = B.paperclip.pileEvery;
      boss.parts.push({
        id: boss.nextPart++,
        kind: 'core',
        hp: B.paperclip.coreHp,
        max: B.paperclip.coreHp,
        at: chooseSite(s, 'compute'),
      });
    }
    boss.maxTtl = boss.ttl;
    emit(s, 'boss', { kind });
    return boss;
  }

  function addCopy(s, boss, from) {
    const part = { id: boss.nextPart++, kind: 'copy', age: randRange(s, 0, 1), at: chooseSite(s, 'any'), from };
    boss.parts.push(part);
    emit(s, 'bossPart', { kind: boss.kind, part });
  }

  function endBoss(s, won) {
    const boss = s.boss;
    s.boss = null;
    if (won) {
      addDoom(s, B.bossWin.doom);
      s.alignBonus += B.bossWin.align;
      addHype(s, B.bossWin.hype);
      recomputeMeters(s);
      s.stats.bossesDefeated++;
      s.bossesWon.push(boss.kind);
      emit(s, 'bossWin', { kind: boss.kind });
    } else {
      let doom;
      if (boss.kind === 'shoggoth') {
        doom = B.shoggoth.failDoom;
        addHype(s, -B.shoggoth.failHype);
      } else if (boss.kind === 'replication') {
        doom = B.replication.failDoomBase + boss.parts.length;
      } else {
        doom = B.paperclip.failDoom;
      }
      const cause = { shoggoth: 'shoggoth', replication: 'replication', paperclip: 'paperclips' }[boss.kind];
      addDoom(s, doom, cause);
      s.stats.bossesFailed++;
      emit(s, 'bossFail', { kind: boss.kind, doom });
    }
  }

  function bossStep(s, h) {
    const boss = s.boss;
    boss.t += h;
    boss.ttl -= h;
    addDoom(s, B.bossDoomPerSec * h, boss.kind === 'paperclip' ? 'paperclips' : boss.kind);
    if (boss.kind === 'replication') {
      for (const part of [...boss.parts]) {
        part.age += h;
        if (part.age >= B.replication.every) {
          part.age = 0;
          addCopy(s, boss, part.id);
        }
      }
      if (boss.parts.length >= B.replication.max) return endBoss(s, false);
    } else if (boss.kind === 'paperclip') {
      boss.timer -= h;
      if (boss.timer <= 0) {
        // Production accelerates as the maximizer settles in.
        boss.timer = B.paperclip.pileEvery * Math.max(0.5, 1 - boss.t / boss.maxTtl / 2);
        const part = { id: boss.nextPart++, kind: 'pile', at: chooseSite(s, 'any') };
        boss.parts.push(part);
        emit(s, 'bossPart', { kind: boss.kind, part });
      }
      if (boss.parts.filter((p) => p.kind === 'pile').length >= B.paperclip.maxPiles) return endBoss(s, false);
    }
    if (boss.ttl <= 0) endBoss(s, false);
  }

  function clickBoss(s, partId) {
    const boss = s.boss;
    if (!boss || s.phase !== 'play') return false;
    const part = boss.parts.find((p) => p.id === partId);
    if (!part) return false;
    if (part.kind === 'tentacle') {
      if (part.hp <= 0) return false;
      part.hp--;
    } else if (part.kind === 'core') {
      part.hp--;
    } else {
      boss.parts = boss.parts.filter((p) => p !== part);
    }
    emit(s, 'bossHit', { kind: boss.kind, partId, partKind: part.kind, hp: part.hp ?? 0, at: part.at });
    if (bossDefeated(boss)) endBoss(s, true);
    return true;
  }

  function bossDefeated(boss) {
    if (boss.kind === 'shoggoth') return boss.parts.every((p) => p.hp <= 0);
    if (boss.kind === 'replication') return boss.parts.length === 0;
    return boss.parts.find((p) => p.kind === 'core').hp <= 0;
  }

  // ── abilities ────────────────────────────────────────────

  function useAbility(s, kind) {
    if (s.phase !== 'play') return false;
    if (kind === 'tweet') {
      if (s.cooldowns.tweet > 0) return false;
      s.cooldowns.tweet = B.tweet.cooldown;
      addHype(s, B.tweet.hype * derived(s).relevance);
      addDoom(s, B.tweet.doom, 'engagement');
      s.stats.tweets++;
    } else if (kind === 'pause') {
      if (!s.pauseUnlocked && s.cap < B.pause.unlockCap) return false;
      if (s.cooldowns.pause > 0) return false;
      s.pauseUnlocked = true;
      s.cooldowns.pause = B.pause.cooldown;
      s.pauseLeft = B.pause.duration;
      addHype(s, B.pause.hype);
      s.stats.pauses++;
    } else if (kind === 'red') {
      if (s.redCharges <= 0) return false;
      s.redCharges--;
      for (const inc of [...s.incidents]) {
        s.incidents = s.incidents.filter((i) => i !== inc);
        emit(s, 'incidentCleared', { id: inc.id, at: inc.at });
      }
      if (s.boss) redButtonBoss(s);
      addDoom(s, B.red.doom);
      addHype(s, B.red.hype);
      s.stats.redButtons++;
    } else {
      return false;
    }
    emit(s, 'ability', { kind });
    return true;
  }

  function redButtonBoss(s) {
    const boss = s.boss;
    if (boss.kind === 'shoggoth') {
      boss.parts.filter((p) => p.hp > 0).slice(0, 3).forEach((p) => (p.hp = 0));
    } else if (boss.kind === 'replication') {
      boss.parts = boss.parts.slice(0, Math.floor(boss.parts.length / 2));
    } else {
      boss.parts = boss.parts.filter((p) => p.kind === 'core');
      boss.parts[0].hp = Math.max(1, boss.parts[0].hp - 6);
    }
    if (bossDefeated(boss)) endBoss(s, true);
  }

  // ── blimp ────────────────────────────────────────────────

  function clickBlimp(s) {
    if (!s.blimp || s.phase !== 'play') return false;
    const cash = Math.max(B.blimpMinCash, derived(s).revenue * B.blimpRevenueSecs);
    addCash(s, cash);
    addHype(s, B.blimpHype);
    s.stats.blimps++;
    emit(s, 'blimpClicked', { cash, quip: s.blimp.quip });
    s.blimp = null;
    return true;
  }

  // ── decision cards ───────────────────────────────────────

  function eligibleCards(s) {
    return content.events.filter(
      (e) =>
        s.cap >= (e.minCap || 0) &&
        s.cap <= (e.maxCap ?? 101) &&
        !(e.once && s.usedCards.includes(e.id)),
    );
  }

  function openCard(s, id) {
    s.card = { id };
    s.phase = 'card';
    s.recentCards = [...s.recentCards.slice(-5), id];
    emit(s, 'card', { id });
  }

  function openRandomCard(s) {
    const eligible = eligibleCards(s);
    if (!eligible.length) return false;
    const fresh = eligible.filter((e) => !s.recentCards.includes(e.id));
    const pool = fresh.length ? fresh : eligible;
    // Prefer cards from the current era.
    const eraFloor = s.era * 20;
    const weighted = [];
    for (const e of pool) {
      const w = (e.minCap || 0) >= eraFloor - 20 ? 3 : 1;
      for (let k = 0; k < w; k++) weighted.push(e);
    }
    openCard(s, pick(s, weighted).id);
    return true;
  }

  function applyEffects(s, fx) {
    if (!fx) return;
    const revenue = derived(s).revenue;
    if (fx.revSecs) addCash(s, revenue * fx.revSecs);
    if (fx.cashMult) s.cash *= fx.cashMult;
    if (fx.doom) addDoom(s, fx.doom);
    if (fx.hype) addHype(s, fx.hype);
    if (fx.align) s.alignBonus += fx.align;
    if (fx.cap) s.capBonus += fx.cap;
    if (fx.buff) {
      s.buffs.push({ stat: fx.buff.stat, mult: fx.buff.mult, left: fx.buff.secs, secs: fx.buff.secs });
      emit(s, 'buff', { ...fx.buff });
    }
    if (fx.flag) s.flags[fx.flag] = (s.flags[fx.flag] || 0) + 1;
    recomputeMeters(s);
  }

  function chooseCard(s, optionIndex) {
    if (s.phase !== 'card' || !s.card) return false;
    const ev = EVENT[s.card.id];
    const opt = ev.options[optionIndex];
    if (!opt) return false;
    if (!s.usedCards.includes(ev.id)) s.usedCards.push(ev.id);
    s.card = null;
    s.phase = 'play';
    s.stats.cardsChosen++;
    applyEffects(s, opt.effects);
    emit(s, 'cardChosen', { id: ev.id, option: optionIndex, result: opt.result, effects: opt.effects });
    checkEnd(s);
    return true;
  }

  // ── endings ──────────────────────────────────────────────

  function dominantCause(s) {
    let best = 'generic';
    for (const c of DOOM_CAUSES) if ((s.doomCause[c] || 0) > (s.doomCause[best] || 0)) best = c;
    return best;
  }

  function survivalFlavor(s) {
    if ((s.flags.greed || 0) >= 3) return 'shareholders';
    if (s.align >= 100 && s.doom < 30) return 'utopia';
    return 'weird';
  }

  function finish(s, ending) {
    s.phase = 'over';
    s.ending = { ...ending, date: date(s), t: s.t };
    s.incidents = [];
    s.boss = null;
    s.blimp = null;
    emit(s, 'ending', { ending: s.ending });
  }

  function checkEnd(s) {
    if (s.phase === 'over') return;
    if (s.doom >= 100) return finish(s, { type: 'doom', cause: dominantCause(s) });
    if (s.hype <= 0) return finish(s, { type: 'winter' });
    if (s.cap >= 100) {
      const final = pick(s, content.releases[9] || [{ name: 'The Last Model', tagline: '' }]);
      s.lastModel = final.name;
      const roll = randInt(s, 1, 100);
      const doomAtRoll = Math.round(s.doom);
      if (roll <= doomAtRoll) {
        return finish(s, { type: 'doom', cause: dominantCause(s), roll, doomAtRoll, singularity: true, model: final.name });
      }
      return finish(s, { type: 'survive', flavor: survivalFlavor(s), roll, doomAtRoll, singularity: true, model: final.name });
    }
  }

  // ── the clock ────────────────────────────────────────────

  function step(s, h) {
    s.t += h;
    const d = derived(s);

    addCash(s, d.revenue * h);
    const capMult = d.paused ? 0 : upgradeProduct(s, 'capMult') * buffMult(s, 'capRate');
    s.labs.forEach((lab, i) => {
      const flow = d.compute * d.labShares[i] + d.labCompute * d.labBaseShares[i];
      lab.cumTrain += flow * capMult * h;
      lab.tokens += flow * B.tokensPerComputeSec * h;
    });
    s.cumTrain += d.trainRate * h;
    s.cumSafety += d.research * h;
    recomputeMeters(s);
    checkProgression(s);

    // Old grievances fade, so the ending reflects what went wrong lately.
    const fade = Math.exp(-h / B.doomCauseMemory);
    for (const c of DOOM_CAUSES) s.doomCause[c] *= fade;

    const d2 = derived(s);
    const gapCause = ERA_CAUSE[s.era];
    if (d2.doomRate > 0) addDoom(s, d2.doomRate * h, gapCause);
    else addDoom(s, d2.doomRate * h);
    let openTiers = 0;
    for (const inc of s.incidents) openTiers += inc.tier;
    if (openTiers) addDoom(s, B.doomPerActiveTier * openTiers * h, gapCause);
    if (s.doom < d2.doomFloor) s.doom = d2.doomFloor;

    addHype(s, d2.hypeRate * h);

    s.cooldowns.tweet = Math.max(0, s.cooldowns.tweet - h);
    s.cooldowns.pause = Math.max(0, s.cooldowns.pause - h);
    s.pauseLeft = Math.max(0, s.pauseLeft - h);
    for (const b of s.buffs) b.left -= h;
    s.buffs = s.buffs.filter((b) => b.left > 0);

    for (const inc of [...s.incidents]) {
      inc.left -= h;
      if (inc.left <= 0) failIncident(s, inc);
    }
    if (d2.autoResolve > 0 && nextRandom(s) < d2.autoResolve * h) {
      const small = s.incidents.filter((i) => i.tier === 1);
      if (small.length) resolveIncident(s, pick(s, small), true);
    }
    s.incidentTimer -= h;
    if (s.incidentTimer <= 0) {
      if (s.incidents.length < B.incidentMax) spawnRandomIncident(s);
      const rate = Math.max(0.01, d2.incidentRate);
      s.incidentTimer = Math.max(1.2, -Math.log(1 - nextRandom(s)) / rate);
    }

    if (s.boss) bossStep(s, h);

    if (s.blimp) {
      s.blimp.left -= h;
      if (s.blimp.left <= 0) {
        s.blimp = null;
        emit(s, 'blimpGone');
      }
    } else {
      s.blimpTimer -= h;
      if (s.blimpTimer <= 0) {
        s.blimp = { left: B.blimpTtl, ttl: B.blimpTtl, quip: randInt(s, 0, 999) };
        s.blimpTimer = randRange(s, B.blimpEvery[0], B.blimpEvery[1]);
        emit(s, 'blimp');
      }
    }

    checkEnd(s);
    if (s.phase !== 'play') return;

    s.cardTimer -= h;
    if (s.cardTimer <= 0) {
      if (s.boss) {
        s.cardTimer = 3;
      } else {
        s.cardTimer = randRange(s, B.cardEvery[0], B.cardEvery[1]);
        openRandomCard(s);
      }
    }
  }

  function tick(s, dt) {
    let left = Math.min(dt, 1);
    while (left > 1e-9 && s.phase === 'play') {
      const h = Math.min(B.STEP, left);
      step(s, h);
      left -= h;
    }
  }

  return {
    newGame,
    tick,
    derived,
    date,
    serialize,
    deserialize,
    drainFx,
    buildingCost,
    buyBuilding,
    buyUpgrade,
    isUnlocked,
    spawnIncident,
    clickIncident,
    clickBoss,
    clickBlimp,
    useAbility,
    openCard,
    chooseCard,
    startBoss,
    survivalFlavor,
    setLabStance,
    content,
  };
}
