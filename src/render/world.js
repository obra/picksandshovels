// The whole rendered world: stage, city, street life, particles, bosses, sky.
// Reads sim state every frame and reacts to sim fx events with visuals.

import * as THREE from 'three';
import { Stage } from './stage.js';
import { City, OFFSET } from './city.js';
import { Life } from './life.js';
import { Particles } from './fx.js';
import { Bosses } from './bosses.js';
import { Sky } from './sky.js';
import { U } from './material.js';
import { P } from './palette.js';
import { VoxelBuilder } from './voxel.js';
import { voxelMaterial } from './material.js';
import { LOT } from './terrain.js';

const DAY_SECONDS = 80;
const GRID_EDGE = 35;
const KIND_SMOKE = { bio: 0x8fdc5a, cyber: 0x2f6a3a, escape: 0x9a4a8c, rsi: 0x6a4aa8 };

function dayCurve(phase) {
  if (phase < 0.55) return 1;
  if (phase < 0.65) return 1 - (phase - 0.55) / 0.1;
  if (phase < 0.88) return 0;
  return (phase - 0.88) / 0.12;
}

function approach(cur, target, rate, dt) {
  return cur + (target - cur) * (1 - Math.exp(-rate * dt));
}

export class World {
  constructor(container, map, content) {
    this.content = content;
    this.map = map;
    this.sky = new Sky(container);
    this.stage = new Stage(container);
    this.fx = new Particles(this.stage.scene);
    this.city = new City(this.stage.scene, map, content.labs, this.fx);
    this.life = new Life(this.stage.scene, map);
    this.bosses = new Bosses(this.stage.scene, this.city, this.fx);
    this.time = 0;
    this.doomShown = 0;
    this.burning = [];
    this.billboardTimer = 0;
    this.ending = null;
    this.endingT = 0;
    this.tumbleweeds = [];
    this.tmp = new THREE.Vector3();
    this.tumbleGeo = (() => {
      const vb = new VoxelBuilder();
      for (let i = 0; i < 9; i++) {
        const a = i * 0.7;
        vb.box(Math.cos(a) * 0.1 - 0.06, Math.sin(a * 1.3) * 0.08 - 0.06, Math.sin(a) * 0.1 - 0.06,
          Math.cos(a) * 0.1 + 0.06, Math.sin(a * 1.3) * 0.08 + 0.06, Math.sin(a) * 0.1 + 0.06, i % 2 ? 0xc8a060 : 0xa8804a, { bottom: true });
      }
      return vb.build();
    })();
    this.tumbleMat = voxelMaterial();

    // The frontier crown floats over whichever lab leads.
    const cvb = new VoxelBuilder();
    cvb.box(-0.5, 0, -0.5, 0.5, 0.25, 0.5, P.yellow, { emit: 2, bottom: true });
    for (const [x, z] of [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4], [0, -0.45], [0, 0.45], [-0.45, 0], [0.45, 0]]) {
      cvb.box(x - 0.08, 0.25, z - 0.08, x + 0.08, 0.55, z + 0.08, P.yellow, { emit: 2 });
    }
    cvb.box(-0.12, 0.08, 0.5, 0.12, 0.2, 0.52, P.red, { emit: 2 });
    cvb.box(0.5, 0.08, -0.12, 0.52, 0.2, 0.12, P.cyan, { emit: 2 });
    this.crown = new THREE.Mesh(cvb.build(), voxelMaterial());
    this.crown.visible = false;
    this.stage.scene.add(this.crown);
    this.labExhaust = map.labs.map(() => 0);

