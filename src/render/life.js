// Things that move: pedestrians, cars, boats, delivery drones, clouds and the
// VC blimp. Pedestrians and cars are instanced; the rest are few meshes.

import * as THREE from 'three';
import { GRID, BLOCK, STRIDE, ORIGIN, tileKind } from '../sim/map.js';
import { VoxelBuilder } from './voxel.js';
import { voxelMaterial } from './material.js';
import { P, SHIRTS, SKINS, CAR_COLORS } from './palette.js';
import { CURB, GROUND } from './terrain.js';
import { OFFSET } from './city.js';
import { blob, cylinder } from './models/common.js';

const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpP = new THREE.Vector3();
const tmpS = new THREE.Vector3(1, 1, 1);
const tmpC = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);

function personGeometry() {
  const vb = new VoxelBuilder();
  vb.box(-0.022, 0, -0.02, -0.002, 0.07, 0.02, P.navy, { bottom: false });
  vb.box(0.002, 0, -0.02, 0.022, 0.07, 0.02, P.navy);
  vb.box(-0.035, 0.07, -0.025, 0.035, 0.15, 0.025, P.white, { tint: 1 });
  vb.box(-0.025, 0.15, -0.025, 0.025, 0.2, 0.025, P.white, { tint: 2 });
  vb.box(-0.027, 0.19, -0.027, 0.027, 0.21, 0.027, P.ink);
  return vb.build();
}

function carGeometry() {
  const vb = new VoxelBuilder();
  const l = 0.36;
  const w = 0.18;
  vb.box(-l / 2, 0.03, -w / 2, l / 2, 0.11, w / 2, P.white, { tint: 1 });
  vb.box(-l * 0.28, 0.11, -w * 0.42, l * 0.22, 0.17, w * 0.42, P.glass, { emit: 1 });
  vb.box(-l * 0.25, 0.17, -w * 0.4, l * 0.2, 0.18, w * 0.4, P.white, { tint: 1 });
  vb.box(-l / 2 + 0.02, 0, -w / 2 - 0.005, -l / 2 + 0.09, 0.05, w / 2 + 0.005, P.black);
  vb.box(l / 2 - 0.09, 0, -w / 2 - 0.005, l / 2 - 0.02, 0.05, w / 2 + 0.005, P.black);
  vb.box(l / 2 - 0.005, 0.06, -w / 2 + 0.02, l / 2 + 0.005, 0.09, -w / 2 + 0.05, P.windowLit, { emit: 2 });
  vb.box(l / 2 - 0.005, 0.06, w / 2 - 0.05, l / 2 + 0.005, 0.09, w / 2 - 0.02, P.windowLit, { emit: 2 });
  vb.box(-l / 2 - 0.005, 0.06, -w / 2 + 0.02, -l / 2 + 0.005, 0.09, -w / 2 + 0.05, P.red, { emit: 2 });
  vb.box(-l / 2 - 0.005, 0.06, w / 2 - 0.05, -l / 2 + 0.005, 0.09, w / 2 - 0.02, P.red, { emit: 2 });
  // Roof lidar on everything. They're all robotaxis now.
  vb.box(-0.025, 0.18, -0.025, 0.025, 0.21, 0.025, P.ink);
  return vb.build();
}

function droneGeometry() {
  const vb = new VoxelBuilder();
  vb.box(-0.06, 0, -0.06, 0.06, 0.04, 0.06, P.white, { tint: 1, bottom: true });
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    vb.box(x * 0.09 - 0.04, 0.03, z * 0.09 - 0.04, x * 0.09 + 0.04, 0.045, z * 0.09 + 0.04, P.ink);
  }
  vb.box(-0.02, -0.04, -0.02, 0.02, 0.0, 0.02, P.red, { emit: 3 });
  vb.box(-0.03, -0.1, -0.03, 0.03, -0.04, 0.03, 0xc8a070); // the package
  return vb.build();
}

