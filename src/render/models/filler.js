// The neighborhood the player's empire slowly bulldozes: houses, apartments,
// shops. Variant and colors come from the plot seed.

import { P } from '../palette.js';
import { GOLD_RUSH_SIGNS } from '../../content/flavor.js';
import { SHOP_INFO, HOME_INFO, LOT_INFO, HQ_INFO } from '../../content/places.js';
import {
  rnd, choose, result, buildingColor, lot, tree, palm, bush, car, person, acUnit, waterTank, awning, ledStrip, antenna,
} from './common.js';

export const SHOP_SIGNS = [
  'TACOS', 'BOBA', 'PIZZA', 'COFFEE', 'VAPE', 'SUSHI', 'DONUTS', 'RAMEN', 'KOMBUCHA', 'POKE',
  'BAGELS', 'GYM', 'PHO', 'BURRITO', 'MATCHA', 'JUICE', 'BANH MI', 'NAILS',
];
const AWNINGS = [
  [P.red, P.white],
  [P.blue, P.white],
  [P.green, P.yellow],
  [P.magenta, P.white],
  [P.orange, P.white],
  [P.teal, P.offwhite],
];

export function house(vb, seed) {
  lot(vb, 'grass');
  const wall = buildingColor(seed, 1);
  const roof = choose([P.roofRed, P.roofBlue, P.roofGreen, P.ink, P.brown], seed, 2);
  const w = 0.55;
  const d = 0.45;
  const h = 0.42;
  const x = -0.15;
  const z = -0.15;
  vb.box(x - w, 0, z - d, x + w, h, z + d, wall);
  // Gabled roof in steps along x.
  for (let i = 0; i < 4; i++) {
    const inset = i * 0.11;
    vb.box(x - w - 0.04, h + i * 0.07, z - d - 0.04 + inset, x + w + 0.04, h + (i + 1) * 0.07, z + d + 0.04 - inset, roof);
  }
  vb.box(x + 0.25, h, z - 0.15, x + 0.36, h + 0.38, z - 0.04, P.brown); // chimney
  vb.panel('+z', z + d, x - 0.08, 0, x + 0.08, 0.24, P.brown);
  vb.windows(x - w, 0.02, z - d, x + w, h - 0.02, z + d, { seed, floorH: 0.3, winW: 0.14, winH: 0.12, gap: 0.22 });
  if (rnd(seed, 4) < 0.6) palm(vb, 0.55, 0.5, seed);
  else tree(vb, 0.55, 0.55, seed);
  bush(vb, -0.6, 0.55, seed);
  if (rnd(seed, 6) < 0.6) car(vb, 0.45, -0.25, seed, 'z');
  // Mailbox.
  vb.box(-0.1, 0, 0.62, -0.07, 0.12, 0.65, P.ink);
  vb.box(-0.13, 0.12, 0.6, -0.04, 0.17, 0.67, P.blue);
  return result(h + 0.3);
}

export function apartment(vb, seed) {
  lot(vb, 'paved');
  const wall = buildingColor(seed, 1);
  const floors = 3 + Math.floor(rnd(seed, 2) * 4);
  const h = 0.12 + floors * 0.26;
  const s = 0.62;
  vb.box(-s, 0, -s, s, h, s, wall);
  vb.box(-s - 0.03, h, -s - 0.03, s + 0.03, h + 0.05, s + 0.03, P.concrete);
  vb.windows(-s, 0.1, -s, s, h, s, { seed, litChance: 0.55 });
  // Balcony ledges.
  for (let f = 1; f < floors; f++) {
    const y = 0.12 + f * 0.26;
    vb.box(-s - 0.04, y - 0.02, s, s + 0.04, y, s + 0.06, P.white);
  }
  vb.panel('+z', s, -0.1, 0, 0.1, 0.22, P.ink);
  if (rnd(seed, 8) < 0.5) tree(vb, 0.7, 0.72, seed, 0.8);
  if (rnd(seed, 9) < 0.5) {
    // Rooftop billboard: whatever the Valley is selling today.
    vb.box(-0.45, h + 0.05, 0.05, -0.41, h + 0.35, 0.09, P.steel);
    vb.box(0.41, h + 0.05, 0.05, 0.45, h + 0.35, 0.09, P.steel);
    vb.box(-0.62, h + 0.3, 0.0, 0.62, h + 0.72, 0.05, P.ink);
    return result(h + 0.8, {
      signs: [{ text: 'AGI SOON', face: '+z', x: 0, y: h + 0.51, z: 0.05, w: 1.18, fg: '#22232b', bg: '#ffffff', slot: 'billboard' }],
    });
  }
  waterTank(vb, -0.3, h + 0.05, -0.3);
  acUnit(vb, 0.3, h + 0.05, 0.2);
  return result(h + 0.4);
}

