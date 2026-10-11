// Models for every building the player can buy. Each takes (vb, seed, level)
// and draws within the 2x2 plot (about -0.82..0.82). Higher levels (built
// upward once land runs out) add height.

import { P } from '../palette.js';
import {
  rnd, choose, result, buildingColor, lot, tree, palm, bush, car, person, acUnit, antenna, waterTank, fence,
  ledStrip, cylinder, blob, awning,
} from './common.js';

const lv = (level, per) => 1 + (Math.max(1, level) - 1) * per;

// ── COMPUTE ────────────────────────────────────────────────

function basement(vb, seed, level) {
  lot(vb, 'grass');
  const wall = buildingColor(seed, 1);
  const h = 0.4 * lv(level, 0.4);
  vb.box(-0.5, 0, -0.45, 0.4, h, 0.4, wall);
  for (let i = 0; i < 3; i++) vb.box(-0.54, h + i * 0.06, -0.49 + i * 0.1, 0.44, h + (i + 1) * 0.06, 0.44 - i * 0.1, P.roofBlue);
  vb.windows(-0.5, 0.1, -0.45, 0.4, h, 0.4, { seed, floorH: 0.3, gap: 0.24 });
  // RGB basement windows, the source of all compute.
  const rgb = [P.neonPink, P.neonCyan, P.neonGreen];
  for (let i = 0; i < 3; i++) {
    vb.panel('+z', 0.4, -0.42 + i * 0.28, 0.01, -0.24 + i * 0.28, 0.07, rgb[i], 2);
    vb.panel('+x', 0.4, -0.36 + i * 0.25, 0.01, -0.2 + i * 0.25, 0.07, rgb[(i + 1) % 3], 2);
  }
  // Satellite dish and a sad lawn chair.
  vb.box(0.2, h + 0.12, -0.3, 0.32, h + 0.24, -0.29, P.white);
  vb.box(0.25, h, -0.31, 0.27, h + 0.14, -0.29, P.steel);
  vb.box(0.55, 0, 0.5, 0.7, 0.06, 0.62, P.cyan);
  bush(vb, -0.65, 0.6, seed);
  return result(h + 0.4, { smoke: [{ x: 0.1, y: h + 0.1, z: -0.2, color: 0x9aa4b5, rate: 0.15 }] });
}

function rack(vb, seed, level) {
  lot(vb, 'paved');
  const rows = 2 + Math.min(3, level - 1);
  // Tarp roof on poles.
  for (const [x, z] of [[-0.7, -0.6], [0.7, -0.6], [-0.7, 0.6], [0.7, 0.6]]) vb.box(x - 0.02, 0, z - 0.02, x + 0.02, 0.62, z + 0.02, P.steel);
  vb.box(-0.76, 0.62, -0.66, 0.76, 0.66, 0.66, P.blue);
  for (let r = 0; r < rows; r++) {
    const z = -0.45 + (r * 0.9) / Math.max(1, rows - 1);
    vb.box(-0.55, 0, z - 0.09, 0.55, 0.5, z + 0.09, P.black);
    for (let i = 0; i < 6; i++) {
      const x = -0.5 + i * 0.18;
      ledStrip(vb, x, x + 0.12, 0.08 + (i % 3) * 0.13, z + 0.095, i % 2 ? P.gpuGreen : P.neonCyan);
    }
  }
  // Box fan pointed at the problem.
  vb.box(0.58, 0, 0.66, 0.78, 0.22, 0.72, P.white);
  vb.box(0.61, 0.03, 0.72, 0.75, 0.19, 0.73, P.concreteDark);
  person(vb, -0.75, 0.75, seed, P.gpuGreen);
  return result(0.9);
}

function mine(vb, seed, level) {
  lot(vb, 'paved');
  const h = 0.55 * lv(level, 0.35);
  vb.box(-0.72, 0, -0.6, 0.72, h, 0.6, P.steel);
  // Corrugation stripes.
  for (let i = 0; i < 10; i++) {
    const x = -0.7 + i * 0.15;
    vb.panel('+z', 0.6, x, 0, x + 0.05, h, P.concreteDark);
  }
  // Curved-ish roof.
  vb.box(-0.76, h, -0.5, 0.76, h + 0.08, 0.5, P.concrete);
  vb.box(-0.76, h + 0.08, -0.3, 0.76, h + 0.14, 0.3, P.concrete);
  // Wall of exhaust fans.
  for (let i = 0; i < 3; i++) {
    const z = -0.4 + i * 0.4;
    vb.box(0.72, 0.12, z - 0.12, 0.76, 0.36, z + 0.12, P.ink);
    vb.box(0.76, 0.22, z - 0.1, 0.77, 0.26, z + 0.1, P.concrete);
  }
  vb.box(-0.3, h + 0.14, 0.1, 0.4, h + 0.42, 0.14, P.black);
  return result(h + 0.6, {
    signs: [{ text: 'AI MINE', face: '+z', x: 0.05, y: h + 0.28, z: 0.145, fg: '#7dff4f', bg: '#22232b' }],
    smoke: [{ x: 0.75, y: 0.3, z: 0, color: 0xdddddd, rate: 0.25 }],
  });
}

