// The city's buildings: lab HQs, the pre-built neighborhood, and whatever the
// player buys. Syncs plot meshes from sim state and animates construction.

import * as THREE from 'three';
import { GRID } from '../sim/map.js';
import { VoxelBuilder } from './voxel.js';
import { voxelMaterial, waterMaterial } from './material.js';
import { buildTerrain, CURB, LOT } from './terrain.js';
import { filler, emptyLot } from './models/filler.js';
import { BUILDING_MODELS } from './models/buildings.js';
import { labHQ } from './models/labs.js';
import { Sign } from './signs.js';
import { P } from './palette.js';

export const OFFSET = -GRID / 2;

// Your HQ upgrades at $1B, $1T and $1Qa of peak cash (cash is in $M).
export function hqLevelFor(peakCash) {
  if (peakCash >= 1e9) return 4;
  if (peakCash >= 1e6) return 3;
  if (peakCash >= 1e3) return 2;
  return 1;
}
export const DIORAMA_MARGIN = 6;

export class City {
  constructor(scene, map, labs, fx) {
    this.map = map;
    this.labsContent = labs;
    this.fx = fx;
    this.material = voxelMaterial();
    this.root = new THREE.Group();
    this.root.position.set(OFFSET, 0, OFFSET);
    scene.add(this.root);

    // The bay is a finite diorama slab floating in the sky, eBoy style, with
    // its cut-away sides showing water, sand and bedrock.
    const S0 = -DIORAMA_MARGIN;
    const S1 = GRID + DIORAMA_MARGIN;
    const water = new THREE.Mesh(new THREE.PlaneGeometry(S1 - S0, S1 - S0), waterMaterial());
    water.rotation.x = -Math.PI / 2;
    water.position.set(GRID / 2, -0.45, GRID / 2);
    this.root.add(water);
    const slab = new VoxelBuilder();
    slab.box(S0, -1.4, S0, S1, -0.46, S1, 0x2a7fd0, { top: 0x2a7fd0 });
    slab.box(S0, -1.8, S0, S1, -1.4, S1, P.sand, { side: P.sandDark });
    slab.box(S0, -3.2, S0, S1, -1.8, S1, P.dirtDark, { side: P.dirtDark });
    slab.box(S0, -3.5, S0, S1, -3.2, S1, 0x5a3a22, { bottom: true });
    for (let i = 0; i < 40; i++) {
      // Pebbles and fossils in the cross-section. One is a GPU.
      const t = S0 + ((i * 7.31) % (S1 - S0));
      const y = -2.0 - ((i * 3.7) % 11) / 10;
      slab.box(t, y, S1, t + 0.25, y + 0.12, S1 + 0.02, i === 13 ? P.gpuGreen : 0x7a5a3a);
      slab.box(S1, y, t, S1 + 0.02, y + 0.12, t + 0.25, i === 29 ? P.yellow : 0x7a5a3a);
    }
    this.root.add(new THREE.Mesh(slab.build(), this.material));

    const { ground, deco } = buildTerrain(map);
    this.root.add(new THREE.Mesh(ground, this.material));
    this.root.add(new THREE.Mesh(deco, this.material));

    this.billboards = [];
    this.labMeshes = map.labs.map((l, i) => {
      const lab = labs[i % labs.length];
      const vb = new VoxelBuilder();
      const res = labHQ(vb, lab, i);
      const g = new THREE.Group();
      g.position.set(l.x, CURB + 0.02, l.z);
      g.add(new THREE.Mesh(vb.build(), this.material));
      for (const spec of res.signs) g.add(this.makeSign(spec).mesh);
      this.root.add(g);
      return { group: g, top: res.top, lab };
    });

    // A giant billboard greets traffic coming off the bridge.
    const bb = new VoxelBuilder();
    const bx = GRID - 1.6;
    const bz = 9.3;
    bb.box(bx - 0.06, -0.2, bz + 0.3, bx + 0.06, 1.0, bz + 0.42, P.steel);
    bb.box(bx - 0.06, -0.2, bz + 1.6, bx + 0.06, 1.0, bz + 1.72, P.steel);
    bb.box(bx - 0.08, 1.0, bz - 0.2, bx, 2.2, bz + 2.2, P.ink);
    bb.box(bx - 0.02, 0.95, bz - 0.1, bx + 0.25, 0.99, bz + 2.1, P.steel);
    for (let i = 0; i < 4; i++) bb.box(bx + 0.18, 0.99, bz + 0.1 + i * 0.6, bx + 0.24, 1.07, bz + 0.18 + i * 0.6, P.yellow, { emit: 2 });
    this.root.add(new THREE.Mesh(bb.build(), this.material));
    this.root.add(this.makeSign({ text: 'AGI SOON', face: '+x', x: bx, y: 1.6, z: bz + 1.0, w: 2.3, fg: '#22232b', bg: '#ffd23f', slot: 'billboard' }).mesh);

    this.plots = map.plots.map((p) => ({ id: p.id, x: p.x, z: p.z, key: null, group: null, top: 0.5, anim: null, smoke: [] }));
  }

  makeSign(spec) {
    const sign = new Sign(spec);
    if (spec.slot === 'billboard') this.billboards.push(sign);
    return sign;
  }