function boatGeometry(kind) {
  const vb = new VoxelBuilder();
  if (kind === 'sail') {
    vb.box(-0.4, -0.05, -0.13, 0.4, 0.08, 0.13, P.white, { side: P.navy });
    vb.box(0.4, -0.02, -0.08, 0.5, 0.08, 0.08, P.white);
    vb.box(-0.02, 0.08, -0.02, 0.02, 1.0, 0.02, P.steel);
    vb.box(-0.35, 0.15, -0.01, -0.02, 0.95, 0.01, P.offwhite);
    vb.box(0.02, 0.15, -0.01, 0.3, 0.7, 0.01, P.red);
  } else if (kind === 'yacht') {
    vb.box(-0.9, -0.05, -0.25, 0.9, 0.15, 0.25, P.white);
    vb.box(0.9, -0.02, -0.15, 1.1, 0.15, 0.15, P.white);
    vb.box(-0.6, 0.15, -0.2, 0.5, 0.35, 0.2, P.white);
    vb.panel('+z', 0.2, -0.55, 0.2, 0.45, 0.3, P.ink, 1);
    vb.panel('-z', -0.2, -0.55, 0.2, 0.45, 0.3, P.ink, 1);
    vb.box(-0.4, 0.35, -0.15, 0.2, 0.5, 0.15, P.white);
    vb.box(-0.3, 0.5, -0.02, -0.25, 0.75, 0.02, P.steel);
    vb.box(-0.9, 0.15, -0.25, -0.6, 0.18, 0.25, 0xc99a66);
  } else {
    vb.box(-0.3, -0.04, -0.11, 0.3, 0.07, 0.11, P.red);
    vb.box(0.3, -0.02, -0.06, 0.4, 0.07, 0.06, P.red);
    vb.box(-0.05, 0.07, -0.09, 0.08, 0.14, 0.09, P.glass);
    vb.box(-0.33, 0.0, -0.04, -0.28, 0.1, 0.04, P.ink);
  }
  return vb.build();
}

function cloudGeometry(seed) {
  const vb = new VoxelBuilder();
  const n = 3 + (seed % 3);
  const base = 0.35;
  // A flat-bottomed cumulus: a wide base slab with puffs stacked on top.
  vb.box(-n * 0.45, 0, -0.55, n * 0.45, base, 0.55, P.white, { side: 0xdfe9f7, bottom: true });
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.75;
    const r = 0.35 + ((seed * 7 + i * 5) % 4) * 0.08;
    vb.box(x - r, base, -r * 0.9, x + r, base + r * 1.1, r * 0.9, P.white, { side: 0xeef3fb });
    if ((seed + i) % 2) vb.box(x - r * 0.55, base + r * 1.1, -r * 0.5, x + r * 0.55, base + r * 1.6, r * 0.5, P.white, { side: 0xeef3fb });
  }
  return vb.build();
}

function blimpGeometry() {
  const vb = new VoxelBuilder();
  const L = 2.4;
  for (let i = 0; i < 12; i++) {
    const t = (i + 0.5) / 12;
    const x = -L / 2 + t * L;
    const r = 0.55 * Math.sqrt(1 - (2 * t - 1) ** 2) + 0.05;
    vb.box(x - L / 24, -r, -r, x + L / 24, r, r, i % 3 === 0 ? 0xd8d8e0 : 0xe8e8ee, { bottom: true });
  }
  // Fins.
  vb.box(-1.25, 0, -0.03, -0.9, 0.55, 0.03, P.red);
  vb.box(-1.25, -0.03, -0.5, -0.9, 0.03, 0.5, P.red);
  // Gondola.
  vb.box(-0.3, -0.75, -0.14, 0.35, -0.5, 0.14, P.ink, { bottom: true });
  vb.panel('+z', 0.14, -0.25, -0.7, 0.3, -0.58, P.windowLit, 1);
  // Money-green banner sides.
  vb.panel('+z', 0.56, -0.7, -0.25, 0.7, 0.25, P.green);
  vb.panel('-z', -0.56, -0.7, -0.25, 0.7, 0.25, P.green);
  return vb.build();
}

// Closed walking loops around each land block, on the sidewalk ring.
function blockLoops(map) {
  return map.blocks
    .filter((b) => b.type !== 'W')
    .map((b) => {
      const i = 0.09;
      return { x0: b.x0 + i, z0: b.z0 + i, x1: b.x0 + BLOCK - i, z1: b.z0 + BLOCK - i };
    });
}

function loopPoint(L, s) {
  const w = L.x1 - L.x0;
  const h = L.z1 - L.z0;
  const per = 2 * (w + h);
  s = ((s % per) + per) % per;
  if (s < w) return [L.x0 + s, L.z0, 1, 0];
  s -= w;
  if (s < h) return [L.x1, L.z0 + s, 0, 1];
  s -= h;
  if (s < w) return [L.x1 - s, L.z1, -1, 0];
  s -= w;
  return [L.x0, L.z1 - s, 0, -1];
}