function datacenter(vb, seed, level) {
  lot(vb, 'paved');
  const h = 0.62 * lv(level, 0.4);
  const s = 0.74;
  vb.box(-s, 0, -s, s, h, s, 0xd8dce6);
  vb.box(-s, 0, -s, s, 0.08, s, P.concreteDark);
  // No windows. Just a stripe of blinking.
  vb.panel('+z', s, -s + 0.05, h - 0.12, s - 0.05, h - 0.08, P.cyan, 3);
  vb.panel('+x', s, -s + 0.05, h - 0.12, s - 0.05, h - 0.08, P.cyan, 3);
  vb.panel('+z', s, -0.12, 0.08, 0.12, 0.3, P.steel);
  // Rooftop chillers in a grid.
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const x = -0.45 + i * 0.45;
    const z = -0.45 + j * 0.45;
    vb.box(x - 0.15, h, z - 0.15, x + 0.15, h + 0.12, z + 0.15, P.concrete);
    vb.box(x - 0.1, h + 0.12, z - 0.1, x + 0.1, h + 0.125, z + 0.1, P.ink);
  }
  fence(vb, -0.82, 0.82, 0.82, 0.82);
  fence(vb, 0.82, -0.82, 0.82, 0.82);
  return result(h + 0.4, {
    signs: [{ text: 'DATA', face: '+x', x: s, y: h * 0.55, z: 0, fg: '#22232b', bg: '#d8dce6' }],
    smoke: [{ x: 0, y: h + 0.15, z: 0, color: 0xffffff, rate: 0.3 }],
  });
}

function campus(vb, seed, level) {
  lot(vb, 'paved');
  const h = 0.9 * lv(level, 0.35);
  vb.box(-0.78, 0, -0.78, 0.25, h, 0.78, 0xc9cfdc);
  vb.panel('+z', 0.78, -0.75, 0.1, 0.22, h - 0.1, 0x9aa8c4);
  for (let i = 0; i < 6; i++) ledStrip(vb, -0.75, 0.22, 0.12 + i * (h - 0.2) / 6, 0.785, i % 2 ? P.gpuGreen : P.cyan);
  vb.box(-0.78, h, -0.78, 0.25, h + 0.05, 0.78, P.concreteDark);
  // Two cooling towers.
  cylinder(vb, 0.52, 0, -0.42, 0.22, 0.75 * lv(level, 0.3), 0xe4e6ec);
  cylinder(vb, 0.52, 0, 0.42, 0.22, 0.75 * lv(level, 0.3), 0xe4e6ec);
  cylinder(vb, 0.52, 0.75 * lv(level, 0.3), -0.42, 0.18, 0.05, P.concrete);
  cylinder(vb, 0.52, 0.75 * lv(level, 0.3), 0.42, 0.18, 0.05, P.concrete);
  for (let i = 0; i < 4; i++) acUnit(vb, -0.6 + i * 0.25, h + 0.05, -0.4);
  return result(h + 0.5, {
    signs: [{ text: 'HYPERSCALE', face: '+x', x: 0.25, y: h - 0.15, z: 0, fg: '#ffffff', bg: '#3f7ff2' }],
    smoke: [
      { x: 0.52, y: 0.8 * lv(level, 0.3), z: -0.42, color: 0xffffff, rate: 0.6 },
      { x: 0.52, y: 0.8 * lv(level, 0.3), z: 0.42, color: 0xffffff, rate: 0.6 },
    ],
  });
}

