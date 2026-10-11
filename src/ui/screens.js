// Full-screen moments: title, how-to-play, pause, the singularity roll, and
// the ending card.

import { h } from './dom.js';
import { icon, sprite } from './icons.js';
import { money } from './format.js';
import { ENDING_IDS, ACHIEVEMENTS, ACHIEVEMENT_BY_ID } from '../content/achievements.js';

const ENDING_SHORT = {
  utopia: 'UTOPIA', shareholders: 'SHARE-\nHOLDERS', weird: 'WEIRD', winter: 'GHOST\nTOWN', dysentery: 'DYSEN-\nTERY',
  paperclips: 'PAPER-\nCLIPS', shoggoth: 'SHOGGOTH', replication: 'COPIES', engagement: 'ENGAGED', sycophancy: 'FLATTERED', generic: 'DOOM',
};
const GOOD_ENDINGS = new Set(['utopia', 'shareholders', 'weird']);

function modal(root, ...children) {
  const el = h('div.modal', {}, ...children);
  root.append(el);
  return el;
}

function logo() {
  return h('div.title-logo', {}, h('div.mark', {}, sprite('pick')), h('h1.title-h1', {}, 'PICKS &', h('br'), 'SHOVELS'), h('div.mark', {}, sprite('shovel')));
}

export function titleScreen(root, { content, meta, hasSave, onNew, onContinue, onHowTo }) {
  // The city is the backdrop here: keep it bright.
  const taglines = content.flavor.TAGLINES;
  const tagline = h('div.tagline', {}, taglines[Math.floor(Math.random() * taglines.length)]);
  const gallery = h('div.gallery');
  for (const id of ENDING_IDS) {
    const found = meta.endings[id];
    gallery.append(h(`div.slot${found ? '.found' : ''}${found && !GOOD_ENDINGS.has(id) ? '.bad' : ''}`, { title: found ? content.endings[id]?.title : 'Undiscovered ending', html: (found ? ENDING_SHORT[id] : '???').replace('\n', '<br>') }));
  }
  const found = ENDING_IDS.filter((id) => meta.endings[id]).length;
  const achCount = Object.keys(meta.achievements).length;
  const buttons = h('div.title-buttons');
  if (hasSave) buttons.append(h('button.btn.big', { onclick: onContinue }, 'CONTINUE'));
  buttons.append(h(`button.btn.big${hasSave ? '.ghost' : ''}`, { onclick: onNew }, hasSave ? 'NEW GAME' : 'START SELLING'));
  buttons.append(h('button.btn.big.ghost', { onclick: onHowTo }, 'HOW TO PLAY'));
  buttons.append(h('button.btn.big.ghost', { onclick: () => achievementsScreen(root, meta) }, 'TROPHIES'));
  const el = modal(
    root,
    h(
      'div.panel.screen.title',
      {},
      logo(),
      tagline,
      h('div.premise', {}, 'You run Picks & Shovels Inc., selling GPUs to every AI lab in the Valley. You are also the only CEO who can see the p(doom) gauge. Keep the hype alive. Keep the world alive. When capability hits 100, the dice decide.'),
      buttons,
      h('div', { style: { fontFamily: 'var(--display)', fontSize: '9px', marginTop: '6px' } }, `ENDINGS DISCOVERED ${found}/${ENDING_IDS.length} · ACHIEVEMENTS ${achCount}`),
      gallery,
      meta.best ? h('div.small-print', {}, `Best run: ${meta.best}`) : null,
      h('div.small-print', {}, 'Sound on. Drag to pan, scroll to zoom, Q/E to rotate. No GPUs were harmed. Several were overclocked.'),
    ),
  );
  el.classList.add('clear');
  let i = 0;
  const timer = setInterval(() => {
    i++;
    tagline.textContent = taglines[(Math.floor(Math.random() * taglines.length) + i) % taglines.length];
  }, 5000);
  return () => {
    clearInterval(timer);
    el.remove();
  };
}

