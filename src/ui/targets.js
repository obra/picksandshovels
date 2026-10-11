// Clickable things pinned to the 3D world: incident bubbles, boss parts, the
// VC blimp, edge arrows for off-screen incidents, and floating text.

import * as THREE from 'three';
import { h, setStyle, toggle } from './dom.js';
import { icon } from './icons.js';

const BOSS_LABEL = { tentacle: 'MASK', copy: 'DEL', pile: 'CLEAR', core: 'SMASH' };
const KIND_LABEL = {
  escape: 'LAB ESCAPE', cyber: 'CYBER', finance: 'MARKETS', bio: 'BIOLAB', swarm: 'SWARM', rsi: 'SELF-IMPROVING', misalignment: 'MISALIGNED',
};

export class Targets {
  constructor(overlay, { world, content, onIncident, onBossPart, onBlimp }) {
    this.root = overlay;
    this.world = world;
    this.content = content;
    this.onIncident = onIncident;
    this.onBossPart = onBossPart;
    this.onBlimp = onBlimp;
    this.incidents = new Map();
    this.parts = new Map();
    this.arrows = new Map();
    this.blimpEl = null;
    this.v = new THREE.Vector3();
    this.p = { x: 0, y: 0, visible: true };
    this.incidentById = Object.fromEntries(content.incidents.map((i) => [i.id, i]));
  }

  clear() {
    for (const el of this.incidents.values()) el.el.remove();
    for (const el of this.parts.values()) el.el.remove();
    for (const el of this.arrows.values()) el.remove();
    this.incidents.clear();
    this.parts.clear();
    this.arrows.clear();
    this.blimpEl?.remove();
    this.blimpEl = null;
  }

  place(el, x, y) {
    setStyle(el, 'transform', `translate(${Math.round(x)}px, ${Math.round(y)}px)`);
  }