  // World-space anchor above a site, for bubbles and effects.
  sitePoint(at, out = new THREE.Vector3()) {
    if (at.kind === 'lab') {
      const l = this.map.labs[at.id];
      const m = this.labMeshes[at.id];
      return out.set(l.x + OFFSET, CURB + Math.min(m.top, 3.2), l.z + OFFSET);
    }
    const p = this.plots[at.id];
    return out.set(p.x + OFFSET, LOT + p.top * (p.group ? p.group.scale.y : 1), p.z + OFFSET);
  }

  siteGround(at, out = new THREE.Vector3()) {
    const src = at.kind === 'lab' ? this.map.labs[at.id] : this.plots[at.id];
    return out.set(src.x + OFFSET, LOT, src.z + OFFSET);
  }

  // Bring plot meshes in line with sim state. animate=false for loads.
  sync(state, animate = true) {
    const hqLevel = hqLevelFor(state.stats.peakCash);
    for (const sp of state.plots) {
      const p = this.plots[sp.id];
      const level = sp.filler === 'hq' ? hqLevel : sp.level;
      const key = `${sp.bId || sp.filler || 'empty'}|${level}`;
      if (p.key === key) continue;
      const wasBuilt = p.key !== null;
      const sameKind = p.key && p.key.split('|')[0] === key.split('|')[0];
      p.key = key;
      this.rebuildPlot(p, sp.filler === 'hq' ? { ...sp, level } : sp, animate && wasBuilt, sameKind && sp.filler !== 'hq');
    }
  }

  rebuildPlot(p, sp, animate, levelUp) {
    const old = p.group;
    const vb = new VoxelBuilder();
    const seed = p.id * 13 + 7;
    let res;
    if (sp.bId) res = BUILDING_MODELS[sp.bId](vb, seed, sp.level || 1);
    else if (sp.filler) res = filler(vb, sp.filler, seed, sp.level);
    else res = emptyLot(vb, seed);
    const g = new THREE.Group();
    g.position.set(p.x, LOT, p.z);
    g.add(new THREE.Mesh(vb.build(), this.material));
    const signs = [];
    for (const spec of res.signs) {
      const s = this.makeSign(spec);
      signs.push(s);
      g.add(s.mesh);
    }
    g.userData.signs = signs;
    this.root.add(g);
    p.group = g;
    p.top = res.top;
    p.smoke = res.smoke.map((s) => ({ ...s, acc: Math.random() }));

    if (old) {
      if (animate && !levelUp) {
        // Old building sinks into a dust cloud.
        p.dying = { group: old, t: 0 };
      } else {
        this.disposeGroup(old);
      }
    }
    if (animate) {
      p.anim = { t: 0, levelUp };
      g.position.y = LOT + (levelUp ? 0 : 6);
      g.scale.set(1, levelUp ? 0.6 : 1.3, 1);
    }
  }

  disposeGroup(g) {
    this.root.remove(g);
    g.traverse((o) => {
      if (o.isMesh && o.material === this.material) o.geometry.dispose();
    });
    for (const s of g.userData.signs || []) {
      this.billboards = this.billboards.filter((b) => b !== s);
      s.dispose();
    }
  }

  update(dt) {
    for (const p of this.plots) {
      if (p.anim) {
        const a = p.anim;
        a.t += dt;
        const g = p.group;
        if (a.levelUp) {
          const k = Math.min(1, a.t / 0.35);
          g.scale.y = 0.6 + 0.4 * (1 - (1 - k) ** 3) + Math.sin(k * Math.PI) * 0.15;
          if (k >= 1) p.anim = null;
        } else {
          const fall = 0.45;
          if (a.t < fall) {
            const k = a.t / fall;
            g.position.y = LOT + 6 * (1 - k * k);
            g.scale.set(0.9, 1.3, 0.9);
          } else {
            if (!a.landed) {
              a.landed = true;
              this.fx?.dust(g.position.x + OFFSET, LOT, g.position.z + OFFSET, 14);
              this.onLand?.();
            }
            const k = Math.min(1, (a.t - fall) / 0.4);
            g.position.y = LOT;
            const squash = Math.sin(k * Math.PI) * (1 - k) * 0.6;
            g.scale.set(1 + squash * 0.5, 1 - squash, 1 + squash * 0.5);
            if (k >= 1) {
              g.scale.set(1, 1, 1);
              p.anim = null;
            }
          }
        }
      }
      if (p.dying) {
        const d = p.dying;
        d.t += dt;
        const k = Math.min(1, d.t / 0.4);
        d.group.scale.set(1 + k * 0.1, 1 - k * 0.98, 1 + k * 0.1);
        if (k === 0 || d.t < dt * 1.5) this.fx?.dust(p.x + OFFSET, LOT, p.z + OFFSET, 18);
        if (k >= 1) {
          this.disposeGroup(d.group);
          p.dying = null;
        }
      }
      if (this.fx && p.smoke.length && !p.anim) {
        for (const s of p.smoke) {
          s.acc += dt * (s.rate ?? 0.3);
          while (s.acc >= 1) {
            s.acc -= 1;
            const sy = p.group.scale.y;
            this.fx.smoke(p.x + OFFSET + s.x, LOT + s.y * sy, p.z + OFFSET + s.z, s.color ?? 0xffffff, s.big ? 1.6 : 1);
          }
        }
      }
    }
  }

  setBillboardTexts(pickText) {
    for (const b of this.billboards) {
      const next = pickText(b);
      if (next && next !== b.text) b.setText(next);
    }
  }
}