export function shop(vb, seed) {
  lot(vb, 'plaza');
  const wall = buildingColor(seed, 1);
  const floors = 1 + Math.floor(rnd(seed, 2) * 2);
  const h = 0.36 + (floors - 1) * 0.28;
  const s = 0.6;
  vb.box(-s, 0, -s, s, h, s, wall);
  vb.box(-s - 0.02, h, -s - 0.02, s + 0.02, h + 0.06, s + 0.02, P.white);
  // Storefront glass on the two street faces.
  vb.panel('+z', s, -s + 0.08, 0.02, s - 0.08, 0.26, P.windowWarm, 1);
  vb.panel('+x', s, -s + 0.08, 0.02, s - 0.08, 0.26, P.windowWarm, 1);
  const colors = choose(AWNINGS, seed, 3);
  awning(vb, '+z', -s, s, 0.28, { plane: s, d: 0.14 }, colors);
  awning(vb, '+x', -s, s, 0.28, { plane: s, d: 0.14 }, colors);
  if (floors > 1) vb.windows(-s, 0.36, -s, s, h, s, { seed, floorH: 0.28 });
  acUnit(vb, -0.2, h + 0.06, -0.2);
  // Sidewalk table and a customer.
  vb.box(0.62, 0, 0.7, 0.74, 0.1, 0.78, P.white);
  person(vb, 0.7, 0.62, seed);
  const text = choose(SHOP_SIGNS, seed, 4);
  return result(h + 0.4, {
    signs: [{ text, face: '+z', x: 0, y: h + 0.2, z: s - 0.05, fg: '#ffffff', bg: choose(['#f2504b', '#3f7ff2', '#22232b', '#f25ab4', '#3fbf6a'], seed, 5), roof: true }],
  });
}

const WEST_SIGNS = GOLD_RUSH_SIGNS;
const WOOD = [0xb5793f, 0xa0663a, 0xc68d55, 0x8f5a33];

// An 1849 false-front: a flat facade taller than the building behind it.
function westernFront(vb, seed, s, h, wood) {
  const front = h + 0.32;
  vb.box(-s, 0, s - 0.06, s, front, s, wood);
  // Stepped top edge.
  vb.box(-s * 0.55, front, s - 0.06, s * 0.55, front + 0.08, s, wood);
  vb.box(-s * 0.2, front + 0.08, s - 0.06, s * 0.2, front + 0.14, s, wood);
  // Board lines.
  for (let i = 1; i < 6; i++) vb.panel('+z', s, -s, (front * i) / 6, s, (front * i) / 6 + 0.012, 0x7a4a2a);
  // Porch roof on posts, and a boardwalk.
  vb.box(-s - 0.02, 0, s, s + 0.02, 0.03, s + 0.24, 0x9a6a3d);
  vb.box(-s - 0.02, 0.36, s, s + 0.02, 0.4, s + 0.26, 0x7a4a2a);
  for (const x of [-s + 0.04, 0, s - 0.04]) vb.box(x - 0.02, 0.03, s + 0.2, x + 0.02, 0.36, s + 0.24, 0x7a4a2a);
  vb.panel('+z', s, -0.12, 0.03, 0.12, 0.3, 0x4a2a1a);
  vb.panel('+z', s, -s + 0.08, 0.1, -0.2, 0.28, P.windowWarm, 1);
  vb.panel('+z', s, 0.2, 0.1, s - 0.08, 0.28, P.windowWarm, 1);
  return front;
}

