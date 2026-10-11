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
  // The rest of the industry trains whether or not you sell to it.
  labBase: 1.6,
  labGrowth: 0.0085, // per second, exponential

  // p(doom)
  doomGapK: 0.011, // per second per point of capability over alignment
  doomRecover: 0.1, // per second when alignment leads by 10+
  doomFloorPerCap: 0.12, // irreducible risk grows with capability
  doomPerActiveTier: 0.012, // per second per tier of open incident

  // Hype
  hypeDecayBase: 0.1,
  hypeDecayPerHype: 0.0026,
  hypeDecayTimeScale: 700, // decay x(1 + t/scale): investors get impatient
  hypeOnComputeBuy: 1.2,
  hypeOnRelease: 12,

  // Incidents
  incidentRateBase: 0.14,
  incidentRatePerCap: 0.0042,
  incidentMax: 7,
  incidentTime: [0, 10, 13, 16],
  incidentClicks: [0, 1, 3, 6],
  incidentFailDoom: [0, 2.5, 4.5, 8],
  incidentFailHype: [0, 1.5, 2.5, 4],
  incidentFixDoom: [0, 0.6, 1.2, 2.4],
  incidentFixAlign: [0, 0.25, 0.6, 1.2],
  incidentFixHype: [0, 0.4, 0.8, 1.5],
  internAutoPerSec: 0.012,
  internAutoMax: 0.35,

  // Releases at every multiple of 10 capability.
  releaseRevenueSecs: 20,
  releaseIncidents: 2,
  releaseDoom: 1,

  // Decision cards
  firstCardAt: 28,
  cardEvery: [38, 55],

  // VC blimp
  firstBlimpAt: 45,
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
  shoggoth: { ttl: 32, tentacles: 8, hp: 3, failDoom: 14, failHype: 8 },
  replication: { ttl: 36, start: 3, every: 4.5, max: 14, failDoomBase: 8 },
  paperclip: { ttl: 42, coreHp: 24, pileEvery: 1.7, maxPiles: 9, failDoom: 18 },
  bossWin: { doom: -8, align: 4, hype: 6 },
  bossIncidentRateMult: 0.35,
  bossDoomPerSec: 0.05, // an unhandled boss is unsettling

  costGrowth: 1.15,
};
