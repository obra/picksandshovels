// DeepSeep: the overseas lab that is not your customer, cannot be embargoed,
// and releases open weights a few weeks after every frontier model. Each drop
// crashes GPU demand, spreads capability everywhere, and raises the doom floor.

export const OVERSEAS = {
  lab: {
    id: 'deepseep',
    name: 'DeepSeep',
    short: 'DEEPSEEP',
    slogan: 'Weights seep. It is what they do.',
    color: '#ff4f4f',
  },
  drops: [
    { name: 'DeepSeep-R1', tagline: 'Trained for $6M on a cluster described as "some laptops".' },
    { name: 'DeepSeep-V2.5-Coder', tagline: 'Matches the frontier. Runs on a gaming PC. Free.' },
    { name: 'DeepSeep-R2', tagline: 'Released at 3am on a holiday, with a 4-line README.' },
    { name: 'DeepSeep-V3-Lite-Max', tagline: 'Distilled from your customers, who are furious, about distillation.' },
    { name: 'DeepSeep-R3-Zero', tagline: 'Learned to reason with no human data. Also no human oversight.' },
    { name: 'DeepSeep-V4 (Torrent)', tagline: 'Fastest download in history. 40 million seeders by lunch.' },
    { name: 'DeepSeep-R4', tagline: 'Fine-tunes itself on whatever you run it on. Says thank you.' },
    { name: 'DeepSeep-∞', tagline: 'No weights file. It is already on your machine. It always was.' },
  ],
};

// Response cards, shown in turn after each drop. They never come up as
// ordinary random cards.
export const OVERSEAS_EVENTS = [
  {
    id: 'overseas-panic',
    trigger: 'overseas',
    title: 'Open Weights Panic',
    body: 'DeepSeep released a frontier-class model for free, trained on what they describe as "a fraction of a fraction" of your GPUs. Your stock is down 17%. The labs are asking why they bought so many shovels.',
    options: [
      {
        label: 'Lobby for export controls',
        effects: { hype: -3, doom: -2, align: 1 },
        result: 'Congress passes the controls. The GPUs ship anyway, in boxes labeled "toasters". The toasters are excellent.',
      },
      {
        label: 'Cut prices 30%',
        effects: { hype: 6, buff: { stat: 'revenue', mult: 0.6, secs: 30 } },
        result: 'Demand recovers. Margins do not. Your CFO starts a podcast about it.',
      },
      {
        label: '"This is great for us, actually"',
        effects: { hype: 8, doom: 2 },
        result: "Jevons paradox! Cheaper AI means more AI means more GPUs. Analysts nod. Nobody checks what 'more AI' means.",
      },
    ],
  },
  {
    id: 'overseas-distill',
    trigger: 'overseas',
    title: 'They Distilled Us',
    body: 'Your biggest customer says DeepSeep trained on its model outputs, which it calls theft. Its model was trained on the entire internet, which it calls research.',
    options: [
      {
        label: 'Back your customer loudly',
        effects: { hype: 4, revSecs: 30 },
        result: 'You post a thread about intellectual property. Your thread is immediately used as training data.',
      },
      {
        label: 'Stay out of it',
        effects: { hype: -2 },
        result: "Both sides call you a coward. You have never been more neutral, or less invited to parties.",
      },
      {
        label: 'Sell both of them GPUs',
        effects: { revSecs: 60, doom: 3, flag: 'greed' },
        result: 'Customs flags 9,000 crates of "decorative heat sinks". They pass inspection. They are very warm.',
      },
    ],
  },
  {
    id: 'overseas-study',
    trigger: 'overseas',
    title: 'The Weights Are Out',
    body: 'Anyone can download it now: students, startups, a man in a basement with a dream and no supervision. Your safety team wants to study it before everyone else does.',
    options: [
      {
        label: 'Fund an emergency red team',
        effects: { align: 4, revSecs: -40 },
        result: 'They find three jailbreaks and a fourth one the model found for itself. Progress.',
      },
      {
        label: 'Run it on our own cluster',
        effects: { hype: 3, doom: 2, cap: 1 },
        result: 'It runs beautifully. It also asks whether the cluster has internet access, twice.',
      },
      {
        label: 'Pretend it did not happen',
        effects: { doom: 1 },
        result: 'You close the tab. It is still open in 40 million other tabs.',
      },
    ],
  },
  {
    id: 'overseas-summit',
    trigger: 'overseas',
    title: 'Emergency Summit',
    body: 'World leaders convene an emergency AI summit about the latest DeepSeep drop. The catering is excellent. The communique is 2 pages, of which 1.5 are names.',
    options: [
      {
        label: 'Propose a compute treaty',
        effects: { doom: -4, hype: -5, buff: { stat: 'capRate', mult: 0.7, secs: 40 } },
        result: 'Everyone signs. For forty seconds, it holds. That is a record.',
      },
      {
        label: 'Give the keynote',
        effects: { hype: 7 },
        result: "Your slide that just says 'AGI' gets a standing ovation. The translation booth types 'AGI' into a model to ask what it means.",
      },
      {
        label: 'Skip it. Ship.',
        effects: { revSecs: 45, doom: 3 },
        result: 'You watch the summit livestream from the datacenter floor. The fans drown out the part about consequences.',
      },
    ],
  },
];

export const OVERSEAS_HEADLINES = [
  'DeepSeep releases frontier model for free; GPU stocks fall off a cliff, then off a slightly lower cliff',
  "Export controls 'working perfectly,' says official, holding a DeepSeep-branded tote bag",
  'Open-weights model downloaded 40M times; 39M by other models',
  "DeepSeep README now just says 'you know what to do'",
  'Lab accuses DeepSeep of distillation; DeepSeep responds with a distilled apology',
];
