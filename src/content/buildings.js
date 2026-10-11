// Buildings the player buys. Each purchase lands on a plot in the city.
// cat: compute (revenue + capability), safety (alignment research and incident
// mitigation), hype (holds off the AI winter).
//
// stats (per building owned):
//   compute        compute units sold to labs (revenue, and training)
//   research       safety research per second (drives alignment)
//   hype           hype per second
//   incidentReduce fraction off the incident spawn rate (multiplicative)
//   incidentTime   fraction added to incident timers
//   autoResolve    adds to the per-second chance an intern fixes a tier-1 incident
//   doomDamp       fraction off gap-driven doom growth (multiplicative)

export const BUILDINGS = [
  // ── COMPUTE ──────────────────────────────────────────────
  {
    id: 'basement', cat: 'compute', name: "Gaming PC in Mom's Basement", cost: 12, minCap: 0,
    stats: { compute: 0.6 },
    desc: 'RGB lighting adds 3% performance. This has been peer reviewed by the guy who sells the RGB.',
  },
  {
    id: 'rack', cat: 'compute', name: 'GPU Rack', cost: 90, minCap: 0,
    stats: { compute: 4 },
    desc: 'Eight GPUs, one fan, zero cable management. Sounds like a jet. Smells like money.',
  },
  {
    id: 'mine', cat: 'compute', name: 'Repurposed Crypto Mine', cost: 750, minCap: 0,
    stats: { compute: 22 },
    desc: 'Formerly mined $DOGE. Now mines meaning. The vibes are identical.',
  },
  {
    id: 'datacenter', cat: 'compute', name: 'Datacenter', cost: 6500, minCap: 10,
    stats: { compute: 130 },
    desc: 'A windowless box that drinks a lake a day. The lake has filed a complaint.',
  },
  {
    id: 'campus', cat: 'compute', name: 'Hyperscale Campus', cost: 60000, minCap: 20,
    stats: { compute: 800 },
    desc: 'Visible from space. Audible from space. Smells like hot pennies from space.',
  },
  {
    id: 'reactor', cat: 'compute', name: 'Restarted Nuclear Plant', cost: 520000, minCap: 35,
    stats: { compute: 4800 },
    desc: 'It was decommissioned for a reason. The reason has been decommissioned.',
  },
  {
    id: 'fab', cat: 'compute', name: 'Totally Safe Microchip Co. Fab', cost: 5.2e6, minCap: 50,
    stats: { compute: 32000 },
    desc: 'Makes chips at 2 nanometers. The cleanroom staff are 2 nanometers from a breakdown.',
  },
  {
    id: 'orbital', cat: 'compute', name: 'Orbital Datacenter Launchpad', cost: 6e7, minCap: 65,
    stats: { compute: 250000 },
    desc: 'Cooling is free in space. So is screaming. Nobody can hear the fans.',
  },
  {
    id: 'dyson', cat: 'compute', name: 'Dyson Swarm Uplink (Beta)', cost: 8e8, minCap: 80,
    stats: { compute: 2.2e6 },
    desc: 'We asked the sun for a term sheet. The sun said yes. The sun has never said no.',
  },

  // ── SAFETY ───────────────────────────────────────────────
  {
    id: 'intern', cat: 'safety', name: 'Alignment Intern', cost: 18, minCap: 0,
    stats: { research: 0.6, autoResolve: 1 },
    desc: 'Unpaid. Overqualified. Occasionally fixes an incident before you notice. Will be thanked in a footnote.',
  },
  {
    id: 'redteam', cat: 'safety', name: 'Red Team Hoodie Collective', cost: 130, minCap: 0,
    stats: { research: 4, incidentReduce: 0.03 },
    desc: 'Twelve people in hoodies who get paid to ask the model how to make napalm. Fewer incidents.',
  },
  {
    id: 'evals', cat: 'safety', name: 'Evals Lab', cost: 1100, minCap: 0,
    stats: { research: 26, incidentTime: 0.05 },
    desc: 'Writes benchmarks faster than models can memorize them. Barely. Incidents take longer to blow up.',
  },
  {
    id: 'interp', cat: 'safety', name: 'Interpretability Lab', cost: 9000, minCap: 10,
    stats: { research: 150, doomDamp: 0.03 },
    desc: 'Found the neuron for deception. It is also the neuron for the Golden Gate Bridge. Investigating.',
  },
  {
    id: 'rlhf', cat: 'safety', name: 'RLHF Thumbs-Up Farm', cost: 80000, minCap: 20,
    stats: { research: 900 },
    desc: 'Ten thousand contractors clicking 👍 until the model learns manners. Some of it sticks.',
  },
  {
    id: 'thinktank', cat: 'safety', name: 'Think Tank', cost: 750000, minCap: 35,
    stats: { research: 6000, doomDamp: 0.02 },
    desc: 'Produces 400-page PDFs about risk. Two of them have been read. One by a model.',
  },
  {
    id: 'monastery', cat: 'safety', name: 'Corrigibility Monastery', cost: 7.5e6, minCap: 50,
    stats: { research: 40000, incidentReduce: 0.02 },
    desc: 'Researchers take a vow of silence until alignment is solved. It is very quiet.',
  },
  {
    id: 'moonbase', cat: 'safety', name: 'Superalignment Moonbase', cost: 9e7, minCap: 65,
    stats: { research: 300000 },
    desc: 'The only place far enough away that the safety team cannot be reorganized.',
  },

  // ── HYPE ─────────────────────────────────────────────────
  {
    id: 'billboard', cat: 'hype', name: 'Billboard', cost: 40, minCap: 0,
    stats: { hype: 0.03 },
    desc: 'Says "AGI SOON" in a font that cost $400,000. Nobody knows what it is advertising. Everyone wants it.',
  },
  {
    id: 'podcast', cat: 'hype', name: 'Podcast Studio', cost: 500, minCap: 0,
    stats: { hype: 0.07 },
    desc: 'Every founder gets a four-hour episode. Three hours are about cold plunges.',
  },
  {
    id: 'hackathon', cat: 'hype', name: 'Hackathon Warehouse', cost: 5000, minCap: 10,
    stats: { hype: 0.14 },
    desc: '48 hours, 400 Red Bulls, 90 wrappers around the same API. One of them raises $30M.',
  },
  {
    id: 'influencer', cat: 'hype', name: 'Content House', cost: 45000, minCap: 20,
    stats: { hype: 0.3 },
    desc: 'Five influencers react to model launches in real time. They are 40% AI-generated and no one has checked which 40%.',
  },
  {
    id: 'conference', cat: 'hype', name: 'DevDay Convention Center', cost: 420000, minCap: 35,
    stats: { hype: 0.6 },
    desc: 'Keynote at 10. "One more thing" at 10:01. Stock up 12% at 10:02. Product ships in 2031.',
  },
  {
    id: 'orb', cat: 'hype', name: 'The Orb', cost: 4.5e6, minCap: 50,
    stats: { hype: 1.1 },
    desc: 'A giant LED sphere that displays whatever the model wants. Today it wants to display a smile.',
  },
  {
    id: 'expo', cat: 'hype', name: 'AGI World Expo Arena', cost: 5.5e7, minCap: 65,
    stats: { hype: 2 },
    desc: 'Tickets $9,000. Includes a lanyard, a keynote, and a waiver regarding the keynote.',
  },
];

export const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));
