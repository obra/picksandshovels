// Banners (big center announcements), the boss banner, toasts, and tips.

import { h, setStyle } from './dom.js';
import { icon } from './icons.js';

export class Notify {
  constructor(root) {
    this.banners = h('div.banner-wrap');
    this.toasts = h('div.toasts');
    root.append(this.banners, this.toasts);
    this.bossBanner = null;
  }

  banner(kind, kicker, big, small, ms = 4200) {
    const el = h(`div.panel.banner.${kind}`, {}, h('div.kicker', {}, kicker), big ? h('div.big', {}, big) : null, small ? h('div.small', {}, small) : null);
    this.banners.append(el);
    const plain = [...this.banners.children].filter((c) => c !== this.bossBanner);
    for (let i = 0; i < plain.length - 2; i++) plain[i].remove();
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 320);
    }, ms);
    return el;
  }

  boss(kicker, big, small) {
    this.endBoss();
    const bar = h('i');
    this.bossBanner = h('div.panel.banner.boss', {}, h('div.kicker', {}, kicker), h('div.big', {}, big), h('div.small', {}, small), h('div.bt', {}, bar));
    this.bossBanner.bar = bar;
    this.banners.prepend(this.bossBanner);
  }

  updateBoss(frac) {
    if (this.bossBanner) setStyle(this.bossBanner.bar, 'width', `${Math.max(0, frac) * 100}%`);
  }

  endBoss() {
    this.bossBanner?.remove();
    this.bossBanner = null;
  }

  toast(kicker, text, iconName = 'star', ms = 3800) {
    const el = h('div.panel.toast', {}, icon(iconName), h('div', {}, h('div.t1', {}, kicker), h('div.t2', {}, text)));
    this.toasts.append(el);
    while (this.toasts.childElementCount > 4) this.toasts.firstChild.remove();
    setTimeout(() => {
      el.classList.add('out');
      el.style.animation = 'fade-out 300ms steps(3) forwards';
      setTimeout(() => el.remove(), 320);
    }, ms);
  }

  clear() {
    this.banners.replaceChildren();
    this.toasts.replaceChildren();
    this.bossBanner = null;
  }
}
