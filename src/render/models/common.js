// Shared voxel props and the model result shape.
//
// A model function draws into a VoxelBuilder in local coordinates (origin at
// the plot center, y=0 on the lot surface) and returns extras the city turns
// into separate objects:
//   signs:  [{ text, face, x, y, z, w?, fg, bg, scale? }]  pixel-text panels
//   smoke:  [{ x, y, z, color?, rate? }]                    particle emitters
//   top:    number                                           roof height (for bubbles)

import { hash01 } from '../../sim/rng.js';
import { P, BUILDING_COLORS, CAR_COLORS, SHIRTS, SKINS } from '../palette.js';

export function rnd(seed, k) {
  return hash01(seed, k);
}

export function choose(list, seed, k) {
  return list[Math.floor(hash01(seed, k) * list.length) % list.length];
}

export function result(top, extra = {}) {
  return { signs: [], smoke: [], top, ...extra };
}

export function buildingColor(seed, k = 1) {
  return choose(BUILDING_COLORS, seed, k);
}

// Lot surface: grass with a lighter path, or paved.
export function lot(vb, kind = 'grass', s = 0.82) {
  const color = kind === 'grass' ? P.grass : kind === 'paved' ? P.concrete : P.plaza;
  vb.box(-s, -0.02, -s, s, 0, s, color);
}

export function tree(vb, x, z, seed, scale = 1) {
  const h = 0.32 * scale;
  vb.box(x - 0.04, 0, z - 0.04, x + 0.04, h, z + 0.04, P.trunk);
  const leaf = rnd(seed, 3) < 0.5 ? P.leaf : P.leafLight;
  const r = 0.18 * scale;
  vb.box(x - r, h, z - r, x + r, h + r * 1.3, z + r, leaf);
  vb.box(x - r * 0.6, h + r * 1.3, z - r * 0.6, x + r * 0.6, h + r * 1.8, z + r * 0.6, leaf);
}

export function palm(vb, x, z, seed, scale = 1) {
  const h = 0.55 * scale;
  const lean = (rnd(seed, 5) - 0.5) * 0.08;
  for (let i = 0; i < 5; i++) {
    const y0 = (h * i) / 5;
    const off = lean * i;
    vb.box(x - 0.035 + off, y0, z - 0.035, x + 0.035 + off, y0 + h / 5, z + 0.035, i % 2 ? P.trunk : 0x9c6a3d);
  }
  const tx = x + lean * 5;
  const L = 0.22 * scale;
  vb.box(tx - L, h, z - 0.04, tx + L, h + 0.05, z + 0.04, P.palmLeaf);
  vb.box(tx - 0.04, h, z - L, tx + 0.04, h + 0.05, z + L, P.palmLeaf);
  vb.box(tx - L * 1.15, h - 0.05, z - 0.03, tx - L * 0.8, h, z + 0.03, P.palmLeaf);
  vb.box(tx + L * 0.8, h - 0.05, z - 0.03, tx + L * 1.15, h, z + 0.03, P.palmLeaf);
  vb.box(tx - 0.03, h - 0.05, z + L * 0.8, tx + 0.03, h, z + L * 1.15, P.palmLeaf);
  vb.box(tx - 0.03, h - 0.05, z - L * 1.15, tx + 0.03, h, z - L * 0.8, P.palmLeaf);
  vb.box(tx - 0.05, h - 0.06, z - 0.05, tx + 0.05, h, z + 0.05, 0x7a4a2a);
}

export function bush(vb, x, z, seed) {
  const c = rnd(seed, 9) < 0.5 ? P.leaf : P.grassDark;
  vb.box(x - 0.1, 0, z - 0.1, x + 0.1, 0.12, z + 0.1, c);
}

// A parked car along x (dir 'x') or z.
export function car(vb, x, z, seed, dir = 'x', y = 0) {
  const c = choose(CAR_COLORS, seed, 21);
  const [l, w] = [0.34, 0.17];
  const [hx, hz] = dir === 'x' ? [l / 2, w / 2] : [w / 2, l / 2];
  vb.box(x - hx, y + 0.03, z - hz, x + hx, y + 0.11, z + hz, c);
  const [cx, cz] = dir === 'x' ? [hx * 0.55, hz * 0.85] : [hx * 0.85, hz * 0.55];
  vb.box(x - cx, y + 0.11, z - cz, x + cx, y + 0.17, z + cz, P.glass, { emit: 0 });
  vb.box(x - cx * 0.9, y + 0.17, z - cz * 0.9, x + cx * 0.9, y + 0.18, z + cz * 0.9, c);
  vb.box(x - hx + 0.02, y, z - hz + 0.01, x - hx + 0.08, y + 0.04, z + hz - 0.01, P.black);
  vb.box(x + hx - 0.08, y, z - hz + 0.01, x + hx - 0.02, y + 0.04, z + hz - 0.01, P.black);
}

