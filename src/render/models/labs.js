// Frontier lab headquarters: one landmark per lab block (about 3.6 x 3.6).
// Six silhouettes, tinted by each lab's colors.

import * as THREE from 'three';
import { P } from '../palette.js';
import { result, tree, palm, car, person, antenna, acUnit, cylinder, blob, rnd } from './common.js';

function hex(c) {
  return new THREE.Color(c).getHex();
}

// A low monument wall at the front of the plaza carries the lab's name at a
// size you can read from orbit.
function monument(vb, lab) {
  vb.box(-1.55, 0, 1.62, 1.55, 0.42, 1.74, P.ink);
  vb.box(-1.6, 0.42, 1.6, 1.6, 0.46, 1.76, new THREE.Color(lab.color).getHex());
  return { text: lab.short, face: '+z', x: 0, y: 0.21, z: 1.74, fg: lab.color, bg: '#22232b', w: 3.0 };
}

function plaza(vb, seed) {
  vb.box(-1.82, -0.02, -1.82, 1.82, 0, 1.82, P.plaza);
  // Paving pattern.
  for (let i = -3; i <= 3; i++) vb.box(i * 0.5 - 0.02, 0, -1.8, i * 0.5 + 0.02, 0.005, 1.8, 0xd8ccb8);
  palm(vb, 1.55, 1.55, seed);
  palm(vb, -1.55, 1.55, seed + 1);
  palm(vb, 1.55, -1.55, seed + 2);
  for (let i = 0; i < 4; i++) person(vb, 1.2 - i * 0.3, 1.35 + (i % 2) * 0.1, seed + 10 + i);
  car(vb, -1.3, 1.2, seed + 3, 'x');
  car(vb, -0.85, 1.2, seed + 4, 'x');
}

// 0: the sleek monolith. Very minimal. Very closed.
function monolith(vb, lab, seed) {
  plaza(vb, seed);
  const c = hex(lab.color);
  const h = 3.4;
  vb.box(-0.95, 0, -0.95, 0.95, h, 0.95, P.white);
  vb.box(-0.97, h * 0.62, -0.97, 0.97, h * 0.72, 0.97, P.black);
  vb.windows(-0.95, 0.1, -0.95, 0.95, h * 0.6, 0.95, { seed, colors: [P.windowCool, P.white], litChance: 0.75 });
  vb.box(-1.05, h, -1.05, 1.05, h + 0.06, 1.05, c);
  // The rooftop ring, implying something circular and inevitable.
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const x = Math.cos(a) * 0.62;
    const z = Math.sin(a) * 0.62;
    vb.box(x - 0.08, h + 0.06, z - 0.08, x + 0.08, h + 0.2, z + 0.08, P.black);
  }
  antenna(vb, 0, h + 0.06, 0, 0.8);
  return result(h + 1.0, {
    signs: [
      { text: lab.short, face: '+z', x: 0, y: h * 0.67, z: 0.97, fg: '#ffffff', bg: '#22232b', scale: 1.6 },
      { text: lab.short, face: '+x', x: 0.97, y: h * 0.67, z: 0, fg: '#ffffff', bg: '#22232b', scale: 1.6 },
    ],
  });
}