export function howToScreen(root, onClose) {
  const el = modal(
    root,
    h(
      'div.panel.screen',
      {},
      h('h2', { style: { fontFamily: 'var(--display)', fontSize: '18px' } }, 'HOW TO SELL SHOVELS'),
      h(
        'ul.howto',
        {},
        h('li', {}, h('b', {}, 'CLICK INCIDENTS. '), 'Speech bubbles pop up over buildings when AI does something dumb. Click them before the timer runs out. Big ones need several clicks. Missed ones raise p(doom).'),
        h('li', {}, h('b', {}, 'BUILD. '), 'COMPUTE makes money but speeds up capability. SAFETY raises alignment. HYPE keeps investors from leaving.'),
        h('li', {}, h('b', {}, 'WATCH THE RACE. '), 'When capability (orange) gets ahead of alignment (blue), p(doom) climbs. When alignment leads, it eases.'),
        h('li', {}, h('b', {}, 'TWO WAYS TO LOSE. '), 'p(doom) hits 100% (the apocalypse) or hype hits 0% (the AI winter, and you get fired).'),
        h('li', {}, h('b', {}, 'THE SINGULARITY. '), 'When capability reaches 100, the game rolls a d100. Roll at or under p(doom) and that is that. p(doom) was a probability all along.'),
        h('li', {}, h('b', {}, 'ABILITIES. '), '1: vague-tweet for hype. 2: pause training. 3: the Big Red Button. P pauses, M mutes, Q/E rotates the city.'),
        h('li', {}, h('b', {}, 'THE BLIMP. '), 'When the VC blimp drifts by, click it. Free money. There is always free money.'),
      ),
      h('div.title-buttons', {}, h('button.btn.big', { onclick: () => { el.remove(); onClose(); } }, 'GOT IT')),
    ),
  );
  return el;
}

export function achievementsScreen(root, meta) {
  const list = h('div.ach-list');
  for (const a of ACHIEVEMENTS) {
    const got = !!meta.achievements[a.id];
    list.append(h(`div.ach${got ? '.got' : ''}`, {}, h('div.ach-n', {}, got ? a.name : '???'), h('div.ach-d', {}, a.desc)));
  }
  const n = ACHIEVEMENTS.filter((a) => meta.achievements[a.id]).length;
  const el = modal(
    root,
    h(
      'div.panel.screen',
      {},
      h('h2', { style: { fontFamily: 'var(--display)', fontSize: '18px' } }, `TROPHY CASE ${n}/${ACHIEVEMENTS.length}`),
      list,
      h('div.title-buttons', {}, h('button.btn.big', { onclick: () => el.remove() }, 'BACK')),
    ),
  );
  el.style.zIndex = 20;
  return el;
}

export function pauseScreen(root, { onResume, onRestart, onQuit }) {
  const el = modal(
    root,
    h(
      'div.panel.screen',
      { style: { width: 'min(440px, 94vw)' } },
      h('h2', { style: { fontFamily: 'var(--display)', fontSize: '20px' } }, 'PAUSED'),
      h('div.premise', {}, 'The singularity will wait for you. (It will not wait for you.)'),
      h('div.title-buttons', {}, h('button.btn.big', { onclick: onResume }, 'RESUME'), h('button.btn.big.ghost', { onclick: onRestart }, 'RESTART'), h('button.btn.big.ghost', { onclick: onQuit }, 'SAVE & QUIT')),
    ),
  );
  return () => el.remove();
}

