// The Valley: a fixed island city laid out on a tile grid. Blocks are 4x4
// tiles separated by one-tile roads. Plot blocks hold four 2x2 plots, which is
// where the player's purchases land. The layout is fixed (no seed) so the
// city is recognizable from run to run.

import { hash01 } from './rng.js';

export const GRID = 30;
export const BLOCK = 4;
export const STRIDE = 5;
export const ORIGIN = 3; // first block's min tile; roads sit at 2, 7, 12, ...

// W water, P plots, L lab HQ, K park, M marina.
// Row index is bj (z), column index is bi (x). The camera looks from +x/+z,
// so the bottom-right corner is nearest the viewer: keep it low (marina).
export const LAYOUT = [
  ['W', 'P', 'L', 'P', 'W'],
  ['P', 'P', 'P', 'L', 'P'],
  ['L', 'K', 'P', 'P', 'L'],
  ['P', 'P', 'L', 'P', 'P'],
  ['W', 'L', 'P', 'P', 'M'],
];

const N = LAYOUT.length;

function blockAt(bi, bj) {
  if (bi < 0 || bj < 0 || bi >= N || bj >= N) return 'W';
  return LAYOUT[bj][bi];
}

function isRoadLine(t) {
  return t >= ORIGIN - 1 && t <= ORIGIN - 1 + N * STRIDE && (t - (ORIGIN - 1)) % STRIDE === 0;
}

// Which block (bi, bj) a tile falls in, or null on a road line or outside.
function blockOfTile(tx, tz) {
  const fx = tx - ORIGIN;
  const fz = tz - ORIGIN;
  if (fx < 0 || fz < 0) return null;
  const bi = Math.floor(fx / STRIDE);
  const bj = Math.floor(fz / STRIDE);
  if (bi >= N || bj >= N) return null;
  if (fx % STRIDE >= BLOCK || fz % STRIDE >= BLOCK) return null;
  return [bi, bj];
}

function landTile(tx, tz) {
  const b = blockOfTile(tx, tz);
  if (b) return blockAt(b[0], b[1]) !== 'W' ? 'block' : null;
  const rx = isRoadLine(tx);
  const rz = isRoadLine(tz);
  if (!rx && !rz) return null;
  // A road tile exists when any block it borders is land.
  const xs = rx ? [(tx - ORIGIN + 1) / STRIDE - 1, (tx - ORIGIN + 1) / STRIDE] : [Math.floor((tx - ORIGIN) / STRIDE)];
  const zs = rz ? [(tz - ORIGIN + 1) / STRIDE - 1, (tz - ORIGIN + 1) / STRIDE] : [Math.floor((tz - ORIGIN) / STRIDE)];
  for (const bi of xs) for (const bj of zs) if (blockAt(bi, bj) !== 'W') return 'road';
  return null;
}

export function tileKind(map, tx, tz) {
  return map.tiles[tz * GRID + tx] ?? 'water';
}

export function generateMap() {
  const tiles = new Array(GRID * GRID).fill('water');
  for (let z = 0; z < GRID; z++) for (let x = 0; x < GRID; x++) {
    const k = landTile(x, z);
    if (k) tiles[z * GRID + x] = k;
  }
  for (let z = 0; z < GRID; z++) for (let x = 0; x < GRID; x++) {
    if (tiles[z * GRID + x] !== 'water') continue;
    let near = false;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const nz = z + dz;
      if (nx < 0 || nz < 0 || nx >= GRID || nz >= GRID) continue;
      const k = tiles[nz * GRID + nx];
      if (k === 'block' || k === 'road') near = true;
    }
    if (near) tiles[z * GRID + x] = 'beach';
  }

  const blocks = [];
  const plots = [];
  const labs = [];
  for (let bj = 0; bj < N; bj++) for (let bi = 0; bi < N; bi++) {
    const type = blockAt(bi, bj);
    const x0 = ORIGIN + bi * STRIDE;
    const z0 = ORIGIN + bj * STRIDE;
    const block = { bi, bj, type, x0, z0, cx: x0 + BLOCK / 2, cz: z0 + BLOCK / 2 };
    blocks.push(block);
    if (type === 'L') labs.push({ id: labs.length, x: block.cx, z: block.cz, bi, bj });
    if (type === 'P') {
      for (let pz = 0; pz < 2; pz++) for (let px = 0; px < 2; px++) {
        plots.push({ id: plots.length, x: x0 + 1 + 2 * px, z: z0 + 1 + 2 * pz, bi, bj });
      }
    }
  }

  // Pre-built neighborhood: about a third of the plots start as homes and shops.
  let homesProtected = 0;
  let shopsProtected = 0;
  for (const p of plots) {
    p.filler = null;
    p.protected = false;
    if (hash01(p.id, 7) < 0.36) {
      p.filler = hash01(p.id, 11) < 0.5 ? 'home' : 'shop';
      if (p.filler === 'home' && homesProtected < 3) {
        p.protected = true;
        homesProtected++;
      } else if (p.filler === 'shop' && shopsProtected < 3) {
        p.protected = true;
        shopsProtected++;
      }
    }
  }

  return {
    tiles,
    blocks,
    plots,
    labs,
    park: blocks.find((b) => b.type === 'K'),
    marina: blocks.find((b) => b.type === 'M'),
  };
}
