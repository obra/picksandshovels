// 8x8 pixel icons as inline SVG, drawn in currentColor.

const MAPS = {
  skull: ['.######.', '########', '#..##..#', '#..##..#', '########', '.##..##.', '.######.', '.#.##.#.'],
  flame: ['...#....', '..##....', '..###.#.', '.#####..', '.######.', '########', '.######.', '..####..'],
  shield: ['########', '#......#', '#.####.#', '#.####.#', '#.####.#', '.#.##.#.', '..#..#..', '...##...'],
  chip: ['#.#.#.#.', '.######.', '##....##', '.#.##.#.', '##.##.##', '.#....#.', '.######.', '#.#.#.#.'],
  coin: ['..####..', '.#....#.', '#.####.#', '#.#....#', '#.####.#', '#....#.#', '.####.#.', '..####..'],
  clock: ['..####..', '.#....#.', '#...#..#', '#...#..#', '#...###.', '#......#', '.#....#.', '..####..'],
  bolt: ['....###.', '...###..', '..###...', '.######.', '...###..', '..###...', '.##.....', '#.......'],
  pick: ['.######.', '#..##..#', '...##...', '...##...', '...##...', '...##...', '...##...', '...##...'],
  shovel: ['...##...', '...##...', '...##...', '...##...', '..####..', '.######.', '.######.', '..####..'],
  pause: ['........', '.##..##.', '.##..##.', '.##..##.', '.##..##.', '.##..##.', '.##..##.', '........'],
  bird: ['........', '......##', '.##..###', '########', '.######.', '..####..', '...#....', '..#.....'],
  button: ['..####..', '.######.', '##.##.##', '########', '##....##', '.######.', '########', '########'],
  sound: ['...#....', '..##.#..', '####..#.', '####.#.#', '####.#.#', '####..#.', '..##.#..', '...#....'],
  mute: ['...#....', '..##....', '####.#.#', '####..#.', '####..#.', '####.#.#', '..##....', '...#....'],
  star: ['...##...', '...##...', '########', '.######.', '..####..', '.##..##.', '.#....#.', '........'],
  gpu: ['........', '########', '#.##.###', '#.##.#.#', '#.##.###', '########', '.#.#.#..', '........'],
  megaphone: ['......#.', '....###.', '#.#####.', '########', '########', '#.#####.', '..#.###.', '..#...#.'],
  smile: ['.######.', '########', '##.##.##', '########', '#.####.#', '##....##', '.######.', '..####..'],
  brain: ['.##.##..', '#..#..#.', '#.##.###', '#..#...#', '##.##.##', '.#..#..#', '..####.#', '.......#'],
};

const cache = new Map();

export function icon(name, cls = '') {
  const key = `${name}|${cls}`;
  if (!cache.has(key)) {
    const rows = MAPS[name] || MAPS.star;
    let rects = '';
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] === '#') rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    });
    cache.set(
      key,
      `<svg class="icon ${cls}" viewBox="0 0 8 8" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${rects}</svg>`,
    );
  }
  const span = document.createElement('span');
  span.className = 'icon-wrap';
  span.innerHTML = cache.get(key);
  return span;
}

export const CATEGORY_ICON = { compute: 'gpu', safety: 'shield', hype: 'megaphone', upgrades: 'star' };

// Multi-color sprites: # metal, w wood, k outline.
const SPRITES = {
  pick: [
    '...kkkkkkkk...',
    '.kk########kk.',
    'k###kkwwkk###k',
    'k#kk.kwwk.kk#k',
    'kk...kwwk...kk',
    '.....kwwk.....',
    '.....kwwk.....',
    '.....kwwk.....',
    '.....kwwk.....',
    '.....kwwk.....',
    '.....kwwk.....',
    '.....kwwk.....',
    '.....kkkk.....',
    '..............',
  ],
  shovel: [
    '.....kkkk.....',
    '....kwwwwk....',
    '.....kwwk.....',
    '.....kwwk.....',
    '.....kwwk.....',
    '.....kwwk.....',
    '.....kwwk.....',
    '....kk##kk....',
    '...k######k...',
    '...k######k...',
    '...k######k...',
    '...k######k...',
    '....k####k....',
    '.....kkkk.....',
  ],
};
const SPRITE_COLORS = { '#': '#d8dee8', w: '#c68d55', k: '#22232b' };

export function sprite(name, cls = '') {
  const rows = SPRITES[name];
  let rects = '';
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = SPRITE_COLORS[row[x]];
      if (c) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`;
    }
  });
  const span = document.createElement('span');
  span.className = 'icon-wrap';
  span.innerHTML = `<svg class="sprite ${cls}" viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
  return span;
}
