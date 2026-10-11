import { describe, it, expect } from 'vitest';
import { generateMap, tileKind, GRID } from '../src/sim/map.js';

describe('city map', () => {
  const map = generateMap();

  it('lays out four 2x2 plots per plot block', () => {
    const plotBlocks = map.blocks.filter((b) => b.type === 'P');
    expect(map.plots.length).toBe(plotBlocks.length * 4);
    const ids = new Set(map.plots.map((p) => p.id));
    expect(ids.size).toBe(map.plots.length);
  });

  it('places six lab HQs, a park and a marina', () => {
    expect(map.labs.length).toBe(6);
    expect(map.blocks.filter((b) => b.type === 'K').length).toBe(1);
    expect(map.blocks.filter((b) => b.type === 'M').length).toBe(1);
  });

  it('puts plot centers on land and never on a road', () => {
    for (const p of map.plots) {
      expect(tileKind(map, Math.floor(p.x), Math.floor(p.z))).toBe('block');
      expect(tileKind(map, Math.floor(p.x - 0.5), Math.floor(p.z - 0.5))).toBe('block');
    }
  });

  it('pre-builds homes and shops, keeping some protected from demolition', () => {
    const homes = map.plots.filter((p) => p.filler === 'home');
    const shops = map.plots.filter((p) => p.filler === 'shop');
    expect(homes.length).toBeGreaterThanOrEqual(5);
    expect(shops.length).toBeGreaterThanOrEqual(5);
    expect(homes.filter((p) => p.protected).length).toBeGreaterThanOrEqual(3);
    expect(shops.filter((p) => p.protected).length).toBeGreaterThanOrEqual(3);
    const empty = map.plots.filter((p) => !p.filler);
    expect(empty.length).toBeGreaterThanOrEqual(25);
  });

  it('reserves one protected plot near the center for the Picks & Shovels HQ', () => {
    const hq = map.plots.filter((p) => p.filler === 'hq');
    expect(hq.length).toBe(1);
    expect(hq[0].protected).toBe(true);
    expect(Math.abs(hq[0].x - 15)).toBeLessThanOrEqual(2);
    expect(Math.abs(hq[0].z - 15)).toBeLessThanOrEqual(2);
  });

  it('has water at the cut corners, roads between land blocks, and a beach ring', () => {
    expect(tileKind(map, 4, 4)).toBe('water'); // block (0,0) is water
    expect(tileKind(map, 12, 10)).toBe('road');
    expect(tileKind(map, 0, 0)).toBe('water');
    const kinds = new Set();
    for (let x = 0; x < GRID; x++) for (let z = 0; z < GRID; z++) kinds.add(tileKind(map, x, z));
    expect([...kinds].sort()).toEqual(['beach', 'block', 'road', 'water']);
  });

  it('is deterministic', () => {
    expect(JSON.stringify(generateMap())).toBe(JSON.stringify(map));
  });
});