  update(s) {
    this.frameNo = (this.frameNo || 0) + 1;

    // Incidents.
    const alive = new Set();
    for (const inc of s.incidents) {
      alive.add(inc.id);
      let t = this.incidents.get(inc.id);
      if (!t) {
        const timer = h('i');
        const pips = h('div.pips');
        for (let i = 0; i < inc.clicksMax; i++) pips.append(h('i'));
        const tpl = this.incidentById[inc.templateId];
        const kind = tpl?.kind && KIND_LABEL[tpl.kind] ? h(`div.kind.k-${tpl.kind}`, {}, KIND_LABEL[tpl.kind]) : null;
        const box = h('div.box', {}, kind, tpl?.text || 'Something is wrong', h('div.timer', {}, timer), inc.clicksMax > 1 ? pips : null);
        const el = h(`div.target.bubble.t${inc.tier}`, {}, box, h('div.tail'));
        const wrap = h('div', { style: { position: 'absolute', left: 0, top: 0 } }, el);
        el.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          this.onIncident(inc.id, e.clientX, e.clientY);
          el.classList.remove('hit');
          void el.offsetWidth;
          el.classList.add('hit');
        });
        this.root.append(wrap);
        t = { el: wrap, bubble: el, timer, pips };
        this.incidents.set(inc.id, t);
      }
      const frac = Math.max(0, inc.left / inc.max);
      setStyle(t.timer, 'width', `${frac * 100}%`);
      toggle(t.bubble, 'urgent', frac < 0.3);
      if (t.pips) [...t.pips.children].forEach((pip, i) => toggle(pip, 'done', i < inc.clicksMax - inc.clicksLeft));
      this.world.sitePoint(inc.at, this.v);
      const p = this.world.project(this.v, this.p);
      this.place(t.el, p.x, p.y - 4);
      this.edgeArrow(`i${inc.id}`, p, '!');
    }
    for (const [id, t] of this.incidents) {
      if (!alive.has(id)) {
        t.el.remove();
        this.incidents.delete(id);
      }
    }

    // Boss parts.
    const partsAlive = new Set();
    const boss = s.boss;
    if (boss && this.world.bosses.kind === boss.kind) {
      for (const part of boss.parts) {
        const key = `${boss.kind}:${part.id}`;
        partsAlive.add(key);
        let t = this.parts.get(key);
        if (!t) {
          const knob = h('div.knob', {}, part.kind === 'tentacle' ? icon('smile') : BOSS_LABEL[part.kind]);
          const hp = part.kind === 'tentacle' ? h('div.hp') : null;
          const coreBar = part.kind === 'core' ? h('div.corebar', {}, h('i')) : null;
          const el = h(`div.target.part.${part.kind}`, {}, knob, hp, coreBar);
          el.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            this.onBossPart(part.id, e.clientX, e.clientY);
          });
          this.root.append(el);
          t = { el, hp, coreBar };
          this.parts.set(key, t);
        }
        if (t.hp) {
          if (t.hp.childElementCount !== part.max) t.hp.replaceChildren(...Array.from({ length: part.max }, () => h('i')));
          [...t.hp.children].forEach((pip, i) => toggle(pip, 'gone', i >= part.hp));
          toggle(t.el, 'masked', part.hp <= 0);
        }
        if (t.coreBar) setStyle(t.coreBar.firstChild, 'width', `${(part.hp / part.max) * 100}%`);
        this.world.bosses.partPoint(boss, part, this.v);
        const p = this.world.project(this.v, this.p);
        this.place(t.el, p.x, p.y);
        if (!(part.kind === 'tentacle' && part.hp <= 0)) this.edgeArrow(key, p, '!');
      }
    }
    this.pruneArrows();
    for (const [key, t] of this.parts) {
      if (!partsAlive.has(key)) {
        t.el.remove();
        this.parts.delete(key);
      }
    }

    // The blimp.
    if (s.blimp && this.world.life.blimp.visible) {
      if (!this.blimpEl) {
        this.blimpEl = h('div.target.blimp-target', {}, h('div.knob', {}, '$ TERM SHEET $'));
        this.blimpEl.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          this.onBlimp(e.clientX, e.clientY);
        });
        this.root.append(this.blimpEl);
      }
      const p = this.world.project(this.world.life.blimpPos, this.p);
      this.place(this.blimpEl, p.x, p.y + 30);
    } else if (this.blimpEl) {
      this.blimpEl.remove();
      this.blimpEl = null;
    }
  }

  // An arrow on the screen edge pointing at something off-screen. Clicking it
  // pans there. Arrows not refreshed this frame are removed by pruneArrows.
  edgeArrow(key, p, label) {
    const stage = this.world.stage;
    const W = stage.width;
    const H = stage.height;
    const off = p.x < 20 || p.x > W - 20 || p.y < 60 || p.y > H - 40;
    let arrow = this.arrows.get(key);
    if (!off) {
      if (arrow) {
        arrow.remove();
        this.arrows.delete(key);
      }
      return;
    }
    if (!arrow) {
      arrow = h('div.offscreen', {}, label);
      arrow.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        stage.focus(arrow.target.x, arrow.target.z);
      });
      this.root.append(arrow);
      this.arrows.set(key, arrow);
    }
    arrow.target = { x: this.v.x, z: this.v.z };
    arrow.seen = this.frameNo;
    setStyle(arrow, 'left', `${Math.max(24, Math.min(W - 24, p.x))}px`);
    setStyle(arrow, 'top', `${Math.max(170, Math.min(H - 60, p.y))}px`);
  }

  pruneArrows() {
    for (const [key, arrow] of this.arrows) {
      if (arrow.seen !== this.frameNo) {
        arrow.remove();
        this.arrows.delete(key);
      }
    }
  }

  // Floating text at a screen point (or above a world site). Quips are jokes,
  // so they get a speech bubble and time to be read, and only two at once.
  floater(text, x, y, cls = '') {
    const quip = cls === 'quip';
    const el = h(`div.floater${cls ? `.${cls}` : ''}`, { style: { left: `${x}px`, top: `${y}px` } }, text);
    if (quip) {
      this.quips = (this.quips || []).filter((q) => q.isConnected);
      while (this.quips.length >= 2) this.quips.shift().remove();
      this.quips.push(el);
    }
    this.root.append(el);
    setTimeout(() => el.remove(), quip ? 3800 : 1900);
  }

  floaterAt(at, text, cls) {
    this.world.sitePoint(at, this.v);
    const p = this.world.project(this.v, this.p);
    this.floater(text, p.x + (Math.random() - 0.5) * 30, p.y - 30, cls);
  }
}