// Road lines with contiguous road extents, for traffic.
function roadLanes(map) {
  const lanes = [];
  for (let k = 0; k <= 5; k++) {
    const line = ORIGIN - 1 + k * STRIDE;
    for (const axis of ['x', 'z']) {
      let start = null;
      for (let t = 0; t <= GRID; t++) {
        const kind = t < GRID ? (axis === 'z' ? tileKind(map, line, t) : tileKind(map, t, line)) : 'water';
        if (kind === 'road' && start === null) start = t;
        if (kind !== 'road' && start !== null) {
          if (t - start >= 3) lanes.push({ axis, line, from: start, to: t });
          start = null;
        }
      }
    }
  }
  return lanes;
}

export class Life {
  constructor(scene, map) {
    this.root = new THREE.Group();
    this.root.position.set(OFFSET, 0, OFFSET);
    scene.add(this.root);
    const mat = voxelMaterial();
    const matIC2 = voxelMaterial({ ic2: true });

    // Pedestrians.
    this.loops = blockLoops(map);
    const N = 150;
    const pg = personGeometry();
    const skin = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      tmpC.set(SKINS[i % SKINS.length]);
      skin.set([tmpC.r, tmpC.g, tmpC.b], i * 3);
    }
    pg.setAttribute('iColor2', new THREE.InstancedBufferAttribute(skin, 3));
    this.people = new THREE.InstancedMesh(pg, matIC2, N);
    this.people.frustumCulled = false;
    this.walkers = [];
    for (let i = 0; i < N; i++) {
      this.people.setColorAt(i, tmpC.set(SHIRTS[(i * 7) % SHIRTS.length]));
      const loop = this.loops[i % this.loops.length];
      this.walkers.push({
        loop,
        s: Math.random() * 16,
        speed: (0.25 + Math.random() * 0.25) * (Math.random() < 0.5 ? -1 : 1),
        phase: Math.random() * 10,
        pause: 0,
      });
    }
    this.root.add(this.people);

    // Cars.
    this.lanes = roadLanes(map);
    const C = 46;
    this.cars = new THREE.InstancedMesh(carGeometry(), mat, C);
    this.cars.frustumCulled = false;
    this.drivers = [];
    for (let i = 0; i < C; i++) {
      this.cars.setColorAt(i, tmpC.set(CAR_COLORS[i % CAR_COLORS.length]));
      const lane = this.lanes[i % this.lanes.length];
      const dir = i % 2 ? 1 : -1;
      this.drivers.push({ lane, dir, pos: lane.from + Math.random() * (lane.to - lane.from), speed: 1.1 + Math.random() * 0.9 });
    }
    this.root.add(this.cars);

    // Drones.
    const D = 40;
    this.drones = new THREE.InstancedMesh(droneGeometry(), mat, D);
    this.drones.frustumCulled = false;
    this.flyers = [];
    for (let i = 0; i < D; i++) {
      this.drones.setColorAt(i, tmpC.set(i % 3 ? P.white : P.ink));
      this.flyers.push(this.newFlight({ x: 3 + Math.random() * 24, y: 3, z: 3 + Math.random() * 24 }));
    }
    this.droneCount = 0;
    this.root.add(this.drones);

    // Boats circle the island.
    this.boats = ['sail', 'speed', 'yacht', 'sail', 'speed', 'sail'].map((kind, i) => {
      const m = new THREE.Mesh(boatGeometry(kind), mat);
      this.root.add(m);
      return { mesh: m, a: (i / 6) * Math.PI * 2, r: 17.6 + (i % 3) * 1.0, speed: (kind === 'speed' ? 0.07 : 0.025) * (i % 2 ? 1 : -1) };
    });