    // DeepSeep's cargo ship: sails in from the diorama edge, leaks weights.
    const svb = new VoxelBuilder();
    svb.box(-1.6, -0.3, -0.42, 1.4, 0.18, 0.42, 0x3a2a2e, { side: 0x6a1f24 });
    svb.box(1.4, -0.2, -0.3, 1.8, 0.18, 0.3, 0x3a2a2e, { side: 0x6a1f24 });
    svb.box(-1.6, -0.3, -0.43, 1.8, -0.18, 0.43, P.red);
    svb.box(-1.5, 0.18, -0.36, -0.9, 0.85, 0.36, P.white);
    svb.windows(-1.5, 0.3, -0.36, -0.9, 0.85, 0.36, { seed: 77, floorH: 0.18, colors: [P.windowLit] });
    svb.box(-1.3, 0.85, -0.06, -1.15, 1.25, 0.06, P.red);
    const crate = [0x3f7ff2, 0xff9a3c, 0x3fbf6a, 0xffd23f, 0x8e93a3];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      const x = -0.75 + i * 0.5;
      svb.box(x, 0.18, -0.36 + j * 0.37, x + 0.46, 0.46, -0.01 + j * 0.37, crate[(i + j * 2) % crate.length]);
    }
    svb.box(-0.25, 0.46, -0.36, 0.71, 0.76, 0.36, P.weights, { emit: 2 });
    svb.panel('+z', 0.36, -0.1, 0.52, 0.56, 0.7, P.white, 2);
    // A covered wagon and two oxen, for when everything has collapsed and it's
    // time to go west.
    const wvb = new VoxelBuilder();
    wvb.box(-0.32, 0.1, -0.14, 0.32, 0.2, 0.14, 0x8a5a33);
    for (const x of [-0.22, 0.22]) for (const z of [-0.16, 0.16]) wvb.box(x - 0.09, 0, z - 0.02, x + 0.09, 0.18, z + 0.02, 0x4a2a1a);
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      const y = 0.2 + Math.sin(t * Math.PI) * 0.16;
      wvb.box(-0.3, 0.2, -0.15 + t * 0.3 - 0.035, 0.3, y + 0.06, -0.15 + t * 0.3 + 0.035, 0xf3f0e8, { side: 0xe0dccf });
    }
    wvb.box(0.32, 0.12, -0.02, 0.6, 0.14, 0.02, 0x6a4028); // tongue
    for (const z of [-0.08, 0.08]) {
      wvb.box(0.52, 0.06, z - 0.05, 0.74, 0.17, z + 0.05, 0x9a6a3d); // ox
      wvb.box(0.72, 0.1, z - 0.035, 0.8, 0.18, z + 0.035, 0x9a6a3d);
      wvb.box(0.76, 0.18, z - 0.06, 0.78, 0.2, z + 0.06, P.offwhite); // horns
      for (const dx of [0.54, 0.7]) wvb.box(dx, 0, z - 0.03, dx + 0.02, 0.06, z + 0.03, 0x6a4028);
    }
    wvb.box(0.24, 0.2, -0.03, 0.3, 0.32, 0.03, 0x3f7ff2); // the CEO, driving
    wvb.box(0.24, 0.32, -0.025, 0.29, 0.37, 0.025, P.peach);
    wvb.box(0.23, 0.37, -0.04, 0.3, 0.39, 0.04, 0x7a5030);
    this.wagon = new THREE.Mesh(wvb.build(), voxelMaterial());
    this.wagon.visible = false;
    this.stage.scene.add(this.wagon);

    this.ship = new THREE.Mesh(svb.build(), voxelMaterial());
    this.ship.visible = false;
    this.stage.scene.add(this.ship);
    this.shipT = -1;
  }

  // The ship's voyage: in from the west edge, park off the south beach while
  // weights leak into town, then sail off east.
  updateShip(dt) {
    if (this.shipT < 0) return;
    this.shipT += dt;
    const t = this.shipT;
    const z = 32.6 + OFFSET;
    let x;
    if (t < 7) x = -6 + (t / 7) * 18;
    else if (t < 12) {
      x = 12;
      if (Math.random() < dt * 14) this.leakWeights();
    } else x = 12 + (t - 12) * 3;
    const gx = x + OFFSET;
    this.ship.visible = x < GRID_EDGE;
    this.ship.position.set(gx, -0.3 + Math.sin(this.time * 1.7) * 0.04, z);
    if (x >= GRID_EDGE) {
      this.ship.visible = false;
      this.shipT = -1;
    }
  }

  leakWeights() {
    const from = this.ship.position;
    const plot = this.map.plots[Math.floor(Math.random() * this.map.plots.length)];
    const tx = plot.x + OFFSET;
    const tz = plot.z + OFFSET;
    const T = 1.4;
    const g = 6;
    const sy = from.y + 0.8;
    this.fx.spawn(from.x, sy, from.z, {
      vx: (tx - from.x) / T,
      vz: (tz - from.z) / T,
      vy: (0.5 - sy + 0.5 * g * T * T) / T,
      g: -g,
      life: T + 0.6,
      size: 0.18,
      color: P.weights,
      spin: 6,
      floor: 0.3,
    });
  }

  // Lab exhaust (token burn) and the frontier crown.
  updateLabs(dt, state, derived) {
    if (!derived) {
      this.crown.visible = false;
      return;
    }
    this.labColors ||= this.content.labs.map((l) => new THREE.Color(l.color).getHex());
    this.map.labs.forEach((l, i) => {
      const share = derived.labShares[i] ?? 0;
      this.labExhaust[i] += dt * (0.4 + share * 10);
      const top = this.city.labMeshes[i].top;
      const color = this.labColors[i];
      while (this.labExhaust[i] >= 1) {
        this.labExhaust[i] -= 1;
        this.fx.smoke(l.x + OFFSET + (Math.random() - 0.5), Math.min(top, 3.6), l.z + OFFSET + (Math.random() - 0.5), color, 0.8 + share * 2);
      }
    });
    const leader = derived.leader;
    const hq = this.map.labs[leader];
    this.crown.visible = !!hq;
    if (hq) {
      const top = this.city.labMeshes[leader].top;
      this.crown.position.set(hq.x + OFFSET, Math.min(top, 3.6) + 0.9 + Math.sin(this.time * 2) * 0.12, hq.z + OFFSET);
      this.crown.rotation.y = this.time * 1.2;
    }
  }

  // Rebuild everything from a state without construction animations (new game / load).
  reset(state) {
    this.ending = null;
    this.endingT = 0;
    for (const k of ['uClip', 'uWinter', 'uUtopia', 'uFlash']) U[k].value = 0;
    this.bosses.reset();
    this.fx.clear();
    this.burning = [];
    for (const t of this.tumbleweeds) this.stage.scene.remove(t.mesh);
    this.tumbleweeds = [];
    this.life.frozen = false;
    this.life.panic = 0;
    this.shipT = -1;
    this.ship.visible = false;
    this.wagon.visible = false;
    this.city.sync(state, false);
    this.stage.attract = false;
    this.stage.snapYaw();
    this.stage.zoomGoal = 1;
    this.stage.goal.set(0, 0, 0);
  }

  sitePoint(at, out) {
    return this.city.sitePoint(at, out);
  }

  project(v, out) {
    return this.stage.project(v.x, v.y, v.z, out);
  }

  update(dt, state, { title = false, derived = null } = {}) {
    this.time += dt;
    U.uTime.value = this.time;
    const t = title ? this.time * 0.5 + 10 : state.t;
    const phase = (t / DAY_SECONDS + 0.12) % 1;
    U.uDay.value = dayCurve(phase);

    const doomTarget = this.ending?.type === 'doom' || this.ending?.type === 'collapse' ? 1 : (state?.doom ?? 0) / 100;
    this.doomShown = approach(this.doomShown, doomTarget, 2, dt);
    U.uDoom.value = this.doomShown;
    U.uFlash.value = Math.max(0, U.uFlash.value - dt * 3);

    if (state && !title) {
      this.city.sync(state, true);
      this.life.setDroneCount(4 + (state.cap / 100) * 36);
      this.life.panic = this.ending ? this.life.panic : Math.max(0, (state.doom - 60) / 40);
      this.life.setDroneColor(state.doom > 75 ? P.red : P.white);
      this.bosses.sync(state.boss, dt, this.time);
    } else {
      this.life.setDroneCount(10);
      this.bosses.sync(null, dt, this.time);
    }
    this.bosses.updateFlood(dt, this.time);

    this.billboardTimer -= dt;
    if (this.billboardTimer <= 0) {
      this.billboardTimer = 4 + Math.random() * 3;
      this.rotateBillboards(state);
    }

    for (const b of this.burning) {
      b.left -= dt;
      b.acc += dt * 3;
      while (b.acc >= 1) {
        b.acc -= 1;
        const p = this.city.sitePoint(b.at, this.tmp);
        this.fx.smoke(p.x, p.y - 0.2, p.z, b.color ?? 0x3a3a44, 1.2);
      }
    }
    this.burning = this.burning.filter((b) => b.left > 0);

    this.updateLabs(dt, state, title || this.ending ? null : derived);
    this.updateShip(dt);
    this.updateEnding(dt, state);
    this.life.update(dt, this.time, state && !title ? state.blimp : null);
    this.city.update(dt);
    this.fx.update(dt);
    this.stage.update(dt);
    this.sky.update(dt, phase, U.uDay.value, this.doomShown, this.ending, this.stage);
    this.stage.render();
  }

  rotateBillboards(state) {
    const flavor = this.content.flavor;
    const forced = this.endingBillboard;
    const ominous = state && state.doom > 70;
    const release = this.releaseBillboard && this.time < this.releaseBillboard.until ? this.releaseBillboard.text : null;
    this.city.setBillboardTexts(() => {
      if (forced) return forced;
      if (release && Math.random() < 0.6) return release;
      const pool = ominous ? flavor.BILLBOARDS.ominous : flavor.BILLBOARDS.normal;
      if (Math.random() < 0.35) return null;
      // Glitch: sometimes an ominous one slips through early.
      if (!ominous && state && state.doom > 40 && Math.random() < 0.15) {
        return flavor.BILLBOARDS.ominous[Math.floor(Math.random() * flavor.BILLBOARDS.ominous.length)];
      }
      return pool[Math.floor(Math.random() * pool.length)];
    });
  }

  // ── reactions to sim events ──────────────────────────────

  onFx(f, state) {
    const at = f.at;
    switch (f.type) {
      case 'incidentResolved': {
        const p = this.city.sitePoint(at, this.tmp);
        this.fx.burst(p.x, p.y, p.z, f.auto ? [P.cyan, P.white] : [P.cyan, P.neonGreen, P.white, P.yellow], f.auto ? 8 : 14 + f.tier * 4);
        break;
      }
      case 'incidentHit': {
        const p = this.city.sitePoint(at, this.tmp);
        this.fx.burst(p.x, p.y, p.z, [P.white, P.cyan], 5, 1.2);
        break;
      }
      case 'incidentFailed': {
        const p = this.city.sitePoint(at, this.tmp);
        this.fx.burst(p.x, p.y, p.z, [P.red, P.orange, P.ink, P.yellow], 22 + f.tier * 6, 3);
        this.kindFailure(f.kind, at, p);
        this.burning.push({ at, left: 10 + f.tier * 5, acc: 0, color: KIND_SMOKE[f.kind] });
        this.stage.shake = Math.max(this.stage.shake, 0.4 + f.tier * 0.25);
        break;
      }
      case 'incidentCleared': {
        const p = this.city.sitePoint(at, this.tmp);
        this.fx.burst(p.x, p.y, p.z, [P.red, P.white], 8);
        break;
      }
      case 'release': {
        if (f.flop) {
          // A fizzle: gray confetti falls on the lab that shipped it.
          const lab = this.map.labs.find((l, i) => this.content.labs[i]?.id === f.labId) || this.map.labs[0];
          this.fx.burst(lab.x + OFFSET, 4, lab.z + OFFSET, [0x8e93a3, 0x6a6e7c, 0xb9bcc8], 30, 1.2);
          this.releaseBillboard = { text: `${f.model} :(`.slice(0, 18), until: this.time + 15 };
          this.billboardTimer = 0;
          break;
        }
        // Billboards across town advertise the new model for a while.
        this.releaseBillboard = { text: `NEW ${f.model}`.slice(0, 18), until: this.time + 25 };
        this.billboardTimer = 0;
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            const lab = this.map.labs[Math.floor(Math.random() * this.map.labs.length)];
            this.fx.firework(lab.x + OFFSET + (Math.random() - 0.5) * 3, 5 + Math.random() * 2, lab.z + OFFSET + (Math.random() - 0.5) * 3);
          }, i * 220);
        }
        U.uFlash.value = 0.25;
        break;
      }
      case 'overseasDrop':
        this.shipT = 0;
        U.uFlash.value = Math.max(U.uFlash.value, 0.2);
        break;
      case 'blimpClicked': {
        const b = this.life.blimpPos;
        this.fx.burst(b.x, b.y - 0.6, b.z, [P.yellow, 0xffe382, 0xd9a520], 34, 3);
        break;
      }
      case 'boss':
        this.stage.shake = 1.2;
        U.uFlash.value = 0.35;
        break;
      case 'bossHit': {
        const part = state.boss?.parts.find((p) => p.id === f.partId) || { kind: f.partKind, at: f.at, index: 0 };
        const p = this.bosses.partPoint(state.boss || {}, part, this.tmp);
        this.fx.burst(p.x, p.y, p.z, f.partKind === 'tentacle' ? [P.smiley, P.white] : [P.white, P.clip], 6, 1.5);
        break;
      }
      case 'bossWin':
        this.stage.shake = 0.6;
        U.uFlash.value = 0.4;
        for (let i = 0; i < 6; i++) setTimeout(() => this.fx.firework((Math.random() - 0.5) * 16, 6, (Math.random() - 0.5) * 16), i * 180);
        break;
      case 'bossFail':
        this.stage.shake = 1.6;
        U.uFlash.value = 0.5;
        break;
      case 'ability':
        if (f.kind === 'red') {
          this.stage.shake = 1.4;
          U.uFlash.value = 0.8;
        }
        break;
      case 'demolished':
        break;
      case 'ending':
        this.startEnding(f.ending, state);
        break;
      default:
    }
  }

  // Each kind of incident fails in its own way.
  kindFailure(kind, at, p) {
    const fx = this.fx;
    switch (kind) {
      case 'escape':
        // The weights leave. Upward. Quickly.
        for (let i = 0; i < 6; i++) {
          fx.spawn(p.x, p.y, p.z, { vx: (Math.random() - 0.5) * 2, vy: 6 + Math.random() * 3, vz: (Math.random() - 0.5) * 2, life: 2.2, size: 0.22, color: P.weights, spin: 4 });
        }
        break;
      case 'cyber':
        for (let i = 0; i < 30; i++) {
          fx.spawn(p.x + (Math.random() - 0.5) * 1.6, p.y - Math.random(), p.z + (Math.random() - 0.5) * 1.6, { vy: 1 + Math.random() * 1.5, life: 1.8, size: 0.07, color: i % 3 ? P.neonGreen : 0x1f8a3a });
        }
        break;
      case 'finance':
        fx.burst(p.x, p.y, p.z, [P.yellow, 0xffe382, 0xd9a520, P.green], 40, 4);
        break;
      case 'bio':
        for (let i = 0; i < 24; i++) {
          const a = Math.random() * Math.PI * 2;
          fx.spawn(p.x, 0.2, p.z, { vx: Math.cos(a) * 1.2, vz: Math.sin(a) * 1.2, vy: 0.4, g: -1, life: 3, size: 0.16, grow: 0.1, drag: 1.5, color: i % 2 ? P.lime : 0x6aa51f, floor: 0.16 });
        }
        break;
      case 'swarm':
        for (let i = 0; i < 20; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = 4 + Math.random() * 2;
          fx.spawn(p.x + Math.cos(a) * r, p.y + 2 + Math.random() * 2, p.z + Math.sin(a) * r, { vx: -Math.cos(a) * r * 0.9, vy: -1.2, vz: -Math.sin(a) * r * 0.9, life: 1.1, size: 0.09, color: i % 2 ? P.white : P.ink, spin: 10 });
        }
        break;
      case 'rsi': {
        // The building briefly gets bigger. Then it decides to stay a bit bigger.
        if (at.kind === 'plot') {
          const g = this.city.plots[at.id].group;
          if (g) {
            g.scale.y = 1.5;
            setTimeout(() => (g.scale.y = 1.08), 500);
          }
        }
        fx.burst(p.x, p.y, p.z, [P.purple, P.neonPink, P.white], 24, 2.5);
        break;
      }
      case 'misalignment':
        U.uFlash.value = Math.max(U.uFlash.value, 0.25);
        fx.burst(p.x, p.y, p.z, [P.smiley, P.red, P.ink], 20, 2.5);
        break;
      default:
    }
  }

  // ── endings ──────────────────────────────────────────────

  startEnding(ending, state) {
    this.ending = ending;
    this.endingT = 0;
    this.stage.attract = true;
    this.stage.zoomGoal = 0.85;
    this.stage.goal.set(0, 0, 0);
    this.burning = [];
    const sites = state.plots.map((p) => ({ kind: 'plot', id: p.id }));
    if (ending.type === 'doom') {
      U.uFlash.value = 1;
      this.stage.shake = 2;
      switch (ending.cause) {
        case 'paperclips':
          this.bosses.floodPiles(sites);
          this.endingBillboard = 'CLIPS :)';
          break;
        case 'shoggoth':
          this.bosses.giant = true;
          this.bosses.rise = 0;
          this.endingBillboard = 'HELLO :)';
          break;
        case 'replication':
          this.bosses.floodCopies(70, (i) => sites[i % sites.length]);
          this.endingBillboard = 'COPY THAT';
          break;
        case 'engagement':
          this.life.frozen = true;
          this.endingBillboard = 'KEEP SCROLL';
          break;
        case 'sycophancy':
          this.life.frozen = true;
          this.endingBillboard = "YOU'RE RIGHT";
          break;
        default:
          this.life.panic = 3;
          this.life.setDroneCount(40);
          this.endingBillboard = 'THANK YOU';
      }
    } else if (ending.type === 'winter') {
      this.life.frozen = true;
      this.endingBillboard = 'FOR LEASE';
    } else if (ending.type === 'collapse') {
      this.life.frozen = true;
      this.endingBillboard = 'GO WEST';
      this.wagon.visible = true;
      this.wagonX = 29;
      // Fires everywhere: the city is not coming back this time.
      state.plots.forEach((p, i) => {
        if (i % 3 === 0) this.burning.push({ at: { kind: 'plot', id: p.id }, left: 999, acc: Math.random() });
      });
    } else {
      this.endingBillboard = { utopia: 'THANK YOU', shareholders: '$$$$$$', weird: 'HELLO :)' }[ending.flavor] || 'THANK YOU';
    }
    this.billboardTimer = 0;
  }

  updateEnding(dt, state) {
    if (!this.ending) {
      this.endingBillboard = null;
      return;
    }
    this.endingT += dt;
    const e = this.ending;
    const k = Math.min(1, this.endingT / 5);
    if (e.type === 'doom') {
      if (e.cause === 'paperclips') U.uClip.value = k;
      if (Math.random() < dt * 2) this.fx.burst((Math.random() - 0.5) * 24, 0.3, (Math.random() - 0.5) * 24, [P.red, P.orange, P.ink], 10, 2);
    } else if (e.type === 'collapse') {
      U.uWinter.value = k * 0.35;
      U.uDoom.value = Math.max(U.uDoom.value, 0.8 * k);
      if (Math.random() < dt * 3) this.fx.burst((Math.random() - 0.5) * 24, 0.4, (Math.random() - 0.5) * 24, [P.orange, P.red, P.yellow], 8, 1.5);
      // The wagon heads west along the bridge road, at an ox's pace.
      this.wagonX -= dt * 0.55;
      if (this.wagonX < -1) this.wagonX = 29;
      this.wagon.position.set(this.wagonX + OFFSET, 0.05 + Math.abs(Math.sin(this.time * 4)) * 0.01, 12.72 + OFFSET);
      this.wagon.rotation.y = Math.PI;
    } else if (e.type === 'winter') {
      U.uWinter.value = k;
      for (let i = 0; i < 3; i++) if (Math.random() < dt * 30) this.fx.snow(0, 0, 34);
      // Ghost town: tumbleweeds roll down empty streets.
      if (this.tumbleweeds.length < 7 && Math.random() < dt * 0.8) {
        const m = new THREE.Mesh(this.tumbleGeo, this.tumbleMat);
        const lane = 2 + 5 * Math.floor(Math.random() * 6);
        const alongX = Math.random() < 0.5;
        m.position.set(alongX ? -16 : lane + 0.5 + OFFSET, LOT, alongX ? lane + 0.5 + OFFSET : -16);
        this.stage.scene.add(m);
        this.tumbleweeds.push({ mesh: m, alongX, speed: 1.5 + Math.random() });
      }
      for (const tw of this.tumbleweeds) {
        const d = tw.speed * dt;
        if (tw.alongX) tw.mesh.position.x += d;
        else tw.mesh.position.z += d;
        tw.mesh.rotation.z -= d * 4 * (tw.alongX ? 1 : 0);
        tw.mesh.rotation.x += d * 4 * (tw.alongX ? 0 : 1);
        tw.mesh.position.y = LOT + 0.1 + Math.abs(Math.sin(this.time * 5 + tw.speed)) * 0.25;
      }
      this.tumbleweeds = this.tumbleweeds.filter((tw) => {
        const out = tw.mesh.position.x > 18 || tw.mesh.position.z > 18;
        if (out) this.stage.scene.remove(tw.mesh);
        return !out;
      });
    } else {
      U.uUtopia.value = e.flavor === 'weird' ? k * 0.5 : k;
      if (Math.random() < dt * 2.5) this.fx.firework((Math.random() - 0.5) * 20, 5 + Math.random() * 3, (Math.random() - 0.5) * 20);
      if (e.flavor === 'shareholders' && Math.random() < dt * 6) {
        this.fx.burst((Math.random() - 0.5) * 20, 6, (Math.random() - 0.5) * 20, [P.yellow, 0xffe382, P.green], 6, 1);
      }
    }
  }
}
