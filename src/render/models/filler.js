// The neighborhood the player's empire slowly bulldozes: houses, apartments,
// shops. Variant and colors come from the plot seed.

import { P } from '../palette.js';
import {
  rnd, choose, result, buildingColor, lot, tree, palm, bush, car, person, acUnit, waterTank, awning,
} from './common.js';

const SHOP_SIGNS = [
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
  waterTank(vb, -0.3, h + 0.05, -0.3);
  acUnit(vb, 0.3, h + 0.05, 0.2);
  if (rnd(seed, 8) < 0.5) tree(vb, 0.7, 0.72, seed, 0.8);
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

const WEST_SIGNS = ['SALOON', 'ASSAY OFFICE', 'GPU EMPORIUM', 'CLAIMS', 'DRY GOODS', 'STABLES', 'EUREKA', 'GOLD BUYER'];
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

// Picks & Shovels Inc. headquarters: still the general store it was in 1849.
export function hq(vb, seed) {
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

export function filler(vb, kind, seed) {
  if (kind === 'hq') return hq(vb, seed);
  if (kind === 'shop') return rnd(seed, 78) < 0.3 ? westernShop(vb, seed) : shop(vb, seed);
  return rnd(seed, 77) < 0.55 ? house(vb, seed) : apartment(vb, seed);
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
  return result(0.4);
}
