// The island: earth slab, beaches, roads with markings, sidewalks, the park,
// the marina, the red bridge, and street furniture. Static: built once.

import { GRID, BLOCK, STRIDE, ORIGIN, tileKind } from '../sim/map.js';
import { hash01 } from '../sim/rng.js';
import { VoxelBuilder } from './voxel.js';
import { P } from './palette.js';
import { tree, palm, bush, person, car } from './models/common.js';

export const GROUND = 0.05; // road surface
export const CURB = 0.13; // block surface (sidewalk top)
export const LOT = 0.15; // lot surface, where buildings stand
const BEACH = -0.18;
const DEPTH = -1.6;

function isRoad(map, x, z) {
  return tileKind(map, x, z) === 'road';
}

export function buildTerrain(map) {
  const vb = new VoxelBuilder();
  const deco = new VoxelBuilder();

  for (let z = 0; z < GRID; z++) for (let x = 0; x < GRID; x++) {
    const k = tileKind(map, x, z);
    if (k === 'water') continue;
    const top = k === 'beach' ? BEACH : k === 'road' ? GROUND : GROUND;
    const topColor = k === 'beach' ? P.sand : k === 'road' ? P.road : P.sidewalk;
    // Earth column with a sand band near the waterline, like a cut-away diorama.
    vb.box(x, DEPTH, z, x + 1, -0.55, z + 1, P.dirtDark, { top: P.dirtDark });
    vb.box(x, -0.55, z, x + 1, top, z + 1, k === 'beach' ? P.sand : P.dirt, { top: topColor, side: k === 'beach' ? P.sandDark : P.dirt });
    if (k === 'beach') {
      const h = hash01(x, z, 3);
      if (h < 0.06) palm(new VoxelBuilderShim(deco, BEACH), x + 0.5, z + 0.5, x * 31 + z, 1.1);
      else if (h < 0.1) {
        // Beach umbrella.
        deco.box(x + 0.48, BEACH, z + 0.48, x + 0.52, BEACH + 0.35, z + 0.52, P.white);
        deco.box(x + 0.25, BEACH + 0.35, z + 0.25, x + 0.75, BEACH + 0.39, z + 0.75, h < 0.08 ? P.red : P.blue);
        deco.box(x + 0.3, BEACH, z + 0.6, x + 0.5, BEACH + 0.02, z + 0.7, P.yellow);
      }
    }
  }

  // Road markings and crosswalks.
  for (let z = 0; z < GRID; z++) for (let x = 0; x < GRID; x++) {
    if (!isRoad(map, x, z)) continue;
    const ns = isRoad(map, x, z - 1) || isRoad(map, x, z + 1);
    const ew = isRoad(map, x - 1, z) || isRoad(map, x + 1, z);
    const onX = (x - (ORIGIN - 1)) % STRIDE === 0;
    const onZ = (z - (ORIGIN - 1)) % STRIDE === 0;
    const y = GROUND + 0.004;
    if (onX && onZ) {
      // Intersection: zebra stripes on each side that has a road.
      for (let i = 0; i < 4; i++) {
        const t = 0.15 + i * 0.2;
        if (isRoad(map, x, z + 1)) vb.box(x + t, GROUND, z + 0.86, x + t + 0.1, y, z + 0.98, P.crosswalk);
        if (isRoad(map, x + 1, z)) vb.box(x + 0.86, GROUND, z + t, x + 0.98, y, z + t + 0.1, P.crosswalk);
      }
    } else if (onX && ns) {
      vb.box(x + 0.47, GROUND, z + 0.15, x + 0.53, y, z + 0.6, P.roadLine);
    } else if (onZ && ew) {
      vb.box(x + 0.15, GROUND, z + 0.47, x + 0.6, y, z + 0.53, P.roadLine);
    }
    // Streetlights at some corners.
    if (onX && onZ && hash01(x, z, 9) < 0.7) {
      deco.box(x + 0.06, GROUND, z + 0.06, x + 0.1, GROUND + 0.55, z + 0.1, P.ink);
      deco.box(x + 0.04, GROUND + 0.55, z + 0.04, x + 0.12, GROUND + 0.6, z + 0.12, P.windowLit, { emit: 2 });
    }
  }

  // Blocks: a raised curb/sidewalk slab per land block.
  for (const b of map.blocks) {
    if (b.type === 'W') continue;
    const x0 = b.x0;
    const z0 = b.z0;
    const x1 = x0 + BLOCK;
    const z1 = z0 + BLOCK;
    vb.box(x0, GROUND, z0, x1, CURB, z1, P.sidewalk, { side: P.curb });
    // Sidewalk joints.
    for (let i = 1; i < 8; i++) {
      const t = i * 0.5;
      vb.box(x0 + t - 0.01, CURB, z1 - 0.18, x0 + t + 0.01, CURB + 0.002, z1, P.curb);
      vb.box(x1 - 0.18, CURB, z0 + t - 0.01, x1, CURB + 0.002, z0 + t + 0.01, P.curb);
    }
    if (b.type === 'K') park(deco, b);
    if (b.type === 'M') marina(deco, b);
    // Hydrants and trees along the curb.
    for (let i = 0; i < 4; i++) {
      const h = hash01(b.bi, b.bj, i);
      if (b.type !== 'P' || h > 0.5) continue;
      const along = x0 + 0.5 + i;
      if (h < 0.25) tree(new VoxelBuilderShim(deco, CURB), along, z1 - 0.1, b.bi * 7 + i, 0.7);
      else {
        deco.box(along - 0.03, CURB, z1 - 0.12, along + 0.03, CURB + 0.08, z1 - 0.06, P.red);
      }
    }
  }

  bridge(deco, map);

  return { ground: vb.build(), deco: deco.build() };
}

