// The build panel: four tabs (compute, safety, hype, upgrades). Click buys
// one; shift-click buys as many as you can afford, up to ten.

import { h, setText, toggle } from './dom.js';
import { icon, CATEGORY_ICON } from './icons.js';
import { money, gpus } from './format.js';
import { ERAS } from '../sim/sim.js';

const TABS = [
  { cat: 'compute', label: 'COMPUTE', hint: 'Sell GPUs to the labs. Money now, capability (and doom) later.' },
  { cat: 'safety', label: 'SAFETY', hint: 'Fund alignment research. Keep the blue bar ahead of the orange one.' },
  { cat: 'hype', label: 'HYPE', hint: 'Keep investors excited, or the AI Winter freezes you out.' },
  { cat: 'upgrades', label: 'UPGRADES', hint: 'One-time research and policy. Some of it even works.' },
];

function eraFor(minCap) {
  return ERAS[Math.min(4, Math.floor((minCap || 0) / 20))];
}

function statLine(b) {
  const s = b.stats;
  const parts = [];
  if (s.compute) parts.push(`+${gpus(s.compute)} GPUs`);
  if (s.research) parts.push(`+${s.research < 10 ? s.research : Math.round(s.research).toLocaleString()} research/s`);
  if (s.hype) parts.push(`+${s.hype} hype/s`);
  if (s.incidentReduce) parts.push(`-${Math.round(s.incidentReduce * 100)}% incidents`);
  if (s.incidentTime) parts.push(`+${Math.round(s.incidentTime * 100)}% incident time`);
  if (s.autoResolve) parts.push('auto-fixes small incidents');
  if (s.doomDamp) parts.push(`-${Math.round(s.doomDamp * 100)}% gap doom`);
  return parts.join(' · ');
}

export class Shop {
  constructor(root, { sim, onBuy, onBuyUpgrade, onHover }) {
    this.sim = sim;
    this.cat = 'compute';
    this.onBuy = onBuy;
    this.onBuyUpgrade = onBuyUpgrade;
    this.onHover = onHover;
    this.tabEls = {};
    const tabs = h('div.tabs');
    for (const t of TABS) {
      const el = h('button.tab', { 'data-cat': t.cat, onclick: () => this.setTab(t.cat) }, icon(CATEGORY_ICON[t.cat]), t.label, h('span.badge', {}, 'NEW'));
      this.tabEls[t.cat] = el;
      tabs.append(el);
    }
    this.hint = h('div.shop-hint');
    this.list = h('div.items');
    this.desc = h('div.desc', {}, h('b', {}, 'PICKS & SHOVELS INC.'), 'Est. 1849. In a gold rush, sell picks and shovels. Hover anything for details.');
    this.el = h('div.panel.shop', {}, tabs, this.hint, this.list, this.desc);
    this.toggleBtn = h('button.btn.shop-toggle', { onclick: () => this.el.classList.toggle('open') }, icon('shovel'), 'BUILD');
    root.append(this.el, this.toggleBtn);

    this.rows = [];
    for (const b of sim.content.buildings) this.rows.push(this.makeRow(b, b.cat, false));
    for (const u of sim.content.upgrades) this.rows.push(this.makeRow(u, 'upgrades', true));
    this.setTab('compute');
  }

  makeRow(item, cat, isUpgrade) {
    const nm = h('div.nm');
    const st = h('div.st');
    const cost = h('div.cost');
    const own = h('div.own');
    const el = h('div.item', { 'data-cat': cat }, h('div.ico', {}, icon(isUpgrade ? 'star' : CATEGORY_ICON[cat])), h('div', {}, nm, st, cost), own);
    const row = { item, cat, isUpgrade, el, nm, st, cost, own };
    el.addEventListener('click', (e) => {
      if (row.locked) return;
      if (isUpgrade) this.onBuyUpgrade(item.id, el);
      else {
        const n = e.shiftKey ? 10 : 1;
        for (let i = 0; i < n; i++) if (!this.onBuy(item.id, el, i === 0)) break;
      }
      this.showDesc(row);
    });
    el.addEventListener('mouseenter', () => this.showDesc(row));
    this.list.append(el);
    return row;
  }

  showDesc(row) {
    if (row.locked) {
      this.desc.replaceChildren(h('b', {}, '???'), `Unlocks in the ${eraFor(row.item.minCap)} (capability ${row.item.minCap}).`);
      return;
    }
    const stat = row.isUpgrade ? '' : statLine(row.item);
    this.desc.replaceChildren(h('b', {}, row.item.name.toUpperCase()), row.item.desc, stat ? h('div', { style: { marginTop: '6px', color: '#3f7ff2' } }, stat) : '');
  }

  setTab(cat) {
    this.cat = cat;
    for (const [c, el] of Object.entries(this.tabEls)) toggle(el, 'active', c === cat);
    setText(this.hint, TABS.find((t) => t.cat === cat).hint);
    for (const r of this.rows) r.el.style.display = r.cat === cat ? '' : 'none';
    this.list.scrollTop = 0;
  }

  update(s) {
    const affordable = { compute: false, safety: false, hype: false, upgrades: false };
    let lockedShown = { compute: 0, safety: 0, hype: 0, upgrades: 0 };
    for (const r of this.rows) {
      const it = r.item;
      const unlocked = this.sim.isUnlocked(s, it.minCap);
      const bought = r.isUpgrade && s.upgrades[it.id];
      const cost = r.isUpgrade ? it.cost : this.sim.buildingCost(s, it.id);
      // Show only the next locked item per tab, as a teaser.
      const teaser = !unlocked && lockedShown[r.cat]++ === 0;
      r.locked = !unlocked;
      toggle(r.el, 'locked', !unlocked);
      toggle(r.el, 'bought', !!bought || (!unlocked && !teaser));
      if (!unlocked) {
        setText(r.nm, `??? · ${eraFor(it.minCap).toUpperCase()}`);
        setText(r.st, '');
        setText(r.cost, '');
        setText(r.own, '');
        continue;
      }
      setText(r.nm, it.name);
      setText(r.st, r.isUpgrade ? it.desc.split('.')[0] + '.' : statLine(it));
      setText(r.cost, money(cost));
      setText(r.own, r.isUpgrade ? '' : String(s.owned[it.id] || 0));
      const poor = s.cash < cost;
      toggle(r.el, 'poor', poor);
      if (!poor && !bought) affordable[r.cat] = true;
    }
    for (const [cat, el] of Object.entries(this.tabEls)) toggle(el, 'has-affordable', affordable[cat] && cat !== this.cat && cat === 'upgrades');
  }

  flash(el) {
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }
}