    // Clouds.
    this.clouds = [];
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(cloudGeometry(i * 5 + 2), mat);
      m.position.set(-24 + i * 10, 8 + (i % 3) * 1.6, -14 + ((i * 17) % 52));
      this.root.add(m);
      this.clouds.push(m);
    }

    // The VC blimp.
    this.blimp = new THREE.Mesh(blimpGeometry(), mat);
    this.blimp.visible = false;
    this.root.add(this.blimp);
    this.blimpPos = new THREE.Vector3();

    this.panic = 0;
    this.frozen = false;
  }

  newFlight(from) {
    return {
      from: { ...from },
      to: { x: 3 + Math.random() * 24, y: 2.2 + Math.random() * 2.5, z: 3 + Math.random() * 24 },
      t: 0,
      dur: 3 + Math.random() * 4,
    };
  }

  setDroneCount(n) {
    this.droneCount = Math.max(0, Math.min(this.flyers.length, Math.round(n)));
  }

  setDroneColor(color) {
    if (this.droneColor === color) return;
    this.droneColor = color;
    for (let i = 0; i < this.flyers.length; i++) this.drones.setColorAt(i, tmpC.set(i % 3 ? color : P.ink));
    this.drones.instanceColor.needsUpdate = true;
  }

  update(dt, time, blimp) {
    const speedK = this.frozen ? 0 : 1 + this.panic * 2.2;

    for (let i = 0; i < this.walkers.length; i++) {
      const w = this.walkers[i];
      w.s += w.speed * dt * speedK;
      const [x, z, dx, dz] = loopPoint(w.loop, w.s);
      const dir = Math.sign(w.speed);
      const bob = this.frozen ? 0 : Math.abs(Math.sin((time + w.phase) * 9 * speedK)) * 0.025;
      tmpQ.setFromAxisAngle(UP, Math.atan2(dx * dir, dz * dir));
      tmpM.compose(tmpP.set(x, CURB + bob, z), tmpQ, tmpS.set(1, 1, 1));
      this.people.setMatrixAt(i, tmpM);
    }
    this.people.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < this.drivers.length; i++) {
      const d = this.drivers[i];
      const L = d.lane;
      d.pos += d.dir * d.speed * dt * (this.frozen ? 0 : 1 + this.panic);
      if (d.pos > L.to) d.pos = L.from;
      if (d.pos < L.from) d.pos = L.to;
      const off = 0.5 + d.dir * 0.22;
      let x;
      let z;
      let ang;
      if (L.axis === 'x') {
        x = d.pos;
        z = L.line + off;
        ang = d.dir > 0 ? 0 : Math.PI;
      } else {
        x = L.line + 1 - off;
        z = d.pos;
        ang = d.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      }
      tmpQ.setFromAxisAngle(UP, ang);
      tmpM.compose(tmpP.set(x, GROUND, z), tmpQ, tmpS.set(1, 1, 1));
      this.cars.setMatrixAt(i, tmpM);
    }
    this.cars.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < this.flyers.length; i++) {
      const f = this.flyers[i];
      if (i >= this.droneCount) {
        this.drones.setMatrixAt(i, tmpM.makeScale(0, 0, 0));
        continue;
      }
      f.t += (dt * (1 + this.panic)) / f.dur;
      if (f.t >= 1) Object.assign(f, this.newFlight(f.to));
      const k = f.t * f.t * (3 - 2 * f.t);
      const hop = Math.sin(f.t * Math.PI) * 0.8;
      tmpP.set(f.from.x + (f.to.x - f.from.x) * k, f.from.y + (f.to.y - f.from.y) * k + hop, f.from.z + (f.to.z - f.from.z) * k);
      tmpQ.setFromAxisAngle(UP, Math.atan2(f.to.x - f.from.x, f.to.z - f.from.z));
      tmpM.compose(tmpP, tmpQ, tmpS.set(1, 1, 1));
      this.drones.setMatrixAt(i, tmpM);
    }
    this.drones.instanceMatrix.needsUpdate = true;

    for (const b of this.boats) {
      b.a += b.speed * dt;
      const x = GRID / 2 + Math.cos(b.a) * b.r;
      const z = GRID / 2 + Math.sin(b.a) * b.r * 0.92;
      b.mesh.position.set(x, -0.42 + Math.sin(time * 2 + b.r) * 0.02, z);
      b.mesh.rotation.y = -b.a - (b.speed > 0 ? Math.PI / 2 : -Math.PI / 2);
    }

    for (const c of this.clouds) {
      c.position.x += dt * 0.35;
      if (c.position.x > 56) c.position.x = -26;
    }

    if (blimp) {
      const k = 1 - blimp.left / blimp.ttl;
      this.blimp.visible = true;
      this.blimp.position.set(-2 + k * 34, 6.5 + Math.sin(time * 1.3) * 0.15, 6 + k * 18);
      this.blimp.rotation.y = -Math.atan2(18, 34);
      this.blimpPos.copy(this.blimp.position).add(this.root.position);
    } else {
      this.blimp.visible = false;
    }
  }
}

export { blob, cylinder };