// 1: terraced ziggurat with gardens. Warm, earnest, slightly worried.
function ziggurat(vb, lab, seed) {
  plaza(vb, seed);
  const c = hex(lab.color);
  const a = hex(lab.accent);
  let y = 0;
  for (let i = 0; i < 5; i++) {
    const r = 1.35 - i * 0.22;
    const hh = 0.5;
    vb.box(-r, y, -r, r, y + hh, r, i % 2 ? c : 0xf0dcc0);
    vb.windows(-r, y, -r, r, y + hh, r, { seed: seed + i, floorH: 0.5, winW: 0.14, gap: 0.12, colors: [P.windowWarm] });
    // Hedges on each terrace.
    vb.box(-r, y + hh, r - 0.12, r, y + hh + 0.1, r, P.leaf);
    vb.box(r - 0.12, y + hh, -r, r, y + hh + 0.1, r, P.leaf);
    y += hh;
  }
  vb.box(-0.3, y, -0.3, 0.3, y + 0.35, 0.3, a);
  blob(vb, 0, y + 0.35, 0, 0.18, P.yellow, { emit: 2 });
  tree(vb, -1.5, -1.0, seed, 1.2);
  return result(y + 0.9, {
    signs: [
      { text: lab.short, face: '+z', x: 0, y: 0.25, z: 1.355, fg: '#22232b', bg: lab.color, scale: 1.4 },
      { text: lab.short, face: '+x', x: 1.355, y: 0.25, z: 0, fg: '#22232b', bg: lab.color, scale: 1.4 },
    ],
  });
}

// 2: glass dome campus with a research tower.
function dome(vb, lab, seed) {
  plaza(vb, seed);
  const c = hex(lab.color);
  blob(vb, -0.35, 0, -0.35, 1.1, P.glass, { emit: 1 });
  vb.box(0.55, 0, 0.55, 1.25, 2.6, 1.25, c);
  vb.windows(0.55, 0.1, 0.55, 1.25, 2.6, 1.25, { seed });
  vb.box(0.5, 2.6, 0.5, 1.3, 2.68, 1.3, P.white);
  antenna(vb, 0.9, 2.68, 0.9, 0.7);
  // Rainbow stripe, because of course.
  const stripe = [P.blue, P.red, P.yellow, P.green];
  for (let i = 0; i < 4; i++) vb.box(0.54, 2.2 + i * 0.06, 1.252, 1.26, 2.26 + i * 0.06, 1.26, stripe[i], { emit: 2 });
  return result(3.4, {
    signs: [{ text: lab.short, face: '+x', x: 1.252, y: 1.6, z: 0.9, fg: '#ffffff', bg: lab.color, scale: 1.2 }],
  });
}

// 3: the ranch. A barn full of GPUs, with llamas.
function ranch(vb, lab, seed) {
  vb.box(-1.82, -0.02, -1.82, 1.82, 0, 1.82, P.grass);
  const c = hex(lab.color);
  vb.box(-1.2, 0, -1.0, 0.9, 1.1, 0.9, c);
  for (let i = 0; i < 5; i++) vb.box(-1.25, 1.1 + i * 0.13, -1.05 + i * 0.18, 0.95, 1.23 + i * 0.13, 0.95 - i * 0.18, 0x7a3a2a);
  vb.panel('+z', 0.9, -0.5, 0, 0.2, 0.75, P.white);
  vb.panel('+z', 0.91, -0.45, 0.05, 0.15, 0.7, 0x7a3a2a);
  vb.panel('+x', 0.9, -0.7, 0.4, 0.5, 0.5, P.gpuGreen, 3);
  // Silo of weights.
  cylinder(vb, 1.25, 0, -1.0, 0.35, 1.8, P.steel);
  blob(vb, 1.25, 1.65, -1.0, 0.36, P.concrete);
  // Llamas.
  for (let i = 0; i < 3; i++) {
    const x = -1.3 + i * 0.5;
    const z = 1.2;
    const wool = [0xf3f0e8, 0xd9b48f, 0x8a6a50][i];
    vb.box(x - 0.12, 0.1, z - 0.06, x + 0.12, 0.24, z + 0.06, wool);
    vb.box(x + 0.08, 0.24, z - 0.04, x + 0.13, 0.42, z + 0.04, wool);
    vb.box(x + 0.08, 0.42, z - 0.04, x + 0.18, 0.47, z + 0.04, wool);
    for (const dx of [-0.1, 0.08]) vb.box(x + dx, 0, z - 0.04, x + dx + 0.03, 0.1, z + 0.04, wool);
  }
  // Fence.
  for (let i = 0; i < 12; i++) vb.box(-1.8 + i * 0.3, 0, 1.5, -1.77 + i * 0.3, 0.2, 1.53, P.white);
  vb.box(-1.8, 0.14, 1.5, 1.6, 0.17, 1.53, P.white);
  return result(2.3, {
    signs: [{ text: lab.short, face: '+z', x: -0.15, y: 0.95, z: 0.91, fg: '#ffffff', bg: '#7a3a2a', scale: 1.3 }],
  });
}