// The d100 roll at the singularity. Calls onDone when the verdict has sunk in.
export function rollScreen(root, { roll, doom, model, audio, onDone }) {
  const die = h('div.die', {}, '??');
  const verdict = h('div.verdict');
  const el = modal(
    root,
    h(
      'div.roll',
      {},
      h('div.k', {}, 'THE SINGULARITY'),
      h('div.rule', { style: { marginTop: '12px' } }, `${model || 'The final model'} has shipped. Capability: 100.`),
      h('div.rule', {}, `Rolling a d100. At or under ${doom} and humanity is done.`),
      die,
      verdict,
    ),
  );
  el.style.background = 'rgba(20, 21, 30, 0.82)';
  let n = 0;
  const steps = 28;
  const tick = () => {
    n++;
    const shown = n >= steps ? roll : 1 + Math.floor(Math.random() * 100);
    die.textContent = String(shown);
    audio.sfx('roll', { pitch: (n % 6) - 2 });
    if (n < steps) {
      setTimeout(tick, 40 + n * n * 0.55);
      return;
    }
    const survived = roll > doom;
    verdict.textContent = survived ? `${roll} > ${doom}. HUMANITY SURVIVES.` : `${roll} ≤ ${doom}. OH NO.`;
    verdict.classList.add(survived ? 'good' : 'bad');
    setTimeout(() => {
      el.remove();
      onDone();
    }, 2600);
  };
  setTimeout(tick, 700);
}

function stat(k, v) {
  return h('div.stat', {}, h('div.k', {}, k), h('div.v', {}, v));
}

// The share card preview and its buttons. card is a Promise<Blob>.
function sharePanel(card, shareLine, { onShareImage, onDownload, onTweet }) {
  const img = h('img.share-preview', { alt: 'Your PICKS & SHOVELS ending card' });
  const status = h('div.share-status', {}, 'Printing your card...');
  let blob = null;
  card.then((b) => {
    blob = b;
    img.src = URL.createObjectURL(b);
    status.textContent = 'Your card. Post it. Make them play.';
  });
  const act = (fn) => async (e) => {
    if (!blob) return;
    const btn = e.currentTarget;
    const msg = await fn(blob, shareLine);
    if (msg) btn.textContent = msg;
  };
  return h(
    'div.share',
    {},
    img,
    status,
    h(
      'div.share-buttons',
      {},
      h('button.btn.blue', { onclick: act(onShareImage) }, 'SHARE IMAGE'),
      h('button.btn.ghost', { onclick: act(onDownload) }, 'DOWNLOAD'),
      h('button.btn.ghost.tweet-btn', { onclick: act((b, line) => onTweet(line)) }, icon('bird'), 'TWEET IT'),
    ),
  );
}

// Societal collapse gets the Oregon Trail treatment.
function trailScreen(root, { E, date, state, newAchievements, discovered, onAgain, onTitle, shareLine, shareCard, sharing }) {
  const lines = h('div.trail-lines');
  const card = h(
    'div.panel.screen.trail',
    {},
    h('div.trail-head', {}, 'YOU HAVE DIED OF DYSENTERY.'),
    h(
      'div.tomb',
      {},
      h('div.stone', {}, h('div', {}, 'HERE LIES'), h('div', {}, 'THE CEO OF'), h('div', {}, 'PICKS &'), h('div', {}, 'SHOVELS INC.'), h('div.yr', {}, `1849 - ${date.year}`), h('div.pep', {}, 'PEPPERONI AND CHEESE')),
      h('div.dirt'),
    ),
    lines,
    h(
      'div.trail-stats',
      {},
      `FINAL P(DOOM) ${Math.round(state.doom)}%  ·  PEAK CASH ${money(state.stats.peakCash)}  ·  MODELS SHIPPED ${state.releases}  ·  ENDINGS ${discovered}/${ENDING_IDS.length}`,
    ),
    newAchievements.length ? h('div.new-ach', {}, ...newAchievements.map((id) => h('span.chip.good', {}, ACHIEVEMENT_BY_ID[id]?.name || id))) : null,
    sharePanel(shareCard, shareLine, sharing),
    h('div.title-buttons', {}, h('button.btn.big', { onclick: onAgain }, 'TRY THE TRAIL AGAIN'), h('button.btn.big.ghost', { onclick: onTitle }, 'MAIN MENU')),
  );
  const el = modal(root, card);
  el.classList.add('soft');
  let i = 0;
  const all = [E.subtitle, ...E.epitaph];
  const next = () => {
    if (i >= all.length || !el.isConnected) return;
    lines.append(h('p', {}, all[i++]));
    setTimeout(next, 900);
  };
  setTimeout(next, 900);
  return () => el.remove();
}

