// The build panel: four tabs (compute, safety, hype, upgrades). Click buys
// one; shift-click buys as many as you can afford, up to ten.

import { h, setText, setStyle, toggle } from './dom.js';
import { icon, CATEGORY_ICON } from './icons.js';
import { money, gpus, big } from './format.js';
import { B } from '../sim/balance.js';
import { ERAS } from '../sim/sim.js';

const TAB_ICON = { ...CATEGORY_ICON, labs: 'brain' };
const TABS = [
  { cat: 'compute', label: 'COMPUTE', hint: 'Sell GPUs to the labs. Money now, capability (and doom) later.' },
  { cat: 'safety', label: 'SAFETY', hint: 'Fund alignment research. Keep the blue bar ahead of the orange one.' },
  { cat: 'hype', label: 'HYPE', hint: 'Keep investors excited, or the AI Winter freezes you out.' },
  { cat: 'upgrades', label: 'UPGRADES', hint: 'One-time research and policy. Some of it even works.' },
  { cat: 'labs', label: 'LABS', hint: 'Your customers. The lab at the frontier sets the pace, and its recklessness sets how fast doom climbs. Favor or embargo.' },
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
  constructor(root, { sim, onBuy, onBuyUpgrade, onLabStance, onTab }) {
    this.sim = sim;
    this.onTab = onTab;
    this.onLabStance = onLabStance;
    this.cat = 'compute';
    this.onBuy = onBuy;
    this.onBuyUpgrade = onBuyUpgrade;
    this.tabEls = {};
    const tabs = h('div.tabs');
    for (const t of TABS) {
      const el = h('button.tab', { 'data-cat': t.cat, onclick: () => { this.setTab(t.cat); this.onTab?.(t.cat); } }, icon(TAB_ICON[t.cat]), t.label, h('span.badge', {}, 'NEW'));
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
    this.labRows = sim.content.labs.map((lab, i) => this.makeLabRow(lab, i));
    this.overseasRows = (sim.content.overseas?.labs || []).map((lab) => this.makeOverseasRow(lab));
    this.setTab('compute');
  }

  makeLabRow(lab, i) {
    const capFill = h('i');
    const capVal = h('span.capv');
    const crown = h('span.crown', {}, icon('crown'), 'FRONTIER');
    const tokens = h('div.tok');
    const model = h('div.mdl');
    const favor = h('button.stance.favor', { onclick: () => this.onStance(lab.id, 'favored') }, 'FAVOR');
    const embargo = h('button.stance.embargo', { onclick: () => this.onStance(lab.id, 'embargo') }, 'EMBARGO');
    const reck = Math.round((lab.reckless ?? 0.5) * 5);
    const el = h(
      'div.lab',
      { 'data-cat': 'labs' },
      h('div.lab-top', {}, h('span.swatch', { style: { background: lab.color } }), h('span.lab-name', {}, lab.name), crown),
      h('div.lab-meta', {}, h('span.culture', { title: 'Recklessness' }, `${lab.culture || ''}${lab.openWeights ? ' · open weights' : ''} `, h('span.reck', {}, '!'.repeat(Math.max(1, reck)))), h('span.share')),
      h('div.lab-cap', {}, h('div.capbar', {}, capFill), capVal),
      tokens,
      model,
      h('div.lab-btns', {}, favor, embargo),
    );
    el.addEventListener('mouseenter', () =>
      this.desc.replaceChildren(h('b', {}, lab.name.toUpperCase()), `"${lab.slogan}" Recklessness ${'!'.repeat(Math.max(1, reck))}. When this lab leads, gap doom runs at ×${(B.recklessBase + B.recklessScale * (lab.reckless ?? 0.5)).toFixed(2)}.`),
    );
    this.list.append(el);
    return { lab, i, el, capFill, capVal, crown, tokens, model, favor, embargo, share: el.querySelector('.share') };
  }

  // DeepSeep: not a customer, so no buttons. Just a reminder that it exists.
  makeOverseasRow(lab) {
    const status = h('div.tok');
    const model = h('div.mdl');
    const el = h(
      'div.lab.overseas',
      { 'data-cat': 'labs', style: { order: '99' } },
      h('div.lab-top', {}, h('span.swatch', { style: { background: lab.color } }), h('span.lab-name', {}, lab.name), h('span.crown.open', {}, 'OPEN WEIGHTS')),
      h('div.lab-meta', {}, h('span.culture', {}, 'Overseas · not your customer · cannot be embargoed')),
      status,
      model,
    );
    el.addEventListener('mouseenter', () =>
      this.desc.replaceChildren(h('b', {}, lab.name.toUpperCase()), `"${lab.slogan}" After every frontier release from the second on, one of the overseas labs drops open weights: GPU demand crashes, incidents spike, and the doom floor rises for good.`),
    );
    this.list.append(el);
    return { lab, el, status, model };
  }

  onStance(labId, stance) {
    const row = this.labRows.find((r) => r.lab.id === labId);
    const current = this.state?.labs[row.i].stance;
    this.onLabStance(labId, current === stance ? 'normal' : stance);
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
    for (const r of this.labRows || []) r.el.style.display = cat === 'labs' ? '' : 'none';
    for (const r of this.overseasRows || []) r.el.style.display = cat === 'labs' ? '' : 'none';
    this.list.scrollTop = 0;
  }

  updateLabs(s) {
    const d = this.sim.derived(s);
    const o = s.overseas;
    for (const row of this.overseasRows) {
      const n = o.byLab?.[row.lab.id] || 0;
      const next = o.pending ? ` · next drop from someone in ~${Math.ceil(o.pending.in)}s` : '';
      setText(row.status, n ? `${n} drop${n > 1 ? 's' : ''}${next}` : `No drops yet${next}`);
      setText(row.model, n ? `Latest: ${row.lab.drops[(n - 1) % row.lab.drops.length].name}` : '');
    }
    const order = this.labRows.slice().sort((a, b) => s.labs[b.i].cap - s.labs[a.i].cap);
    order.forEach((r, rank) => {
      const lab = s.labs[r.i];
      r.el.style.order = String(rank);
      setStyle(r.capFill, 'width', `${Math.min(100, lab.cap)}%`);
      setStyle(r.capFill, 'background', r.lab.color);
      setText(r.capVal, lab.cap.toFixed(1));
      toggle(r.crown, 'hidden', r.i !== d.leader);
      setText(r.tokens, `${big(((d.compute * d.labShares[r.i] + d.labCompute * d.labBaseShares[r.i]) * B.tokensPerComputeSec * 86400))} tokens/day · ${big(lab.tokens)} burned`);
      setText(r.model, lab.lastModel ? `Latest: ${lab.lastModel}` : 'No frontier release yet');
      setText(r.share, `buys ${Math.round(d.labShares[r.i] * 100)}% of your GPUs`);
      toggle(r.favor, 'on', lab.stance === 'favored');
      toggle(r.embargo, 'on', lab.stance === 'embargo');
      toggle(r.el, 'embargoed', lab.stance === 'embargo');
    });
  }

  update(s) {
    this.state = s;
    if (this.cat === 'labs') this.updateLabs(s);
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