// A standing person (static props: protesters, staff).
export function person(vb, x, z, seed, shirt) {
  const s = shirt ?? choose(SHIRTS, seed, 31);
  const skin = choose(SKINS, seed, 32);
  vb.box(x - 0.025, 0, z - 0.02, x + 0.025, 0.07, z + 0.02, P.navy);
  vb.box(x - 0.035, 0.07, z - 0.025, x + 0.035, 0.15, z + 0.025, s);
  vb.box(x - 0.025, 0.15, z - 0.025, x + 0.025, 0.2, z + 0.025, skin);
}

export function acUnit(vb, x, y, z) {
  vb.box(x - 0.07, y, z - 0.06, x + 0.07, y + 0.08, z + 0.06, P.concrete);
  vb.box(x - 0.04, y + 0.08, z - 0.04, x + 0.04, y + 0.085, z + 0.04, P.concreteDark);
}

export function antenna(vb, x, y, z, h, blink = true) {
  vb.box(x - 0.015, y, z - 0.015, x + 0.015, y + h, z + 0.015, P.steel);
  if (blink) vb.box(x - 0.03, y + h, z - 0.03, x + 0.03, y + h + 0.05, z + 0.03, P.red, { emit: 3 });
}

export function waterTank(vb, x, y, z) {
  for (const [dx, dz] of [[-0.06, -0.06], [0.06, -0.06], [-0.06, 0.06], [0.06, 0.06]]) {
    vb.box(x + dx - 0.01, y, z + dz - 0.01, x + dx + 0.01, y + 0.1, z + dz + 0.01, P.trunk);
  }
  vb.box(x - 0.1, y + 0.1, z - 0.1, x + 0.1, y + 0.28, z + 0.1, 0xa8754a);
  vb.box(x - 0.07, y + 0.28, z - 0.07, x + 0.07, y + 0.33, z + 0.07, 0x8a5a33);
}

// Striped awning along a face.
export function awning(vb, face, x0, x1, y, depth, colors) {
  const n = Math.max(2, Math.round((x1 - x0) / 0.1));
  const w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const c = colors[i % colors.length];
    const a = x0 + i * w;
    if (face === '+z') vb.box(a, y, depth.plane, a + w, y + 0.05, depth.plane + depth.d, c);
    else vb.box(depth.plane, y, a, depth.plane + depth.d, y + 0.05, a + w, c);
  }
}

export function fence(vb, x0, z0, x1, z1, color = P.steel) {
  const h = 0.1;
  if (Math.abs(x1 - x0) > Math.abs(z1 - z0)) {
    vb.box(x0, h - 0.015, z0 - 0.008, x1, h, z0 + 0.008, color);
    for (let x = x0; x <= x1 + 1e-6; x += 0.16) vb.box(x - 0.008, 0, z0 - 0.008, x + 0.008, h, z0 + 0.008, color);
  } else {
    vb.box(x0 - 0.008, h - 0.015, z0, x0 + 0.008, h, z1, color);
    for (let z = z0; z <= z1 + 1e-6; z += 0.16) vb.box(x0 - 0.008, 0, z - 0.008, x0 + 0.008, h, z + 0.008, color);
  }
}

// A rooftop LED strip of blinking lights along x.
export function ledStrip(vb, x0, x1, y, z, color = P.gpuGreen) {
  vb.box(x0, y, z - 0.01, x1, y + 0.03, z + 0.01, color, { emit: 3 });
}

// Stepped "round" form: a column of boxes approximating a cylinder.
export function cylinder(vb, x, y0, z, r, h, color, opts = {}) {
  vb.box(x - r, y0, z - r * 0.55, x + r, y0 + h, z + r * 0.55, color, opts);
  vb.box(x - r * 0.55, y0, z - r, x + r * 0.55, y0 + h, z + r, color, opts);
  vb.box(x - r * 0.85, y0, z - r * 0.85, x + r * 0.85, y0 + h, z + r * 0.85, color, opts);
}

// A voxel sphere-ish blob from stacked cylinders.
export function blob(vb, x, y0, z, r, color, opts = {}) {
  const layers = 6;
  for (let i = 0; i < layers; i++) {
    const t = (i + 0.5) / layers;
    const rr = r * Math.sqrt(1 - (2 * t - 1) ** 2);
    cylinder(vb, x, y0 + (2 * r * i) / layers, z, Math.max(0.02, rr), (2 * r) / layers, color, opts);
  }
}
