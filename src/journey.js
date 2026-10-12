// Player-journey analytics: which screens people see, how far a run gets,
// what they choose, and where they drop off. It turns game events into a
// small number of well-named analytics events.
//
// Event volume stays modest: firsts are sent once per run, vitals once per
// in-game year, and choices (cards, upgrades, abilities, stances, bosses) as
// they happen. Incidents and purchases are not sent one by one.

import { B } from './sim/balance.js';

const YEAR_SECONDS = B.QUARTER_SECONDS * 4;
const TITLES = { title: 'Title', howto: 'How To Play', trophies: 'Trophy Case', game: 'Game', ending: 'Ending' };

export class Journey {
  constructor({ track, setUserProps }) {
    this.track = track;
    this.setUserProps = setUserProps;
    this.lastScreen = null;
    this.inRun = false;
  }

  screen(name) {
    if (name === this.lastScreen) return;
    this.lastScreen = name;
    const origin = typeof location !== 'undefined' ? location.origin : '';
    this.track('page_view', { page_title: TITLES[name] || name, page_location: `${origin}/#${name}` });
  }

  player({ runs, endingsFound }) {
    this.setUserProps({ runs_played: runs, endings_found: endingsFound });
  }

  runStarted({ continued }) {
    this.inRun = true;
    this.firsts = new Set();
    this.buildings = new Set();
    this.lastYear = null;
    this.bossStart = null;
    this.continued = continued;
  }

  runEnded() {
    this.inRun = false;
  }

  // Saved and went back to the menu: not an ending, but the run stopped here.
  quit(s) {
    if (!this.inRun) return;
    this.track('run_quit', this.vitals(s));
    this.inRun = false;
  }

  // The tab closed (or the phone app switched away for good) mid-run.
  abandon(s) {
    if (!this.inRun) return;
    this.track('run_abandon', { ...this.vitals(s), transport_type: 'beacon' });
    this.inRun = false;
  }

  milestone(name, s) {
    if (!this.inRun || this.firsts.has(name)) return;
    this.firsts.add(name);
    this.track('run_milestone', { milestone: name, seconds: Math.round(s.t), year: yearOf(s) });
  }

  feature(name, s) {
    if (s) this.milestone(`used_${name}`, s);
  }

  vitals(s) {
    return {
      seconds: Math.round(s.t),
      year: yearOf(s),
      doom: Math.round(s.doom),
      hype: Math.round(s.hype),
      capability: Math.round(s.cap),
      alignment: Math.round(s.align),
    };
  }

  tick(s) {
    if (!this.inRun) return;
    const year = Math.floor(s.t / YEAR_SECONDS);
    if (this.lastYear === null) {
      this.lastYear = year;
      return;
    }
    if (year <= this.lastYear) return;
    this.lastYear = year;
    this.track('run_checkpoint', {
      ...this.vitals(s),
      cash: Math.round(s.cash),
      era: s.era,
      models: s.releases,
      fixed: s.stats.incidentsResolved,
      missed: s.stats.incidentsFailed,
      buildings: s.stats.buildingsBought,
    });
  }

  cardChosen({ id, option, label }, s) {
    if (!this.inRun) return;
    this.milestone('first_card_choice', s);
    this.track('card_choice', { card_id: id, option, option_label: String(label).slice(0, 100), seconds: Math.round(s.t) });
  }

  onFx(f, s) {
    if (!this.inRun) return;
    const seconds = Math.round(s.t);
    switch (f.type) {
      case 'incidentResolved':
        if (!f.auto) this.milestone('first_fix', s);
        break;
      case 'incidentFailed':
        this.milestone('first_miss', s);
        break;
      case 'built':
        this.milestone('first_purchase', s);
        if (!this.buildings.has(f.bId)) {
          this.buildings.add(f.bId);
          this.track('building_first', { building: f.bId, seconds });
        }
        break;
      case 'upgrade':
        this.track('upgrade_buy', { upgrade: f.id, seconds });
        break;
      case 'ability':
        this.track('ability_use', { ability: f.kind, seconds });
        break;
      case 'labStance':
        this.track('lab_stance', { lab: f.lab, stance: f.stance, seconds });
        break;
      case 'card':
        this.milestone('first_card', s);
        break;
      case 'release':
        this.milestone('first_release', s);
        if (f.flop) this.milestone('first_flop', s);
        break;
      case 'era':
        this.milestone(`era_${f.era}`, s);
        break;
      case 'boss':
        this.bossStart = { kind: f.kind, t: s.t };
        this.track('boss_start', { boss: f.kind, seconds });
        break;
      case 'bossWin':
      case 'bossFail':
        this.track('boss_end', {
          boss: f.kind,
          won: f.type === 'bossWin',
          boss_seconds: this.bossStart ? Math.round(s.t - this.bossStart.t) : null,
          seconds,
        });
        this.bossStart = null;
        break;
      case 'overseasDrop':
        this.milestone('first_open_weights_drop', s);
        break;
      case 'blimpClicked':
        this.milestone('first_blimp', s);
        break;
      default:
    }
  }
}

function yearOf(s) {
  return B.START_YEAR + Math.floor(s.t / YEAR_SECONDS);
}
