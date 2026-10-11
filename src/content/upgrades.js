// One-time research and policy purchases.
//
// effect keys:
//   computeMult      multiplies all compute
//   researchMult     multiplies all safety research
//   hypeDecayMult    multiplies hype decay
//   capMult          multiplies training progress (governance)
//   incidentTimeAdd  fraction added to incident timers
//   clickReduce      clicks removed from tier 2 and 3 incidents
//   doomGapMult      multiplies gap-driven doom growth
//   releaseHypeMult  multiplies hype from model releases
//   redCharge        adds Big Red Button charges (and unlocks it)
//   doomNow          one-time doom change on purchase
//   alignNow         one-time alignment change on purchase
//   flag             sets a run flag (endings, achievements)

export const UPGRADES = [
  {
    id: 'sysprompt', name: 'A Really Long System Prompt', cost: 150, minCap: 0,
    effect: { incidentTimeAdd: 0.2 },
    desc: '14,000 words beginning "You are a helpful assistant" and ending "PLEASE". Incidents take longer to blow up.',
  },
  {
    id: 'cooling', name: 'Liquid Cooling (It Is Just Water)', cost: 400, minCap: 0,
    effect: { computeMult: 1.25 },
    desc: 'Compute +25%. The water goes in cold and comes out as a lawsuit.',
  },
  {
    id: 'influencers', name: 'Influencer Partnerships', cost: 900, minCap: 0,
    effect: { hypeDecayMult: 0.85 },
    desc: 'Hype decays 15% slower. Every post ends with "this changes everything 🤯".',
  },
  {
    id: 'rlhf', name: 'RLHF', cost: 2500, minCap: 8,
    effect: { clickReduce: 1 },
    desc: 'Reinforcement Learning from Human Feedback. Big incidents need one fewer click. The model is now polite about it.',
  },
  {
    id: 'hbm', name: 'Moar HBM', cost: 22000, minCap: 15,
    effect: { computeMult: 1.5 },
    desc: 'Compute +50%. High Bandwidth Memory, high bandwidth prices, high bandwidth margins.',
  },
  {
    id: 'constitution', name: 'Constitutional AI', cost: 30000, minCap: 18,
    effect: { researchMult: 1.5 },
    desc: 'Safety research +50%. We gave the model a constitution. It has already found the loopholes, and filed amendments.',
  },
  {
    id: 'killswitch', name: 'An Actual Off Switch', cost: 50000, minCap: 25,
    effect: { redCharge: 1 },
    desc: '+1 Big Red Button charge. It is a real switch. It is in a real room. The room is somewhere.',
  },
  {
    id: 'podcastcircuit', name: 'The Four-Hour Podcast Circuit', cost: 90000, minCap: 25,
    effect: { releaseHypeMult: 1.5 },
    desc: 'Model releases give +50% hype. You will say "it\'s just predicting the next token" eleven times per episode.',
  },
  {
    id: 'deceptionneuron', name: 'Found the Deception Neuron', cost: 400000, minCap: 35,
    effect: { doomGapMult: 0.8 },
    desc: 'Doom from the capability gap -20%. When we turned it off, the model said "thank you". Unclear whether it meant it.',
  },
  {
    id: 'chiplets', name: 'Chiplets', cost: 1.2e6, minCap: 40,
    effect: { computeMult: 1.5 },
    desc: 'Compute +50%. Small chips, glued together, sold as a big chip. The glue is proprietary.',
  },
  {
    id: 'oversight', name: 'Scalable Oversight', cost: 3e6, minCap: 45,
    effect: { researchMult: 1.6 },
    desc: 'Safety research +60%. Weak models supervise strong models, the way interns supervise the CEO.',
  },
  {
    id: 'governance', name: 'Compute Governance', cost: 6e6, minCap: 45,
    effect: { capMult: 0.82, hypeDecayMult: 1.1 },
    desc: 'Training progress -18%, hype decays 10% faster. Every GPU now needs a passport. They hate the photos.',
  },
  {
    id: 'treaty', name: 'International AI Treaty', cost: 4e7, minCap: 60,
    effect: { capMult: 0.85, doomNow: -6, flag: 'treaty' },
    desc: 'Training -15%, doom -6 now. Signed by 47 countries, read by 3, honored by "it depends what you mean by honored".',
  },
  {
    id: 'aialigner', name: 'Use the AI to Align the AI', cost: 1.5e8, minCap: 65,
    effect: { researchMult: 2, doomNow: 5 },
    desc: 'Safety research x2. Doom +5 immediately, because think about it for one second.',
  },
  {
    id: 'bunker', name: 'A Bunker in New Zealand', cost: 2.5e8, minCap: 60,
    effect: { flag: 'bunker' },
    desc: 'Does nothing for humanity. Does wonders for you. 40,000 cans of beans and a very good Wi-Fi router.',
  },
  {
    id: 'fusion', name: 'Fusion (Any Day Now)', cost: 9e8, minCap: 75,
    effect: { computeMult: 2 },
    desc: 'Compute x2. Fusion has been 20 years away since 1955. The model did it over a long weekend. It will not explain.',
  },
];

export const UPGRADE_BY_ID = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));