function reactor(vb, seed, level) {
  lot(vb, 'paved');
  const th = 1.3 * lv(level, 0.25);
  // Hyperboloid cooling tower: wide, pinched, flared.
  const layers = 9;
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const r = 0.42 - 0.17 * Math.sin(t * Math.PI * 0.85);
    cylinder(vb, -0.3, (th * i) / layers, -0.25, r, th / layers + 0.001, i % 4 === 3 ? 0xd9d9df : 0xeeeef2);
  }
  // Containment dome.
  blob(vb, 0.45, 0, 0.4, 0.3, 0xdcdfe8);
  vb.box(0.15, 0, 0.1, 0.75, 0.12, 0.7, P.concreteDark);
  // Warning stripes.
  for (let i = 0; i < 6; i++) {
    vb.box(-0.8 + i * 0.27, 0, 0.74, -0.68 + i * 0.27, 0.06, 0.8, i % 2 ? P.yellow : P.black);
  }
  return result(th + 0.4, {
    signs: [{ text: 'NUCLEAR', face: '+x', x: 0.76, y: 0.22, z: 0.4, fg: '#ffd23f', bg: '#22232b' }],
    smoke: [{ x: -0.3, y: th, z: -0.25, color: 0xffffff, rate: 1.2, big: true }],
  });
}

function fab(vb, seed, level) {
  lot(vb, 'paved');
  const h = 0.7 * lv(level, 0.35);
  vb.box(-0.78, 0, -0.7, 0.78, h, 0.7, P.white);
  vb.panel('+z', 0.7, -0.78, h * 0.45, 0.78, h * 0.55, P.blue);
  vb.panel('+x', 0.78, -0.7, h * 0.45, 0.7, h * 0.55, P.blue);
  vb.windows(-0.78, h * 0.6, -0.7, 0.78, h, 0.7, { seed, floorH: 0.2, winW: 0.2, winH: 0.08, colors: [P.windowCool] });
  // Chimneys and pipes.
  for (let i = 0; i < 3; i++) {
    const x = -0.5 + i * 0.4;
    vb.box(x - 0.06, h, -0.5, x + 0.06, h + 0.55, -0.38, i % 2 ? P.red : P.white);
    vb.box(x - 0.07, h + 0.45, -0.51, x + 0.07, h + 0.5, -0.37, P.red);
  }
  vb.box(-0.78, h + 0.05, 0.2, 0.78, h + 0.1, 0.26, P.steel);
  vb.box(-0.78, h + 0.05, 0.4, 0.78, h + 0.1, 0.46, P.yellow);
  return result(h + 0.7, {
    signs: [{ text: 'T.S.M.C.', face: '+z', x: 0, y: h * 0.25, z: 0.7, fg: '#3f7ff2', bg: '#ffffff' }],
    smoke: [
      { x: -0.5, y: h + 0.55, z: -0.44, color: 0xe8f4ff, rate: 0.4 },
      { x: 0.3, y: h + 0.55, z: -0.44, color: 0xe8f4ff, rate: 0.4 },
    ],
  });
}

function orbital(vb, seed, level) {
  lot(vb, 'paved');
  vb.box(-0.6, 0, -0.6, 0.6, 0.06, 0.6, P.concreteDark);
  for (let i = 0; i < 4; i++) vb.box(-0.6, 0.06, -0.6 + i * 0.4, 0.6, 0.065, -0.55 + i * 0.4, P.yellow);
  // Rocket.
  const rh = 1.4 * lv(level, 0.2);
  cylinder(vb, 0, 0.06, 0, 0.14, rh, P.white);
  cylinder(vb, 0, 0.06 + rh, 0, 0.1, 0.12, P.white);
  cylinder(vb, 0, 0.18 + rh, 0, 0.05, 0.12, P.red);
  vb.box(-0.025, 0.3 + rh, -0.025, 0.025, 0.36 + rh, 0.025, P.red);
  vb.box(-0.24, 0.06, -0.04, 0.24, 0.3, 0.04, P.red);
  vb.box(-0.04, 0.06, -0.24, 0.04, 0.3, 0.24, P.red);
  vb.panel('+z', 0.14 * 0.55, -0.08, rh * 0.5, 0.08, rh * 0.5 + 0.3, P.ink);
  // Gantry.
  vb.box(-0.55, 0.06, -0.15, -0.4, rh + 0.1, 0.0, P.red);
  for (let i = 1; i < 6; i++) vb.box(-0.4, (rh * i) / 6, -0.1, -0.14, (rh * i) / 6 + 0.04, -0.06, P.steel);
  // Dish.
  vb.box(0.4, 0, 0.4, 0.46, 0.25, 0.46, P.steel);
  vb.box(0.3, 0.25, 0.32, 0.56, 0.32, 0.6, P.white);
  return result(rh + 0.6, {
    signs: [{ text: 'TO ORBIT', face: '+x', x: 0.6, y: 0.18, z: -0.3, fg: '#ffffff', bg: '#f2504b' }],
    smoke: [{ x: 0, y: 0.05, z: 0, color: 0xffd28a, rate: 0.3 }],
  });
}

