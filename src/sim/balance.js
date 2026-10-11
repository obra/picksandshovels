// Every tuning number in one place. scripts/simulate.mjs exercises these with
// bot players; change them there first, then play.

export const B = {
  QUARTER_SECONDS: 20,
  START_YEAR: 2023,
  STEP: 0.1, // sim substep, seconds

  start: { cash: 30, hype: 55, doom: 3 },
  startOwned: { rack: 1 },

  // Revenue: compute x price x hype multiplier.
  price: 1,
  hypeRevenueBase: 0.5, // multiplier at 0 hype; +1 at 100 hype

  // Scaling laws: capability and alignment are log10 of cumulative
  // training compute / safety research, POINTS_PER_DECADE each.
  pointsPerDecade: 20,
  capC0: 180,
  alignS0: 180,
  // Each lab's capability is log10 of its own cumulative training compute.
  labC0: 45,
  tokensPerComputeSec: 1e6, // one compute unit (1,000 GPUs) serves a million tokens a second
  favorMult: 3,
  embargoRevenueCut: 0.04, // per embargoed lab: they were paying a premium
  embargoHype: 2,
  // Gap doom x(recklessBase + recklessScale x the leading lab's recklessness).
  recklessBase: 0.6,
  recklessScale: 0.8,
  // The rest of the industry trains whether or not you sell to it.
  labBase: 1.6,
  labGrowth: 0.0085, // per second, exponential

  // p(doom)
  doomGapK: 0.015, // per second per point of capability over alignment
  doomRecover: 0.1, // per second when alignment leads by 10+
  doomFloorPerCap: 0.2, // irreducible risk grows with capability; upgrades shrink it
  doomPerActiveTier: 0.012, // per second per tier of open incident
  doomCauseMemory: 150, // seconds; older causes fade when picking the ending

  // Hype hitting zero while p(doom) is at least this high is not an AI winter.
  // It's societal collapse, and the ending is pure Oregon Trail.
  collapseDoom: 50,

  // Hype
  hypeDecayBase: 0.1,
  hypeDecayPerHype: 0.0026,
  hypeDecayTimeScale: 700, // decay x(1 + t/scale): investors get impatient
  hypeOnComputeBuy: 0.8,
  hypeOnRelease: 12,
  // Selling little compute while the rest of the industry grows looks like
  // irrelevance: decay x(1 + irrelevanceK x the labs' share of all compute).
  irrelevanceK: 1.5,
  irrelevanceGainCut: 0.6, // hype gains x(1 - cut x labs' share)

  // Incidents
  incidentRateBase: 0.09,
  incidentRatePerCap: 0.005,
  incidentMax: 7,
  firstIncidentAt: 9,
  // Early incidents give more time to read them; the bonus fades by capability 30.
  earlyTimeBonus: 0.4,
  earlyUntilCap: 30,
  incidentTime: [0, 10, 13, 16],
  incidentClicks: [0, 1, 3, 6],
  incidentFailDoom: [0, 2.5, 4.5, 8],
  incidentFailHype: [0, 1.5, 2.5, 4],
  incidentFixDoom: [0, 0.25, 0.5, 1],
  incidentFixAlign: [0, 0.05, 0.12, 0.25],
  incidentFixHype: [0, 0.25, 0.5, 1],
  comboWindow: 3.5, // seconds between fixes to keep a combo going
  comboRevenueSecs: 0.5, // per combo step past two, capped at comboCap
  comboCap: 10,
  comboMinCash: 5,
  comboHype: 0.4,
  internAutoPerSec: 0.012,
  internAutoMax: 0.35,

  // Releases at every multiple of 10 capability.
  releaseRevenueSecs: 20,
  releaseIncidents: 2,
  releaseDoom: 1,

  // An overseas lab drops open weights after each frontier release from the
  // second on: markets panic, incidents spike, and the doom floor rises for good.
  overseas: { afterRelease: 2, delay: [35, 55], hypeHit: 10, revenueMult: 0.7, incidentMult: 1.6, buffSecs: 30, doom: 3, floorAdd: 1 },

  // Some releases bomb. Reckless labs bomb more; evals labs catch problems first.
  bomb: { base: 0.1, recklessK: 0.15, evalsK: 0.012, min: 0.04, hype: -8, rollback: 1.5 },
  // Open-weights customer labs leak a little too when they ship.
  openRelease: { floorAdd: 0.5, incidentMult: 1.3, secs: 20 },

  // Decision cards
  firstCardAt: 45,
  cardEvery: [45, 65],
  cardAfterBoss: 8,

  // VC blimp
  firstBlimpAt: 75,
  blimpEvery: [55, 85],
  blimpTtl: 14,
  blimpRevenueSecs: 40,
  blimpMinCash: 40,
  blimpHype: 3,

  // Abilities
  tweet: { cooldown: 40, hype: 9, doom: 0.4 },
  pause: { unlockCap: 15, cooldown: 75, duration: 15, hype: -5 },
  red: { unlockCap: 30, maxCharges: 3, doom: -2, hype: -4 },

  // Bosses trigger at these capability levels.
  bosses: [
    { kind: 'shoggoth', at: 35 },
    { kind: 'replication', at: 55 },
    { kind: 'paperclip', at: 75 },
  ],
  shoggoth: { ttl: 30, tentacles: 10, hp: 4, failDoom: 14, failHype: 8 },
  replication: { ttl: 36, start: 4, every: 3.2, max: 16, failDoomBase: 8 },
  paperclip: { ttl: 40, coreHp: 30, pileEvery: 1.5, maxPiles: 9, failDoom: 18 },
  bossWin: { doom: -8, align: 3, hype: 6 },
  bossIncidentRateMult: 0.35,
  bossDoomPerSec: 0.05, // an unhandled boss is unsettling

  costGrowth: 1.15,
};
