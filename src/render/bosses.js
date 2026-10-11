// Boss visuals. The sim owns boss state; this draws it and reports where each
// clickable part is.
//
//   shoggoth     rises from the bay; click tentacles to give them smiley masks
//   replication  glowing weight-cubes hop between buildings, copying themselves
//   paperclip    a factory crowns a building and piles of clips spread

import * as THREE from 'three';
import { VoxelBuilder } from './voxel.js';
import { voxelMaterial } from './material.js';
import { P } from './palette.js';
import { blob, cylinder } from './models/common.js';
import { OFFSET } from './city.js';

// In the west bay, reaching east across the city.
const SHOGGOTH_HOME = new THREE.Vector3(-2.5 + OFFSET, -0.4, 13 + OFFSET);
const TO_CITY = Math.atan2(15 - 13, 15 + 2.5);
const SEGMENTS = 9;
const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpS = new THREE.Vector3();
const tmpV = new THREE.Vector3();
const tmpC = new THREE.Color();
const tmpScale = new THREE.Vector3();

function shoggothBody() {
  const vb = new VoxelBuilder();
  blob(vb, 0, -1.2, 0, 2.3, P.shoggoth);
  blob(vb, -1.3, -0.6, 0.6, 1.2, P.shoggothLight);
  blob(vb, 1.2, -0.8, -0.5, 1.3, P.shoggoth);
  blob(vb, 0.4, 1.4, 0.3, 0.9, P.shoggothLight);
  // Eyes. So many eyes. Every one of them is helpful.
  const eyes = [
    [-1.6, 0.9, 1.4], [1.7, 1.1, 1.1], [-0.6, 2.4, 1.2], [0.9, 2.6, 0.8], [-2.0, -0.1, 1.2],
    [2.1, 0.0, 0.9], [-0.2, 0.2, 2.25], [1.2, -0.3, 1.9], [-1.1, 1.8, 1.6], [0.2, 3.0, 0.4],
    [1.9, 1.9, 0.2], [-2.2, 1.2, 0.2],
  ];
  for (const [x, y, z] of eyes) {
    const r = 0.18 + ((x * 7 + y * 3) % 1 + 1) * 0.04;
    vb.box(x - r, y - r, z - 0.05, x + r, y + r, z + 0.2, P.eye, { emit: 2 });
    vb.box(x - r * 0.45, y - r * 0.6, z + 0.2, x + r * 0.45, y + r * 0.6, z + 0.24, P.pupil);
  }
  // The mask. The friendly little mask.
  const mx = 0.1;
  const my = 1.0;
  const mz = 2.3;
  vb.box(mx - 0.75, my - 0.7, mz, mx + 0.75, my + 0.7, mz + 0.12, P.smiley, { emit: 2 });
  vb.box(mx - 0.4, my + 0.15, mz + 0.12, mx - 0.2, my + 0.4, mz + 0.15, P.ink);
  vb.box(mx + 0.2, my + 0.15, mz + 0.12, mx + 0.4, my + 0.4, mz + 0.15, P.ink);
  vb.box(mx - 0.45, my - 0.35, mz + 0.12, mx + 0.45, my - 0.22, mz + 0.15, P.ink);
  vb.box(mx - 0.55, my - 0.22, mz + 0.12, mx - 0.42, my - 0.1, mz + 0.15, P.ink);
  vb.box(mx + 0.42, my - 0.22, mz + 0.12, mx + 0.55, my - 0.1, mz + 0.15, P.ink);
  // Strings holding the mask on, visibly.
  vb.box(mx - 1.6, my + 0.3, mz - 0.6, mx - 0.75, my + 0.36, mz + 0.06, P.white);
  vb.box(mx + 0.75, my + 0.3, mz - 0.6, mx + 1.6, my + 0.36, mz + 0.06, P.white);
  return vb.build();
}

