import { BUILDINGS } from '../src/content/buildings.js';
import { UPGRADES } from '../src/content/upgrades.js';

export const fixtureContent = {
  buildings: BUILDINGS,
  upgrades: UPGRADES,
  labs: [
    { id: 'closed', name: 'ClosedAI', short: 'CLOSEDAI', slogan: 's', color: '#fff', accent: '#000', reckless: 0.9, appetite: 1, culture: 'YOLO' },
    { id: 'anthro', name: 'Anthropomorphic', short: 'ANTHRO', slogan: 's', color: '#fa0', accent: '#000', reckless: 0.2, appetite: 1, culture: 'Worried', openWeights: true },
  ],
  releases: Array.from({ length: 10 }, (_, i) => [{ name: `Glorp-${i + 1}`, tagline: 't' }]),
  incidents: [
    { id: 'ducks', text: 'Agent ordered ducks', site: 'any', tier: 1, minCap: 0, fail: 'Ducks', fix: 'ok' },
    { id: 'glue', text: 'Glue on pizza', site: 'shop', tier: 2, minCap: 0, fail: 'Glue', fix: 'ok' },
    { id: 'lab', text: 'Lab thing', site: 'lab', tier: 3, minCap: 0, fail: 'Lab', fix: 'ok' },
    { id: 'hype', text: 'Hype thing', site: 'hype', tier: 1, minCap: 0, fail: 'Hype', fix: 'ok' },
    { id: 'late', text: 'Late thing', site: 'any', tier: 1, minCap: 80, fail: 'Late', fix: 'ok' },
    { id: 'scheme', text: 'Model schemes', site: 'lab', tier: 1, minCap: 0, kind: 'misalignment', fail: 'Schemed', fix: 'ok' },
    { id: 'exfil', text: 'Weights escape', site: 'lab', tier: 1, minCap: 0, kind: 'escape', fail: 'Escaped', fix: 'ok' },
  ],
  overseas: {
    labs: [
      { id: 'deepseep', name: 'DeepSeep', short: 'DEEPSEEP', slogan: 's', color: '#e33', drops: [{ name: 'DeepSeep-1', tagline: 't' }, { name: 'DeepSeep-2', tagline: 't' }] },
      { id: 'qwerty', name: 'Qwerty', short: 'QWERTY', slogan: 's', color: '#e83', drops: [{ name: 'Qwerty-1', tagline: 't' }, { name: 'Qwerty-2', tagline: 't' }] },
    ],
  },
  flops: [{ tagline: 'The demo was pre-recorded.', headline: '{lab} launch flops' }],
  events: [
    {
      id: 'overseas-response', title: 'Open Weights Drop', body: 'b', trigger: 'overseas',
      options: [
        { label: 'Lobby', effects: { hype: -2 }, result: 'r' },
        { label: 'Study it', effects: { align: 1 }, result: 'r' },
      ],
    },
    {
      id: 'money', title: 'Money', body: 'b', once: true,
      options: [
        { label: 'Take it', effects: { revSecs: 30, doom: 5, flag: 'greed' }, result: 'r' },
        { label: 'No', effects: { hype: -5 }, result: 'r' },
      ],
    },
    {
      id: 'buffy', title: 'Buff', body: 'b',
      options: [
        { label: 'Faster', effects: { buff: { stat: 'revenue', mult: 2, secs: 10 } }, result: 'r' },
        { label: 'Slower', effects: { cap: 0.1, align: 3 }, result: 'r' },
      ],
    },
    {
      id: 'late', title: 'Late', body: 'b', minCap: 80,
      options: [{ label: 'x', effects: {}, result: 'r' }, { label: 'y', effects: {}, result: 'r' }],
    },
  ],
};