function westernShop(vb, seed) {
  lot(vb, 'plaza');
  const wood = choose(WOOD, seed, 1);
  const s = 0.6;
  const h = 0.5;
  vb.box(-s, 0, -s, s, h, s - 0.06, wood);
  vb.box(-s - 0.03, h, -s - 0.03, s + 0.03, h + 0.04, s - 0.06, 0x6a4028);
  const front = westernFront(vb, seed, s, h, wood);
  // Barrels and a hitching post.
  vb.box(0.66, 0, 0.66, 0.78, 0.14, 0.78, 0x8a5a33);
  vb.box(0.66, 0.06, 0.66, 0.78, 0.08, 0.78, P.ink);
  vb.box(-0.75, 0.12, 0.72, -0.35, 0.14, 0.74, 0x7a4a2a);
  vb.box(-0.74, 0, 0.72, -0.72, 0.14, 0.74, 0x7a4a2a);
  vb.box(-0.38, 0, 0.72, -0.36, 0.14, 0.74, 0x7a4a2a);
  return result(front + 0.3, {
    signs: [{ text: choose(WEST_SIGNS, seed, 4), face: '+z', x: 0, y: front - 0.14, z: s, fg: '#ffe382', bg: '#4a2a1a', maxW: 1.1 }],
  });
}

// Picks & Shovels Inc. headquarters grows with the company. Level 1 is the
// 1849 general store; every later level keeps a piece of it.
export function hq(vb, seed, level = 1) {
  if (level === 2) return hqBrick(vb, seed);
  if (level === 3) return hqTower(vb, seed);
  if (level >= 4) return hqGold(vb, seed);
  return hqStore(vb, seed);
}

// The goldish pick and shovel crossed on a facade at height y.
function crossedTools(vb, face, plane, y, size = 1) {
  const s = size;
  for (let i = 0; i < 7; i++) {
    const t = (i - 3) * 0.05 * s;
    vb.panel(face, plane, t - 0.025 * s, y + t - 0.025 * s, t + 0.025 * s, y + t + 0.025 * s, P.yellow, 2);
    vb.panel(face, plane, t - 0.025 * s, y - t - 0.025 * s, t + 0.025 * s, y - t + 0.025 * s, P.yellow, 2);
  }
}

function hqBrick(vb, seed) {
  lot(vb, 'plaza');
  const brick = 0xb3563a;
  const h = 1.0;
  vb.box(-0.75, 0, -0.75, 0.75, h, 0.6, brick);
  for (let i = 1; i < 8; i++) vb.panel('+z', 0.6, -0.75, (h * i) / 8, 0.75, (h * i) / 8 + 0.012, 0x8e4030);
  vb.windows(-0.75, 0.3, -0.75, 0.75, h, 0.6, { seed, colors: [P.windowWarm], floorH: 0.3 });
  vb.box(-0.8, h, -0.8, 0.8, h + 0.08, 0.65, 0x6a4028);
  // The old wooden front, now a lobby.
  westernFront(vb, seed, 0.6, 0.4, 0xc68d55);
  crossedTools(vb, '+z', 0.6, h - 0.15);
  // A small datacenter annex out back, humming.
  vb.box(-0.7, h + 0.08, -0.7, 0.1, h + 0.35, -0.2, 0xd8dce6);
  ledStrip(vb, -0.65, 0.05, h + 0.25, -0.195, P.gpuGreen);
  return result(h + 0.6, {
    signs: [{ text: 'PICKS & SHOVELS INC.', face: '+z', x: 0, y: 0.6, z: 0.6, fg: '#ffe382', bg: '#4a2a1a', maxW: 1.4 }],
    smoke: [{ x: -0.3, y: h + 0.4, z: -0.45, color: 0xdddddd, rate: 0.2 }],
  });
}

function hqTower(vb, seed) {
  lot(vb, 'plaza');
  const h = 2.6;
  vb.box(-0.7, 0, -0.7, 0.7, h, 0.55, 0x9fc9f0);
  vb.windows(-0.7, 0.5, -0.7, 0.7, h, 0.55, { seed, colors: [P.windowCool, P.white], litChance: 0.8 });
  vb.box(-0.75, h, -0.75, 0.75, h + 0.1, 0.6, P.ink);
  // The original false front, bolted to the ground floor of a glass tower.
  westernFront(vb, seed, 0.6, 0.4, 0xc68d55);
  crossedTools(vb, '+z', 0.55, h - 0.35, 1.4);
  // Rooftop gold pick sculpture.
  vb.box(-0.03, h + 0.1, -0.03, 0.03, h + 0.7, 0.03, 0x8a5a33);
  vb.box(-0.35, h + 0.62, -0.05, 0.35, h + 0.74, 0.05, P.yellow, { emit: 2 });
  vb.box(-0.4, h + 0.55, -0.04, -0.3, h + 0.64, 0.04, P.yellow, { emit: 2 });
  vb.box(0.3, h + 0.55, -0.04, 0.4, h + 0.64, 0.04, P.yellow, { emit: 2 });
  antenna(vb, 0.5, h + 0.1, -0.5, 0.5);
  return result(h + 0.9, {
    signs: [
      { text: 'PICKS & SHOVELS', face: '+z', x: 0, y: h - 0.7, z: 0.55, fg: '#22232b', bg: '#ffe382', maxW: 1.3 },
      { text: 'EST. 1849', face: '+z', x: 0, y: 0.62, z: 0.6, fg: '#ffe382', bg: '#4a2a1a', maxW: 1.0 },
    ],
  });
}