function dyson(vb, seed, level) {
  lot(vb, 'paved');
  const h = 2.2 * lv(level, 0.15);
  vb.box(-0.5, 0, -0.5, 0.5, 0.3, 0.5, P.ink);
  vb.box(-0.12, 0.3, -0.12, 0.12, h, 0.12, P.black);
  for (let i = 0; i < 5; i++) {
    const y = 0.5 + (i * (h - 0.6)) / 5;
    const r = 0.35 - i * 0.04;
    vb.box(-r, y, -r, r, y + 0.04, -r + 0.05, P.neonCyan, { emit: 2 });
    vb.box(-r, y, r - 0.05, r, y + 0.04, r, P.neonCyan, { emit: 2 });
    vb.box(-r, y, -r, -r + 0.05, y + 0.04, r, P.neonCyan, { emit: 2 });
    vb.box(r - 0.05, y, -r, r, y + 0.04, r, P.neonCyan, { emit: 2 });
  }
  // The beam. It goes up. Nobody asks where.
  vb.box(-0.04, h, -0.04, 0.04, h + 6, 0.04, 0xfff6b0, { emit: 2 });
  return result(h + 0.5, {
    signs: [{ text: 'SUN API', face: '+z', x: 0, y: 0.15, z: 0.5, fg: '#4ff6ff', bg: '#22232b' }],
  });
}

// ── SAFETY ─────────────────────────────────────────────────

function intern(vb, seed) {
  lot(vb, 'grass');
  // A folding table under an umbrella. That's the whole department.
  vb.box(-0.25, 0.18, -0.15, 0.25, 0.21, 0.15, P.white);
  for (const [x, z] of [[-0.22, -0.12], [0.22, -0.12], [-0.22, 0.12], [0.22, 0.12]]) vb.box(x - 0.01, 0, z - 0.01, x + 0.01, 0.18, z + 0.01, P.steel);
  vb.box(-0.02, 0, -0.02, 0.02, 0.6, 0.02, P.white);
  for (let i = 0; i < 3; i++) {
    const r = 0.42 - i * 0.12;
    vb.box(-r, 0.55 + i * 0.04, -r, r, 0.59 + i * 0.04, r, i % 2 ? P.white : P.red);
  }
  person(vb, 0, -0.3, seed, P.yellow);
  vb.box(-0.1, 0.21, -0.05, 0.08, 0.28, 0.02, P.ink); // laptop
  vb.box(0.05, 0.21, 0.05, 0.11, 0.26, 0.11, P.red); // coffee
  tree(vb, -0.6, 0.6, seed, 0.9);
  bush(vb, 0.62, -0.6, seed);
  return result(0.8, {
    signs: [{ text: 'ALIGN?', face: '+z', x: 0, y: 0.1, z: 0.16, fg: '#22232b', bg: '#ffd23f' }],
  });
}

function redteam(vb, seed, level) {
  lot(vb, 'paved');
  const h = 0.48 * lv(level, 0.4);
  vb.box(-0.65, 0, -0.6, 0.55, h, 0.5, 0x8a8f9e);
  vb.box(-0.7, h, -0.65, 0.6, h + 0.05, 0.55, P.ink);
  vb.panel('+z', 0.5, -0.45, 0, 0.25, 0.34, P.red);
  for (let i = 0; i < 4; i++) vb.panel('+z', 0.5, -0.45, 0.06 + i * 0.08, 0.25, 0.065 + i * 0.08, P.redDark);
  // Hoodies on the curb, plus pizza boxes.
  for (let i = 0; i < 3; i++) person(vb, 0.66, -0.3 + i * 0.22, seed + i, P.ink);
  for (let i = 0; i < 4; i++) vb.box(-0.62, i * 0.03, 0.6, -0.42, i * 0.03 + 0.025, 0.78, i % 2 ? 0xf0e0c0 : 0xe6d2a8);
  acUnit(vb, -0.3, h + 0.05, -0.3);
  return result(h + 0.4, {
    signs: [{ text: 'RED TEAM', face: '+z', x: -0.1, y: h - 0.08, z: 0.5, fg: '#ffffff', bg: '#f2504b' }],
  });
}