// 4: black tower with a giant neon X and a rocket on the roof.
function xtower(vb, lab, seed) {
  plaza(vb, seed);
  const h = 3.0;
  vb.box(-0.9, 0, -0.9, 0.9, h, 0.9, P.black);
  vb.windows(-0.9, 0.1, -0.9, 0.9, h, 0.9, { seed, litChance: 0.3, colors: [P.windowCool] });
  // Neon X on both faces.
  for (let i = 0; i < 9; i++) {
    const t = -0.6 + i * 0.15;
    vb.panel('+z', 0.9, t - 0.06, h * 0.5 + t - 0.06, t + 0.06, h * 0.5 + t + 0.06, P.white, 2);
    vb.panel('+z', 0.9, t - 0.06, h * 0.5 - t - 0.06, t + 0.06, h * 0.5 - t + 0.06, P.white, 2);
    vb.panel('+x', 0.9, t - 0.06, h * 0.5 + t - 0.06, t + 0.06, h * 0.5 + t + 0.06, P.white, 2);
    vb.panel('+x', 0.9, t - 0.06, h * 0.5 - t - 0.06, t + 0.06, h * 0.5 - t + 0.06, P.white, 2);
  }
  cylinder(vb, 0, h, 0, 0.16, 1.0, P.steel);
  cylinder(vb, 0, h + 1.0, 0, 0.1, 0.2, P.steel);
  vb.box(-0.25, h, -0.05, 0.25, h + 0.25, 0.05, P.ink);
  return result(h + 1.6, {
    signs: [{ text: lab.short, face: '+z', x: 0, y: 0.35, z: 0.905, fg: '#22232b', bg: '#ffffff', scale: 1.3 }],
  });
}

// 5: a long low building and a lattice tower. Very European.
function lattice(vb, lab, seed) {
  plaza(vb, seed);
  const c = hex(lab.color);
  vb.box(-1.6, 0, -1.2, 0.2, 0.75, -0.2, c);
  vb.windows(-1.6, 0.05, -1.2, 0.2, 0.75, -0.2, { seed, colors: [P.windowWarm] });
  vb.box(-1.65, 0.75, -1.25, 0.25, 0.85, -0.15, P.navy);
  // Lattice tower.
  const h = 3.2;
  for (let i = 0; i < 10; i++) {
    const t = i / 10;
    const r = 0.55 * (1 - t) ** 1.4 + 0.05;
    const y = h * t;
    const cx = 0.9;
    const cz = 0.6;
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      vb.box(cx + dx * r - 0.04, y, cz + dz * r - 0.04, cx + dx * r + 0.04, y + h / 10, cz + dz * r + 0.04, 0x8a6a4a);
    }
    if (i % 3 === 0) vb.box(cx - r, y, cz - r, cx + r, y + 0.05, cz + r, 0x8a6a4a);
  }
  antenna(vb, 0.9, h, 0.6, 0.4);
  return result(h + 0.6, {
    signs: [{ text: lab.short, face: '+z', x: -0.7, y: 0.4, z: -0.195, fg: '#ffffff', bg: '#2b3f8c', scale: 1.2 }],
  });
}

const STYLES = [monolith, ziggurat, dome, ranch, xtower, lattice];

export function labHQ(vb, lab, index) {
  const seed = 1000 + index * 17;
  const res = STYLES[index % STYLES.length](vb, lab, seed);
  res.signs.push(monument(vb, lab));
  return res;
}

export { rnd, acUnit };
