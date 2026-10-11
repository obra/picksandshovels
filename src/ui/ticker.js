// The news ticker: a constant crawl of headlines picked to match the moment,
// with breaking news (failures, releases, events) jumping the queue.

import { h } from './dom.js';

const SPEED = 90; // px per second

export class Ticker {
  constructor(root, content) {
    this.content = content;
    this.tag = h('div.tag', {}, 'NEWS');
    this.track = h('div.track');
    this.el = h('div.ticker', {}, this.tag, this.track);
    root.append(this.el);
    this.queue = [];
    this.current = null;
    this.recent = [];
    this.stockPrices = Object.fromEntries((content.flavor.TICKER_SYMBOLS || []).map((t) => [t.sym, 100 + Math.random() * 400]));
  }

  clear() {
    this.queue = [];
    this.current = null;
    this.track.replaceChildren();
  }

  breaking(text) {
    if (!text) return;
    this.queue.unshift({ text, breaking: true });
    if (this.queue.length > 4) this.queue.length = 4;
    // Breaking news cuts off whatever filler is crawling.
    if (this.current && !this.current.breaking) this.current.x = -1e9;
  }

  fill(text, s) {
    const lab = this.content.labs[Math.floor(Math.random() * this.content.labs.length)].name;
    const year = s ? 2023 + Math.floor(s.t / 80) : 2023;
    return text.replaceAll('{lab}', lab).replaceAll('{model}', s?.lastModel || 'Glorp-1').replaceAll('{year}', String(year));
  }

  pickHeadline(s) {
    const H = this.content.headlines;
    const pools = [];
    if (!s) pools.push(H.calm);
    else {
      const band = s.doom < 25 ? H.calm : s.doom < 50 ? H.uneasy : s.doom < 75 ? H.alarming : H.apocalyptic;
      pools.push(band, band, H.eras[s.era]);
      if (s.hype < 25) pools.push(H.winter, H.winter);
      if (s.hype > 80) pools.push(H.boom);
      if (s.overseas?.drops > 0 && this.content.overseas) pools.push(this.content.overseas.headlines);
    }
    for (let tries = 0; tries < 8; tries++) {
      const pool = pools[Math.floor(Math.random() * pools.length)];
      const text = pool[Math.floor(Math.random() * pool.length)];
      if (!this.recent.includes(text)) {
        this.recent = [...this.recent.slice(-30), text];
        return this.fill(text, s);
      }
    }
    return this.fill(pools[0][0], s);
  }

  stocks(s) {
    const syms = this.content.flavor.TICKER_SYMBOLS || [];
    const picks = syms.slice().sort(() => Math.random() - 0.5).slice(0, 4);
    const bias = s ? (s.hype - 50) / 50 : 0.3;
    return picks.map((t) => {
      const ch = (Math.random() - 0.45 + bias * 0.3) * 9;
      this.stockPrices[t.sym] *= 1 + ch / 100;
      return { sym: t.sym, price: this.stockPrices[t.sym], ch };
    });
  }

  next(s) {
    let item = this.queue.shift();
    if (!item) {
      if (Math.random() < 0.25) item = { stocks: this.stocks(s) };
      else item = { text: this.pickHeadline(s) };
    }
    const line = h('div.line');
    if (item.stocks) {
      for (const st of item.stocks) {
        line.append(h(`span.stock${st.ch < 0 ? '.down' : ''}`, {}, `${st.sym} ${st.price.toFixed(2)} ${st.ch < 0 ? '▼' : '▲'}${Math.abs(st.ch).toFixed(1)}%`));
      }
    } else {
      line.append(h(item.breaking ? 'span.breaking' : 'span', {}, item.text));
    }
    this.tag.textContent = item.breaking ? 'BREAKING' : item.stocks ? 'MARKETS' : 'NEWS';
    this.tag.classList.toggle('calm', !item.breaking);
    this.track.replaceChildren(line);
    this.current = { line, x: this.track.clientWidth, w: 0, breaking: !!item.breaking };
  }

  update(dt, s) {
    if (!this.current) this.next(s);
    const c = this.current;
    if (!c.w) c.w = c.line.offsetWidth;
    c.x -= SPEED * dt;
    c.line.style.transform = `translate(${Math.round(c.x)}px, -50%)`;
    if (c.x < -c.w - 30) this.next(s);
  }
}