function evals(vb, seed, level) {
  lot(vb, 'plaza');
  const h = 0.75 * lv(level, 0.35);
  vb.box(-0.62, 0, -0.62, 0.45, h, 0.45, P.white);
  vb.windows(-0.62, 0.05, -0.62, 0.45, h, 0.45, { seed, colors: [P.windowCool] });
  // Checkered rooftop.
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
    const x = -0.6 + i * 0.175;
    const z = -0.6 + j * 0.175;
    vb.box(x, h, z, x + 0.175, h + 0.02, z + 0.175, (i + j) % 2 ? P.black : P.white);
  }
  // Test tubes.
  const tubes = [P.lime, P.magenta, P.cyan];
  for (let i = 0; i < 3; i++) {
    const x = 0.62;
    const z = -0.4 + i * 0.35;
    vb.box(x - 0.07, 0, z - 0.07, x + 0.07, 0.42, z + 0.07, P.glass);
    vb.box(x - 0.06, 0, z - 0.06, x + 0.06, 0.15 + i * 0.08, z + 0.06, tubes[i], { emit: 2 });
  }
  return result(h + 0.4, {
    signs: [{ text: 'EVALS', face: '+z', x: -0.08, y: h - 0.1, z: 0.45, fg: '#22232b', bg: '#a6e34f' }],
  });
}

function interp(vb, seed, level) {
  lot(vb, 'plaza');
  const h = 0.8 * lv(level, 0.35);
  vb.box(-0.6, 0, -0.6, 0.6, h, 0.6, 0x7fa7ff);
  vb.windows(-0.6, 0.05, -0.6, 0.6, h, 0.6, { seed });
  vb.box(-0.64, h, -0.64, 0.64, h + 0.05, 0.64, P.navy);
  // Giant magnifying glass on the roof, examining nothing in particular.
  const cx = 0;
  const cy = h + 0.55;
  const r = 0.35;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    vb.box(x - 0.05, y - 0.05, -0.04, x + 0.05, y + 0.05, 0.04, P.ink);
  }
  vb.box(-0.27, cy - 0.27, -0.01, 0.27, cy + 0.27, 0.01, P.cyan, { emit: 1 });
  vb.box(0.22, h, -0.03, 0.3, cy - 0.3, 0.03, P.brown);
  // Pink neon brain.
  blob(vb, -0.35, h + 0.05, 0.35, 0.14, P.neonPink, { emit: 2 });
  return result(h + 1.0, {
    signs: [{ text: 'INTERP', face: '+x', x: 0.6, y: h - 0.12, z: 0, fg: '#ffffff', bg: '#2b3f8c' }],
  });
}

function rlhf(vb, seed, level) {
  lot(vb, 'grass');
  // Greenhouse rows.
  const rows = 3;
  for (let r = 0; r < rows; r++) {
    const z = -0.6 + r * 0.42;
    vb.box(-0.75, 0, z, 0.3, 0.22, z + 0.32, P.glass, { emit: 0 });
    vb.box(-0.75, 0.22, z + 0.06, 0.3, 0.28, z + 0.26, 0xbfe9ff);
    for (let i = 0; i < 6; i++) vb.box(-0.7 + i * 0.17, 0, z + 0.08, -0.62 + i * 0.17, 0.12, z + 0.24, P.lime);
  }
  // Thumbs up. Large. Sincere.
  const x = 0.55;
  const z = 0;
  const s = 1 + (Math.max(1, level) - 1) * 0.25;
  vb.box(x - 0.04, 0, z - 0.04, x + 0.04, 0.4 * s, z + 0.04, P.steel);
  vb.box(x - 0.18, 0.4 * s, z - 0.1, x + 0.12, 0.62 * s, z + 0.1, P.yellow);
  vb.box(x - 0.08, 0.62 * s, z - 0.08, x + 0.04, 0.92 * s, z + 0.06, P.yellow);
  vb.box(x + 0.12, 0.44 * s, z - 0.06, x + 0.16, 0.6 * s, z + 0.06, 0xf0c030);
  return result(0.95 * s + 0.2, {
    signs: [{ text: 'RLHF', face: '+z', x: -0.22, y: 0.42, z: 0.26, fg: '#22232b', bg: '#ffd23f' }],
  });
}

