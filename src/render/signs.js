// Pixel-text sign panels: the 5x7 font drawn to a small canvas, used as a
// nearest-filtered texture on a plane stuck to a facade.

import * as THREE from 'three';
import { textWidth, drawText, GLYPH_H } from './font.js';
import { signMaterial } from './material.js';

const TEXEL = 0.03; // world units per texel at scale 1

function paint(canvas, text, fg, bg) {
  const w = textWidth(text) + 4;
  const h = GLYPH_H + 4;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  // A one-texel darker frame keeps signs readable against bright walls.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, h - 1, w, 1);
  ctx.fillRect(w - 1, 0, 1, h);
  drawText(ctx, text, 2, 2, 1, fg);
  return { w, h };
}

export class Sign {
  constructor(spec) {
    this.spec = spec;
    this.canvas = document.createElement('canvas');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;
    this.material = signMaterial(this.texture);
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material);
    this.setText(spec.text);
    const off = 0.012;
    if (spec.face === '+x') {
      this.mesh.rotation.y = Math.PI / 2;
      this.mesh.position.set(spec.x + off, spec.y, spec.z);
    } else if (spec.face === '-x') {
      this.mesh.rotation.y = -Math.PI / 2;
      this.mesh.position.set(spec.x - off, spec.y, spec.z);
    } else if (spec.face === '-z') {
      this.mesh.rotation.y = Math.PI;
      this.mesh.position.set(spec.x, spec.y, spec.z - off);
    } else {
      this.mesh.position.set(spec.x, spec.y, spec.z + off);
    }
  }

  setText(text, fg = this.spec.fg, bg = this.spec.bg) {
    const clean = String(text).toUpperCase();
    this.text = clean;
    const { w, h } = paint(this.canvas, clean, fg, bg);
    this.texture.dispose();
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.generateMipmaps = false;
    this.material.uniforms.map.value = this.texture;
    let texel = TEXEL * (this.spec.scale ?? 1);
    if (this.spec.w) texel = this.spec.w / w;
    if (this.spec.maxW && w * texel > this.spec.maxW) texel = this.spec.maxW / w;
    this.mesh.scale.set(w * texel, h * texel, 1);
  }

  dispose() {
    this.texture.dispose();
    this.material.dispose();
    this.mesh.geometry.dispose();
  }
}
