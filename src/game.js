// The game controller: owns the sim state, runs the frame loop, routes sim
// events to the renderer, UI and audio, and handles runs, saves and endings.

import { createSim, MAP } from './sim/sim.js';
import { B } from './sim/balance.js';
import { CONTENT } from './content/index.js';
import { ACHIEVEMENTS, ENDING_IDS, endingId } from './content/achievements.js';
import { World } from './render/world.js';
import { hqLevelFor } from './render/city.js';
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
import { renderShareCard, shareSummary } from './ui/sharecard.js';
import { Inspect } from './ui/inspect.js';
import { track, setUserProps } from './analytics.js';
import { Journey } from './journey.js';

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
    this.journey = new Journey({ track, setUserProps });
    this.journey.player({ runs: this.meta.runs, endingsFound: ENDING_IDS.filter((id) => this.meta.endings[id]).length });
    this.inspect = new Inspect(this.ui, this.overlay, {
      world: this.world,
      getState: () => this.state,
      sim: this.sim,
      content: CONTENT,
      isActive: () => (this.mode === 'play' || this.mode === 'title') && !this.cards?.open,
      onShow: () => this.journey.feature('tooltip', this.mode === 'play' ? this.state : null),
    });
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
        track('sound_toggle', { muted: audio.isMuted() });
        return audio.isMuted();
      },
      isMuted: () => audio.isMuted(),
      onRotate: (dir) => {
        this.world.stage.rotate(dir);
        this.journey.feature('rotate', this.state);
      },
    });
    this.shop = new Shop(this.ui, {
      sim: this.sim,
      onBuy: (id, el, first) => this.buy(id, el, first),
      onBuyUpgrade: (id, el) => this.buyUpgrade(id, el),
      onTab: (cat) => this.mode === 'play' && this.journey.feature(`tab_${cat}`, this.state),
      onLabStance: (id, stance) => {
        if (this.mode === 'play' && this.sim.setLabStance(this.state, id, stance)) audio.sfx('click');
      },
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
      onDone: () => audio.unduck(),
      isActive: () => this.mode === 'play',
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
      // Keep the loop alive whatever happens; one bad frame must not freeze the game.
      requestAnimationFrame(frame);
      try {
        this.frame(dt, now);
      } catch (err) {
        console.error('frame failed', err);
      }
    };
    requestAnimationFrame(frame);
  }

  showTitle() {
    this.runId = (this.runId || 0) + 1;
    this.mode = 'title';
    this.closeScreen?.();
    if (this.uiBuilt) {
      this.setPlayUIVisible(false);
      this.targets.clear();
      this.notify.clear();
    }
    this.cards?.reset();
    this.tutorial?.hide();
    this.ticker?.clear();
    this.updateInsets();
    // The title gets a fresh, untroubled city (no leftover doom tint).
    this.state = this.sim.newGame(12345);
    this.world.reset(this.state);
    this.world.stage.attract = true;
    audio.music('title');
    this.journey.screen('title');
    this.closeScreen = titleScreen(this.ui, {
      content: CONTENT,
      meta: this.meta,
      hasSave: !!loadGame(),
      onNew: () => this.newGame(),
      onContinue: () => this.continueGame(),
      onHowTo: () => {
        this.journey.screen('howto');
        howToScreen(this.ui, () => this.journey.screen('title'));
      },
      onTrophies: () => this.journey.screen('trophies'),
      onTrophiesClosed: () => this.journey.screen('title'),
    });
  }

  newGame() {
    clearGame();
    track('game_start', { continued: false });
    this.beginRun(this.sim.newGame((Math.random() * 2 ** 31) | 0));
  }

  continueGame() {
    const raw = loadGame();
    if (!raw) return this.newGame();
    try {
      this.beginRun(this.sim.deserialize(raw), { continued: true });
      track('game_start', { continued: true });
    } catch {
      this.newGame();
    }
  }

  beginRun(state, { continued = false } = {}) {
    this.runId = (this.runId || 0) + 1;
    this.journey.runStarted({ continued });
    this.journey.screen('game');
    this.closeScreen?.();
    this.closeScreen = null;
    this.state = state;
    this.buildPlayUI();
    this.setPlayUIVisible(true);
    this.cards.reset();
    this.ticker.clear();
    this.targets.clear();
    this.notify.clear();
    this.world.reset(state);
    this.mode = 'play';
    this.updateInsets();
    this.world.stage.attract = false;
    this.tutorial?.hide();
    this.tutorial = new Tutorial(
      this.ui,
      this.meta,
      () => {
        this.meta.tipsDone = true;
        saveMeta(this.meta);
      },
      {
        onTip: (id) => track('tutorial_tip', { tip: id, seconds: Math.round(this.state.t) }),
        onSkip: () => track('tutorial_skip', { seconds: Math.round(this.state.t) }),
      },
    );
    this.lastIntensity = -1;
    this.hqLevel = hqLevelFor(state.stats.peakCash);
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
      if (k === 'q' || k === 'e') {
        this.world.stage.rotate(k === 'q' ? -1 : 1);
        if (this.mode === 'play') this.journey.feature('rotate', this.state);
      }
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
    // Closing the tab mid-run is the biggest drop-off signal there is.
    window.addEventListener('pagehide', () => {
      if (this.mode === 'play' || this.mode === 'paused') this.journey.abandon(this.state);
    });
  }

  togglePause() {
    if (this.mode === 'play') {
      this.journey.feature('pause', this.state);
      this.mode = 'paused';
      audio.duck(9999);
      this.closePause = pauseScreen(this.ui, {
        onResume: () => this.togglePause(),
        onRestart: () => {
          this.closePause();
          this.journey.quit(this.state);
          track('run_restart', { seconds: Math.round(this.state.t) });
          this.newGame();
        },
        onQuit: () => {
          this.closePause();
          this.save();
          this.journey.quit(this.state);
          this.showTitle();
        },
      });
    } else if (this.mode === 'paused') {
      this.closePause?.();
      this.mode = 'play';
      if (this.cards?.open) audio.duck(9999);
      else audio.unduck();
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
    const stance = ev?.options[i]?.effects?.stance;
    this.cards.stanceName = stance ? CONTENT.labs[this.sim.labTarget(this.state, stance.target)]?.name : '';
    if (!this.sim.chooseCard(this.state, i)) {
      this.cards.unstick();
      return;
    }
    this.journey.cardChosen({ id: ev.id, option: i, label: ev.options[i].label }, this.state);
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

    const derived = this.mode === 'title' ? null : this.sim.derived(s);
    this.world.update(dt, s, { title: this.mode === 'title', derived });
    this.inspect.update(s, derived, this.mode === 'play' || this.mode === 'paused');

    if (this.uiBuilt && (this.mode === 'play' || this.mode === 'paused')) {
      const d = derived;
      this.hud.update(s, d, this.sim);
      this.shop.update(s);
      this.abilities.update(s);
      this.targets.update(s);
      if (s.boss) this.notify.updateBoss(s.boss.ttl / s.boss.maxTtl);
      this.redFlash.classList.toggle('on', s.doom >= 80);
      if (playing) {
        this.journey.tick(s);
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
        const hq = hqLevelFor(s.stats.peakCash);
        if (hq !== this.hqLevel) {
          this.hqLevel = hq;
          audio.sfx('achievement');
          const names = ['', '', 'a brick building with a datacenter out back', 'a glass tower (the 1849 storefront stays)', 'a solid gold shovel the size of a skyscraper'];
          this.notify.toast('HQ UPGRADED', `Picks & Shovels Inc. moves into ${names[hq]}.`, 'shovel', 5000);
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
    const s = this.state;
    const ev = CONTENT.events.find((e) => e.id === s.card.id);
    if (!ev) return;
    const name = (target) => CONTENT.labs[this.sim.labTarget(s, target)]?.name;
    const tokens = { leader: name('leader'), rival: name('rival') };
    const mentions = /\{leader\}|\{rival\}/.test(ev.title + ev.body);
    const lab = mentions ? { name: tokens.leader } : CONTENT.labs[Math.abs(hashString(ev.id)) % CONTENT.labs.length];
    audio.sfx('card');
    audio.duck(9999);
    this.cards.show(ev, lab.name, tokens);
  }

  // ── sim events → audio, visuals, UI ─────────────────────

  onFx(f) {
    const s = this.state;
    if (this.mode === 'title') return;
    this.world.onFx(f.type === 'ending' && f.ending.singularity ? { type: 'noop' } : f, s);
    this.journey.onFx(f, s);
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
      case 'overseasDrop': {
        audio.sfx('glitch');
        audio.sfx('alarm');
        this.notify.banner('boss', `OPEN WEIGHTS DROP #${f.n}`, `${f.lab} releases ${f.model}`, `"${f.tagline}"`, 5500);
        const hl = CONTENT.overseas.headlines;
        this.ticker.breaking(hl[(f.n - 1) % hl.length]);
        this.notify.toast('MARKETS', 'GPU demand -30% and incidents up for 30s. The weights are everywhere now.', 'skull', 6000);
        break;
      }
      case 'combo':
        audio.sfx('coin', { pitch: Math.min(12, f.combo - 2) });
        this.targets.floaterAt(f.at, `COMBO ×${f.combo}! +${money(f.cash)}`, 'gold');
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
        if (f.flop) {
          audio.sfx('winterEnd'); // the sad trombone
          this.notify.banner('boss', `LAUNCH FLOP · MODEL #${f.n}`, `${f.lab} ships ${f.model}`, f.flopLine, 5200);
          this.ticker.breaking(f.flopHeadline);
        } else {
          audio.sfx('release');
          this.notify.banner('release', `EUREKA! MODEL #${f.n}${f.openWeights ? ' · OPEN WEIGHTS' : ''}`, `${f.lab} ships ${f.model}`, `"${f.tagline}"`, 5200);
          this.ticker.breaking(`${f.lab} releases ${f.model}: "${f.tagline}"`);
        }
        if (f.openWeights) this.notify.toast('OPEN WEIGHTS', `${f.lab} posted the weights. Everyone has it now. Doom floor rises.`, 'skull', 5000);
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
        this.notify.toast('TERM SHEET SIGNED', q[f.quip % q.length], 'coin');
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
      case 'labStance':
        if (f.stance === 'embargo') this.ticker.breaking(`Picks & Shovels embargoes ${f.lab}; ${f.lab} calls it "a growth opportunity"`);
        if (f.stance === 'favored') this.ticker.breaking(`Picks & Shovels names ${f.lab} a preferred customer; rivals demand to speak to a manager`);
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
    track('game_end', {
      ending: key,
      ending_type: ending.type,
      minutes: Math.round(this.state.t / 6) / 10,
      doom: Math.round(this.state.doom),
      year: this.sim.date(this.state).year,
      roll: ending.roll ?? null,
    });
    this.meta.runs++;
    this.meta.endings[key] = (this.meta.endings[key] || 0) + 1;
    this.journey.runEnded();
    this.journey.player({ runs: this.meta.runs, endingsFound: ENDING_IDS.filter((id) => this.meta.endings[id]).length });
    const fresh = this.checkAchievements(ending);
    const score = ending.type === 'survive' ? 1000 - ending.doomAtRoll : Math.floor(this.state.t / 20);
    const date = this.sim.date(this.state);
    if (!this.meta.bestScore || score > this.meta.bestScore) {
      this.meta.bestScore = score;
      this.meta.best = ending.type === 'survive' ? `survived the singularity at p(doom) ${ending.doomAtRoll}% (${date.year})` : `lasted until ${date.year} Q${date.quarter}`;
    }
    saveMeta(this.meta);

    // Delayed steps belong to this run only; a new game or the title cancels them.
    const runId = this.runId;
    const current = () => this.runId === runId;
    const showEnding = () => {
      if (!current()) return;
      const music = ending.type === 'survive' ? 'good' : ending.type === 'winter' || ending.type === 'collapse' ? 'winter' : 'doom';
      audio.sfx(ending.type === 'survive' ? 'goodEnd' : ending.type === 'winter' ? 'winterEnd' : 'doomEnd');
      audio.music(music);
      setTimeout(() => {
        if (!current()) return;
        this.setPlayUIVisible(false);
        this.journey.screen('ending');
        const E = CONTENT.endings[key] || CONTENT.endings.generic;
        const date = this.sim.date(this.state);
        const shareCard = renderShareCard({ world: this.world, state: this.state, ending, E, date });
        const summary = shareSummary({ ending, E, state: this.state, date });
        this.closeScreen = endingScreen(this.ui, {
          content: CONTENT,
          ending,
          endingKey: key,
          state: this.state,
          sim: this.sim,
          newAchievements: fresh,
          discovered: ENDING_IDS.filter((id) => this.meta.endings[id]).length,
          onAgain: () => {
            track('end_action', { action: 'play_again', ending: key });
            this.newGame();
          },
          onTitle: () => {
            track('end_action', { action: 'main_menu', ending: key });
            this.showTitle();
          },
          shareCard,
          summary,
          sharing: {
            onCopyBoth: (blob, sum) => (track('share', { method: 'copy_both', ending: key }), this.copyBoth(blob, sum)),
            onCopyImage: (blob) => (track('share', { method: 'copy_image', ending: key }), this.copyImage(blob)),
            onCopyText: (blob, sum) => (track('share', { method: 'copy_text', ending: key }), this.copyText(sum)),
            onShare: (blob, sum) => (track('share', { method: 'native', ending: key }), this.nativeShare(blob, sum)),
            onDownload: (blob) => (track('share', { method: 'download', ending: key }), this.downloadImage(blob)),
            onTweet: (blob, sum) => (track('share', { method: 'twitter', ending: key }), this.tweet(sum)),
          },
        });
      }, 4200);
    };

    if (ending.singularity) {
      audio.music('off');
      setTimeout(() => {
        if (!current()) return;
        rollScreen(this.ui, {
          roll: ending.roll,
          doom: ending.doomAtRoll,
          model: ending.model,
          audio,
          onDone: () => {
            if (!current()) return;
            this.world.startEnding(ending, this.state);
            showEnding();
          },
        });
      }, 900);
    } else {
      showEnding();
    }
  }

  // Renders a 1200x630 social card from the live city and POSTs it to
  // scripts/og-receiver.mjs. A maintenance tool; nothing in the game calls it.
  async captureOgImage(url = 'http://localhost:5199/') {
    const stage = this.world.stage;
    this.world.update(0, this.state, { title: this.mode === 'title' });
    const W = 1200;
    const H = 630;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const src = stage.canvas;
    const scale = Math.max(W / src.width, H / src.height);
    const dw = src.width * scale;
    const dh = src.height * scale;
    ctx.drawImage(this.world.sky.canvas, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.fillStyle = '#fffdf5';
    ctx.strokeStyle = '#22232b';
    ctx.lineWidth = 6;
    ctx.fillRect(40, 40, 560, 190);
    ctx.strokeRect(40, 40, 560, 190);
    ctx.fillStyle = '#22232b';
    ctx.font = '44px "Press Start 2P"';
    ctx.fillText('PICKS &', 70, 112);
    ctx.fillText('SHOVELS', 70, 172);
    ctx.font = '22px "Atkinson Hyperlegible Next"';
    ctx.fillText('Sell the GPUs. Keep p(doom) under 100%.', 70, 212);
    const data = c.toDataURL('image/png');
    await fetch(url, { method: 'POST', body: data });
    return data.length;
  }

  // Image, plain text and HTML (with the image inline and a real link) in one
  // clipboard write, so whatever you paste into picks the best it can use.
  async copyBoth(blob, sum) {
    try {
      const dataUrl = await blobToDataUrl(blob);
      const html = `${sum.html}<p><img src="${dataUrl}" width="600" alt="PICKS &amp; SHOVELS ending card"></p>`;
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
          'text/plain': new Blob([sum.text], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' }),
        }),
      ]);
      return 'COPIED BOTH!';
    } catch {
      // Some browsers take one kind at a time: at least get the words out.
      const ok = await this.copyText(sum);
      return ok ? 'TEXT COPIED. NOW COPY IMAGE' : 'COPY FAILED';
    }
  }

  async copyImage(blob) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return 'IMAGE COPIED!';
    } catch {
      this.downloadImage(blob);
      return 'SAVED INSTEAD';
    }
  }

  async copyText(sum) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([sum.text], { type: 'text/plain' }),
          'text/html': new Blob([sum.html], { type: 'text/html' }),
        }),
      ]);
      return 'TEXT COPIED!';
    } catch {
      try {
        await navigator.clipboard.writeText(sum.text);
        return 'TEXT COPIED!';
      } catch {
        return null;
      }
    }
  }

  // The phone's share sheet, with the card attached.
  async nativeShare(blob, sum) {
    const file = new File([blob], 'picks-and-shovels.png', { type: 'image/png' });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text: sum.text });
      else await navigator.share({ text: sum.text });
      return 'SHARED!';
    } catch (err) {
      return err?.name === 'AbortError' ? null : 'SHARE FAILED';
    }
  }

  downloadImage(blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'picks-and-shovels.png';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    return 'SAVED!';
  }

  // Opens a prefilled tweet. Players paste in the card they just copied.
  tweet(sum) {
    const text = sum.text.length > 270 ? `${sum.text.split('\n')[0]} ${sum.text.split('\n').pop()}` : sum.text;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener');
    return 'TWEETING...';
  }

}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  return h;
}
