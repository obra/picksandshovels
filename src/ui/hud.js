// Top bar: brand + date, the p(doom) gauge with hype and the capability vs
// alignment race, and cash.

import { h, setText, setStyle, toggle } from './dom.js';
import { icon, sprite } from './icons.js';
import { money, gpus, pct } from './format.js';
import { B } from '../sim/balance.js';

const BUFF_LABEL = { capRate: 'TRAINING', alignRate: 'SAFETY', hypeDecay: 'HYPE DECAY', incidentRate: 'INCIDENTS', revenue: 'REVENUE' };
// Whether a multiplier above 1 is good for the player.
const BUFF_UP_GOOD = { capRate: false, alignRate: true, hypeDecay: false, incidentRate: false, revenue: true };

function meter(cls, label, iconName) {
  const fill = h('div.fill');
  const bar = h('div.bar', {}, fill);
  const val = h('div.val');
  const el = h(`div.meter.${cls}`, {}, h('div.lbl', {}, icon(iconName), label), bar, val);
  return { el, fill, bar, val };
}

export class Hud {
  constructor(root, { onPause, onMute, isMuted, onRotate }) {
    this.date = h('div.date');
    this.era = h('div.era');
    const brand = h('div.panel.brand', {}, h('div.logo', {}, sprite('pick')), h('div', {}, h('div.name', {}, 'PICKS &', h('br'), 'SHOVELS'), this.date, this.era));

    this.doomFill = h('div.doom-fill');
    this.doomFloor = h('div.doom-floor');
    this.doomPct = h('div.doom-pct');
    this.hype = meter('hype', 'Hype', 'flame');
    this.cap = meter('cap', 'Capability', 'brain');
    this.align = meter('align', 'Alignment', 'shield');
    for (const def of B.bosses) {
      this.cap.bar.append(h('div.tick.boss-tick', { style: { left: `${def.at}%` }, title: `Something big arrives at ${def.at}` }));
    }
    for (let i = 10; i < 100; i += 10) this.cap.bar.append(h('div.tick', { style: { left: `${i}%` } }));
    this.gapNote = h('div.gap-note');
    this.meters = h(
      'div.panel.meters',
      {},
      h('div.doom-row', {}, h('div.doom-label', {}, icon('skull'), 'p(doom)'), h('div.doom-bar', {}, this.doomFill, this.doomFloor), this.doomPct),
      h('div.sub-meters', {}, this.cap.el, this.hype.el, this.align.el, h('div.meter.spacer'), this.gapNote),
    );

    this.cash = h('div.cash');
    this.rev = h('div.rev');
    this.gpus = h('div.gpus');
    this.buffs = h('div.buffs');
    this.muteBtn = h('button.btn.icon-btn', { title: 'Sound (M)', onclick: () => this.updateMute(onMute()) });
    const pauseBtn = h('button.btn.icon-btn', { title: 'Pause (P)', onclick: onPause }, icon('pause'));
    const rotL = h('button.btn.icon-btn', { title: 'Rotate city (Q)', onclick: () => onRotate(-1) }, icon('rotl'));
    const rotR = h('button.btn.icon-btn', { title: 'Rotate city (E)', onclick: () => onRotate(1) }, icon('rotr'));
    const money_ = h('div', {}, h('div.panel.money', {}, this.cash, this.rev, this.gpus, this.buffs), h('div.hud-buttons', {}, rotL, rotR, this.muteBtn, pauseBtn));
    this.updateMute(isMuted());

    this.el = h('div.hud', {}, brand, this.meters, money_);
    root.append(this.el);
    this.lastBuffKey = '';
  }

  updateMute(muted) {
    this.muteBtn.replaceChildren(icon(muted ? 'mute' : 'sound'));
  }

  update(s, d, sim) {
    const date = sim.date(s);
    setText(this.date, `${date.year} Q${date.quarter}`);
    setText(this.era, d.eraName);

    setStyle(this.doomFill, 'width', `${Math.min(100, s.doom)}%`);
    setStyle(this.doomFloor, 'left', `${Math.min(99, d.doomFloor)}%`);
    setText(this.doomPct, pct(s.doom));
    toggle(this.meters, 'danger', s.doom >= 75);

    setStyle(this.hype.fill, 'width', `${s.hype}%`);
    setText(this.hype.val, pct(s.hype));
    toggle(this.hype.el, 'low', s.hype < 20);
    setStyle(this.cap.fill, 'width', `${s.cap}%`);
    setText(this.cap.val, Math.floor(s.cap).toString());
    setStyle(this.align.fill, 'width', `${Math.min(100, s.align)}%`);
    setText(this.align.val, Math.floor(s.align).toString());

    const gap = s.cap - s.align;
    let note = '';
    let cls = '';
    if (d.paused) {
      note = `TRAINING PAUSED ${Math.ceil(s.pauseLeft)}s`;
      cls = 'good';
    } else if (gap > 8) {
      note = `Capability is ${Math.round(gap)} ahead of alignment: p(doom) climbing`;
      cls = 'bad';
    } else if (gap < -8) {
      note = 'Alignment is ahead: p(doom) easing';
      cls = 'good';
    } else if (s.hype < 20 && s.doom >= B.collapseDoom) {
      note = 'Hype is running out with the world on fire: SOCIETAL COLLAPSE ahead';
      cls = 'bad';
    } else if (s.hype < 20) {
      note = 'Hype is running out: AI WINTER is coming';
      cls = 'bad';
    }
    setText(this.gapNote, note);
    toggle(this.gapNote, 'bad', cls === 'bad');
    toggle(this.gapNote, 'good', cls === 'good');

    setText(this.cash, money(s.cash));
    setText(this.rev, `+${money(d.revenue)}/s`);
    setText(this.gpus, `${gpus(d.compute)} GPUs sold to labs`);

    const key = s.buffs.map((b) => `${b.stat}${b.mult}${Math.ceil(b.left)}`).join('|');
    if (key !== this.lastBuffKey) {
      this.lastBuffKey = key;
      this.buffs.replaceChildren(
        ...s.buffs.map((b) => {
          const up = b.mult > 1;
          const good = up === BUFF_UP_GOOD[b.stat];
          return h(`span.buff${good ? '' : '.bad'}`, {}, `${BUFF_LABEL[b.stat] || b.stat} ×${b.mult} ${Math.ceil(b.left)}s`);
        }),
      );
    }
  }
}