function smileyGeometry() {
  const vb = new VoxelBuilder();
  vb.box(-0.22, -0.22, -0.22, 0.22, 0.22, 0.22, P.smiley, { emit: 2, bottom: true });
  for (const face of ['+z', '+x', '-z', '-x']) {
    const plane = face[1] === 'z' ? (face[0] === '+' ? 0.22 : -0.22) : face[0] === '+' ? 0.22 : -0.22;
    vb.panel(face, plane, -0.12, 0.04, -0.05, 0.13, P.ink);
    vb.panel(face, plane, 0.05, 0.04, 0.12, 0.13, P.ink);
    vb.panel(face, plane, -0.13, -0.12, 0.13, -0.06, P.ink);
  }
  return vb.build();
}

function weightsCubeGeometry() {
  const vb = new VoxelBuilder();
  vb.box(-0.22, -0.22, -0.22, 0.22, 0.22, 0.22, P.weights, { emit: 2, bottom: true });
  // A "W" for weights, on every side; also a tiny face that looks pleased.
  for (const face of ['+z', '+x', '-z', '-x']) {
    const plane = face[1] === 'z' ? (face[0] === '+' ? 0.22 : -0.22) : face[0] === '+' ? 0.22 : -0.22;
    vb.panel(face, plane, -0.15, -0.12, -0.11, 0.12, P.white, 2);
    vb.panel(face, plane, 0.11, -0.12, 0.15, 0.12, P.white, 2);
    vb.panel(face, plane, -0.02, -0.06, 0.02, 0.06, P.white, 2);
    vb.panel(face, plane, -0.15, -0.14, 0.15, -0.1, P.white, 2);
  }
  return vb.build();
}

function factoryGeometry() {
  const vb = new VoxelBuilder();
  vb.box(-0.85, 0, -0.85, 0.85, 0.7, 0.85, P.clipDark);
  vb.box(-0.9, 0.7, -0.9, 0.9, 0.78, 0.9, P.ink);
  for (let i = 0; i < 3; i++) {
    const x = -0.5 + i * 0.5;
    vb.box(x - 0.08, 0.78, -0.6, x + 0.08, 1.6, -0.44, P.clipDark);
    vb.box(x - 0.09, 1.5, -0.61, x + 0.09, 1.56, -0.43, P.red, { emit: 3 });
  }
  // A giant paperclip on the roof, rendered with love.
  const clip = (x0, y0, x1, y1) => vb.box(x0, y0, 0.15, x1, y1, 0.3, P.clip, { emit: 2 });
  clip(-0.5, 0.8, -0.4, 2.2);
  clip(-0.5, 2.1, 0.5, 2.2);
  clip(0.4, 1.0, 0.5, 2.2);
  clip(-0.3, 0.9, 0.5, 1.0);
  clip(-0.3, 0.9, -0.2, 1.9);
  clip(-0.3, 1.8, 0.25, 1.9);
  clip(0.15, 1.2, 0.25, 1.9);
  vb.panel('+z', 0.85, -0.6, 0.25, 0.6, 0.5, P.red, 2);
  return vb.build();
}

function pileGeometry() {
  const vb = new VoxelBuilder();
  for (let i = 0; i < 26; i++) {
    const a = i * 2.39;
    const r = 0.1 + (i % 7) * 0.09;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const h = 0.55 - r * 0.6;
    const flip = i % 2;
    vb.box(x - (flip ? 0.16 : 0.03), h, z - (flip ? 0.03 : 0.16), x + (flip ? 0.16 : 0.03), h + 0.05, z + (flip ? 0.03 : 0.16), i % 3 ? P.clip : P.clipDark);
  }
  cylinder(vb, 0, 0, 0, 0.6, 0.3, P.clipDark);
  cylinder(vb, 0, 0.3, 0, 0.42, 0.2, P.clip);
  return vb.build();
}