function thinktank(vb, seed, level) {
  lot(vb, 'plaza');
  const h = 0.6 * lv(level, 0.4);
  vb.box(-0.62, 0, -0.62, 0.62, 0.08, 0.62, P.offwhite);
  vb.box(-0.55, 0.08, -0.55, 0.35, h, 0.35, P.offwhite);
  // Columns on the two front faces.
  for (let i = 0; i < 5; i++) {
    const t = -0.5 + i * 0.22;
    vb.box(t - 0.03, 0.08, 0.45, t + 0.03, h, 0.51, P.white);
    vb.box(0.45, 0.08, t - 0.03, 0.51, h, t + 0.03, P.white);
  }
  vb.box(-0.6, h, -0.6, 0.56, h + 0.07, 0.56, P.white);
  for (let i = 0; i < 3; i++) vb.box(-0.6 + i * 0.12, h + 0.07 + i * 0.06, -0.6, 0.56 - i * 0.12, h + 0.13 + i * 0.06, 0.56, P.offwhite);
  // Stacks of unread PDFs.
  for (let i = 0; i < 3; i++) vb.box(-0.75, 0, -0.75 + i * 0.15, -0.65, 0.1 + i * 0.07, -0.65 + i * 0.15, P.white);
  return result(h + 0.5, {
    signs: [{ text: 'THINK', face: '+z', x: -0.1, y: h - 0.05, z: 0.52, fg: '#2b3f8c', bg: '#f3f0e8' }],
  });
}

function monastery(vb, seed, level) {
  lot(vb, 'grass');
  const tiers = 3 + Math.min(3, Math.max(1, level) - 1);
  let y = 0;
  for (let i = 0; i < tiers; i++) {
    const r = 0.55 - i * 0.08;
    const hh = 0.24;
    vb.box(-r, y, -r, r, y + hh, r, i % 2 ? 0xc63a36 : P.red);
    vb.windows(-r, y, -r, r, y + hh, r, { seed: seed + i, floorH: 0.24, winW: 0.1, gap: 0.12, colors: [P.windowWarm] });
    vb.box(-r - 0.1, y + hh, -r - 0.1, r + 0.1, y + hh + 0.05, r + 0.1, P.ink);
    vb.box(-r - 0.13, y + hh, -r - 0.13, -r - 0.06, y + hh + 0.09, -r - 0.06, P.yellow);
    vb.box(r + 0.06, y + hh, r + 0.06, r + 0.13, y + hh + 0.09, r + 0.13, P.yellow);
    y += hh + 0.05;
  }
  vb.box(-0.02, y, -0.02, 0.02, y + 0.3, 0.02, P.yellow);
  tree(vb, 0.7, -0.6, seed, 0.9);
  tree(vb, -0.65, 0.65, seed + 1, 0.9);
  return result(y + 0.5);
}

function moonbase(vb, seed, level) {
  lot(vb, 'paved');
  vb.box(-0.8, 0, -0.8, 0.8, 0.04, 0.8, 0xc9c9d6);
  blob(vb, -0.15, 0, -0.15, 0.55 * lv(level, 0.15), 0xf0f0f6);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    vb.box(-0.15 + Math.cos(a) * 0.5 - 0.03, 0.15, -0.15 + Math.sin(a) * 0.5 - 0.03, -0.15 + Math.cos(a) * 0.5 + 0.03, 0.21, -0.15 + Math.sin(a) * 0.5 + 0.03, P.cyan, { emit: 2 });
  }
  antenna(vb, 0.55, 0.04, -0.55, 0.9);
  // Landing pad.
  vb.box(0.3, 0.04, 0.3, 0.78, 0.06, 0.78, P.ink);
  vb.box(0.5, 0.06, 0.38, 0.56, 0.065, 0.7, P.yellow);
  vb.box(0.42, 0.06, 0.5, 0.66, 0.065, 0.56, P.yellow);
  return result(1.4, {
    signs: [{ text: 'SUPERALIGN', face: '+z', x: -0.15, y: 0.12, z: 0.4, fg: '#3f7ff2', bg: '#ffffff' }],
  });
}

// ── HYPE ───────────────────────────────────────────────────

function billboard(vb, seed, level) {
  lot(vb, 'grass');
  const h = 0.7 * lv(level, 0.3);
  vb.box(-0.42, 0, -0.04, -0.36, h, 0.04, P.steel);
  vb.box(0.36, 0, -0.04, 0.42, h, 0.04, P.steel);
  vb.box(-0.7, h, -0.06, 0.7, h + 0.5, 0.0, P.ink);
  vb.box(-0.6, h - 0.04, 0.0, 0.6, h - 0.02, 0.12, P.steel);
  for (let i = 0; i < 3; i++) vb.box(-0.45 + i * 0.45, h - 0.08, 0.1, -0.41 + i * 0.45, h - 0.02, 0.14, P.yellow, { emit: 2 });
  bush(vb, -0.6, 0.5, seed);
  bush(vb, 0.6, 0.55, seed + 1);
  return result(h + 0.7, {
    signs: [{ text: '@billboard', face: '+z', x: 0, y: h + 0.25, z: 0.005, w: 1.36, fg: '#22232b', bg: '#ffffff', scale: 1.6, slot: 'billboard' }],
  });
}

