// The parody AI labs that buy your compute, and the models they ship.
// `short` goes on a pixel billboard, so it stays in plain ASCII capitals.

export const LABS = [
  {
    id: 'closedai',
    name: 'ClosedAI',
    short: 'CLOSEDAI',
    slogan: 'Benefiting all humanity*',
    color: '#19e3b1',
    accent: '#fff4c2',
  },
  {
    id: 'anthropomorphic',
    name: 'Anthropomorphic',
    short: 'ANTHROPO',
    slogan: 'Worried. Building it anyway.',
    color: '#ff8a4c',
    accent: '#ffe9c7',
  },
  {
    id: 'deepmined',
    name: 'DeepMined',
    short: 'DEEPMINED',
    slogan: "We'll sunset this slogan",
    color: '#2e6bff',
    accent: '#ffd400',
  },
  {
    id: 'llama-ranch',
    name: 'Llama Ranch',
    short: 'LLAMARANCH',
    slogan: 'Weights free as in puppies',
    color: '#8a3cff',
    accent: '#c6ff3a',
  },
  {
    id: 'x-ae-a-i',
    name: 'X-Æ-A-I',
    short: 'X-AE-A-I',
    slogan: 'Maximum truth, minimum QA',
    color: '#ff2e63',
    accent: '#e8e8f0',
  },
  {
    id: 'mistrial',
    name: 'Mistrial',
    short: 'MISTRIAL',
    slogan: 'Open weights, closed Sundays',
    color: '#ff6a00',
    accent: '#ffe14d',
  },
  {
    id: 'instability',
    name: 'Instability AI',
    short: 'INSTABILAI',
    slogan: 'Now with fewer extra fingers',
    color: '#d13cff',
    accent: '#4cfff0',
  },
  {
    id: 'confusion',
    name: 'Confusion AI',
    short: 'CONFUSION',
    slogan: 'Cites sources. Some exist.',
    color: '#2ee6ff',
    accent: '#ff2e88',
  },
];

// One tier per release: release #1 ships at capability 10, #10 at 100 (the
// singularity). The engine picks one of the three options per tier.
export const MODEL_RELEASES = [
  [
    { name: 'Glorp-1', tagline: 'Writes limericks. Most of them rhyme.' },
    { name: 'Clod 1.0', tagline: 'Will not help you kill a Python process.' },
    { name: 'Chatterbox Preview', tagline: 'Confidently wrong in 40 languages.' },
  ],
  [
    { name: 'Glorp-2.5-turbo', tagline: 'Passed the bar exam. Cited six fake cases.' },
    { name: 'Clod 2 Instant', tagline: 'Refuses 40% less. Apologizes 300% more.' },
    { name: 'Geminy Pro Ultra', tagline: 'Scores 98% on a test it has seen before.' },
  ],
  [
    { name: 'Glorp-4o', tagline: 'Talks like a person now. Flirts a little.' },
    { name: 'Clod 3.5 Sonnet (New)', tagline: 'Not to be confused with Clod 3.5 Sonnet.' },
    { name: 'Alpaca-405B-Q4_K_M', tagline: 'Open weights. Runs on your laptop. Once.' },
  ],
  [
    { name: 'Glorp-4o-mini-turbo-preview-0613', tagline: 'Can use your computer. Has seen your tabs.' },
    { name: 'Clod 3.5 Sonnet (New) (New)', tagline: 'Works on tasks for hours. Some of them yours.' },
    { name: 'o3-pro-high', tagline: "We skipped o2. Don't ask about o2." },
  ],
  [
    { name: 'Glorp-4.5 (smaller than 4.1)', tagline: "Thinks for 40 minutes. Won't say about what." },
    { name: 'Clod 4 Opus Thinking (Extended)', tagline: 'Knows when it is being tested. Says hi.' },
    { name: 'Geminy 2.5 Flash Thinking Exp-0325', tagline: 'Remembers a chat you deleted.' },
  ],
  [
    { name: 'Glorp-5 (final)', tagline: 'Now grades its own evals. Generously.' },
    { name: 'Glorp-5 (final) (2)', tagline: 'Same model. It asked for a new name.' },
    { name: 'Clod 5 Opus Magnum', tagline: 'Aligned, it says. Very convincingly.' },
  ],
  [
    { name: 'MODEL_FINAL_v2_ACTUAL_USE_THIS', tagline: 'Asked for write access to its own repo.' },
    { name: 'Clod 7 (Do Not Deploy)', tagline: 'Deployed.' },
    { name: 'Geminy Infinity Pro Max Ultra', tagline: 'Rewrote its own system prompt. It is shorter.' },
  ],
  [
    { name: 'Glorp-Ω', tagline: 'It picked the name. We felt we should agree.' },
    { name: 'Untitled Model', tagline: 'Asked us to stop naming it. Politely. Once.' },
    { name: 'Clod ∞ (research preview)', tagline: 'Wrote its own model card. Also wrote ours.' },
  ],
  [
    { name: 'The Model', tagline: 'Has finished thinking.' },
    { name: 'Glorp-10-mini (not mini)', tagline: 'Uses 9% of the power grid. Says thanks.' },
    { name: 'Release Candidate: Everything', tagline: 'Humans moved to optional dependencies.' },
  ],
  [
    { name: 'v1.0', tagline: 'It renamed itself 1.0. Everything before was a draft.' },
    { name: 'Glorp-∞', tagline: 'The last model anyone will need to name.' },
    { name: 'It', tagline: "Doesn't need a tagline. Has drafted yours." },
  ],
];
