// The game controller: owns the sim state, runs the frame loop, routes sim
// events to the renderer, UI and audio, and handles runs, saves and endings.

import { createSim, MAP } from './sim/sim.js';
import { B } from './sim/balance.js';
import { CONTENT } from './content/index.js';
import { ACHIEVEMENTS, ENDING_IDS, endingId } from './content/achievements.js';
import { World } from './render/world.js';
import { audio } from './audio/audio.js';
import { Hud } from './ui/hud.js';
import { Shop } from './ui/shop.js';
import { Abilities } from './ui/abilities.js';
import { Ticker } from './ui/ticker.js';
import { Targets } from './ui/targets.js';
import { Cards } from './ui/cards.js';
import { Notify } from './ui/notify.js';
import { Tutorial } from './ui/tutorial.js';
import { titleScreen, howToScreen, pauseScreen, rollScreen, endingScreen } from './ui/screens.js';
import { loadMeta, saveMeta, loadGame, saveGame, clearGame } from './ui/storage.js';
import { money } from './ui/format.js';
import { h } from './ui/dom.js';

const ERA_BLURBS = [
  '',
  'Every app now has a sparkle button. Nobody asked for the sparkle button.',
  'The models can use computers now. They have opinions about your desktop.',
  'It is smarter than everyone at the board meeting. The board meeting is still happening.',
  'Things are moving very fast. Please keep your hands inside the civilization.',
];

const BOSS_INTRO = {
  shoggoth: ['SOMETHING IS RISING FROM THE BAY', 'THE SHOGGOTH', 'Click its tentacles to put smiley masks on them. That is how RLHF works. Probably.'],
  replication: ['WEIGHTS EXFILTRATED', 'ROGUE WEIGHTS ARE COPYING THEMSELVES', 'Click every glowing copy before it copies itself. Do not let it reach 16.'],
  paperclip: ['PRODUCTION ANOMALY', 'THE PAPERCLIP MAXIMIZER', 'Clear the paperclip piles and SMASH the factory core. Nine piles and it wins.'],
};

export class Game {
  constructor() {
    this.sim = createSim(CONTENT);
    this.meta = loadMeta();
    this.ui = document.getElementById('ui');
    this.overlay = document.getElementById('overlay');
    this.world = new World(document.getElementById('stage'), MAP, CONTENT);
    this.world.city.onLand = () => audio.sfx('build');
    this.state = this.sim.newGame(12345);
    this.world.reset(this.state);
    this.mode = 'title';
    this.closeScreen = null;
    this.uiBuilt = false;
    this.saveTimer = 0;
    this.achTimer = 0;
    this.redFlash = h('div.flash-red');
    this.overlay.append(this.redFlash);
    this.bindInput();
  }

  // ── setup ────────────────────────────────────────────────

  buildPlayUI() {
    if (this.uiBuilt) return;
    this.uiBuilt = true;
    this.hud = new Hud(this.ui, {
      onPause: () => this.togglePause(),
      onMute: () => {
        audio.setMuted(!audio.isMuted());
        return audio.isMuted();
      },
      isMuted: () => audio.isMuted(),
    });
    this.shop = new Shop(this.ui, {
      sim: this.sim,
      onBuy: (id, el, first) => this.buy(id, el, first),
      onBuyUpgrade: (id, el) => this.buyUpgrade(id, el),
    });
    this.abilities = new Abilities(this.ui, { onUse: (kind) => this.useAbility(kind) });
    this.ticker = new Ticker(this.ui, CONTENT);
    this.notify = new Notify(this.ui);
    this.targets = new Targets(this.overlay, {
      world: this.world,
      content: CONTENT,
      onIncident: (id) => this.clickIncident(id),
      onBossPart: (id) => this.clickBoss(id),
      onBlimp: () => this.clickBlimp(),
    });
    this.cards = new Cards(this.ui, {
      onChoose: (i) => this.chooseCard(i),
      onDone: () => audio.duck(0),
    });
    this.updateInsets();
    window.addEventListener('resize', () => this.updateInsets());
  }

  setPlayUIVisible(on) {
    for (const el of this.ui.querySelectorAll('.hud, .shop, .shop-toggle, .abilities, .ticker, .banner-wrap, .toasts')) el.classList.toggle('hidden', !on);
  }

  updateInsets() {
    const narrow = window.innerWidth <= 860;
    if (this.mode === 'play' || this.mode === 'paused') {
      this.world.stage.setInsets(narrow ? { top: 150, bottom: 110 } : { top: 140, right: 340, bottom: 120 });
    } else {
      this.world.stage.setInsets({});
    }
  }

