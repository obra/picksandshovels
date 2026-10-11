// Seeded PRNG (mulberry32). The generator state lives in the game state as a
// plain number so saves round-trip and runs replay deterministically.

export function nextRandom(state) {
  let a = (state.rng = (state.rng + 0x6d2b79f5) | 0);
  a = Math.imul(a ^ (a >>> 15), a | 1);
  a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
  return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
}

export function randRange(state, lo, hi) {
  return lo + (hi - lo) * nextRandom(state);
}

export function randInt(state, lo, hiInclusive) {
  return lo + Math.floor(nextRandom(state) * (hiInclusive - lo + 1));
}

export function pick(state, list) {
  return list[Math.floor(nextRandom(state) * list.length)];
}

// Stateless hash for cosmetic variety (colors, window patterns) that must not
// consume game randomness.
export function hash01(...ns) {
  let h = 2166136261;
  for (const n of ns) {
    h ^= n | 0;
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
  }
  return (h >>> 0) / 4294967296;
}
