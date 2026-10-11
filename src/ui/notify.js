// Banners (big center announcements), the boss banner, and toasts.
//
// Everything queues: one banner at a time and at most two toasts, each held
// long enough to read its text. The writing is the point, so nothing should
// flash past.

import { h, setStyle } from './dom.js';
import { icon } from './icons.js';

// Reading time: a base plus a little per character.
function readMs(text, base) {
  return base + String(text || '').length * 45;
}

export class Notify {
  constructor(root) {
    this.banners = h('div.banner-wrap');
    this.toasts = h('div.toasts');
    root.append(this.banners, this.toasts);
    this.bossBanner = null;
    this.bannerQueue = [];
    this.bannerBusy = false;
    this.toastQueue = [];
    this.toastsShown = 0;
    this.gen = 0; // bumped by clear(); timers from before a clear do nothing
  }

  // ms is a minimum; long text stays up longer.
  banner(kind, kicker, big, small, ms = 4200) {
    this.bannerQueue.push({ kind, kicker, big, small, ms: Math.max(ms, readMs(`${big} ${small}`, 2500)) });
    if (this.bannerQueue.length > 4) this.bannerQueue.shift(); // stale news is no news
    this.nextBanner();
  }

  nextBanner() {
    if (this.bannerBusy || !this.bannerQueue.length) return;
    const b = this.bannerQueue.shift();
    this.bannerBusy = true;
    const gen = this.gen;
    const el = h(`div.panel.banner.${b.kind}`, {}, h('div.kicker', {}, b.kicker), b.big ? h('div.big', {}, b.big) : null, b.small ? h('div.small', {}, b.small) : null);
    this.banners.append(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => {
        el.remove();
        if (gen !== this.gen) return;
        this.bannerBusy = false;
        setTimeout(() => this.nextBanner(), 250);
      }, 320);
    }, b.ms);
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

  toast(kicker, text, iconName = 'star', ms = 4000) {
    this.toastQueue.push({ kicker, text, iconName, ms: Math.max(ms, readMs(text, 3000)) });
    if (this.toastQueue.length > 6) this.toastQueue.shift();
    this.nextToast();
  }

  nextToast() {
    if (this.toastsShown >= 2 || !this.toastQueue.length) return;
    const t = this.toastQueue.shift();
    this.toastsShown++;
    const gen = this.gen;
    const el = h('div.panel.toast', {}, icon(t.iconName), h('div', {}, h('div.t1', {}, t.kicker), h('div.t2', {}, t.text)));
    this.toasts.append(el);
    setTimeout(() => {
      el.style.animation = 'fade-out 300ms steps(3) forwards';
      setTimeout(() => {
        el.remove();
        if (gen !== this.gen) return;
        this.toastsShown--;
        setTimeout(() => this.nextToast(), 400);
      }, 320);
    }, t.ms);
  }

  clear() {
    this.banners.replaceChildren();
    this.toasts.replaceChildren();
    this.bossBanner = null;
    this.bannerQueue = [];
    this.toastQueue = [];
    this.bannerBusy = false;
    this.toastsShown = 0;
    this.gen++;
  }
}
