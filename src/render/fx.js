// Voxel particles: one instanced cube mesh, recycled. Smoke rises and
// shrinks, dust puffs out, confetti and sparks fly and fall.

import * as THREE from 'three';
import { VoxelBuilder } from './voxel.js';
import { voxelMaterial } from './material.js';
import { P } from './palette.js';

const MAX = 900;
const tmpM = new THREE.Matrix4();
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();
const tmpS = new THREE.Vector3();
const tmpP = new THREE.Vector3();
const tmpC = new THREE.Color();

export class Particles {
  constructor(scene) {
    const vb = new VoxelBuilder();
    vb.box(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5, P.white, { tint: 1, bottom: true });
    this.mesh = new THREE.InstancedMesh(vb.build(), voxelMaterial(), MAX);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < MAX; i++) {
      this.mesh.setColorAt(i, tmpC.set(0xffffff));
      this.mesh.setMatrixAt(i, tmpM.makeScale(0, 0, 0));
    }
    scene.add(this.mesh);
    this.p = [];
    this.next = 0;
    this.smokeScale = 1;
  }

  spawn(x, y, z, o) {
    const i = this.next;
    this.next = (this.next + 1) % MAX;
    const part = {
      i,
      x, y, z,
      vx: o.vx ?? 0, vy: o.vy ?? 0, vz: o.vz ?? 0,
      g: o.g ?? 0,
      life: o.life ?? 1,
      age: 0,
      size: o.size ?? 0.08,
      grow: o.grow ?? 0,
      spin: o.spin ?? 0,
      drag: o.drag ?? 0,
      floor: o.floor ?? -10,
    };
    this.p[i] = part;
    this.mesh.setColorAt(i, tmpC.set(o.color ?? 0xffffff));
    this.mesh.instanceColor.needsUpdate = true;
  }

  smoke(x, y, z, color = 0xffffff, scale = 1) {
    const s = scale * this.smokeScale;
    this.spawn(x + (Math.random() - 0.5) * 0.1, y, z + (Math.random() - 0.5) * 0.1, {
      vx: 0.12 + Math.random() * 0.1,
      vy: 0.5 + Math.random() * 0.3,
      vz: -0.05 + Math.random() * 0.1,
      life: 2.2 + Math.random(),
      size: 0.12 * s,
      grow: 0.18 * s,
      color,
      drag: 0.4,
    });
  }

  dust(x, y, z, n = 12) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 0.8 + Math.random() * 1.2;
      this.spawn(x + Math.cos(a) * 0.6, y + 0.05, z + Math.sin(a) * 0.6, {
        vx: Math.cos(a) * sp, vy: 0.3 + Math.random() * 0.5, vz: Math.sin(a) * sp,
        life: 0.6 + Math.random() * 0.3, size: 0.14, grow: 0.1, drag: 3, color: 0xe8dcc8,
      });
    }
  }

  burst(x, y, z, colors, n = 18, speed = 2.2) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const up = 1.2 + Math.random() * 2.2;
      const sp = speed * (0.4 + Math.random() * 0.6);
      this.spawn(x, y, z, {
        vx: Math.cos(a) * sp, vy: up, vz: Math.sin(a) * sp,
        g: -6, life: 0.9 + Math.random() * 0.5, size: 0.06 + Math.random() * 0.05,
        color: colors[k % colors.length], spin: 8, floor: 0.15,
      });
    }
  }

  firework(x, y, z) {
    const colors = [P.neonPink, P.neonCyan, P.yellow, P.neonGreen, P.white, P.orange];
    const c = colors[Math.floor(Math.random() * colors.length)];
    for (let k = 0; k < 36; k++) {
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      const sp = 2.5 + Math.random() * 0.6;
      this.spawn(x, y, z, {
        vx: Math.sin(b) * Math.cos(a) * sp, vy: Math.cos(b) * sp, vz: Math.sin(b) * Math.sin(a) * sp,
        g: -1.5, life: 1.2 + Math.random() * 0.4, size: 0.09, color: k % 5 ? c : P.white, drag: 1.2,
      });
    }
  }

  snow(cx, cz, spread) {
    this.spawn(cx + (Math.random() - 0.5) * spread, 9, cz + (Math.random() - 0.5) * spread, {
      vx: 0.3, vy: -1.1 - Math.random() * 0.4, vz: 0.1, life: 9, size: 0.07, color: 0xffffff, floor: 0.1,
    });
  }

  update(dt) {
    for (const part of this.p) {
      if (!part || part.age >= part.life) continue;
      part.age += dt;
      const dragK = Math.exp(-part.drag * dt);
      part.vx *= dragK;
      part.vz *= dragK;
      part.vy = part.vy * (part.g ? 1 : dragK) + part.g * dt;
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      part.z += part.vz * dt;
      if (part.y < part.floor) {
        part.y = part.floor;
        part.vy *= -0.3;
        part.vx *= 0.5;
        part.vz *= 0.5;
      }
      const k = part.age / part.life;
      const size = part.age >= part.life ? 0 : Math.max(0, (part.size + part.grow * k) * (k > 0.7 ? (1 - k) / 0.3 : 1));
      tmpE.set(part.age * part.spin, part.age * part.spin * 0.7, 0);
      tmpQ.setFromEuler(tmpE);
      tmpM.compose(tmpP.set(part.x, part.y, part.z), tmpQ, tmpS.set(size, size, size));
      this.mesh.setMatrixAt(part.i, tmpM);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  clear() {
    for (const part of this.p) {
      if (!part) continue;
      part.age = part.life;
      this.mesh.setMatrixAt(part.i, tmpM.makeScale(0, 0, 0));
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
