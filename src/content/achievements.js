// Achievements. check(state, ending) runs during play (ending null) and once
// at the end of a run.

export function endingId(ending) {
  if (!ending) return null;
  if (ending.type === 'doom') return ending.cause;
  if (ending.type === 'winter') return 'winter';
  if (ending.type === 'collapse') return 'dysentery';
  return ending.flavor;
}

export const ENDING_IDS = [
  'utopia', 'shareholders', 'weird', 'winter', 'dysentery',
  'paperclips', 'shoggoth', 'replication', 'engagement', 'sycophancy', 'generic',
];

const q = (s) => Math.floor(s.t / 20);

export const ACHIEVEMENTS = [
  { id: 'first-fix', name: 'Incident Response', desc: 'Resolve your first incident.', check: (s) => s.stats.incidentsResolved >= 1 },
  { id: 'whack', name: 'Whack-a-Mole Certified', desc: 'Resolve 50 incidents in one run.', check: (s) => s.stats.incidentsResolved >= 50 },
  { id: 'firefighter', name: 'Professional Firefighter', desc: 'Resolve 150 incidents in one run.', check: (s) => s.stats.incidentsResolved >= 150 },
  { id: 'combo-10', name: 'Flow State', desc: 'Chain a ×10 incident combo.', check: (s) => (s.stats.comboBest || 0) >= 10 },
  { id: 'eureka', name: 'Eureka!', desc: 'Witness your first model release.', check: (s) => s.releases >= 1 },
  { id: 'ship-it', name: 'Ship It', desc: 'Witness nine model releases in one run.', check: (s) => s.releases >= 9 },
  { id: 'mask-on', name: 'Mask On', desc: 'Put a smiley mask on every tentacle of the Shoggoth.', check: (s) => s.bossesWon.includes('shoggoth') },
  { id: 'ctrl-z', name: 'Ctrl+Z', desc: 'Delete every copy of the rogue weights.', check: (s) => s.bossesWon.includes('replication') },
  { id: 'unclipped', name: 'Unclipped', desc: 'Smash the paperclip maximizer.', check: (s) => s.bossesWon.includes('paperclip') },
  { id: 'boss-rush', name: 'Boss Rush', desc: 'Defeat all three bosses in one run.', check: (s) => s.stats.bossesDefeated >= 3 },
  { id: 'blimps', name: 'Term Sheet Collector', desc: 'Click five VC blimps in one run.', check: (s) => s.stats.blimps >= 5 },
  { id: 'seven-trillion', name: 'The $7 Trillion Ask', desc: 'Hold $7T in cash.', check: (s) => s.cash >= 7e6 },
  { id: 'quadrillionaire', name: 'Quadrillionaire', desc: 'Hold $1Qa in cash. Money has stopped meaning anything.', check: (s) => s.cash >= 1e9 },
  { id: 'decel', name: 'Decel', desc: 'Pause training five times in one run.', check: (s) => s.stats.pauses >= 5 },
  { id: 'big-red', name: 'Did You Try Turning It Off', desc: 'Press the Big Red Button.', check: (s) => s.stats.redButtons >= 1 },
  { id: 'vagueposter', name: 'Vagueposter', desc: 'Vague-tweet 20 times in one run.', check: (s) => s.stats.tweets >= 20 },
  { id: 'fiduciary', name: 'Fiduciary Duty', desc: 'Take the dodgy money three times in one run.', check: (s) => (s.flags.greed || 0) >= 3 },
  { id: 'prepper', name: 'Prepper', desc: 'Get yourself a bunker.', check: (s) => !!s.upgrades.bunker || (s.flags.bunker || 0) > 0 },
  { id: 'signatory', name: 'Signatory', desc: 'Get an AI treaty signed.', check: (s) => !!s.upgrades.treaty || (s.flags.treaty || 0) > 0 },
  { id: 'yolo', name: 'YOLO', desc: 'Take the YOLO option three times in one run.', check: (s) => (s.flags.yolo || 0) >= 3 },
  { id: 'open-source', name: 'Information Wants To Be Free', desc: 'Open-source something you probably should not have.', check: (s) => (s.flags.openWeights || 0) > 0 },
  { id: 'gentrifier', name: 'Gentrification', desc: 'Bulldoze ten homes and shops for compute.', check: (s) => s.stats.demolished >= 10 },
  { id: 'survived', name: 'Survived the Singularity', desc: 'Roll above p(doom) when capability hits 100.', check: (s, e) => e?.type === 'survive' },
  { id: 'lucky', name: 'Natural 100', desc: 'Survive the singularity with p(doom) at 50% or more.', check: (s, e) => e?.type === 'survive' && e.doomAtRoll >= 50 },
  { id: 'unlucky', name: 'Should Have Been Fine', desc: 'Lose the singularity roll with p(doom) at 20% or less.', check: (s, e) => e?.type === 'doom' && e.singularity && e.doomAtRoll <= 20 },
  { id: 'move-fast', name: 'Move Fast', desc: 'Reach the singularity before 2027.', check: (s, e) => e?.singularity && q(s) < 16 },
  { id: 'brink', name: 'Brinkmanship', desc: 'Survive after p(doom) peaked at 90% or more.', check: (s, e) => e?.type === 'survive' && s.stats.peakDoom >= 90 },
  { id: 'ending-utopia', name: 'Fully Automated Luxury', desc: 'Reach the good ending.', check: (s, e) => endingId(e) === 'utopia' },
  { id: 'ending-winter', name: 'Ghost Town', desc: 'Let the hype hit zero.', check: (s, e) => endingId(e) === 'winter' },
  { id: 'ending-dysentery', name: 'You Have Died Of Dysentery', desc: 'Let the bubble pop while the world is already falling apart.', check: (s, e) => e?.type === 'collapse' },
  { id: 'ending-doom', name: 'We Tried', desc: 'End the world. Any way will do.', check: (s, e) => e?.type === 'doom' },
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
