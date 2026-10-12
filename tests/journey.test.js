import { describe, it, expect, vi } from 'vitest';
import { Journey } from '../src/journey.js';

function setup() {
  const sent = [];
  const props = [];
  const j = new Journey({ track: (name, params) => sent.push({ name, ...params }), setUserProps: (p) => props.push(p) });
  const state = (t, extra = {}) => ({
    t,
    doom: 12.4,
    hype: 61.2,
    cash: 1234.5,
    cap: 22.2,
    align: 18.8,
    era: 1,
    releases: 2,
    stats: { incidentsResolved: 9, incidentsFailed: 2, buildingsBought: 7 },
    ...extra,
  });
  return { j, sent, props, state };
}

describe('journey analytics', () => {
  it('reports each first-time milestone once, with seconds into the run', () => {
    const { j, sent, state } = setup();
    j.runStarted({ continued: false });
    j.onFx({ type: 'incidentResolved', auto: false }, state(12.3));
    j.onFx({ type: 'incidentResolved', auto: false }, state(20));
    j.onFx({ type: 'built', bId: 'rack' }, state(25));
    j.onFx({ type: 'built', bId: 'rack' }, state(26));
    j.onFx({ type: 'built', bId: 'intern' }, state(30));
    const milestones = sent.filter((e) => e.name === 'run_milestone');
    expect(milestones.map((e) => e.milestone)).toEqual(['first_fix', 'first_purchase']);
    expect(milestones[0].seconds).toBe(12);
    const firsts = sent.filter((e) => e.name === 'building_first');
    expect(firsts.map((e) => e.building)).toEqual(['rack', 'intern']);
  });

  it('records choices: cards, upgrades, abilities, stances, bosses', () => {
    const { j, sent, state } = setup();
    j.runStarted({ continued: false });
    j.cardChosen({ id: 'open-weights', option: 1, label: 'Release them' }, state(40));
    j.onFx({ type: 'upgrade', id: 'cooling' }, state(41));
    j.onFx({ type: 'ability', kind: 'tweet' }, state(42));
    j.onFx({ type: 'labStance', lab: 'ClosedAI', stance: 'embargo' }, state(43));
    j.onFx({ type: 'boss', kind: 'shoggoth' }, state(100));
    j.onFx({ type: 'bossWin', kind: 'shoggoth' }, state(118));
    const names = sent.map((e) => e.name);
    expect(names).toEqual(expect.arrayContaining(['card_choice', 'upgrade_buy', 'ability_use', 'lab_stance', 'boss_start', 'boss_end']));
    expect(sent.find((e) => e.name === 'card_choice')).toMatchObject({ card_id: 'open-weights', option: 1, option_label: 'Release them' });
    expect(sent.find((e) => e.name === 'boss_end')).toMatchObject({ boss: 'shoggoth', won: true, boss_seconds: 18 });
  });

  it('checkpoints once per in-game year with rounded vitals', () => {
    const { j, sent, state } = setup();
    j.runStarted({ continued: false });
    for (let t = 0; t <= 200; t += 1) j.tick(state(t));
    const cps = sent.filter((e) => e.name === 'run_checkpoint');
    expect(cps.length).toBe(2); // years 2024 and 2025 begin at t=80 and t=160
    expect(cps[0]).toMatchObject({ year: 2024, doom: 12, hype: 61, capability: 22, alignment: 19, fixed: 9, missed: 2 });
  });

  it('notices a run abandoned mid-game, but not one that ended', () => {
    const { j, sent, state } = setup();
    j.runStarted({ continued: false });
    j.abandon(state(95));
    expect(sent.filter((e) => e.name === 'run_abandon')).toHaveLength(1);
    j.runStarted({ continued: false });
    j.runEnded();
    j.abandon(state(10));
    expect(sent.filter((e) => e.name === 'run_abandon')).toHaveLength(1);
  });

  it('reports screens as page views for path exploration', () => {
    const { j, sent } = setup();
    j.screen('title');
    j.screen('title');
    j.screen('game');
    expect(sent.filter((e) => e.name === 'page_view').map((e) => e.page_title)).toEqual(['Title', 'Game']);
  });

  it('keeps the landing URL query in screen page views so campaign tags still attribute the visit', () => {
    vi.stubGlobal('location', new URL('https://picksandshovels.org/?utm_source=newsletter&utm_medium=email'));
    try {
      const { j, sent } = setup();
      j.screen('title');
      j.screen('game');
      const urls = sent.filter((e) => e.name === 'page_view').map((e) => new URL(e.page_location));
      expect(urls.map((u) => u.searchParams.get('utm_source'))).toEqual(['newsletter', 'newsletter']);
      expect(urls.map((u) => u.hash)).toEqual(['#title', '#game']);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps returning-player traits as user properties', () => {
    const { j, props } = setup();
    j.player({ runs: 3, endingsFound: 4 });
    expect(props).toEqual([{ runs_played: 3, endings_found: 4 }]);
  });
});
