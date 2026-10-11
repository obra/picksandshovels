// Builds merged box geometry with per-vertex color, emissive and tint
// attributes for the eBoy shader. Faces are shaded in the shader by which way
// they face on screen, so colors here are the flat base color.
//
// aEmit: 0 surface, 1 window (glass by day, glows at night), 2 neon (always lit),
//        3 blinking LED
// aTint: 0 own color, 1 instanceColor, 2 per-instance second color (iColor2)

import * as THREE from 'three';

// Pixel art wants exact palette values: no linear/sRGB conversions anywhere.
THREE.ColorManagement.enabled = false;
import { hash01 } from '../sim/rng.js';
import { P } from './palette.js';

const tmp = new THREE.Color();

function rgb(color) {
  tmp.set(color);
  return [tmp.r, tmp.g, tmp.b];
}

export class VoxelBuilder {
  constructor() {
    this.pos = [];
    this.nor = [];
    this.col = [];
    this.emit = [];
    this.tint = [];
    this.index = [];
  }

  get vertexCount() {
    return this.pos.length / 3;
  }

  // One quad from four corners (counter-clockwise seen from outside).
  quad(a, b, c, d, n, color, emit = 0, tint = 0) {
    const base = this.vertexCount;
    const [r, g, bl] = rgb(color);
    for (const v of [a, b, c, d]) {
      this.pos.push(v[0], v[1], v[2]);
      this.nor.push(n[0], n[1], n[2]);
      this.col.push(r, g, bl);
      this.emit.push(emit);
      this.tint.push(tint);
    }
    this.index.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  // Axis-aligned box from (x0,y0,z0) to (x1,y1,z1).
  // opts: top, side (colors), emit, tint, bottom (include bottom face)
  box(x0, y0, z0, x1, y1, z1, color, opts = {}) {
    const top = opts.top ?? color;
    const side = opts.side ?? color;
    const e = opts.emit ?? 0;
    const t = opts.tint ?? 0;
    const sideE = opts.sideEmit ?? e;
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], top, opts.topEmit ?? e, t);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], side, sideE, t);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], side, sideE, t);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], side, sideE, t);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], side, sideE, t);
    if (opts.bottom) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], side, e, t);
    return this;
  }

  // Box centered on (cx, cz) in the ground plane.
  cbox(cx, y0, cz, w, h, d, color, opts) {
    return this.box(cx - w / 2, y0, cz - d / 2, cx + w / 2, y0 + h, cz + d / 2, color, opts);
  }

  // A flat panel on one face of a box: face is '+x' | '-x' | '+z' | '-z'.
  // (u0,v0)-(u1,v1) are along the face (u horizontal, v = y).
  panel(face, plane, u0, v0, u1, v1, color, emit = 0) {
    const o = 0.006;
    switch (face) {
      case '+x':
        return this.quad([plane + o, v0, u1], [plane + o, v0, u0], [plane + o, v1, u0], [plane + o, v1, u1], [1, 0, 0], color, emit);
      case '-x':
        return this.quad([plane - o, v0, u0], [plane - o, v0, u1], [plane - o, v1, u1], [plane - o, v1, u0], [-1, 0, 0], color, emit);
      case '+z':
        return this.quad([u0, v0, plane + o], [u1, v0, plane + o], [u1, v1, plane + o], [u0, v1, plane + o], [0, 0, 1], color, emit);
      case '-z':
        return this.quad([u1, v0, plane - o], [u0, v0, plane - o], [u0, v1, plane - o], [u1, v1, plane - o], [0, 0, -1], color, emit);
      default:
        throw new Error(`bad face ${face}`);
    }
  }

  // A grid of windows on all four sides of the box (x0..x1, y0..y1, z0..z1).
  // opts: floorH, winW, winH, gap, seed, litChance, colors, faces
  windows(x0, y0, z0, x1, y1, z1, opts = {}) {
    const floorH = opts.floorH ?? 0.26;
    const winW = opts.winW ?? 0.12;
    const winH = opts.winH ?? 0.13;
    const gap = opts.gap ?? 0.1;
    const seed = opts.seed ?? 0;
    const lit = opts.litChance ?? 0.6;
    const colors = opts.colors ?? [P.windowLit, P.windowWarm, P.windowCool];
    const faces = opts.faces ?? ['+x', '-x', '+z', '-z'];
    const floors = Math.max(1, Math.floor((y1 - y0 - 0.06) / floorH));
    let k = 0;
    for (const face of faces) {
      const alongX = face === '+z' || face === '-z';
      const a0 = alongX ? x0 : z0;
      const a1 = alongX ? x1 : z1;
      const plane = { '+x': x1, '-x': x0, '+z': z1, '-z': z0 }[face];
      const span = a1 - a0;
      const cols = Math.max(1, Math.floor((span - gap) / (winW + gap)));
      const used = cols * winW + (cols - 1) * gap;
      const start = a0 + (span - used) / 2;
      for (let f = 0; f < floors; f++) {
        const vy = y0 + 0.08 + f * floorH + (floorH - winH) / 2;
        for (let c = 0; c < cols; c++) {
          const u = start + c * (winW + gap);
          const h = hash01(seed, k++, f, c);
          const color = h < lit ? colors[Math.floor(h * 997) % colors.length] : P.windowOff;
          this.panel(face, plane, u, vy, u + winW, vy + winH, color, 1);
        }
      }
    }
    return this;
  }

  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('aColor', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aEmit', new THREE.Float32BufferAttribute(this.emit, 1));
    g.setAttribute('aTint', new THREE.Float32BufferAttribute(this.tint, 1));
    g.setIndex(this.index);
    g.computeBoundingSphere();
    return g;
  }
}