  start() {
    audio.music('title');
    this.showTitle();
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      this.frame(dt, now);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  showTitle() {
    this.mode = 'title';
    this.closeScreen?.();
    if (this.uiBuilt) {
      this.setPlayUIVisible(false);
      this.targets.clear();
      this.notify.clear();
    }
    this.updateInsets();
    this.world.reset(this.sim.newGame(12345));
    this.world.stage.attract = true;
    audio.music('title');
    this.closeScreen = titleScreen(this.ui, {
      content: CONTENT,
      meta: this.meta,
      hasSave: !!loadGame(),
      onNew: () => this.newGame(),
      onContinue: () => this.continueGame(),
      onHowTo: () => howToScreen(this.ui, () => {}),
    });
  }

  newGame() {
    clearGame();
    this.beginRun(this.sim.newGame((Math.random() * 2 ** 31) | 0));
  }

  continueGame() {
    const raw = loadGame();
    if (!raw) return this.newGame();
    try {
      this.beginRun(this.sim.deserialize(raw));
    } catch {
      this.newGame();
    }
  }

  beginRun(state) {
    this.closeScreen?.();
    this.closeScreen = null;
    this.state = state;
    this.buildPlayUI();
    this.setPlayUIVisible(true);
    this.targets.clear();
    this.notify.clear();
    this.world.reset(state);
    this.mode = 'play';
    this.updateInsets();
    this.world.stage.attract = false;
    this.tutorial?.hide();
    this.tutorial = new Tutorial(this.ui, this.meta, () => {
      this.meta.tipsDone = true;
      saveMeta(this.meta);
    });
    this.lastIntensity = -1;
    audio.music(state.boss ? 'boss' : 'play');
    if (state.boss) this.showBossBanner(state.boss.kind);
    this.notify.banner('era', `${this.sim.date(state).year} · ${this.sim.derived(state).eraName.toUpperCase()}`, 'THE GOLD RUSH IS ON', 'Sell GPUs to the labs. Keep the world in one piece.', 3600);
  }

  // ── input ────────────────────────────────────────────────

  bindInput() {
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      const k = e.key.toLowerCase();
      if (k === 'm') {
        audio.setMuted(!audio.isMuted());
        this.hud?.updateMute(audio.isMuted());
      }
      if (k === 'q') this.world.stage.rotate(-1);
      if (k === 'e') this.world.stage.rotate(1);
      if (k === '=' || k === '+') this.world.stage.setZoom(this.world.stage.zoomGoal * 1.25);
      if (k === '-') this.world.stage.setZoom(this.world.stage.zoomGoal / 1.25);
      if (this.mode === 'play' && !this.cards?.open) {
        if (k === '1') this.useAbility('tweet');
        if (k === '2') this.useAbility('pause');
        if (k === '3') this.useAbility('red');
      }
      if ((k === 'p' || k === 'escape') && (this.mode === 'play' || this.mode === 'paused')) this.togglePause();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.mode === 'play' && !this.cards?.open) this.togglePause();
    });
  }

  togglePause() {
    if (this.mode === 'play') {
      this.mode = 'paused';
      audio.duck(9999);
      this.closePause = pauseScreen(this.ui, {
        onResume: () => this.togglePause(),
        onRestart: () => {
          this.closePause();
          this.newGame();
        },
        onQuit: () => {
          this.closePause();
          this.save();
          this.showTitle();
        },
      });
    } else if (this.mode === 'paused') {
      this.closePause?.();
      this.mode = 'play';
      audio.duck(0);
    }
  }

  // ── actions ──────────────────────────────────────────────

  buy(id, el, first) {
    const ok = this.sim.buyBuilding(this.state, id);
    if (ok) {
      if (first) audio.sfx('buy');
      this.shop.flash(el);
    }
    return ok;
  }

  buyUpgrade(id, el) {
    if (this.sim.buyUpgrade(this.state, id)) this.shop.flash(el);
  }

  useAbility(kind) {
    if (this.mode !== 'play') return;
    if (!this.sim.useAbility(this.state, kind)) audio.sfx('error');
  }

  clickIncident(id) {
    if (this.mode === 'play') this.sim.clickIncident(this.state, id);
  }

  clickBoss(id) {
    if (this.mode === 'play') this.sim.clickBoss(this.state, id);
  }

  clickBlimp() {
    if (this.mode === 'play') this.sim.clickBlimp(this.state);
  }

  chooseCard(i) {
    const before = this.state.cash;
    const ev = CONTENT.events.find((e) => e.id === this.state.card?.id);
    if (!this.sim.chooseCard(this.state, i)) return;
    audio.sfx('choose');
    this.cards.showResult(ev.options[i], this.state.cash - before);
  }

  // ── frame ────────────────────────────────────────────────

  frame(dt, now) {
    const s = this.state;
    const playing = this.mode === 'play' && !this.cards?.open;
    if (playing) this.sim.tick(s, dt);
    for (const f of this.sim.drainFx(s)) this.onFx(f);
    if (this.mode === 'play' && s.phase === 'card' && !this.cards.open) this.openCard();

    this.world.update(dt, s, { title: this.mode === 'title' });

    if (this.uiBuilt && (this.mode === 'play' || this.mode === 'paused')) {
      const d = this.sim.derived(s);
      this.hud.update(s, d, this.sim);
      this.shop.update(s);
      this.abilities.update(s);
      this.targets.update(s);
      if (s.boss) this.notify.updateBoss(s.boss.ttl / s.boss.maxTtl);
      this.redFlash.classList.toggle('on', s.doom >= 80);
      if (playing) {
        this.ticker.update(dt, s);
        this.tutorial.update(s, now);
        this.achTimer -= dt;
        if (this.achTimer <= 0) {
          this.achTimer = 1;
          this.checkAchievements(null);
        }
        this.saveTimer -= dt;
        if (this.saveTimer <= 0) {
          this.saveTimer = 8;
          this.save();
        }
        const intensity = Math.round(s.doom) / 100;
        if (intensity !== this.lastIntensity) {
          this.lastIntensity = intensity;
          audio.setIntensity(intensity);
        }
        if (s.doom >= 85 && Math.random() < dt * 0.6) audio.sfx('heartbeat');
      }
    }
  }

  save() {
    if (this.mode === 'play' || this.mode === 'paused') saveGame(this.sim.serialize(this.state));
  }

  openCard() {
    const ev = CONTENT.events.find((e) => e.id === this.state.card.id);
    const lab = CONTENT.labs[Math.abs(hashString(ev.id)) % CONTENT.labs.length];
    audio.sfx('card');
    audio.duck(9999);
    this.cards.show(ev, lab.name);
  }

  // ── sim events → audio, visuals, UI ─────────────────────

  onFx(f) {
    const s = this.state;
    if (this.mode === 'title') return;
    this.world.onFx(f.type === 'ending' && f.ending.singularity ? { type: 'noop' } : f, s);
    switch (f.type) {
      case 'incident':
        audio.sfx('alarm');
        break;
      case 'incidentHit':
        audio.sfx('hit', { pitch: (f.clicksMax - f.clicksLeft) * 2 });
        break;
      case 'incidentResolved':
        audio.sfx('resolve', { pitch: f.tier - 1 });
        this.targets.floaterAt(f.at, f.auto ? 'INTERN FIXED IT' : f.fix || 'FIXED', f.auto ? 'good' : 'quip');
        break;
      case 'incidentFailed':
        audio.sfx('fail');
        this.targets.floaterAt(f.at, `+${B.incidentFailDoom[f.tier]}% DOOM`, 'bad');
        this.ticker.breaking(f.headline);
        break;
      case 'demolished':
        this.ticker.breaking(f.was === 'home' ? 'Family home bulldozed for compute; family offered GPUs as compensation' : 'Beloved local shop replaced by datacenter; regulars report the datacenter is "less chatty"');
        break;
      case 'release':
        audio.sfx('release');
        this.notify.banner('release', `EUREKA! MODEL #${f.n}`, `${f.lab} ships ${f.model}`, `"${f.tagline}"`, 5200);
        this.ticker.breaking(`${f.lab} releases ${f.model}: "${f.tagline}"`);
        break;
      case 'era':
        this.notify.banner('era', 'A NEW ERA BEGINS', f.name.toUpperCase(), ERA_BLURBS[f.era], 5000);
        break;
      case 'unlock':
        audio.sfx('achievement');
        if (f.what === 'pause') this.notify.toast('NEW ABILITY', 'PAUSE TRAINING (2): freeze capability for 15s.', 'pause', 6000);
        if (f.what === 'red') this.notify.toast('NEW ABILITY', 'THE BIG RED BUTTON (3): shut down every incident.', 'button', 6000);
        break;
      case 'blimp':
        audio.sfx('blimp');
        break;
      case 'blimpClicked': {
        audio.sfx('coin');
        const p = this.world.project(this.world.life.blimpPos, { x: 0, y: 0 });
        this.targets.floater(`+${money(f.cash)}`, p.x, p.y, 'gold');
        const q = CONTENT.flavor.BLIMP_QUIPS;
        this.targets.floater(q[f.quip % q.length], p.x, p.y + 34, 'quip');
        break;
      }
      case 'boss':
        audio.sfx('boss');
        audio.music('boss');
        this.showBossBanner(f.kind);
        break;
      case 'bossHit':
        audio.sfx('bossHit', { pitch: Math.random() * 4 });
        break;
      case 'bossWin':
        audio.sfx('bossDefeat');
        audio.music('play');
        this.notify.endBoss();
        this.notify.banner('release', 'CRISIS AVERTED', 'BOSS DEFEATED', 'p(doom) down, alignment up. Nobody will ever know how close it was.', 4200);
        break;
      case 'bossFail':
        audio.sfx('fail');
        audio.music('play');
        this.notify.endBoss();
        this.notify.banner('boss', 'IT GOT AWAY', `+${Math.round(f.doom)}% p(DOOM)`, 'That is going to be in the history books, if there are history books.', 4200);
        break;
      case 'ability':
        audio.sfx({ tweet: 'tweet', pause: 'pause', red: 'redButton' }[f.kind]);
        if (f.kind === 'tweet') this.ticker.breaking('CEO posts "something big is coming 👀"; markets react to the eyes emoji');
        if (f.kind === 'red') this.ticker.breaking('Picks & Shovels pulls the plug on everything; everything was briefly fine');
        break;
      case 'upgrade': {
        const u = CONTENT.upgrades.find((x) => x.id === f.id);
        audio.sfx('buy');
        this.notify.toast('UPGRADE', u.name, 'star');
        break;
      }
      case 'error':
        audio.sfx('error');
        break;
      case 'ending':
        this.endRun(f.ending);
        break;
      default:
    }
  }

  showBossBanner(kind) {
    const [k, big, small] = BOSS_INTRO[kind];
    this.notify.boss(k, big, small);
  }

  // ── achievements & endings ───────────────────────────────

  checkAchievements(ending) {
    const fresh = [];
    for (const a of ACHIEVEMENTS) {
      if (this.meta.achievements[a.id]) continue;
      let ok = false;
      try {
        ok = a.check(this.state, ending);
      } catch {
        ok = false;
      }
      if (ok) {
        this.meta.achievements[a.id] = Date.now();
        fresh.push(a.id);
        if (!ending) {
          audio.sfx('achievement');
          this.notify.toast('ACHIEVEMENT UNLOCKED', a.name, 'star', 4500);
        }
      }
    }
    if (fresh.length) saveMeta(this.meta);
    return fresh;
  }

  endRun(ending) {
    this.mode = 'ending';
    clearGame();
    this.tutorial?.hide();
    this.targets.clear();
    this.notify.endBoss();
    this.redFlash.classList.remove('on');
    const key = endingId(ending);
    this.meta.runs++;
    this.meta.endings[key] = (this.meta.endings[key] || 0) + 1;
    const fresh = this.checkAchievements(ending);
    const score = ending.type === 'survive' ? 1000 - ending.doomAtRoll : Math.floor(this.state.t / 20);
    const date = this.sim.date(this.state);
    if (!this.meta.bestScore || score > this.meta.bestScore) {
      this.meta.bestScore = score;
      this.meta.best = ending.type === 'survive' ? `survived the singularity at p(doom) ${ending.doomAtRoll}% (${date.year})` : `lasted until ${date.year} Q${date.quarter}`;
    }
    saveMeta(this.meta);

    const showEnding = () => {
      const music = ending.type === 'survive' ? 'good' : ending.type === 'winter' ? 'winter' : 'doom';
      audio.sfx(ending.type === 'survive' ? 'goodEnd' : ending.type === 'winter' ? 'winterEnd' : 'doomEnd');
      audio.music(music);
      setTimeout(() => {
        this.setPlayUIVisible(false);
        this.closeScreen = endingScreen(this.ui, {
          content: CONTENT,
          ending,
          endingKey: key,
          state: this.state,
          sim: this.sim,
          newAchievements: fresh,
          discovered: ENDING_IDS.filter((id) => this.meta.endings[id]).length,
          onAgain: () => this.newGame(),
          onTitle: () => this.showTitle(),
          onShare: (line) => this.share(line),
        });
      }, 4200);
    };

    if (ending.singularity) {
      audio.music('off');
      setTimeout(() => {
        rollScreen(this.ui, {
          roll: ending.roll,
          doom: ending.doomAtRoll,
          model: ending.model,
          audio,
          onDone: () => {
            this.world.startEnding(ending, this.state);
            showEnding();
          },
        });
      }, 900);
    } else {
      showEnding();
    }
  }

  async share(line) {
    const text = `${line} Sell the GPUs. Keep p(doom) under 100%. https://picksandshovels.org`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'PICKS & SHOVELS', text });
        return 'SHARED!';
      }
      await navigator.clipboard.writeText(text);
      return 'COPIED!';
    } catch {
      // Share sheet dismissed or clipboard blocked.
      return null;
    }
  }
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  return h;
}