function park(vb, b) {
  const x0 = b.x0 + 0.15;
  const z0 = b.z0 + 0.15;
  const x1 = b.x0 + BLOCK - 0.15;
  const z1 = b.z0 + BLOCK - 0.15;
  const y = CURB;
  vb.box(x0, y, z0, x1, y + 0.02, z1, P.park);
  // Cross paths.
  vb.box(b.cx - 0.2, y + 0.02, z0, b.cx + 0.2, y + 0.025, z1, P.sand);
  vb.box(x0, y + 0.02, b.cz - 0.2, x1, y + 0.025, b.cz + 0.2, P.sand);
  // Fountain.
  vb.box(b.cx - 0.5, y, b.cz - 0.5, b.cx + 0.5, y + 0.15, b.cz + 0.5, P.concrete);
  vb.box(b.cx - 0.42, y + 0.02, b.cz - 0.42, b.cx + 0.42, y + 0.13, b.cz + 0.42, P.cyan);
  vb.box(b.cx - 0.06, y, b.cz - 0.06, b.cx + 0.06, y + 0.4, b.cz + 0.06, P.concrete);
  vb.box(b.cx - 0.04, y + 0.4, b.cz - 0.04, b.cx + 0.04, y + 0.55, b.cz + 0.04, 0xbfefff, { emit: 2 });
  // Trees in the corners.
  const seeds = [3, 5, 7, 11, 13, 17, 19, 23];
  let k = 0;
  for (const [dx, dz] of [[0.5, 0.5], [3.3, 0.5], [0.5, 3.3], [3.3, 3.3], [1.1, 0.5], [0.5, 1.1], [3.3, 2.7], [2.7, 3.3]]) {
    const g = new VoxelBuilderShim(vb, y);
    tree(g, b.x0 + dx, b.z0 + dz, seeds[k++], 1.1);
  }
  // Two protest camps glaring at each other across the fountain.
  const pause = [P.red, P.white, P.red];
  for (let i = 0; i < 4; i++) {
    const gx = b.x0 + 1.0 + i * 0.18;
    const gz = b.z0 + 2.6;
    const shim = new VoxelBuilderShim(vb, y);
    person(shim, gx, gz, 200 + i);
    vb.box(gx - 0.08, y + 0.2, gz - 0.01, gx + 0.08, y + 0.32, gz + 0.01, pause[i % 3]);
    vb.box(gx - 0.005, y + 0.12, gz - 0.005, gx + 0.005, y + 0.2, gz + 0.005, P.brown);
  }
  for (let i = 0; i < 4; i++) {
    const gx = b.x0 + 2.6;
    const gz = b.z0 + 0.9 + i * 0.18;
    const shim = new VoxelBuilderShim(vb, y);
    person(shim, gx, gz, 300 + i, P.ink);
    vb.box(gx - 0.01, y + 0.2, gz - 0.08, gx + 0.01, y + 0.32, gz + 0.08, i % 2 ? P.green : P.yellow);
    vb.box(gx - 0.005, y + 0.12, gz - 0.005, gx + 0.005, y + 0.2, gz + 0.005, P.brown);
  }
  // Benches.
  vb.box(b.x0 + 1.4, y, b.z0 + 3.45, b.x0 + 1.8, y + 0.08, b.z0 + 3.55, P.brown);
  vb.box(b.x0 + 3.45, y, b.z0 + 1.4, b.x0 + 3.55, y + 0.08, b.z0 + 1.8, P.brown);
}

