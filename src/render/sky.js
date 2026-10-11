// A low-resolution banded sky with dithered seams, a pixel sun and moon, and
// stars at night. Doom bleeds it toward a sick orange-red; endings repaint it.

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function hex(h) {
  return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
}

const DAY = [hex(0x4fb8ff), hex(0xa8e6ff)];
const DUSK = [hex(0x5a4fd4), hex(0xffa070)];
const NIGHT = [hex(0x0c1238), hex(0x2a3a7a)];
const DOOM = [hex(0x2a0a12), hex(0xff5a2a)];
const WINTER = [hex(0x8a9ab8), hex(0xe4ecf6)];
const UTOPIA = [hex(0x7fd0ff), hex(0xffd6f0)];
const CLIP = [hex(0x8f9aae), hex(0xd8dee8)];
const BANDS = 9;

export class Sky {
  constructor(container) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'sky-canvas';
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.stars = Array.from({ length: 90 }, () => [Math.random(), Math.random() * 0.75, Math.random()]);
    this.acc = 1;
  }

  update(dt, phase, day, doom, ending, stage) {
    this.acc += dt;
    if (this.acc < 1 / 15) return;
    this.acc = 0;
    const w = Math.ceil(stage.width / stage.pixelScale);
    const h = Math.ceil(stage.height / stage.pixelScale);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    const duskness = phase > 0.5 && phase < 0.72 ? 1 - Math.abs(phase - 0.61) / 0.11 : phase > 0.85 ? 1 - Math.abs(phase - 0.94) / 0.09 : 0;
    let top = mix(NIGHT[0], DAY[0], day);
    let bottom = mix(NIGHT[1], DAY[1], day);
    const dk = Math.max(0, Math.min(1, duskness)) * 0.8;
    top = mix(top, DUSK[0], dk);
    bottom = mix(bottom, DUSK[1], dk);
    const d = doom * doom;
    top = mix(top, DOOM[0], d * 0.85);
    bottom = mix(bottom, DOOM[1], d * 0.85);
    if (ending) {
      const target =
        ending.type === 'winter' ? WINTER : ending.type === 'survive' ? UTOPIA : ending.cause === 'paperclips' ? CLIP : null;
      if (target) {
        top = target[0];
        bottom = target[1];
      }
    }

    const ctx = this.ctx;
    const bandH = Math.ceil(h / BANDS);
    for (let i = 0; i < BANDS; i++) {
      const c = mix(top, bottom, i / (BANDS - 1));
      ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
      ctx.fillRect(0, i * bandH, w, bandH + 1);
      // Dither the seam with the next band's color on a checkerboard.
      if (i < BANDS - 1) {
        const n = mix(top, bottom, (i + 1) / (BANDS - 1));
        ctx.fillStyle = `rgb(${n[0] | 0},${n[1] | 0},${n[2] | 0})`;
        const y0 = (i + 1) * bandH - 2;
        for (let y = y0; y < y0 + 2; y++) for (let x = (y & 1); x < w; x += 2) ctx.fillRect(x, y, 1, 1);
      }
    }

    const night = 1 - day;
    if (night > 0.05 && !(ending && ending.type !== 'doom')) {
      ctx.fillStyle = `rgba(255,255,230,${night})`;
      const tw = performance.now() / 600;
      for (const [sx, sy, s] of this.stars) {
        if (Math.sin(tw + s * 40) > 0.6) continue;
        ctx.fillRect((sx * w) | 0, (sy * h * 0.6) | 0, 1, 1);
      }
    }
    // Sun by day, moon by night, crossing on the same arc.
    const arc = (phase + 0.05) % 1;
    const sunUp = day > 0.05;
    const bx = (sunUp ? arc / 0.7 : (arc - 0.6) / 0.4) * w;
    const by = h * (0.45 - Math.sin(Math.min(1, Math.max(0, sunUp ? arc / 0.7 : (arc - 0.6) / 0.4)) * Math.PI) * 0.33);
    const r = Math.max(4, Math.round(h / 40));
    ctx.fillStyle = sunUp ? (doom > 0.6 ? '#ff6a3a' : '#fff4b0') : '#f0f0ff';
    for (let y = -r; y <= r; y++) {
      const span = Math.round(Math.sqrt(r * r - y * y));
      ctx.fillRect((bx - span) | 0, (by + y) | 0, span * 2, 1);
    }
    if (!sunUp) {
      ctx.fillStyle = `rgb(${top[0] | 0},${top[1] | 0},${top[2] | 0})`;
      for (let y = -r; y <= r; y++) {
        const span = Math.round(Math.sqrt(r * r - y * y));
        ctx.fillRect((bx - span + r * 0.7) | 0, (by + y - r * 0.3) | 0, span * 2, 1);
      }
    }
  }
}
