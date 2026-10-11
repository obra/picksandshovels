// All game content in one object, as the sim and renderer expect it.

import { BUILDINGS } from './buildings.js';
import { UPGRADES } from './upgrades.js';
import { INCIDENTS } from './incidents.js';
import { EVENTS } from './events.js';
import { LABS, MODEL_RELEASES } from './labs.js';
import { HEADLINES } from './headlines.js';
import { ENDINGS } from './endings.js';
import * as flavor from './flavor.js';

export const CONTENT = {
  buildings: BUILDINGS,
  upgrades: UPGRADES,
  incidents: INCIDENTS,
  events: EVENTS,
  labs: LABS,
  releases: MODEL_RELEASES,
  headlines: HEADLINES,
  endings: ENDINGS,
  flavor,
};