function marina(vb, b) {
  const y = CURB;
  const x1 = b.x0 + BLOCK;
  const z1 = b.z0 + BLOCK;
  // Boardwalk over the whole block.
  vb.box(b.x0 + 0.15, y, b.z0 + 0.15, x1 - 0.15, y + 0.03, z1 - 0.15, 0xc99a66);
  for (let i = 1; i < 12; i++) vb.box(b.x0 + 0.15, y + 0.03, b.z0 + i * 0.32, x1 - 0.15, y + 0.032, b.z0 + i * 0.32 + 0.02, 0xa87a4a);
  const shim = new VoxelBuilderShim(vb, y + 0.03);
  palm(shim, b.x0 + 0.5, b.z0 + 0.5, 41, 1.1);
  palm(shim, b.x0 + 3.4, b.z0 + 0.6, 43, 1.0);
  palm(shim, b.x0 + 0.6, b.z0 + 3.4, 47, 1.2);
  // Seafood shack.
  vb.box(b.x0 + 1.0, y, b.z0 + 0.4, b.x0 + 2.4, y + 0.45, b.z0 + 1.3, P.white);
  vb.box(b.x0 + 0.95, y + 0.45, b.z0 + 0.35, b.x0 + 2.45, y + 0.52, b.z0 + 1.35, P.red);
  vb.panel('+z', b.z0 + 1.3, b.x0 + 1.1, y + 0.05, b.x0 + 2.3, y + 0.3, P.windowWarm, 1);
  vb.panel('+x', b.x0 + 2.4, b.z0 + 0.5, y + 0.05, b.z0 + 1.2, y + 0.3, P.windowWarm, 1);
  for (let i = 0; i < 3; i++) {
    vb.box(b.x0 + 1.2 + i * 0.4, y + 0.03, b.z0 + 1.8, b.x0 + 1.4 + i * 0.4, y + 0.13, b.z0 + 2.0, P.white);
    vb.box(b.x0 + 1.25 + i * 0.4, y + 0.13, b.z0 + 1.85, b.x0 + 1.35 + i * 0.4, y + 0.4, b.z0 + 1.95, P.white);
    vb.box(b.x0 + 1.1 + i * 0.4, y + 0.4, b.z0 + 1.75, b.x0 + 1.5 + i * 0.4, y + 0.43, b.z0 + 2.05, [P.red, P.blue, P.yellow][i]);
  }
  // Lighthouse in the corner.
  const lx = b.x0 + 3.2;
  const lz = b.z0 + 3.2;
  for (let i = 0; i < 6; i++) vb.box(lx - 0.24 + i * 0.015, y + i * 0.22, lz - 0.24 + i * 0.015, lx + 0.24 - i * 0.015, y + (i + 1) * 0.22, lz + 0.24 - i * 0.015, i % 2 ? P.red : P.white);
  vb.box(lx - 0.15, y + 1.32, lz - 0.15, lx + 0.15, y + 1.5, lz + 0.15, P.windowLit, { emit: 2 });
  vb.box(lx - 0.19, y + 1.5, lz - 0.19, lx + 0.19, y + 1.56, lz + 0.19, P.ink);
  // Docks into the bay past the beach, on both open sides.
  const deck = -0.12;
  for (let i = 0; i < 3; i++) {
    const dx = b.x0 + 0.5 + i * 1.3;
    vb.box(dx, -0.7, z1 + 1.1, dx + 0.28, deck, z1 + 4.4, 0xc99a66, { side: 0x8a6a4a });
    const dz = b.z0 + 0.5 + i * 1.3;
    vb.box(x1 + 1.1, -0.7, dz, x1 + 4.4, deck, dz + 0.28, 0xc99a66, { side: 0x8a6a4a });
  }
  car(shim, b.x0 + 2.8, b.z0 + 2.2, 77, 'x');
}