function hqGold(vb, seed) {
  lot(vb, 'plaza');
  const h = 3.8;
  // A shovel handle of a building, in gold, because at this point why not.
  vb.box(-0.42, 0, -0.42, 0.42, h, 0.42, 0xd9a520);
  for (let i = 0; i < 12; i++) vb.panel('+z', 0.42, -0.42, 0.4 + i * 0.28, 0.42, 0.42 + i * 0.28, 0xffe382, 1);
  for (let i = 0; i < 12; i++) vb.panel('+x', 0.42, -0.42, 0.4 + i * 0.28, 0.42, 0.42 + i * 0.28, 0xffe382, 1);
  vb.box(-0.55, h, -0.12, 0.55, h + 0.14, 0.12, 0xd9a520);
  // The giant shovel blade on top.
  vb.box(-0.5, h + 0.14, -0.08, 0.5, h + 0.95, 0.08, P.yellow, { emit: 2 });
  vb.box(-0.38, h + 0.95, -0.07, 0.38, h + 1.15, 0.07, P.yellow, { emit: 2 });
  vb.box(-0.2, h + 1.15, -0.06, 0.2, h + 1.25, 0.06, P.yellow, { emit: 2 });
  // The 1849 store, preserved out front as a museum.
  const store = new ShiftedBuilder(vb, 0, 0.58);
  store.box(-0.35, 0, -0.18, 0.35, 0.3, 0.18, 0xc68d55);
  store.box(-0.35, 0, 0.18, 0.35, 0.48, 0.22, 0xc68d55);
  store.panel('+z', 0.22, -0.08, 0.02, 0.08, 0.2, 0x4a2a1a);
  for (const [x, z] of [[-0.75, 0.75], [0.75, 0.75], [0.75, -0.75]]) vb.box(x - 0.04, 0, z - 0.04, x + 0.04, 0.5, z + 0.04, P.yellow, { emit: 2 });
  return result(h + 1.4, {
    signs: [
      { text: 'P&S', face: '+z', x: 0, y: h - 0.5, z: 0.42, fg: '#22232b', bg: '#ffe382', maxW: 0.7 },
      { text: 'MUSEUM', face: '+z', x: 0, y: 0.38, z: 0.81, fg: '#ffe382', bg: '#4a2a1a', maxW: 0.6 },
    ],
  });
}

// Draws through to a builder with an x/z offset.
class ShiftedBuilder {
  constructor(vb, dx, dz) {
    this.vb = vb;
    this.dx = dx;
    this.dz = dz;
  }
  box(x0, y0, z0, x1, y1, z1, c, o) {
    return this.vb.box(x0 + this.dx, y0, z0 + this.dz, x1 + this.dx, y1, z1 + this.dz, c, o);
  }
  panel(face, plane, u0, v0, u1, v1, c, e) {
    const shift = face[1] === 'z' ? this.dz : this.dx;
    const along = face[1] === 'z' ? this.dx : this.dz;
    return this.vb.panel(face, plane + shift, u0 + along, v0, u1 + along, v1, c, e);
  }
}