export function endingScreen(root, { content, ending, endingKey, state, sim, newAchievements, discovered, onAgain, onTitle, shareCard, sharing }) {
  const E = content.endings[endingKey] || content.endings.generic;
  const good = ending.type === 'survive';
  const date = sim.date(state);
  const epitaph = h('div.epitaph');
  let lines = [...E.epitaph];
  if (state.flags.bunker && ending.type === 'doom') lines.push('You watched it all from a bunker in New Zealand. The Wi-Fi was excellent. The beans ran out in March.');
  if (ending.singularity) lines.unshift(`At the singularity you rolled ${ending.roll} against p(doom) ${ending.doomAtRoll}%.`);
  const shareLine = good
    ? `I survived the AI singularity with p(doom) at ${ending.doomAtRoll}%.`
    : ending.type === 'winter'
      ? `I let the AI hype hit zero and got fired in ${date.year}. The Valley is a ghost town.`
      : ending.type === 'collapse'
        ? `The AI bubble popped, society collapsed, and I died of dysentery in ${date.year}.`
        : `I ended the world (${E.title}) in ${date.year} Q${date.quarter}.`;
  if (ending.type === 'collapse') return trailScreen(root, { E, date, state, newAchievements, discovered, onAgain, onTitle, shareLine, shareCard, sharing });
  const card = h(
    'div.panel.screen.ending',
    {},
    h(`div.stamp${good ? '.good' : ''}`, {}, E.stamp),
    h('div', { style: { fontFamily: 'var(--display)', fontSize: '9px', textAlign: 'left', color: '#8a8ea0' } }, `${date.year} Q${date.quarter} · PICKS & SHOVELS INC.`),
    h('h2', {}, E.title),
    h('div.subtitle', {}, E.subtitle),
    epitaph,
    h(
      'div.stats',
      {},
      stat('FINAL P(DOOM)', `${Math.round(state.doom)}%`),
      stat('PEAK CASH', money(state.stats.peakCash)),
      stat('MODELS SHIPPED', String(state.releases)),
      stat('INCIDENTS FIXED', String(state.stats.incidentsResolved + state.stats.incidentsAuto)),
      stat('INCIDENTS MISSED', String(state.stats.incidentsFailed)),
      stat('BOSSES BEATEN', `${state.stats.bossesDefeated}/${state.bossesStarted.length}`),
    ),
    newAchievements.length
      ? h('div', {}, h('div', { style: { fontFamily: 'var(--display)', fontSize: '9px', margin: '6px 0' } }, 'NEW ACHIEVEMENTS'), h('div.new-ach', {}, ...newAchievements.map((id) => h('span.chip.good', { title: ACHIEVEMENT_BY_ID[id]?.desc }, ACHIEVEMENT_BY_ID[id]?.name || id))))
      : null,
    h('div', { style: { fontFamily: 'var(--display)', fontSize: '9px', marginTop: '8px' } }, `ENDINGS DISCOVERED ${discovered}/${ENDING_IDS.length}`),
    sharePanel(shareCard, shareLine, sharing),
    h('div.title-buttons', {}, h('button.btn.big', { onclick: onAgain }, 'PLAY AGAIN'), h('button.btn.big.ghost', { onclick: onTitle }, 'MAIN MENU')),
  );
  const el = modal(root, card);
  el.classList.add('soft');
  // Typewriter the epitaph, one line at a time.
  let i = 0;
  const next = () => {
    if (i >= lines.length || !el.isConnected) return;
    epitaph.append(h('p', {}, lines[i++]));
    setTimeout(next, 900);
  };
  setTimeout(next, 500);
  return () => el.remove();
}