function podcast(vb, seed, level) {
  lot(vb, 'plaza');
  const h = 0.5 * lv(level, 0.4);
  vb.box(-0.6, 0, -0.6, 0.5, h, 0.5, P.ink);
  vb.panel('+z', 0.5, -0.5, 0.05, 0.4, h - 0.1, 0x3a2f5a);
  vb.panel('+z', 0.5, -0.45, 0.1, -0.1, h - 0.15, P.neonPink, 1);
  // Giant microphone.
  vb.box(-0.05, h, -0.05, 0.05, h + 0.35, 0.05, P.steel);
  blob(vb, 0, h + 0.33, 0, 0.14, P.concrete);
  vb.box(-0.16, h + 0.3, -0.03, 0.16, h + 0.34, 0.03, P.steel);
  person(vb, 0.66, 0.2, seed);
  person(vb, 0.66, -0.1, seed + 3);
  return result(h + 0.8, {
    signs: [{ text: 'ON AIR', face: '+x', x: 0.5, y: h - 0.12, z: 0, fg: '#ffffff', bg: '#f2504b' }],
  });
}

function hackathon(vb, seed, level) {
  lot(vb, 'paved');
  const h = 0.55 * lv(level, 0.4);
  vb.box(-0.72, 0, -0.65, 0.6, h, 0.55, 0xb36b4a);
  // Brick lines.
  for (let i = 1; i < 5; i++) vb.panel('+z', 0.55, -0.72, (h * i) / 5, 0.6, (h * i) / 5 + 0.015, 0x8e5038);
  vb.box(-0.76, h, -0.69, 0.64, h + 0.05, 0.59, P.ink);
  // String lights.
  const bulbs = [P.yellow, P.neonPink, P.neonCyan, P.neonGreen];
  for (let i = 0; i < 10; i++) {
    const x = -0.7 + i * 0.14;
    const sag = Math.sin((i / 9) * Math.PI) * 0.06;
    vb.box(x - 0.02, h - 0.02 - sag, 0.62, x + 0.02, h + 0.02 - sag, 0.66, bulbs[i % 4], { emit: 2 });
  }
  vb.panel('+z', 0.55, -0.6, 0.02, 0.48, 0.3, P.windowWarm, 1);
  // Food truck.
  vb.box(0.45, 0, 0.62, 0.8, 0.26, 0.8, P.yellow);
  vb.box(0.45, 0.26, 0.64, 0.8, 0.29, 0.78, P.white);
  vb.panel('+z', 0.8, 0.5, 0.1, 0.72, 0.2, P.ink);
  return result(h + 0.4, {
    signs: [{ text: 'HACK', face: '+x', x: 0.6, y: h - 0.14, z: -0.05, fg: '#7dff4f', bg: '#22232b' }],
  });
}

function influencer(vb, seed, level) {
  lot(vb, 'grass');
  const h = 0.55 * lv(level, 0.4);
  const wall = choose([P.pink, 0xffe9a8, 0xa0e7e5, 0xffffff], seed, 1);
  vb.box(-0.7, 0, -0.7, 0.2, h, 0.2, wall);
  vb.box(-0.7, h, -0.7, -0.1, h + 0.3, -0.1, wall);
  vb.windows(-0.7, 0.05, -0.7, 0.2, h, 0.2, { seed, colors: [P.windowWarm, P.neonPink] });
  // Pool with a flamingo.
  vb.box(0.25, -0.01, 0.15, 0.78, 0.02, 0.78, P.white);
  vb.box(0.3, 0.0, 0.2, 0.73, 0.025, 0.73, P.cyan);
  vb.box(0.5, 0.025, 0.45, 0.6, 0.06, 0.5, P.pink);
  vb.box(0.57, 0.06, 0.46, 0.59, 0.13, 0.48, P.pink);
  // Ring light.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    vb.box(-0.4 + Math.cos(a) * 0.1 - 0.02, 0.34 + Math.sin(a) * 0.1 - 0.02, 0.3, -0.4 + Math.cos(a) * 0.1 + 0.02, 0.34 + Math.sin(a) * 0.1 + 0.02, 0.33, P.white, { emit: 2 });
  }
  vb.box(-0.41, 0, 0.3, -0.39, 0.24, 0.32, P.steel);
  person(vb, -0.4, 0.55, seed, P.magenta);
  palm(vb, 0.7, -0.6, seed);
  return result(h + 0.6, {
    signs: [{ text: 'CONTENT', face: '+z', x: -0.25, y: h - 0.12, z: 0.2, fg: '#f25ab4', bg: '#ffffff' }],
  });
}

