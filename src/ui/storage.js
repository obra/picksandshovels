// Everything the game remembers between visits, in localStorage.

const KEYS = {
  save: 'ps.save.v1',
  meta: 'ps.meta.v1',
};

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or full storage: the game still plays, it just forgets.
  }
}

export function loadMeta() {
  return {
    runs: 0,
    endings: {},
    achievements: {},
    tipsDone: false,
    best: null,
    ...read(KEYS.meta, {}),
  };
}

export function saveMeta(meta) {
  write(KEYS.meta, meta);
}

export function loadGame() {
  try {
    return window.localStorage.getItem(KEYS.save);
  } catch {
    return null;
  }
}

export function saveGame(serialized) {
  try {
    window.localStorage.setItem(KEYS.save, serialized);
  } catch {
    // ignore
  }
}

export function clearGame() {
  try {
    window.localStorage.removeItem(KEYS.save);
  } catch {
    // ignore
  }
}
