// Reigns-style decision cards. Options show which meters they touch, not by
// how much; the result reveals the punchline and the damage.

import { h } from './dom.js';
import { icon } from './icons.js';
import { money } from './format.js';

const FX_ICONS = [
  ['doom', 'skull'],
  ['hype', 'flame'],
  ['align', 'shield'],
  ['cap', 'brain'],
  ['revSecs', 'coin'],
  ['cashMult', 'coin'],
  ['buff', 'clock'],
  ['stance', 'brain'],
];
const BUFF_NAMES = { capRate: 'TRAINING', alignRate: 'SAFETY RESEARCH', hypeDecay: 'HYPE DECAY', incidentRate: 'INCIDENTS', revenue: 'REVENUE' };
const BUFF_UP_GOOD = { capRate: false, alignRate: true, hypeDecay: false, incidentRate: false, revenue: true };

export class Cards {
  constructor(root, { onChoose, onDone }) {
    this.root = root;
    this.onChoose = onChoose;
    this.onDone = onDone;
    this.el = null;
    this.keyHandler = (e) => {
      if (!this.el) return;
      if (this.mode === 'choose' && /^[1-3]$/.test(e.key)) {
        const i = Number(e.key) - 1;
        if (i < this.options.length) this.choose(i);
      } else if (this.mode === 'result' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        this.close();
      }
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  get open() {
    return !!this.el;
  }

  // tokens: { leader, rival } lab names, filled into {leader} and {rival}.
  show(event, labName, tokens = {}) {
    this.mode = 'choose';
    this.event = event;
    this.options = event.options;
    this.fill = (t) => String(t).replaceAll('{leader}', tokens.leader ?? 'the leading lab').replaceAll('{rival}', tokens.rival ?? 'its rival');
    const fill = this.fill;
    const opts = h('div.opts');
    event.options.forEach((opt, i) => {
      const fx = h('span.fx');
      for (const [k, ic] of FX_ICONS) if (opt.effects && opt.effects[k] !== undefined) fx.append(icon(ic));
      opts.append(h('button.btn.opt', { onclick: () => this.choose(i) }, h('span', {}, h('span.k', {}, `${i + 1}`), fill(opt.label)), fx));
    });
    this.card = h('div.panel.card', {}, h('div.head', {}, h('div.t', {}, fill(event.title).toUpperCase()), h('div.src', {}, labName ? `RE: ${labName.toUpperCase()}` : 'MEMO')), h('div.body', {}, fill(event.body)), opts);
    this.el = h('div.modal', {}, this.card);
    this.root.append(this.el);
  }

  choose(i) {
    if (this.mode !== 'choose') return;
    this.mode = 'pending';
    this.onChoose(i);
  }

  // Called after the sim applied the option.
  showResult(opt, cashDelta) {
    this.mode = 'result';
    const chips = h('div.result-fx');
    const e = opt.effects || {};
    const chip = (text, good) => chips.append(h(`span.chip.${good ? 'good' : 'bad'}`, {}, text));
    if (e.doom) chip(`P(DOOM) ${e.doom > 0 ? '+' : ''}${e.doom}`, e.doom < 0);
    if (e.hype) chip(`HYPE ${e.hype > 0 ? '+' : ''}${e.hype}`, e.hype > 0);
    if (e.align) chip(`ALIGNMENT ${e.align > 0 ? '+' : ''}${e.align}`, e.align > 0);
    if (e.cap) chip(`CAPABILITY ${e.cap > 0 ? '+' : ''}${e.cap}`, e.cap < 0);
    if (Math.abs(cashDelta) >= 0.001) chip(`${cashDelta > 0 ? '+' : '-'}${money(Math.abs(cashDelta))}`, cashDelta > 0);
    if (e.buff) chip(`${BUFF_NAMES[e.buff.stat] || e.buff.stat} ×${e.buff.mult} FOR ${e.buff.secs}s`, (e.buff.mult > 1) === BUFF_UP_GOOD[e.buff.stat]);
    const opts = this.card.querySelector('.opts');
    if (e.stance) chip(`${e.stance.stance === 'embargo' ? 'EMBARGO' : e.stance.stance === 'favored' ? 'FAVOR' : 'NORMAL'}: ${(this.stanceName || '').toUpperCase()}`, e.stance.stance === 'embargo' ? e.stance.target === 'reckless' : e.stance.target !== 'reckless');
    opts.replaceWith(h('div.result', {}, h('div', {}, h('b', {}, `"${this.fill(opt.label)}" `)), this.fill(opt.result), chips.childElementCount ? chips : null));
    this.card.append(h('div.foot', {}, h('button.btn', { onclick: () => this.close() }, 'CONTINUE >')));
  }

  close() {
    this.el?.remove();
    this.el = null;
    this.mode = null;
    this.onDone();
  }
}
