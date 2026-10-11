// Ability buttons: vague-tweet, pause training, Big Red Button.

import { h, setText, setStyle, toggle } from './dom.js';
import { icon } from './icons.js';
import { B } from '../sim/balance.js';

const DEFS = [
  { kind: 'tweet', key: '1', cls: 'tweet', icon: 'bird', label: 'VAGUE\nTWEET', title: 'Post "something big is coming 👀". +hype. Slightly unsettling.' },
  { kind: 'pause', key: '2', cls: 'pause-ab', icon: 'pause', label: 'PAUSE\nTRAINING', title: 'Freeze capability for 15s. Investors hate it.' },
  { kind: 'red', key: '3', cls: 'red', icon: 'button', label: 'BIG RED\nBUTTON', title: 'Shut down every open incident (and hurt a boss). Limited charges.' },
];

export class Abilities {
  constructor(root, { onUse }) {
    this.btns = {};
    const el = h('div.abilities');
    for (const d of DEFS) {
      const cd = h('div.cd');
      const charges = h('div.charges');
      const b = h(`button.ability.${d.cls}`, { title: d.title, onclick: () => onUse(d.kind) }, h('div.key', {}, d.key), charges, icon(d.icon), h('div.lbl', { html: d.label.replace('\n', '<br>') }), cd);
      this.btns[d.kind] = { b, cd, charges };
      el.append(b);
    }
    root.append(el);
  }

  update(s) {
    const tw = this.btns.tweet;
    const twFrac = s.cooldowns.tweet / B.tweet.cooldown;
    setStyle(tw.cd, 'clipPath', `inset(${(1 - twFrac) * 100}% 0 0 0)`);
    toggle(tw.b, 'ready', twFrac <= 0 && s.hype < 40);

    const pa = this.btns.pause;
    const paLocked = !s.pauseUnlocked;
    toggle(pa.b, 'locked', paLocked);
    const paFrac = s.pauseLeft > 0 ? 1 : s.cooldowns.pause / B.pause.cooldown;
    setStyle(pa.cd, 'clipPath', paLocked ? 'inset(0 0 0 0)' : `inset(${(1 - paFrac) * 100}% 0 0 0)`);
    setText(pa.charges, paLocked ? '' : s.pauseLeft > 0 ? `${Math.ceil(s.pauseLeft)}s` : '');

    const rd = this.btns.red;
    toggle(rd.b, 'locked', !s.redUnlocked);
    setStyle(rd.cd, 'clipPath', s.redCharges > 0 ? 'inset(100% 0 0 0)' : 'inset(0 0 0 0)');
    setText(rd.charges, s.redUnlocked ? `×${s.redCharges}` : '');
    toggle(rd.b, 'ready', s.redCharges > 0 && (s.incidents.length >= 5 || !!s.boss));
  }
}