function conference(vb, seed, level) {
  lot(vb, 'plaza');
  const h = 0.75 * lv(level, 0.3);
  vb.box(-0.8, 0, -0.8, 0.6, h, 0.6, 0xe9eef7);
  vb.box(-0.85, h, -0.85, 0.65, h + 0.08, 0.65, P.navy);
  // Huge keynote screens.
  vb.panel('+z', 0.6, -0.7, 0.2, 0.5, h - 0.08, P.neonCyan, 2);
  vb.panel('+x', 0.6, -0.7, 0.2, 0.5, h - 0.08, P.neonPink, 2);
  vb.panel('+z', 0.6, -0.7, 0.02, 0.5, 0.16, P.windowWarm, 1);
  // Banners.
  for (let i = 0; i < 4; i++) {
    const x = -0.6 + i * 0.35;
    vb.box(x - 0.02, 0, 0.72, x + 0.02, 0.5, 0.76, P.steel);
    vb.box(x + 0.02, 0.28, 0.73, x + 0.12, 0.48, 0.75, [P.red, P.yellow, P.blue, P.green][i]);
  }
  return result(h + 0.4, {
    signs: [{ text: 'DEVDAY', face: '+z', x: -0.1, y: h - 0.35, z: 0.605, fg: '#ffffff', bg: '#22232b' }],
  });
}

function orb(vb, seed, level) {
  lot(vb, 'plaza');
  const r = 0.62 * lv(level, 0.15);
  vb.box(-0.3, 0, -0.3, 0.3, 0.15, 0.3, P.ink);
  // An LED sphere: alternate neon bands.
  const layers = 8;
  for (let i = 0; i < layers; i++) {
    const t = (i + 0.5) / layers;
    const rr = r * Math.sqrt(1 - (2 * t - 1) ** 2);
    const band = [P.neonPink, P.neonCyan, P.yellow, P.neonGreen][i % 4];
    cylinder(vb, 0, 0.15 + (2 * r * i) / layers, 0, Math.max(0.03, rr), (2 * r) / layers, band, { emit: 2 });
  }
  // A smile. It's always smiling.
  vb.panel('+z', r * 0.8, -0.2, 0.15 + r * 1.0, -0.1, 0.15 + r * 1.15, P.black, 2);
  vb.panel('+z', r * 0.8, 0.1, 0.15 + r * 1.0, 0.2, 0.15 + r * 1.15, P.black, 2);
  vb.panel('+z', r * 0.8, -0.25, 0.15 + r * 0.6, 0.25, 0.15 + r * 0.68, P.black, 2);
  return result(0.15 + 2 * r + 0.3);
}

function expo(vb, seed, level) {
  lot(vb, 'plaza');
  const h = 0.6 * lv(level, 0.3);
  // Oval arena from stacked rings.
  for (let i = 0; i < 4; i++) {
    const r = 0.8 - i * 0.03;
    const y = (h * i) / 4;
    vb.box(-r, y, -r * 0.7, r, y + h / 4, r * 0.7, i % 2 ? P.white : 0xdfe6f2);
    vb.box(-r * 0.7, y, -r, r * 0.7, y + h / 4, r, i % 2 ? P.white : 0xdfe6f2);
  }
  vb.box(-0.5, h, -0.5, 0.5, h + 0.02, 0.5, P.green);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * 0.72;
    const z = Math.sin(a) * 0.72;
    vb.box(x - 0.02, h, z - 0.02, x + 0.02, h + 0.45, z + 0.02, P.steel);
    vb.box(x, h + 0.3, z - 0.01, x + 0.15, h + 0.43, z + 0.01, [P.red, P.yellow, P.blue, P.magenta, P.green, P.orange][i]);
  }
  vb.panel('+z', 0.56, -0.4, h * 0.3, 0.4, h * 0.9, P.neonCyan, 2);
  return result(h + 0.6, {
    signs: [{ text: 'AGI EXPO', face: '+x', x: 0.56, y: h * 0.6, z: 0, fg: '#ffffff', bg: '#9a62f2' }],
  });
}

export const BUILDING_MODELS = {
  basement, rack, mine, datacenter, campus, reactor, fab, orbital, dyson,
  intern, redteam, evals, interp, rlhf, thinktank, monastery, moonbase,
  billboard, podcast, hackathon, influencer, conference, orb, expo,
};

export { tree, palm, bush, car, person, waterTank, awning };