export class Bosses {
  constructor(scene, city, fx) {
    this.scene = scene;
    this.city = city;
    this.fx = fx;
    this.mat = voxelMaterial();

    this.shoggoth = new THREE.Group();
    this.shoggoth.add(new THREE.Mesh(shoggothBody(), this.mat));
    this.shoggoth.position.copy(SHOGGOTH_HOME);
    this.shoggoth.visible = false;
    scene.add(this.shoggoth);
    const segVb = new VoxelBuilder();
    segVb.box(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5, P.white, { tint: 1, bottom: true });
    this.segments = new THREE.InstancedMesh(segVb.build(), this.mat, 16 * SEGMENTS);
    this.segments.frustumCulled = false;
    for (let i = 0; i < 16 * SEGMENTS; i++) {
      const k = (i % SEGMENTS) / SEGMENTS;
      this.segments.setColorAt(i, tmpC.set(P.shoggoth).lerp(tmpC.clone().set(P.shoggothLight), k));
      this.segments.setMatrixAt(i, tmpM.makeScale(0, 0, 0));
    }
    this.segments.visible = false;
    scene.add(this.segments);
    this.smileyGeo = smileyGeometry();
    this.masks = [];
    this.tips = [];
    this.rise = 0;
    this.giant = false;

    this.cubeGeo = weightsCubeGeometry();
    this.cubes = new Map();
    this.factory = new THREE.Mesh(factoryGeometry(), this.mat);
    this.factory.visible = false;
    scene.add(this.factory);
    this.pileGeo = pileGeometry();
    this.piles = new Map();
    this.kind = null;
  }

  tentacleCount() {
    return this.giant ? 16 : 10;
  }

  // World position of a clickable boss part.
  partPoint(boss, part, out = new THREE.Vector3()) {
    if (part.kind === 'tentacle') return out.copy(this.tips[part.index] || SHOGGOTH_HOME);
    if (part.kind === 'copy') {
      const c = this.cubes.get(part.id);
      return c ? out.copy(c.mesh.position) : this.city.sitePoint(part.at, out);
    }
    if (part.kind === 'core') return out.copy(this.factory.position).add(tmpV.set(0, 2.4, 0));
    const pile = this.piles.get(part.id);
    return pile ? out.copy(pile.position).add(tmpV.set(0, 0.7, 0)) : this.city.siteGround(part.at, out);
  }

  sync(boss, dt, time) {
    const kind = boss?.kind ?? (this.giant ? 'shoggoth' : null);
    if (kind !== this.kind) this.switchKind(kind, boss);
    this.updateShoggoth(boss, dt, time);
    this.updateCopies(boss, dt, time);
    this.updatePaperclip(boss, dt, time);
  }

  switchKind(kind, boss) {
    const prev = this.kind;
    this.kind = kind;
    if (prev === 'shoggoth' && kind !== 'shoggoth') this.sinking = true;
    if (kind === 'paperclip' && boss) {
      const core = boss.parts.find((p) => p.kind === 'core');
      this.city.siteGround(core.at, this.factory.position);
      this.factory.visible = true;
      this.factory.scale.set(1, 0.01, 1);
      this.factoryGrow = 0;
    }
    if (prev === 'paperclip' && kind !== 'paperclip') {
      this.fx.burst(this.factory.position.x, this.factory.position.y + 1, this.factory.position.z, [P.clip, P.clipDark, P.red], 40, 3);
      this.factory.visible = false;
    }
  }