function hqStore(vb, seed) {
  lot(vb, 'plaza');
  const wood = 0xc68d55;
  const s = 0.7;
  const h = 0.62;
  vb.box(-s, 0, -s, s, h, s - 0.06, wood);
  vb.box(-s - 0.04, h, -s - 0.04, s + 0.04, h + 0.05, s - 0.06, 0x6a4028);
  vb.windows(-s, 0.05, -s, s, h, s - 0.06, { seed, faces: ['+x'], colors: [P.windowWarm] });
  const front = westernFront(vb, seed, s, h, wood);
  // Crossed pick and shovel, in gold, over the sign.
  const y = front - 0.1;
  for (let i = 0; i < 7; i++) {
    const t = (i - 3) * 0.05;
    vb.box(t - 0.025, y + t - 0.025, s, t + 0.025, y + t + 0.025, s + 0.03, P.yellow, { emit: 2 });
    vb.box(t - 0.025, y - t - 0.025, s, t + 0.025, y - t + 0.025, s + 0.03, P.yellow, { emit: 2 });
  }
  vb.box(-0.25, y + 0.1, s, -0.1, y + 0.2, s + 0.03, P.yellow, { emit: 2 }); // pick head
  vb.box(0.12, y + 0.12, s, 0.24, y + 0.24, s + 0.03, P.yellow, { emit: 2 }); // shovel blade
  // Mine-cart rails out the side door, and a cart heaped with GPUs.
  vb.box(s, 0, -0.35, 0.82, 0.01, -0.33, P.steel);
  vb.box(s, 0, -0.15, 0.82, 0.01, -0.13, P.steel);
  for (let i = 0; i < 4; i++) vb.box(s + 0.01 + i * 0.03, 0, -0.38, s + 0.02 + i * 0.03, 0.008, -0.1, 0x7a4a2a);
  vb.box(-0.62, 0, -0.85, -0.22, 0.01, -0.83, P.steel);
  vb.box(0.4, 0.03, -0.42, 0.78, 0.2, -0.06, 0x6f7480);
  for (let i = 0; i < 3; i++) vb.box(0.44 + i * 0.11, 0.2, -0.38, 0.52 + i * 0.11, 0.27, -0.1, P.ink);
  for (let i = 0; i < 3; i++) vb.box(0.45 + i * 0.11, 0.22, -0.39, 0.51 + i * 0.11, 0.25, -0.38, P.gpuGreen, { emit: 2 });
  vb.box(0.42, 0, -0.43, 0.48, 0.05, -0.37, P.black);
  vb.box(0.7, 0, -0.43, 0.76, 0.05, -0.37, P.black);
  // A pick and a shovel leaning by the door, for the tourists.
  vb.box(0.55, 0.03, 0.88, 0.57, 0.4, 0.9, 0x7a4a2a);
  vb.box(0.5, 0.36, 0.87, 0.64, 0.4, 0.91, P.steel);
  vb.box(-0.6, 0.03, 0.88, -0.58, 0.36, 0.9, 0x7a4a2a);
  vb.box(-0.63, 0.03, 0.86, -0.55, 0.12, 0.92, P.steel);
  return result(front + 0.4, {
    signs: [
      { text: 'PICKS & SHOVELS', face: '+z', x: 0, y: front - 0.32, z: s, fg: '#ffe382', bg: '#4a2a1a', maxW: 1.32 },
      { text: 'EST. 1849', face: '+x', x: s, y: h + 0.15, z: 0.1, fg: '#4a2a1a', bg: '#ffe382', maxW: 0.9 },
    ],
  });
}

// Every filler model also says what it is, for the hover tooltip.
export function filler(vb, kind, seed, level = 1) {
  if (kind === 'hq') return { ...hq(vb, seed, level), info: HQ_INFO };
  if (kind === 'shop') {
    const res = rnd(seed, 78) < 0.3 ? westernShop(vb, seed) : shop(vb, seed);
    const sign = res.signs[0]?.text;
    return { ...res, info: { title: sign, text: SHOP_INFO[sign] || 'A local business, for now.' } };
  }
  if (rnd(seed, 77) < 0.55) return { ...house(vb, seed), info: { title: 'Home', text: choose(HOME_INFO.house, seed, 61) } };
  return { ...apartment(vb, seed), info: { title: 'Apartments', text: choose(HOME_INFO.apartment, seed, 62) } };
}

export function emptyLot(vb, seed) {
  lot(vb, 'grass');
  // A FOR LEASE sign and some weeds: the Valley's natural state, briefly.
  vb.box(0.3, 0, 0.45, 0.33, 0.22, 0.48, P.white);
  vb.box(0.18, 0.16, 0.46, 0.45, 0.3, 0.48, P.white);
  vb.box(0.2, 0.18, 0.485, 0.43, 0.28, 0.49, P.red);
  for (let i = 0; i < 5; i++) {
    const x = (rnd(seed, 40 + i) - 0.5) * 1.3;
    const z = (rnd(seed, 50 + i) - 0.5) * 1.3;
    vb.box(x - 0.03, 0, z - 0.03, x + 0.03, 0.05, z + 0.03, P.grassDark);
  }
  return result(0.4, { info: { title: 'For Lease', text: LOT_INFO } });
}
