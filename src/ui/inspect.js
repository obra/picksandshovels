// Making the city readable: hover (or tap) any building for a tooltip that says
// what it is, and floating name tags over the lab HQs.

import { h, setText, setStyle, toggle } from './dom.js';
import { icon } from './icons.js';
import { gpus } from './format.js';

export class Inspect {
  constructor(root, overlay, { world, getState, sim, content, isActive }) {
    this.world = world;
    this.getState = getState;
    this.sim = sim;
    this.content = content;
    this.isActive = isActive;
    this.title = h('div.in-title');
    this.text = h('div.in-text');
    this.extra = h('div.in-extra');
    this.el = h('div.panel.inspect.hidden', {}, this.title, this.text, this.extra);
    root.append(this.el);
    this.current = null;
    this.hideAt = 0;

    const canvas = world.stage.canvas;
    let down = null;
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch' || !this.isActive()) return;
      if (e.buttons) return this.hide(); // dragging the camera
      this.showAt(e.clientX, e.clientY, 0);
    });
    canvas.addEventListener('pointerleave', () => this.hide());
    canvas.addEventListener('pointerdown', (e) => (down = { x: e.clientX, y: e.clientY }));
    canvas.addEventListener('pointerup', (e) => {
      // A tap (no drag) on a touch screen shows the tooltip for a few seconds.
      if (e.pointerType !== 'touch' || !down || !this.isActive()) return;
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8) this.showAt(e.clientX, e.clientY, 5000);
    });

    // Lab name tags.
    this.tags = world.map.labs.map((l, i) => {
      const lab = content.labs[i];
      const crown = h('span.tag-crown.hidden', {}, icon('crown'));
      const el = h('div.lab-tag', {}, crown, h('span.tag-swatch', { style: { background: lab.color } }), lab.name);
      overlay.append(el);
      return { el, crown, i };
    });
    this.p = { x: 0, y: 0 };
  }

  showAt(x, y, holdMs) {
    const hit = this.world.pick(x, y);
    if (!hit?.info) return this.hide();
    this.current = hit;
    this.hideAt = holdMs ? performance.now() + holdMs : 0;
    this.render();
    this.el.classList.remove('hidden');
    const r = this.el.getBoundingClientRect();
    const W = window.innerWidth;
    const H = window.innerHeight;
    let left = x + 18;
    let top = y + 18;
    if (left + r.width > W - 8) left = x - r.width - 18;
    if (top + r.height > H - 46) top = y - r.height - 18;
    setStyle(this.el, 'left', `${Math.max(8, left)}px`);
    setStyle(this.el, 'top', `${Math.max(8, top)}px`);
  }

  render() {
    const { at, info } = this.current;
    const s = this.getState();
    setText(this.title, info.title);
    setText(this.text, info.text || '');
    let extra = '';
    if (at.kind === 'lab' && s?.labs) {
      const lab = s.labs[at.id];
      const d = this.sim.derived(s);
      const stance = lab.stance === 'favored' ? ' · FAVORED' : lab.stance === 'embargo' ? ' · EMBARGOED' : '';
      extra = `${info.lab.culture} · capability ${lab.cap.toFixed(1)}${d.leader === at.id ? ' · FRONTIER' : ''} · buys ${Math.round(d.labShares[at.id] * 100)}% of your GPUs${stance}${lab.lastModel ? ` · latest: ${lab.lastModel}` : ''}`;
    } else if (info.bId && s?.owned) {
      const b = this.content.buildings.find((x) => x.id === info.bId);
      const owned = s.owned[info.bId] || 0;
      extra = `You own ${owned}${b.stats.compute ? ` · +${gpus(b.stats.compute)} GPUs each` : ''}`;
    }
    const plot = at.kind === 'plot' ? this.world.city.plots[at.id] : null;
    if (plot?.billboard) extra = `${extra ? `${extra} · ` : ''}Billboard: "${plot.billboard.text}"`;
    setText(this.extra, extra);
    toggle(this.extra, 'hidden', !extra);
  }

  hide() {
    this.current = null;
    this.el.classList.add('hidden');
  }

  // Per frame: expire tap tooltips, keep lab tags pinned to their HQs.
  update(state, derived, playing) {
    if (this.hideAt && performance.now() > this.hideAt) this.hide();
    if (this.current && !this.isActive()) this.hide();
    // Tags only when the city is drawn big enough for them not to pile up.
    const pxPerUnit = this.world.stage.height / this.world.stage.viewSize();
    const show = playing && pxPerUnit >= 20;
    for (const t of this.tags) {
      toggle(t.el, 'hidden', !show);
      if (!show) continue;
      this.world.sitePoint({ kind: 'lab', id: t.i }, this.world.tmp);
      const p = this.world.project(this.world.tmp, this.p);
      setStyle(t.el, 'transform', `translate(${Math.round(p.x)}px, ${Math.round(p.y - 18)}px) translate(-50%, -100%)`);
      toggle(t.crown, 'hidden', !derived || derived.leader !== t.i);
    }
  }
}
