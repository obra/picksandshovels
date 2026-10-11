// Renderer, dimetric camera and pan/zoom/rotate controls.
//
// The scene renders at a fraction of screen resolution and is upscaled with
// nearest-neighbor filtering, so every voxel edge lands on a chunky pixel.
// Pitch 30° with yaw 45° gives true 2:1 pixel-art lines.

import * as THREE from 'three';
import { U } from './material.js';

const PITCH = Math.PI / 6;

export class Stage {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x000000, 0);
    this.canvas = this.renderer.domElement;
    this.canvas.className = 'stage-canvas';
    container.appendChild(this.canvas);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -200, 400);
    this.target = new THREE.Vector3(0, 0, 0);
    this.goal = new THREE.Vector3(0, 0, 0);
    this.yaw = Math.PI / 4;
    this.yawGoal = this.yaw;
    this.zoom = 1; // world units visible vertically = viewHeight / zoom
    this.zoomGoal = 1;
    this.viewHeight = 26;
    this.bounds = 16;
    this.shake = 0;
    this.attract = false;
    this.pixelScale = 2;

    this.projected = new THREE.Vector3();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindControls();
  }

  resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    // Aim for roughly 700-900 art pixels across.
    this.pixelScale = Math.max(1, Math.min(4, Math.round(Math.min(w / 780, h / 470)) || 1));
    if (w < 700) this.pixelScale = Math.max(1, Math.round(w / 360));
    this.width = w;
    this.height = h;
    this.renderer.setSize(Math.ceil(w / this.pixelScale), Math.ceil(h / this.pixelScale), false);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.fitZoom();
  }

  // Screen space covered by HUD panels, in CSS px. The island frames itself
  // in what's left.
  setInsets(insets) {
    this.insets = { top: 0, right: 0, bottom: 0, left: 0, ...insets };
    this.fitZoom();
  }

  // Default zoom: the whole island fits in the uncovered area.
  fitZoom() {
    const ins = this.insets || { top: 0, right: 0, bottom: 0, left: 0 };
    const effW = Math.max(200, this.width - ins.left - ins.right);
    const effH = Math.max(200, this.height - ins.top - ins.bottom);
    const needH = 23;
    const needW = 42;
    this.baseView = Math.max((needH * this.height) / effH, (needW * this.height) / effW);
    this.offsetPx = { x: (ins.left - ins.right) / 2, y: (ins.top - ins.bottom) / 2 };
  }

  bindControls() {
    const el = this.container;
    let drag = null;
    const pointers = new Map();
    let pinchStart = 0;
    let pinchZoom = 1;

    el.addEventListener('pointerdown', (e) => {
      if (e.target !== this.canvas) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, moved: 0 };
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
        pinchZoom = this.zoomGoal;
      }
      this.canvas.setPointerCapture?.(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchStart > 0) this.setZoom(pinchZoom * (dist / pinchStart));
        return;
      }
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      this.panBy(dx, dy);
    });
    const end = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size === 0) drag = null;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.setZoom(this.zoomGoal * Math.exp(-e.deltaY * 0.0015));
      },
      { passive: false },
    );
  }

  setZoom(z) {
    this.zoomGoal = Math.max(0.75, Math.min(3.2, z));
  }

  // Drag in screen pixels moves the target opposite in the ground plane.
  panBy(dx, dy) {
    const unitsPerPx = this.viewSize() / this.height;
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.goal.addScaledVector(right, -dx * unitsPerPx);
    // Screen-vertical drags cover more ground: the ground plane is foreshortened.
    this.goal.addScaledVector(fwd, (dy * unitsPerPx) / Math.sin(PITCH));
    this.clampGoal();
  }

  clampGoal() {
    const b = this.bounds;
    this.goal.x = Math.max(-b, Math.min(b, this.goal.x));
    this.goal.z = Math.max(-b, Math.min(b, this.goal.z));
  }

  rotate(dir) {
    this.yawGoal += (dir * Math.PI) / 2;
  }

  focus(x, z) {
    this.goal.set(x, 0, z);
    this.clampGoal();
  }

  viewSize() {
    return this.baseView / this.zoom;
  }

  update(dt) {
    const k = 1 - Math.exp(-dt * 8);
    if (this.attract) this.yawGoal += dt * 0.06;
    this.yaw += (this.yawGoal - this.yaw) * k;
    this.zoom += (this.zoomGoal - this.zoom) * k;
    this.target.lerp(this.goal, k);
    this.shake = Math.max(0, this.shake - dt * 2.5);

    const view = this.viewSize();
    const aspect = this.width / this.height;
    const cam = this.camera;
    // Shift the frustum so the look-at point sits in the middle of the
    // uncovered area, snapped to whole art pixels.
    const upp0 = view / this.height;
    const off = this.offsetPx || { x: 0, y: 0 };
    const ox = Math.round(off.x / this.pixelScale) * this.pixelScale * upp0;
    const oy = Math.round(off.y / this.pixelScale) * this.pixelScale * upp0;
    cam.top = view / 2 + oy;
    cam.bottom = -view / 2 + oy;
    cam.left = (-view / 2) * aspect - ox;
    cam.right = (view / 2) * aspect - ox;
    cam.updateProjectionMatrix();

    const dist = 100;
    const dir = new THREE.Vector3(
      Math.cos(PITCH) * Math.sin(this.yaw),
      Math.sin(PITCH),
      Math.cos(PITCH) * Math.cos(this.yaw),
    );
    // Snap the look-at point to the art-pixel grid so panning doesn't shimmer.
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const up = new THREE.Vector3().crossVectors(right, dir).normalize().negate();
    const upp = view / (this.height / this.pixelScale);
    const t = this.target.clone();
    if (this.shake > 0) {
      t.addScaledVector(right, (Math.random() - 0.5) * this.shake * 0.6);
      t.addScaledVector(up, (Math.random() - 0.5) * this.shake * 0.6);
    }
    const r = Math.round(t.dot(right) / upp) * upp;
    const u = Math.round(t.dot(up) / upp) * upp;
    const f = t.dot(dir);
    const snapped = new THREE.Vector3().addScaledVector(right, r).addScaledVector(up, u).addScaledVector(dir, f);
    cam.position.copy(snapped).addScaledVector(dir, dist);
    cam.up.set(0, 1, 0);
    cam.lookAt(snapped);
    cam.updateMatrixWorld();
    U.uRight.value.copy(right);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  // World point -> CSS pixel position within the container.
  project(x, y, z, out = { x: 0, y: 0, visible: true }) {
    const p = this.projected.set(x, y, z).project(this.camera);
    out.x = (p.x * 0.5 + 0.5) * this.width;
    out.y = (-p.y * 0.5 + 0.5) * this.height;
    out.visible = p.x > -1.05 && p.x < 1.05 && p.y > -1.05 && p.y < 1.05;
    return out;
  }
}
