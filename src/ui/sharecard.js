// The end-of-run share card: a 1200x630 PNG of your city in its ending state,
// with the outcome, a rubber stamp, a few stats, and the URL. Built to be
// posted.

import { drawSprite } from './icons.js';
import { money } from './format.js';

const W = 1200;
const H = 630;
const INK = '#22232b';
const PAPER = '#fffdf5';
const URL = 'PICKSANDSHOVELS.ORG';

function wrap(ctx, text, maxW) {
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function text(ctx, str, x, y, font, color, maxW, lineH = 0) {
  ctx.font = font;
  ctx.fillStyle = color;
  const lines = maxW ? wrap(ctx, str, maxW) : [str];
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
  return y + lines.length * lineH;
}

function outcomeLine(ending, date) {
  if (ending.type === 'survive') return `ROLLED ${ending.roll} VS P(DOOM) ${ending.doomAtRoll}%. HUMANITY SURVIVES.`;
  if (ending.type === 'doom' && ending.singularity) return `ROLLED ${ending.roll} VS P(DOOM) ${ending.doomAtRoll}%. OH NO.`;
  if (ending.type === 'doom') return `P(DOOM) HIT 100% IN ${date.year} Q${date.quarter}.`;
  if (ending.type === 'collapse') return `THE BUBBLE POPPED IN ${date.year}. SO DID SOCIETY.`;
  return `HYPE HIT ZERO IN ${date.year} Q${date.quarter}. FIRED.`;
}

const SITE = 'https://picksandshovels.org';

function escapeHtml(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// The caption that goes with the card: plain text, and HTML with a real link.
export function shareSummary({ ending, E, state, date }) {
  const outcome = outcomeLine(ending, date);
  const models = `${state.releases} model${state.releases === 1 ? '' : 's'} shipped`;
  const stats = `Peak cash ${money(state.stats.peakCash)} · ${models}.`;
  const ask = 'Can you keep p(doom) under 100%?';
  const text = [`PICKS & SHOVELS: "${E.title}"`, `${outcome} ${E.subtitle}`, stats, `${ask} Play: ${SITE}`].join('\n');
  const html =
    `<p><b>PICKS &amp; SHOVELS</b>: &ldquo;${escapeHtml(E.title)}&rdquo;<br>` +
    `${escapeHtml(outcome)} ${escapeHtml(E.subtitle)}<br>` +
    `${escapeHtml(stats)}<br>` +
    `${escapeHtml(ask)} Play: <a href="${SITE}">picksandshovels.org</a></p>`;
  return { text, html };
}

// world: the World (we render one frame and copy its canvases).
export async function renderShareCard({ world, state, ending, E, date }) {
  await Promise.all([document.fonts.load('20px "Press Start 2P"'), document.fonts.load('24px "Pixelify Sans"')]);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // The city, as it ended, drawn right after a fresh render.
  world.update(0, state, {});
  const src = world.stage.canvas;
  const scale = Math.max(W / src.width, H / src.height);
  const dw = src.width * scale;
  const dh = src.height * scale;
  const dx = (W - dw) / 2;
  const dy = (H - dh) / 2;
  ctx.drawImage(world.sky.canvas, dx, dy, dw, dh);
  // Nudge the city right, out from behind the panel.
  ctx.drawImage(src, dx + 160, dy, dw, dh);

  const trail = ending.type === 'collapse';
  const good = ending.type === 'survive';
  const panelBg = trail ? '#000' : PAPER;
  const fg = trail ? '#fff' : INK;
  const px = 36;
  const py = 36;
  const pw = 560;
  const ph = H - 72;
  ctx.fillStyle = trail ? '#6a6e7c' : INK;
  ctx.fillRect(px + 8, py + 8, pw, ph);
  ctx.fillStyle = panelBg;
  ctx.fillRect(px, py, pw, ph);
  ctx.strokeStyle = trail ? '#fff' : INK;
  ctx.lineWidth = 6;
  ctx.strokeRect(px, py, pw, ph);

  // Brand row.
  drawSprite(ctx, 'pick', px + 26, py + 22, 3);
  drawSprite(ctx, 'shovel', px + 70, py + 22, 3);
  text(ctx, 'PICKS & SHOVELS', px + 122, py + 58, '20px "Press Start 2P"', fg);

  let y = py + 120;
  if (trail) {
    y = text(ctx, 'YOU HAVE DIED OF DYSENTERY.', px + 28, y - 6, '20px "Press Start 2P"', '#fff', pw - 56, 32);
    // Tombstone: a round-topped slab whose arc starts at ty, on a strip of grass.
    const tw = 280;
    const tx = px + (pw - tw) / 2;
    const ty = y + 6;
    const r = tw / 2;
    const bottom = ty + 236;
    ctx.fillStyle = '#8e93a3';
    ctx.beginPath();
    ctx.moveTo(tx, bottom);
    ctx.lineTo(tx, ty + r);
    ctx.arc(tx + r, ty + r, r, Math.PI, 0);
    ctx.lineTo(tx + tw, bottom);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#6a6e7c';
    ctx.fillRect(tx + tw - 12, ty + r, 12, bottom - ty - r);
    ctx.fillStyle = '#3fbf6a';
    ctx.fillRect(tx - 50, bottom, tw + 100, 16);
    ctx.textAlign = 'center';
    const cx = tx + r;
    text(ctx, 'HERE LIES', cx, ty + 78, '15px "Press Start 2P"', INK);
    text(ctx, 'THE CEO OF', cx, ty + 106, '15px "Press Start 2P"', INK);
    text(ctx, 'PICKS & SHOVELS', cx, ty + 134, '15px "Press Start 2P"', INK);
    text(ctx, `1849 - ${date.year}`, cx, ty + 172, '15px "Press Start 2P"', INK);
    text(ctx, 'PEPPERONI AND CHEESE', cx, ty + 206, '10px "Press Start 2P"', '#3a3c48');
    ctx.textAlign = 'left';
    y = bottom + 30;
  } else {
    y = text(ctx, E.title.toUpperCase(), px + 28, y, '30px "Press Start 2P"', fg, pw - 56, 42);
    y = text(ctx, E.subtitle, px + 28, y + 8, '26px "Pixelify Sans"', '#4a4c5a', pw - 56, 30);
    y += 16;
    y = text(ctx, outcomeLine(ending, date), px + 28, y + 6, '14px "Press Start 2P"', good ? '#2f9a52' : '#c63a36', pw - 56, 24);
    y += 22;
    const stats = [
      ['YEAR', `${date.year} Q${date.quarter}`],
      ['P(DOOM)', `${Math.round(state.doom)}%`],
      ['PEAK CASH', money(state.stats.peakCash)],
      ['MODELS', String(state.releases)],
    ];
    stats.forEach(([k, v], i) => {
      const sx = px + 28 + (i % 2) * 254;
      const sy = y + Math.floor(i / 2) * 70;
      ctx.fillStyle = '#f3efe2';
      ctx.fillRect(sx, sy, 240, 58);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.strokeRect(sx, sy, 240, 58);
      text(ctx, k, sx + 12, sy + 22, '10px "Press Start 2P"', '#8a8ea0');
      text(ctx, v, sx + 12, sy + 46, '16px "Press Start 2P"', INK);
    });
  }

  // URL strip.
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(px, py + ph - 70, pw, 70);
  ctx.fillStyle = INK;
  ctx.fillRect(px, py + ph - 73, pw, 3);
  text(ctx, `PLAY: ${URL}`, px + 28, py + ph - 26, '20px "Press Start 2P"', INK);

  // The rubber stamp, slapped across the city.
  ctx.save();
  ctx.translate(960, 120);
  ctx.rotate(0.14);
  ctx.font = '34px "Press Start 2P"';
  const sw = ctx.measureText(E.stamp).width + 40;
  ctx.fillStyle = 'rgba(255,253,245,0.85)';
  ctx.fillRect(-sw / 2, -36, sw, 64);
  ctx.strokeStyle = good ? '#3fbf6a' : '#f2504b';
  ctx.lineWidth = 8;
  ctx.strokeRect(-sw / 2, -36, sw, 64);
  ctx.fillStyle = good ? '#2f9a52' : '#f2504b';
  ctx.textAlign = 'center';
  ctx.fillText(E.stamp, 0, 12);
  ctx.restore();

  return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/png'));
}

// Exposed for tests.
export { wrap as wrapForTest, text as textForTest };
