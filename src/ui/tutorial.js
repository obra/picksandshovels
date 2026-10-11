// First-run coaching: short tips triggered by what's happening, one at a time.

import { h } from './dom.js';
import { sprite } from './icons.js';

const TIPS = [
  {
    id: 'welcome',
    when: (s) => s.t > 1.5,
    title: 'WELCOME TO THE VALLEY, CEO',
    text: 'You sell GPUs to the AI labs. Every GPU makes you money, and makes the AI smarter. Try to keep both of those going without ending the world.',
  },
  {
    id: 'incident',
    when: (s) => s.incidents.length > 0,
    title: 'AN INCIDENT',
    text: 'When a bubble pops up over a building, click it before its timer runs out. Missed incidents push p(doom) up.',
  },
  {
    id: 'build',
    when: (s) => s.cash >= 40 && s.t > 10,
    title: 'GO SHOPPING',
    text: 'COMPUTE buildings earn money. SAFETY buildings raise alignment. HYPE buildings keep the investors from wandering off.',
  },
  {
    id: 'inspect',
    when: (s) => s.t > 22,
    title: 'LOOK AROUND',
    text: 'Hover over any building (or tap it) to see what it is. Every shop, lab and billboard in the Valley has something to say.',
  },
  {
    id: 'race',
    when: (s) => s.cap > 6 && s.cap - s.align > 3,
    title: 'THE RACE',
    text: 'Under p(doom): orange is capability, blue is alignment. When orange pulls ahead, doom climbs. Buy SAFETY to catch up.',
  },
  {
    id: 'hype',
    when: (s) => s.hype < 40,
    title: 'HYPE IS COOLING',
    text: 'At zero hype it is AI winter and you are fired. Press 1 to vague-tweet, or buy HYPE buildings.',
  },
  {
    id: 'blimp',
    when: (s) => !!s.blimp,
    title: 'A VC BLIMP',
    text: 'Click it before it drifts off. Free term sheet. There is always free money.',
  },
  {
    id: 'labs',
    when: (s) => s.cap > 14,
    title: 'YOUR CUSTOMERS',
    text: 'Check the LABS tab. The leading lab sets the pace, and reckless leaders make doom climb faster. Favor careful labs, embargo reckless ones.',
  },
  {
    id: 'openweights',
    when: (s) => s.overseas?.drops > 0,
    title: 'OPEN WEIGHTS',
    text: 'An overseas lab gave away a frontier model. GPU demand dips, incidents spike, and the doom floor rises for good. You cannot embargo them. You can only out-align them.',
  },
  {
    id: 'release',
    when: (s) => s.releases >= 1,
    title: 'EUREKA',
    text: 'A lab shipped a new model. Hype goes up, incidents follow. Another ships every 10 capability. At 100, the singularity.',
  },
];

export class Tutorial {
  constructor(root, meta, onFinish) {
    this.root = root;
    this.done = new Set(meta.tipsDone ? TIPS.map((t) => t.id) : []);
    this.onFinish = onFinish;
    this.el = null;
    this.hideAt = 0;
    this.nextAt = 0;
  }

  get finished() {
    return this.done.size >= TIPS.length;
  }

  skipAll() {
    for (const t of TIPS) this.done.add(t.id);
    this.hide();
    this.onFinish();
  }

  update(s, now) {
    if (this.el && now > this.hideAt) this.hide();
    if (this.el || this.finished) return;
    // Give each tip room: never two within 15 seconds.
    if (now < this.nextAt) return;
    const tip = TIPS.find((t) => !this.done.has(t.id) && t.when(s));
    if (!tip) return;
    this.done.add(tip.id);
    this.el = h(
      'div.panel.tip',
      {},
      h('div.who', {}, sprite('shovel')),
      h('div.txt', {}, h('b', {}, tip.title), tip.text),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } }, h('button.btn', { onclick: () => this.hide() }, 'OK'), h('button.btn.ghost', { onclick: () => this.skipAll() }, 'NO TIPS')),
    );
    this.root.append(this.el);
    this.hideAt = now + 14000;
    this.nextAt = now + 15000;
    if (this.finished) this.onFinish();
  }

  hide() {
    this.el?.remove();
    this.el = null;
  }
}