// Red suspension bridge leaving the island to the east along the middle road.
function bridge(vb, map) {
  const z = ORIGIN - 1 + 2 * STRIDE; // the middle east-west road
  const x0 = GRID - 2;
  const x1 = GRID + 6; // cut off at the diorama edge
  const deckY = 0.35;
  vb.box(x0, deckY - 0.12, z - 0.05, x1, deckY, z + 1.05, P.bridge, { side: 0xb84a30 });
  vb.box(x0, deckY, z + 0.1, x1, deckY + 0.01, z + 0.9, P.road);
  for (let x = x0; x < x1; x += 0.8) vb.box(x, deckY + 0.01, z + 0.47, x + 0.4, deckY + 0.015, z + 0.53, P.roadLine);
  // Ramp from the island road across the beach.
  vb.box(x0, BEACH, z, x0 + 1, deckY - 0.12, z + 1, P.bridge);
  // Towers.
  for (const tx of [x0 + 1.6, x0 + 6.0]) {
    vb.box(tx, -0.6, z - 0.2, tx + 0.3, 4.2, z + 0.05, P.bridge);
    vb.box(tx, -0.6, z + 0.95, tx + 0.3, 4.2, z + 1.2, P.bridge);
    for (const y of [1.5, 2.8, 4.0]) vb.box(tx, y, z - 0.2, tx + 0.3, y + 0.25, z + 1.2, P.bridge);
    vb.box(tx + 0.1, 4.2, z - 0.15, tx + 0.2, 4.35, z, P.red, { emit: 3 });
  }
  // Main cables, stepped catenary.
  const towers = [x0 + 1.75, x0 + 6.15];
  for (const side of [z - 0.08, z + 1.08]) {
    for (let x = x0; x < x1; x += 0.25) {
      let y;
      if (x < towers[0]) y = deckY + ((x - x0) / (towers[0] - x0)) * (4.1 - deckY) * ((x - x0) / (towers[0] - x0));
      else if (x < towers[1]) {
        const t = (x - towers[0]) / (towers[1] - towers[0]);
        y = deckY + 0.4 + (4.1 - deckY - 0.4) * (2 * t - 1) ** 2;
      } else y = 4.1 - (x - towers[1]) * 0.25;
      if (y < deckY) continue;
      vb.box(x, y, side - 0.03, x + 0.25, y + 0.06, side + 0.03, P.bridge);
      if (Math.round(x * 4) % 4 === 0) vb.box(x + 0.1, deckY, side - 0.01, x + 0.12, y, side + 0.01, 0xb84a30);
    }
  }
}

// Lets the shared prop helpers (which build at y=0) draw at an offset height.
class VoxelBuilderShim {
  constructor(vb, dy) {
    this.vb = vb;
    this.dy = dy;
  }
  box(x0, y0, z0, x1, y1, z1, c, o) {
    return this.vb.box(x0, y0 + this.dy, z0, x1, y1 + this.dy, z1, c, o);
  }
  panel(face, plane, u0, v0, u1, v1, c, e) {
    return this.vb.panel(face, plane, u0, v0 + this.dy, u1, v1 + this.dy, c, e);
  }
}

export { VoxelBuilderShim };