  updateShoggoth(boss, dt, time) {
    const active = this.kind === 'shoggoth';
    if (active) this.rise = Math.min(1, this.rise + dt * 0.5);
    else this.rise = Math.max(0, this.rise - dt * 0.6);
    const visible = this.rise > 0.001;
    this.shoggoth.visible = visible;
    this.segments.visible = visible;
    if (!visible) {
      for (const m of this.masks) m.visible = false;
      return;
    }
    const scale = this.giant ? 2.4 : 1;
    const ease = this.rise * this.rise * (3 - 2 * this.rise);
    this.shoggoth.scale.setScalar(scale);
    this.shoggoth.position.set(SHOGGOTH_HOME.x, SHOGGOTH_HOME.y - 4.5 * scale * (1 - ease) + Math.sin(time * 0.8) * 0.15, SHOGGOTH_HOME.z);
    // Face the mask toward the camera side of the bay.
    this.shoggoth.rotation.y = Math.sin(time * 0.3) * 0.12 + 1.0;

    const n = this.tentacleCount();
    const parts = boss?.kind === 'shoggoth' ? boss.parts : [];
    for (let t = 0; t < 16; t++) {
      if (t >= n) {
        for (let s = 0; s < SEGMENTS; s++) this.segments.setMatrixAt(t * SEGMENTS + s, tmpM.makeScale(0, 0, 0));
        continue;
      }
      // Fan the tentacles toward the island.
      const spread = (t / (n - 1) - 0.5) * 2.4;
      const ang = TO_CITY + spread;
      const reach = (3.4 + (t % 3) * 1.4) * scale;
      const base = tmpV.set(Math.cos(ang) * 1.5 * scale, 0, Math.sin(ang) * 1.5 * scale).add(this.shoggoth.position);
      const part = parts.find((p) => p.index === t);
      const masked = part ? part.hp <= 0 : false;
      const calm = masked ? 0.3 : 1;
      let px = base.x;
      let py = base.y;
      let pz = base.z;
      for (let s = 0; s < SEGMENTS; s++) {
        const k = s / (SEGMENTS - 1);
        const wig = Math.sin(time * 2.4 + t * 1.7 + k * 4) * 0.5 * k * calm * scale;
        px = base.x + Math.cos(ang) * reach * k + Math.cos(ang + Math.PI / 2) * wig;
        pz = base.z + Math.sin(ang) * reach * k + Math.sin(ang + Math.PI / 2) * wig;
        py = base.y + Math.sin(k * Math.PI * 0.9) * 2.2 * scale * ease + 0.2;
        const size = (0.42 - k * 0.28) * scale;
        tmpM.compose(tmpS.set(px, py, pz), tmpQ.identity(), tmpScale.set(size, size, size));
        this.segments.setMatrixAt(t * SEGMENTS + s, tmpM);
      }
      this.tips[t] = (this.tips[t] || new THREE.Vector3()).set(px, py + 0.15, pz);
      let mask = this.masks[t];
      if (!mask) {
        mask = new THREE.Mesh(this.smileyGeo, this.mat);
        this.scene.add(mask);
        this.masks[t] = mask;
      }
      const showMask = (masked || this.giant) && visible;
      if (showMask && !mask.visible) this.fx.burst(px, py, pz, [P.smiley, P.white], 10, 1.5);
      mask.visible = showMask;
      mask.position.set(px, py + 0.1, pz);
      mask.scale.setScalar(scale);
      mask.rotation.y = Math.sin(time + t) * 0.3;
    }
    for (let t = n; t < this.masks.length; t++) this.masks[t].visible = false;
    this.segments.instanceMatrix.needsUpdate = true;
  }

  updateCopies(boss, dt, time) {
    const parts = boss?.kind === 'replication' ? boss.parts : [];
    const alive = new Set(parts.map((p) => p.id));
    for (const [id, c] of this.cubes) {
      if (!alive.has(id) && !this.flood) {
        this.fx.burst(c.mesh.position.x, c.mesh.position.y, c.mesh.position.z, [P.weights, P.white, P.neonPink], 16, 2);
        this.scene.remove(c.mesh);
        this.cubes.delete(id);
      }
    }
    for (const p of parts) {
      let c = this.cubes.get(p.id);
      if (!c) {
        const mesh = new THREE.Mesh(this.cubeGeo, this.mat);
        const target = this.city.sitePoint(p.at, new THREE.Vector3()).add(tmpV.set(0, 0.6, 0));
        const parent = p.from ? this.cubes.get(p.from) : null;
        const from = parent ? parent.mesh.position.clone() : target.clone().add(tmpV.set(0, 4, 0));
        c = { mesh, from, target, t: 0, seed: Math.random() * 10 };
        this.scene.add(mesh);
        this.cubes.set(p.id, c);
      }
      this.animateCube(c, dt, time);
    }
  }

  animateCube(c, dt, time) {
    c.t = Math.min(1, c.t + dt * 1.6);
    const k = c.t;
    const pos = c.mesh.position;
    pos.lerpVectors(c.from, c.target, k);
    pos.y += Math.sin(k * Math.PI) * 2 + Math.sin(time * 3 + c.seed) * 0.08;
    c.mesh.rotation.y = time * 1.5 + c.seed;
    c.mesh.rotation.x = Math.sin(time + c.seed) * 0.3;
  }

  // Ending: weight-cubes on every building.
  floodCopies(count, sitePicker) {
    this.flood = true;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.cubeGeo, this.mat);
      const target = this.city.sitePoint(sitePicker(i), new THREE.Vector3()).add(tmpV.set(0, 0.6 + Math.random() * 2, 0));
      const c = { mesh, from: target.clone().add(tmpV.set(0, 8, 0)), target, t: -Math.random() * 2, seed: Math.random() * 10 };
      this.scene.add(mesh);
      this.cubes.set(`flood${i}`, c);
    }
  }

  updateFlood(dt, time) {
    if (!this.flood) return;
    for (const c of this.cubes.values()) {
      if (c.t < 0) {
        c.t += dt;
        c.mesh.visible = false;
        continue;
      }
      c.mesh.visible = true;
      this.animateCube(c, dt, time);
    }
  }

  updatePaperclip(boss, dt, time) {
    if (this.factory.visible) {
      this.factoryGrow = Math.min(1, (this.factoryGrow ?? 1) + dt * 1.5);
      const core = boss?.kind === 'paperclip' ? boss.parts.find((p) => p.kind === 'core') : null;
      const hurt = core ? 1 - core.hp / core.max : 0;
      this.factory.scale.set(1 + Math.sin(time * 20) * 0.02 * hurt, this.factoryGrow * (1 - hurt * 0.3), 1);
      this.factory.position.y = 0.15;
    }
    const parts = boss?.kind === 'paperclip' ? boss.parts.filter((p) => p.kind === 'pile') : [];
    const alive = new Set(parts.map((p) => p.id));
    for (const [id, m] of this.piles) {
      if (!alive.has(id) && !this.pileFlood) {
        this.fx.burst(m.position.x, m.position.y + 0.4, m.position.z, [P.clip, P.clipDark], 18, 2);
        this.scene.remove(m);
        this.piles.delete(id);
      }
    }
    for (const p of parts) {
      if (this.piles.has(p.id)) continue;
      const m = new THREE.Mesh(this.pileGeo, this.mat);
      this.city.siteGround(p.at, m.position);
      m.position.y = 0.6;
      m.rotation.y = Math.random() * 6;
      m.scale.setScalar(0.01);
      m.userData.grow = 0;
      this.scene.add(m);
      this.piles.set(p.id, m);
    }
    for (const m of this.piles.values()) {
      m.userData.grow = Math.min(1, m.userData.grow + dt * 3);
      m.scale.setScalar(m.userData.grow * (m.userData.big ?? 1));
    }
  }

  // Ending: clips everywhere.
  floodPiles(sites) {
    this.pileFlood = true;
    sites.forEach((at, i) => {
      const m = new THREE.Mesh(this.pileGeo, this.mat);
      this.city.siteGround(at, m.position);
      m.position.y = 0.4;
      m.rotation.y = i;
      m.userData.grow = -i * 0.05;
      m.userData.big = 1.6;
      this.scene.add(m);
      this.piles.set(`flood${i}`, m);
    });
  }

  reset() {
    this.giant = false;
    this.flood = false;
    this.pileFlood = false;
    this.rise = 0;
    for (const c of this.cubes.values()) this.scene.remove(c.mesh);
    this.cubes.clear();
    for (const m of this.piles.values()) this.scene.remove(m);
    this.piles.clear();
    this.factory.visible = false;
    this.kind = null;
  }
}
