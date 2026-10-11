/**
 * PICKS & SHOVELS sound: chiptune SFX and generative background music,
 * synthesized at runtime with WebAudio. There are no audio assets.
 *
 * The engine talks to the `audio` singleton exported at the bottom:
 *
 *   audio.unlock()              call from the first click/keydown
 *   audio.sfx(name, { pitch })  one-shot; pitch is a semitone offset
 *   audio.music(mode)           'title' | 'play' | 'boss' | 'doom' | 'winter' | 'good' | 'off'
 *   audio.setIntensity(x)       p(doom)/100 during play
 *   audio.duck(seconds)         briefly lowers the music
 *   audio.unduck()              brings it back now
 *   audio.setMuted(b), audio.isMuted(), audio.setVolume(x)
 *
 * Browsers refuse to start audio before a user gesture, so nothing sounds
 * until unlock(). Earlier calls are harmless: mute, volume, intensity and the
 * requested music mode are remembered and take effect at unlock; one-shots
 * and ducks are dropped.
 *
 * Signal flow:
 *   SFX voices   → sfxBus → lowpass ──────────┐
 *   music tracks → musicBus → lowpass → duck ─┴→ master (volume, mute) → compressor → speakers
 *
 * Music is a lookahead sequencer: a 25 ms timer schedules notes about 0.1 s
 * ahead on the AudioContext clock, so nothing runs per animation frame. Songs
 * are 4-bar sections of scale degrees over chord progressions, which lets the
 * 'play' tune keep its melody while p(doom) re-harmonizes it (SONGS.play.tiers).
 */

const MUTE_KEY = 'ps.muted';
const DEFAULT_VOLUME = 0.7;
const MAX_VOICES = 12;
// Identical one-shots closer together than this are one event to the ear;
// playing both would only add loudness.
const RETRIGGER_GAP = 0.03;
const PUMP_MS = 25;
const SCHEDULE_AHEAD = 0.1;
const CROSSFADE = 1.2;
const DUCK_LEVEL = 0.3;
const PLAY_BPM_CALM = 112;
const PLAY_BPM_DOOM = 150;

// ---------------------------------------------------------------------------
// Pitch helpers

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const cents = (c) => 2 ** (c / 1200);
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const pick = (list) => list[Math.floor(Math.random() * list.length)];

const LETTERS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// Frequency of a note name such as 'C4', 'Bb2' or 'F#5'.
function note(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`audio: bad note name "${name}"`);
  const accidental = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return hz(12 * (Number(m[3]) + 1) + LETTERS[m[1]] + accidental);
}

// ---------------------------------------------------------------------------
// Engine state

let ctx = null;
let master;
let sfxBus;
let musicBus;
let duckGain;
let noiseBuffer;
let crushCurve;
const waves = {}; // NES-style pulse duty cycles, built per context

let muted = readMuted();
let volume = DEFAULT_VOLUME;
let intensity = 0;
let musicMode = 'off'; // most recently requested mode
let tracks = []; // music tracks; two of them while crossfading
let pumpTimer = null;
const voices = []; // live SFX voices, oldest first
const lastTrigger = new Map(); // sfx name → context time it last started
const warned = new Set();
let duckUntil = 0;

function readMuted() {
  try {
    // Through `window` because Node (which has no window) warns on any
    // touch of its experimental global localStorage.
    return globalThis.window?.localStorage?.getItem(MUTE_KEY) === '1';
  } catch {
    return false; // storage is unavailable in some private modes and sandboxed frames
  }
}

function writeMuted(value) {
  try {
    globalThis.window?.localStorage?.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    // Same as readMuted: without storage the setting lasts for this page only.
  }
}

function warnOnce(message) {
  if (warned.has(message)) return;
  warned.add(message);
  console.warn(message);
}

function buildGraph() {
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -12;
  compressor.knee.value = 12;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.25;
  compressor.connect(ctx.destination);

  master = ctx.createGain();
  master.gain.value = muted ? 0 : volume;
  master.connect(compressor);

  // Square waves get harsh at the top; a gentle lowpass on each bus keeps them friendly.
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.9;
  sfxBus.connect(lowpass(9000)).connect(master);

  duckGain = ctx.createGain();
  duckGain.connect(master);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.5;
  musicBus.connect(lowpass(7000)).connect(duckGain);

  // Two seconds of white noise, shared by every noise sound. Long enough that
  // looping it for wind and endings doesn't sound periodic.
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const samples = noiseBuffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;

  waves.pulse12 = pulseWave(0.125);
  waves.pulse25 = pulseWave(0.25);

  // A staircase transfer curve: 3-bit amplitude, for the 'glitch' sound.
  crushCurve = new Float32Array(1024);
  for (let i = 0; i < crushCurve.length; i++) {
    const x = (i / (crushCurve.length - 1)) * 2 - 1;
    crushCurve[i] = Math.round(x * 4) / 4;
  }
}

function lowpass(frequency) {
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = frequency;
  return filter;
}

// A pulse wave with the given duty cycle, from its Fourier series.
function pulseWave(duty) {
  const harmonics = 64;
  const real = new Float32Array(harmonics);
  const imag = new Float32Array(harmonics);
  for (let k = 1; k < harmonics; k++) {
    real[k] = Math.sin(2 * Math.PI * k * duty) / (Math.PI * k);
    imag[k] = (1 - Math.cos(2 * Math.PI * k * duty)) / (Math.PI * k);
  }
  return ctx.createPeriodicWave(real, imag);
}

// ---------------------------------------------------------------------------
// Synthesis primitives, shared by SFX and music

// Sets `param` from a constant, or from a path of [secondsAfterT, value]
// points that glides exponentially (or linearly) between them.
function automate(param, t, spec, scale = 1, linear = false) {
  if (typeof spec === 'number') {
    param.setValueAtTime(spec * scale, t);
    return;
  }
  const [[t0, v0], ...rest] = spec;
  param.setValueAtTime(v0 * scale, t + t0);
  for (const [dt, v] of rest) {
    if (linear) param.linearRampToValueAtTime(v * scale, t + dt);
    else param.exponentialRampToValueAtTime(v * scale, t + dt);
  }
}

// Attack to `vol` over `a`, decay toward `vol * s` over about `d`, hold until
// `dur` (default: the end of the decay), then release over about `r`.
// Returns the time the sound has died away.
function envelope(param, t, o) {
  const { vol, a = 0.004, d = 0.1, s = 1, r = 0.04 } = o;
  const off = t + Math.max(o.dur ?? a + d, a);
  param.setValueAtTime(0, t);
  param.linearRampToValueAtTime(vol, t + a);
  if (s < 1) param.setTargetAtTime(vol * s, t + a, d / 3);
  param.setTargetAtTime(0, off, r / 5);
  return off + r;
}

// Plays one oscillator into `dest` at `t`. Options: wave, f (Hz or path),
// ratio (pitch multiplier), linear, detune (cents), vib (cents) and vibRate,
// lp (lowpass Hz or path), plus the envelope's vol/a/d/s/dur/r.
function playTone(dest, t, o, onEnd) {
  const osc = ctx.createOscillator();
  const wave = o.wave ?? 'square';
  if (waves[wave]) osc.setPeriodicWave(waves[wave]);
  else osc.type = wave;
  automate(osc.frequency, t, o.f, o.ratio ?? 1, o.linear);
  if (o.detune) osc.detune.value = o.detune;

  const amp = ctx.createGain();
  const end = envelope(amp.gain, t, o);
  const nodes = [osc, amp];
  let head = osc;
  if (o.lp) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    automate(filter.frequency, t, o.lp);
    head = head.connect(filter);
    nodes.push(filter);
  }
  if (o.vib) {
    const lfo = ctx.createOscillator();
    lfo.frequency.value = o.vibRate ?? 5.5;
    const depth = ctx.createGain();
    depth.gain.value = o.vib;
    lfo.connect(depth).connect(osc.detune);
    lfo.start(t);
    lfo.stop(end);
    nodes.push(lfo, depth);
  }
  head.connect(amp).connect(dest);
  osc.start(t);
  osc.stop(end);
  osc.onended = () => {
    for (const node of nodes) node.disconnect();
    onEnd?.();
  };
  return osc;
}

// Plays filtered noise into `dest` at `t`. Options: filter type, f (Hz or
// path), q, ratio, rate (playback speed), plus the envelope's options; the
// envelope is percussive (s = 0) unless told otherwise.
function playNoise(dest, t, o, onEnd) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  if (o.rate) src.playbackRate.value = o.rate;
  const filter = ctx.createBiquadFilter();
  filter.type = o.filter ?? 'bandpass';
  filter.Q.value = o.q ?? 1;
  automate(filter.frequency, t, o.f ?? 1000, o.ratio ?? 1);
  const amp = ctx.createGain();
  const end = envelope(amp.gain, t, { s: 0, ...o });
  src.connect(filter).connect(amp).connect(dest);
  src.start(t, Math.random() * (noiseBuffer.duration - 0.1));
  src.stop(end);
  src.onended = () => {
    src.disconnect();
    filter.disconnect();
    amp.disconnect();
    onEnd?.();
  };
  return src;
}

// ---------------------------------------------------------------------------
// Sound effects
//
// Each recipe gets a builder `s` whose tone/noise/seq calls take times
// relative to the sound's start and transpose by the requested pitch.
// Tones also take `octave` to shift one part of a sound by octaves.
// Recipe options: cap (max simultaneous copies, default 3), lp (lowpass Hz
// for the whole sound), crush (3-bit amplitude), level (output gain).

const FLAT = cents(-55);
const FLATTER = cents(-110);

const SFX = {
  click: {
    cap: 2,
    play(s) {
      s.tone({ wave: 'pulse25', f: [[0, note('E6')], [0.03, note('B5')]], vol: 0.08, a: 0.002, d: 0.03, s: 0, r: 0.01 });
    },
  },

  hit: {
    cap: 2,
    play(s) {
      s.tone({ wave: 'square', f: [[0, 240], [0.07, 110]], vol: 0.13, a: 0.002, d: 0.07, s: 0, r: 0.02 });
      s.tone({ wave: 'pulse25', f: [[0, 960], [0.025, 480]], vol: 0.05, a: 0.001, d: 0.025, s: 0, r: 0.01 });
      s.noise({ filter: 'highpass', f: 2500, vol: 0.06, a: 0.001, d: 0.025, r: 0.01 });
    },
  },

  resolve: {
    play(s) {
      const arpeggio = [[0, 'E5', 0.05], [0.06, 'G5', 0.05], [0.12, 'C6', 0.16]];
      s.seq({ wave: 'pulse25', vol: 0.09, d: 0.08, s: 0.5, r: 0.06 }, arpeggio);
      s.seq({ wave: 'triangle', vol: 0.1, d: 0.08, s: 0.5, r: 0.06, octave: -1 }, arpeggio);
    },
  },

  fail: {
    lp: 2200,
    play(s) {
      const blat = { wave: 'sawtooth', vol: 0.11, a: 0.01, d: 0.1, s: 0.7, r: 0.06 };
      const fall = [[0, note('A3')], [0.35, note('E3')]];
      s.tone({ ...blat, f: [[0, note('D4')], [0.14, note('C#4')]], dur: 0.14 });
      s.tone({ ...blat, at: 0.17, f: fall, dur: 0.35, vib: 30, vibRate: 9, r: 0.1 });
      s.tone({ ...blat, at: 0.17, f: fall, dur: 0.35, wave: 'square', vol: 0.05, detune: -12, r: 0.1 });
    },
  },

  buy: {
    play(s) {
      s.noise({ filter: 'bandpass', f: 2800, q: 1.5, vol: 0.12, a: 0.001, d: 0.035 }); // drawer clack
      s.tone({ wave: 'square', f: [[0, 260], [0.05, 140]], vol: 0.07, a: 0.001, d: 0.05, s: 0 }); // thunk
      s.tone({ wave: 'pulse25', at: 0.06, f: note('E6'), vol: 0.07, d: 0.05, s: 0 }); // ka-
      s.tone({ wave: 'pulse25', at: 0.11, f: note('A6'), vol: 0.075, d: 0.35, s: 0 }); // -ching
      s.tone({ wave: 'triangle', at: 0.11, f: note('A7'), vol: 0.03, d: 0.2, s: 0 }); // bell shimmer
    },
  },

  coin: {
    play(s) {
      s.tone({ wave: 'pulse25', f: note('C6'), vol: 0.08, a: 0.002, dur: 0.045, r: 0.005 });
      s.tone({ wave: 'pulse25', at: 0.045, f: note('G6'), vol: 0.08, d: 0.22, s: 0, r: 0.03 });
      s.tone({ wave: 'triangle', at: 0.045, f: note('G5'), vol: 0.06, d: 0.15, s: 0 });
    },
  },

  build: {
    play(s) {
      s.tone({ wave: 'triangle', f: [[0, 170], [0.16, 42]], vol: 0.35, a: 0.002, d: 0.18, s: 0 });
      s.tone({ wave: 'sine', f: [[0, 120], [0.16, 35]], vol: 0.3, a: 0.002, d: 0.18, s: 0 });
      s.noise({ filter: 'lowpass', f: [[0, 900], [0.12, 200]], vol: 0.12, a: 0.002, d: 0.12 });
      s.seq({ wave: 'pulse12', vol: 0.045, d: 0.06, s: 0 }, [
        [0.1, 'C6'],
        [0.145, 'G6'],
        [0.19, 'E6'],
        [0.235, 'C7'],
      ]);
    },
  },

  // Fires often, so it is soft, short and round: a triangle "wee-oo".
  alarm: {
    cap: 1,
    play(s) {
      const siren = [[0, 700], [0.09, 1050], [0.2, 760]];
      s.tone({ wave: 'triangle', f: siren, vol: 0.12, a: 0.01, dur: 0.2, r: 0.04 });
      s.tone({ wave: 'pulse25', f: siren, vol: 0.025, a: 0.01, dur: 0.2, r: 0.04 });
    },
  },

  release: {
    cap: 1,
    play(s) {
      const brass = { wave: 'pulse25', vol: 0.1, a: 0.004, d: 0.1, s: 0.7, r: 0.05 };
      s.seq(brass, [
        [0, 'G4', 0.07],
        [0.08, 'C5', 0.07],
        [0.16, 'E5', 0.07],
        [0.24, 'G5', 0.2],
        [0.48, 'E5', 0.07],
        [0.56, 'G5', 0.07],
      ]);
      // The big last note comes out flat and sags. It shipped anyway.
      const top = note('C6');
      s.tone({ ...brass, at: 0.66, f: [[0, top * FLAT], [0.6, top * FLATTER]], dur: 0.6, r: 0.25, vib: 12 });
      s.tone({ wave: 'pulse12', at: 0.66, f: note('G5'), vol: 0.04, dur: 0.6, r: 0.25 });
      s.seq({ wave: 'triangle', vol: 0.2, d: 0.1, s: 0.8, r: 0.05 }, [
        [0, 'C3', 0.22],
        [0.24, 'G2', 0.2],
        [0.48, 'C3', 0.15],
        [0.66, 'C3', 0.6],
      ]);
      s.noise({ filter: 'highpass', f: 5000, at: 0.66, vol: 0.06, a: 0.002, d: 0.4 });
    },
  },

  card: {
    play(s) {
      s.noise({ filter: 'bandpass', f: [[0, 700], [0.16, 3200]], q: 1.2, vol: 0.09, a: 0.07, dur: 0.12, s: 1, r: 0.06 });
      s.tone({ wave: 'triangle', at: 0.15, f: note('A6'), vol: 0.12, d: 0.45, s: 0 });
      s.tone({ wave: 'sine', at: 0.15, f: note('A6') * 2.76, vol: 0.03, d: 0.12, s: 0 }); // bell overtone
    },
  },

  choose: {
    play(s) {
      s.seq({ wave: 'pulse25', vol: 0.1, d: 0.06, s: 0.4, r: 0.03 }, [
        [0, 'E5', 0.05],
        [0.055, 'A5', 0.09],
      ]);
      s.tone({ wave: 'triangle', at: 0.055, f: note('A4'), vol: 0.1, d: 0.1, s: 0 });
    },
  },

  // Two brass stabs a half step apart: dun... DUNN.
  boss: {
    cap: 1,
    play(s) {
      const stab = (at, name, dur) => {
        const f = note(name);
        for (const [mult, detune, vol] of [[1, -9, 0.11], [1, 9, 0.11], [1.5, 0, 0.06]]) {
          s.tone({
            wave: 'square',
            at,
            f: [[0, f * mult * 0.94], [0.05, f * mult]],
            detune,
            vol,
            a: 0.02,
            d: 0.2,
            s: 0.6,
            dur,
            r: 0.25,
            lp: [[0, 250], [0.06, 1600], [dur, 450]],
          });
        }
      };
      stab(0, 'Bb1', 0.14);
      stab(0.22, 'A1', 0.75);
      s.noise({ filter: 'lowpass', at: 0.22, f: [[0, 1200], [0.9, 150]], vol: 0.16, a: 0.005, d: 0.5, s: 0.2, dur: 0.6, r: 0.3 });
    },
  },

  bossHit: {
    cap: 2,
    play(s) {
      s.tone({ wave: 'square', f: [[0, 330], [0.09, 70]], vol: 0.12, a: 0.002, d: 0.09, s: 0 });
      s.tone({ wave: 'triangle', f: [[0, 130], [0.12, 45]], vol: 0.3, a: 0.002, d: 0.12, s: 0 });
      s.noise({ filter: 'bandpass', f: 1300, q: 0.8, vol: 0.13, a: 0.001, d: 0.06 });
    },
  },

  // Arpeggio up, then the bVI-bVII-I cadence every victory deserves.
  bossDefeat: {
    cap: 1,
    play(s) {
      const lead = { wave: 'pulse25', vol: 0.09, d: 0.1, s: 0.7, r: 0.06 };
      s.seq(lead, [
        [0, 'C5', 0.08],
        [0.09, 'E5', 0.08],
        [0.18, 'G5', 0.08],
        [0.27, 'C6', 0.28],
        [0.6, 'Ab5', 0.24],
        [0.87, 'Bb5', 0.24],
      ]);
      s.tone({ ...lead, at: 1.14, f: note('C6'), dur: 0.75, r: 0.35, vib: 15 });
      s.seq({ wave: 'pulse12', vol: 0.045, d: 0.1, s: 0.7, r: 0.06 }, [
        [0.27, 'G5', 0.28],
        [0.6, 'Eb5', 0.24],
        [0.87, 'F5', 0.24],
        [1.14, 'G5', 0.75],
      ]);
      s.seq({ wave: 'triangle', vol: 0.22, d: 0.1, s: 0.8, r: 0.06 }, [
        [0, 'C3', 0.25],
        [0.27, 'C3', 0.28],
        [0.6, 'Ab2', 0.24],
        [0.87, 'Bb2', 0.24],
        [1.14, 'C3', 0.75],
      ]);
      for (const at of [0.27, 1.14]) s.noise({ filter: 'highpass', f: 4500, at, vol: 0.06, a: 0.002, d: 0.45 });
    },
  },

  tweet: {
    play(s) {
      s.noise({ filter: 'bandpass', f: [[0, 400], [0.32, 4500]], q: 1.4, vol: 0.12, a: 0.26, dur: 0.3, s: 1, r: 0.06 });
      s.tone({ wave: 'triangle', at: 0.3, f: [[0, 2100], [0.05, 3300]], vol: 0.09, a: 0.003, dur: 0.05, r: 0.02 });
      s.tone({ wave: 'triangle', at: 0.38, f: [[0, 2300], [0.06, 3700]], vol: 0.09, a: 0.003, dur: 0.06, r: 0.02 });
    },
  },

  // A chord whose tape slows to a stop: pitch falls linearly toward zero.
  pause: {
    play(s) {
      for (const name of ['A4', 'C#5', 'E5']) {
        const f = note(name);
        s.tone({
          wave: 'sawtooth',
          f: [[0, f], [0.6, f * 0.06]],
          linear: true,
          lp: [[0, 3500], [0.6, 200]],
          vol: 0.06,
          a: 0.005,
          dur: 0.6,
          r: 0.05,
        });
      }
    },
  },

  redButton: {
    cap: 1,
    play(s) {
      s.noise({ filter: 'lowpass', f: [[0, 8000], [1.2, 150]], q: 0.7, vol: 0.28, a: 0.005, d: 0.35, s: 0.3, dur: 0.9, r: 0.4 });
      s.tone({ wave: 'sine', f: [[0, 110], [0.5, 28]], vol: 0.55, a: 0.003, d: 0.5, s: 0, r: 0.1 });
      s.tone({ wave: 'square', f: [[0, 55], [0.4, 30]], lp: 400, vol: 0.12, a: 0.003, d: 0.35, s: 0 });
    },
  },

  // Honk, honk, HONK: a two-tone horn a major third wide.
  blimp: {
    lp: 1800,
    play(s) {
      const honk = (at, name, dur) => {
        for (const [mult, vol] of [[1, 0.09], [2 ** (4 / 12), 0.07]]) {
          const f = note(name) * mult;
          s.tone({ wave: 'square', at, f: [[0, f * 0.9], [0.03, f]], vol, a: 0.01, d: 0.05, s: 0.8, dur, r: 0.04 });
        }
      };
      honk(0, 'F4', 0.09);
      honk(0.13, 'F4', 0.07);
      honk(0.25, 'Bb4', 0.22);
    },
  },

  achievement: {
    play(s) {
      s.tone({ wave: 'triangle', f: note('E4'), vol: 0.12, d: 0.4, s: 0 });
      s.seq({ wave: 'pulse25', vol: 0.07, d: 0.12, s: 0, r: 0.05 }, [
        [0, 'B5'],
        [0.05, 'E6'],
        [0.1, 'G#6'],
        [0.15, 'B6', 0.3],
      ]);
      s.seq({ wave: 'triangle', vol: 0.04, d: 0.08, s: 0 }, [
        [0.25, 'E7'],
        [0.33, 'B7'],
        [0.41, 'E7'],
      ]);
    },
  },

  // Eh-ehh, down a tritone.
  error: {
    cap: 1,
    lp: 1400,
    play(s) {
      const buzz = { wave: 'square', vol: 0.1, a: 0.003, d: 0.05, s: 0.8, r: 0.02 };
      s.tone({ ...buzz, f: note('E3'), dur: 0.07 });
      s.tone({ ...buzz, at: 0.1, f: note('Bb2'), dur: 0.13 });
    },
  },

  heartbeat: {
    cap: 1,
    play(s) {
      for (const [at, strength] of [[0, 1], [0.2, 0.7]]) {
        const thump = [[0, 75], [0.1, 38]];
        s.tone({ wave: 'sine', at, f: thump, vol: 0.5 * strength, a: 0.004, d: 0.13, s: 0 });
        s.tone({ wave: 'triangle', at, f: thump, vol: 0.16 * strength, a: 0.004, d: 0.1, s: 0 });
        s.noise({ filter: 'lowpass', at, f: 250, vol: 0.08 * strength, a: 0.002, d: 0.04 });
      }
    },
  },

  // Random chatter through a 3-bit crusher. The crusher quantizes full-scale
  // signal, so the parts are loud going in and `level` brings them back down.
  glitch: {
    cap: 2,
    crush: true,
    level: 0.12,
    play(s) {
      const parts = 7 + Math.floor(Math.random() * 6);
      let at = 0;
      for (let i = 0; i < parts; i++) {
        const dur = 0.018 + Math.random() * 0.03;
        if (Math.random() < 0.3) {
          s.noise({ filter: 'bandpass', f: 800 + Math.random() * 5000, q: 2, at, dur, vol: 0.8, a: 0.001, s: 1, r: 0.004 });
        } else {
          const wave = Math.random() < 0.5 ? 'triangle' : 'sawtooth';
          s.tone({ wave, f: 90 * 2 ** (Math.random() * 4.5), at, dur, vol: 0.7, a: 0.001, r: 0.004 });
        }
        at += dur + (Math.random() < 0.2 ? 0.03 : 0);
      }
    },
  },

  roll: {
    cap: 1,
    play(s) {
      s.tone({ wave: 'triangle', f: [[0, 1700], [0.02, 1100]], vol: 0.11, a: 0.001, d: 0.025, s: 0 });
      s.noise({ filter: 'highpass', f: 5000, vol: 0.05, a: 0.001, d: 0.012 });
    },
  },

  // A dissonant cluster sinks while noise swells up and swallows it.
  doomEnd: {
    cap: 1,
    play(s) {
      for (const [name, detune] of [['C4', -12], ['Db4', 9], ['F#4', -5], ['G4', 14]]) {
        const f = note(name);
        s.tone({
          wave: 'sawtooth',
          f: [[0, f], [3.4, f / 4]],
          detune,
          lp: [[0, 3000], [3.4, 180]],
          vol: 0.07,
          a: 0.04,
          dur: 3.4,
          r: 0.8,
        });
      }
      s.tone({ wave: 'sine', f: [[0, 65], [4, 28]], vol: 0.28, a: 0.3, dur: 3.6, r: 0.8 });
      s.noise({ filter: 'lowpass', f: [[0, 200], [2.6, 5000], [4.4, 500]], q: 0.5, vol: 0.16, a: 2.2, dur: 3.4, s: 1, r: 1 });
    },
  },

  // Wah, wah, wah, wahhhh. The last note deflates.
  winterEnd: {
    cap: 1,
    lp: 1600,
    play(s) {
      const horn = { wave: 'sawtooth', vol: 0.13, a: 0.03, d: 0.15, s: 0.75, r: 0.12 };
      for (const [at, name] of [[0, 'Bb3'], [0.38, 'A3'], [0.76, 'Ab3']]) {
        const f = note(name);
        s.tone({ ...horn, at, f: [[0, f * 0.97], [0.06, f]], dur: 0.3 });
      }
      const g = note('G3');
      s.tone({ ...horn, at: 1.14, f: [[0, g * 0.97], [0.06, g], [1.3, g * 0.89]], dur: 1.3, vib: 22, vibRate: 5, r: 0.3 });
    },
  },

  // A D major 9 chord blooming upward, with a little sparkle on top.
  goodEnd: {
    cap: 1,
    play(s) {
      ['D3', 'A3', 'D4', 'F#4', 'A4', 'C#5', 'E5'].forEach((name, i) => {
        const at = i * 0.07;
        s.tone({ wave: 'triangle', at, f: note(name), vol: 0.07, a: 0.3, dur: 2.2, r: 1.2 });
        if (i >= 4) {
          for (const detune of [-7, 7]) {
            s.tone({ wave: 'pulse12', at, f: note(name), detune, vol: 0.012, a: 0.5, dur: 2, r: 1.2 });
          }
        }
      });
      s.seq({ wave: 'pulse25', vol: 0.035, d: 0.2, s: 0 }, [
        [0.5, 'A5'],
        [0.58, 'D6'],
        [0.66, 'F#6'],
        [0.74, 'A6', 0.4],
      ]);
    },
  },
};

// Starts a voice for one SFX, making room under the per-sound and global caps.
// Returns null when the same sound was triggered a moment ago.
function startVoice(name, recipe) {
  const now = ctx.currentTime;
  if (now - (lastTrigger.get(name) ?? -Infinity) < RETRIGGER_GAP) return null;
  lastTrigger.set(name, now);

  const same = voices.filter((v) => v.name === name);
  if (same.length >= (recipe.cap ?? 3)) stopVoice(same[0]);
  if (voices.length >= MAX_VOICES) stopVoice(voices[0]);

  const out = ctx.createGain();
  out.gain.value = recipe.level ?? 1;
  out.connect(sfxBus);
  const voice = { name, out, input: out, nodes: [out], sources: [], live: 0, done: false };
  if (recipe.lp) voice.input = prependTo(voice, lowpass(recipe.lp));
  if (recipe.crush) {
    const shaper = ctx.createWaveShaper();
    shaper.curve = crushCurve;
    voice.input = prependTo(voice, shaper);
  }
  voices.push(voice);
  return voice;
}

function prependTo(voice, node) {
  node.connect(voice.input);
  voice.nodes.push(node);
  return node;
}

function removeVoice(voice) {
  const i = voices.indexOf(voice);
  if (i >= 0) voices.splice(i, 1);
}

function finishVoice(voice) {
  if (voice.done) return;
  voice.done = true;
  for (const node of voice.nodes) node.disconnect();
  removeVoice(voice);
}

// Fades a voice out over 15 ms to make room for a newer one.
function stopVoice(voice) {
  const now = ctx.currentTime;
  const gain = voice.out.gain;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(gain.value, now);
  gain.linearRampToValueAtTime(0, now + 0.015);
  for (const src of voice.sources) src.stop(now + 0.02);
  removeVoice(voice);
  // Sources that hadn't started yet may never report 'ended'; detach regardless.
  setTimeout(() => finishVoice(voice), 60);
}

function sfxBuilder(voice, t0, ratio) {
  const add = (src) => {
    voice.live += 1;
    voice.sources.push(src);
  };
  const ended = () => {
    voice.live -= 1;
    if (voice.live === 0) finishVoice(voice);
  };
  const builder = {
    tone(o) {
      add(playTone(voice.input, t0 + (o.at ?? 0), { ...o, ratio: ratio * 2 ** (o.octave ?? 0) }, ended));
    },
    noise(o) {
      add(playNoise(voice.input, t0 + (o.at ?? 0), { ...o, ratio }, ended));
    },
    // Plays [at, noteName, dur?] entries with shared options.
    seq(o, notes) {
      for (const [at, name, dur] of notes) builder.tone({ ...o, at: (o.at ?? 0) + at, f: note(name), dur: dur ?? o.dur });
    },
  };
  return builder;
}

// ---------------------------------------------------------------------------
// Music data
//
// Lines are one character per 16th note. In melodies, a digit or letter is a
// scale degree in base 36 (0 = tonic, 7 = the octave above, 'e' = 14); in bass
// lines R/F/O are the chord's root, fifth and the root an octave up. '-' holds
// the previous note one more step and '.' is silence. Drum lines use x
// (accent) and o (normal).

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  harmonic: [0, 2, 3, 5, 7, 8, 11],
};

const CHORD_SHAPES = {
  min: [0, 3, 7],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
};

const MINOR_PENTATONIC = [0, 3, 5, 7, 10, 12, 15];

const PATCH = {
  lead: { wave: 'pulse25', vol: 0.08, a: 0.005, d: 0.15, s: 0.55, r: 0.06 },
  bossLead: { wave: 'square', vol: 0.06, a: 0.003, d: 0.08, s: 0.5, r: 0.03 },
  warmLead: { wave: 'triangle', vol: 0.15, a: 0.02, d: 0.3, s: 0.7, r: 0.15 },
  coldLead: { wave: 'pulse12', vol: 0.055, a: 0.01, d: 0.5, s: 0.25, r: 0.4 },
  musicBox: { wave: 'triangle', vol: 0.13, a: 0.002, d: 0.9, s: 0, r: 0.2 },
  counter: { wave: 'pulse12', vol: 0.035, a: 0.002, d: 0.08, s: 0.3, r: 0.03 },
  bass: { wave: 'triangle', vol: 0.26, a: 0.004, d: 0.2, s: 0.8, r: 0.04 },
  pad: { wave: 'triangle', vol: 0.045, a: 0.25, d: 0.5, s: 0.8, r: 0.6 },
  snow: { wave: 'pulse12', vol: 0.018, a: 0.002, d: 0.3, s: 0, r: 0.1 },
};

const BASS = {
  bounce: 'R-..F-..R-..F-..',
  pulse: 'R.R.F.R.R.R.F.R.',
  drive: 'R.O.R.O.R.O.R.O.',
  heart: 'R-------........',
  long: 'R---------------',
  warm: 'R-----F-O-----F-',
  drone: 'R-----------',
};

const DRUMS = {
  title: { k: 'x.......x.x.....', s: '....x.......x...', h: 'o.o.o.o.o.o.o.o.' },
  play0: { k: 'x.......x.......', s: '....o.......o...', h: '..o...o...o...o.' },
  play1: { k: 'x.....x.x.......', s: '....x.......x...', h: 'o.o.o.o.o.o.o.o.' },
  play2: { k: 'x..x....x..x....', s: '....x.......x...', h: 'xoooxoooxoooxooo' },
  // Lub-dub twice a bar, and a clock ticking where the hats were.
  heart: { k: 'x.o.....x.o.....', h: '......o.......o.', deep: true },
  boss: { k: 'x...x...x...x...', s: '....x.......x..o', h: 'oooooooooooooooo' },
  good: { k: 'x.......x.......', s: '....o.......o...', h: '..o...o...o...o.', level: 0.7 },
  tick: { h: 'o...o...o...', level: 0.35 },
  none: {},
};

const FILL = '....x.......xoxx';
const DRUM_LEVEL = { x: 1, o: 0.6 };
const ECHOES = [[3, 0.35], [6, 0.12]]; // [steps later, relative volume]

// Song fields: bpm, key (MIDI tonic), bar (steps per bar), swing (fraction of
// a 16th that off-beat 8ths are delayed), scale, leadOct/bassOct/arpOct
// (octaves from the key), lead patch, bass and drums by name, phrases, and a
// form of 4-bar sections. A section names its chord progression (scale degrees,
// or { deg, q } for a borrowed chord), its lead phrase, and optionally a
// counter line: 'arp', 'harmony' (a third under the lead) or another phrase.
// Without one, alternate passes through the form add the harmony line.
const SONGS = {
  // Jaunty startup-ad optimism: shuffle, oom-pah bass, a tune you could whistle.
  title: {
    bpm: 120,
    key: 65,
    bar: 16,
    swing: 0.5,
    scale: 'major',
    leadOct: 0,
    bassOct: -1,
    arpOct: 1,
    lead: PATCH.lead,
    bass: 'bounce',
    drums: 'title',
    phrases: {
      A: '2-4-7--.6-7-9---' + '8-7-6-4-8-----..' + '7-5-7--.9-7-5---' + '3-5-7-8-7---4-..',
      B: '5.5.4-3-5-------' + '4.4.3-2-4-------' + '6.6.5-4-6---4-2-' + '5-------4-3-2-1-',
      C: '3-5-7--.8-7-5---' + '4-6-8--.9-8-6---' + '7-------9-----7-' + '--------........',
    },
    form: [
      { prog: [0, 4, 5, 3], lead: 'A' },
      { prog: [3, 4, 2, 5], lead: 'B' },
      { prog: [0, 4, 5, 3], lead: 'A' },
      { prog: [3, 4, 0, 0], lead: 'C', counter: 'arp', fill: true },
    ],
  },

  // The title's sibling. Intensity picks one of four arrangements of the same
  // melody: calm major, busier major, driving harmonic minor, and a sour
  // diminished version over a heartbeat. Tempo glides with intensity too.
  play: {
    bpm: PLAY_BPM_CALM,
    key: 60,
    bar: 16,
    leadOct: 1,
    bassOct: -1,
    arpOct: 0,
    lead: PATCH.lead,
    phrases: {
      P1: '0.2.4.7..7.6.4..' + '5.7.9.7..5.4.2..' + '3.5.7.8..7.5.3..' + '4---6---8---6-4-',
      P2: '0.2.4.7..7.6.4..' + '5.7.9.7..5.4.2..' + '3.5.7.8..7.5.3..' + '6.8.6.4.2---1---',
      P3: '9-------7---5---' + '7-------5---3---' + '4-------7---9---' + '8-----------6-8-',
    },
    form: [
      { prog: [0, 5, 3, 4], lead: 'P1' },
      { prog: [0, 5, 3, 4], lead: 'P2' },
      { prog: [5, 3, 0, 4], lead: 'P3' },
      { prog: [0, 5, 3, 4], lead: null, counter: 'arp' },
    ],
    tiers: [
      { scale: 'major', bass: 'bounce', drums: 'play0', swing: 0.25 },
      { scale: 'major', bass: 'pulse', drums: 'play1', counter: 'arp', swing: 0.15, fills: true },
      { scale: 'harmonic', bass: 'drive', drums: 'play2', counter: 'arp', fills: true },
      {
        scale: 'harmonic',
        bass: 'heart',
        drums: 'heart',
        counter: 'arp',
        arpEvery: 3, // three-against-four: the arpeggio stops lining up with the beat
        wobble: true,
        chordMap: { 3: { deg: 3, q: 'dim' }, 4: { deg: 6, q: 'dim7' } },
      },
    ],
  },

  // Urgent D minor: a 16th-note ostinato, then a heroic line over it.
  boss: {
    bpm: 160,
    key: 62,
    bar: 16,
    scale: 'harmonic',
    leadOct: 0,
    bassOct: -2,
    arpOct: 1,
    lead: PATCH.bossLead,
    bass: 'drive',
    drums: 'boss',
    fills: true,
    phrases: {
      OST: '0.0.3.0.4.0.3.2.' + '0.0.3.0.4.0.5.4.' + '5.5.7.5.9.5.7.5.' + '4.4.6.4.8.4.6.4.',
      HERO: '7-------9-------' + '8-------7---6---' + '5-------7---9---' + 'b---------------',
    },
    form: [
      { prog: [0, 0, 5, 4], lead: 'OST' },
      { prog: [0, 0, 5, 4], lead: 'OST', counter: 'arp' },
      { prog: [0, 0, 5, 4], lead: 'HERO', counter: 'OST', counterOct: -1 },
      { prog: [0, 0, 5, 4], lead: 'HERO', counter: 'OST', counterOct: -1 },
    ],
  },

  // A lullaby on a worn-out music box, in 3/4, winding down as it plays.
  doom: {
    bpm: 66,
    key: 57,
    bar: 12,
    scale: 'harmonic',
    leadOct: 1,
    bassOct: -1,
    arpOct: 1,
    lead: PATCH.musicBox,
    bass: 'drone',
    bassLevel: 0.5,
    drums: 'tick',
    counter: null,
    broken: true,
    phrases: {
      L1: 'b---9---7---' + 'c---b---a---' + '8---6---b---' + '9-------7---',
      L2: '7-9-b-e-----' + 'c-b-a-c-----' + 'b-8-6-8-----' + '7-----------',
    },
    form: [
      { prog: [0, 3, 4, 0], lead: 'L1' },
      { prog: [0, 3, 4, 0], lead: 'L2' },
    ],
  },

  // Sparse and cold: echoing high notes, wind, the odd snowflake.
  winter: {
    bpm: 70,
    key: 52,
    bar: 16,
    scale: 'minor',
    leadOct: 1,
    bassOct: -1,
    arpOct: 1,
    lead: PATCH.coldLead,
    bass: 'long',
    bassLevel: 0.6,
    drums: 'none',
    counter: null,
    echo: true,
    snow: true,
    wind: true,
    phrases: {
      W1: 'b-------7-------' + '9-------........' + 'a-------9---7---' + '8---------------',
      W2: 'e-------b-------' + 'c-------b---9---' + 'a-------........' + '8-------7-------',
    },
    form: [
      { prog: [0, 5, 3, 4], lead: 'W1' },
      { prog: [0, 5, 3, 4], lead: 'W2' },
      { prog: [0, 5, 3, 4], lead: null },
    ],
  },

  // Warm: soft pads, a triangle melody, I-iii-IV-iv.
  good: {
    bpm: 92,
    key: 62,
    bar: 16,
    swing: 0.25,
    scale: 'major',
    leadOct: 0,
    bassOct: -1,
    arpOct: 1,
    lead: PATCH.warmLead,
    bass: 'warm',
    drums: 'good',
    pad: true,
    phrases: {
      G1: '2---4---7-------' + '6---4---2-------' + '3---5---7---8---' + '7-------3-------',
      G2: '9---8---7---4---' + '8---6---4-------' + '5---7---9---7---' + '7---------------',
    },
    form: [
      { prog: [0, 2, 3, { deg: 3, q: 'min' }], lead: 'G1' },
      { prog: [0, 4, 5, 3], lead: 'G2', counter: 'arp' },
    ],
  },
};

// Parses a line (see "Music data") into notes indexed by their starting step.
function parseLine(text) {
  const notes = [];
  let last = null;
  [...text].forEach((ch, step) => {
    if (ch === '-') {
      if (last) last.len += 1;
    } else if (ch === '.') {
      last = null;
    } else {
      last = { ch, deg: parseInt(ch, 36), len: 1 };
      notes[step] = last;
    }
  });
  return notes;
}

const BASS_LINES = Object.fromEntries(Object.entries(BASS).map(([name, line]) => [name, parseLine(line)]));

// Parses each song's phrases into song.notes, and checks that every line fits
// the song's bar length, so a mistyped phrase fails here instead of drifting
// out of time.
function prepareSongs() {
  for (const [mode, song] of Object.entries(SONGS)) {
    const fail = (why) => {
      throw new Error(`audio: song "${mode}": ${why}`);
    };
    const checkLine = (what, line) => {
      if (line && line.length !== song.bar) fail(`${what} is ${line.length} steps, expected ${song.bar}`);
    };
    song.notes = {};
    for (const [name, text] of Object.entries(song.phrases)) {
      if (text.length !== 4 * song.bar) fail(`phrase ${name} is ${text.length} steps, expected ${4 * song.bar}`);
      song.notes[name] = parseLine(text);
    }
    for (const arr of song.tiers ?? [song]) {
      const bass = arr.bass ?? song.bass;
      const drums = arr.drums ?? song.drums;
      if (!BASS[bass] || !DRUMS[drums]) fail(`unknown bass "${bass}" or drums "${drums}"`);
      checkLine(`bass ${bass}`, BASS[bass]);
      for (const part of ['k', 's', 'h']) checkLine(`drums ${drums}.${part}`, DRUMS[drums][part]);
      if (arr.fills) checkLine('fill', FILL);
    }
    for (const section of song.form) {
      if (section.prog.length !== 4) fail('every section is 4 bars');
      if (section.fill) checkLine('fill', FILL);
      for (const name of [section.lead, section.counter]) {
        if (name && name !== 'arp' && name !== 'harmony' && !song.notes[name]) fail(`unknown phrase ${name}`);
      }
    }
  }
}

prepareSongs();

// ---------------------------------------------------------------------------
// Music sequencer

// Semitones above the key for a scale degree, which may run past an octave
// either way.
function degreePitch(scale, deg) {
  const octave = Math.floor(deg / 7);
  return scale[deg - octave * 7] + 12 * octave;
}

// Chord tones, in semitones above the key, root first.
function chordTones(spec, scale, chordMap) {
  const chord = typeof spec === 'number' ? (chordMap?.[spec] ?? { deg: spec }) : spec;
  const root = degreePitch(scale, chord.deg);
  if (chord.q) return CHORD_SHAPES[chord.q].map((x) => root + x);
  return [0, 2, 4].map((k) => degreePitch(scale, chord.deg + k));
}

// Which 'play' arrangement suits intensity `x`. The 0.02 hysteresis keeps a
// meter that hovers at a boundary from flipping the harmony every bar.
const TIER_EDGES = [0.25, 0.5, 0.75];
function nextTier(tier, x) {
  while (tier < TIER_EDGES.length && x >= TIER_EDGES[tier] + 0.02) tier += 1;
  while (tier > 0 && x < TIER_EDGES[tier - 1] - 0.02) tier -= 1;
  return tier;
}

const playBpm = (heat) => PLAY_BPM_CALM + (PLAY_BPM_DOOM - PLAY_BPM_CALM) * heat;

function createTrack(mode, now) {
  const song = SONGS[mode];
  const out = ctx.createGain();
  out.connect(musicBus);
  return {
    mode,
    song,
    out,
    time: now + 0.05, // when the next step plays
    step: 0,
    bar: -1,
    heat: intensity, // intensity, smoothed so changes glide
    tier: song.tiers ? nextTier(0, intensity) : 0,
    bpm: song.tiers ? playBpm(intensity) : song.bpm,
    stopAt: Infinity,
    // Set at each bar:
    section: null,
    barInSection: 0,
    pass: 0,
    arr: song,
    scale: null,
    chord: null,
  };
}

function startBar(tr) {
  const { song } = tr;
  tr.bar += 1;
  const sections = song.form.length;
  tr.section = song.form[Math.floor(tr.bar / 4) % sections];
  tr.barInSection = tr.bar % 4;
  tr.pass = Math.floor(tr.bar / (4 * sections));
  if (song.tiers) {
    tr.tier = nextTier(tr.tier, tr.heat);
    tr.arr = song.tiers[tr.tier];
  }
  tr.scale = SCALES[tr.arr.scale ?? song.scale];
  tr.chord = chordTones(tr.section.prog[tr.barInSection], tr.scale, tr.arr.chordMap);
  if (song.broken && tr.bar > 0) {
    // The spring winds down bar by bar, until someone winds it back up.
    tr.bpm *= 0.97;
    if (tr.bpm < 50) tr.bpm = song.bpm;
  }
}

// Moves a track forward one 16th, sounding it if `audible`.
function advance(tr, audible) {
  const { song } = tr;
  const i = tr.step % song.bar;
  if (i === 0) startBar(tr);
  if (song.tiers) {
    tr.heat += (intensity - tr.heat) * 0.04;
    tr.bpm = playBpm(tr.heat);
  }
  const stepDur = 60 / tr.bpm / 4;
  if (audible) playStep(tr, i, stepDur);
  tr.time += stepDur;
  tr.step += 1;
}

function counterFor(tr) {
  if (tr.section.counter !== undefined) return tr.section.counter;
  if (tr.arr.counter !== undefined) return tr.arr.counter;
  return tr.pass % 2 === 1 ? 'harmony' : null;
}

function playStep(tr, i, stepDur) {
  const { song, arr, section, chord, scale, out } = tr;
  const swing = arr.swing ?? song.swing ?? 0;
  const t = tr.time + (i % 4 === 2 ? swing * stepDur : 0);
  const pos = tr.barInSection * song.bar + i;
  // During play the arpeggio and hats push forward as doom rises.
  const busy = song.tiers ? 0.6 + 0.6 * tr.heat : 1;

  const lead = section.lead && song.notes[section.lead][pos];
  if (lead) {
    playLead(tr, t, song.key + 12 * song.leadOct + degreePitch(scale, lead.deg), lead.len * stepDur, stepDur);
  }

  const counter = counterFor(tr);
  if (counter === 'harmony') {
    if (lead) {
      const midi = song.key + 12 * song.leadOct + degreePitch(scale, lead.deg - 2);
      playTone(out, t, { ...PATCH.counter, f: hz(midi), dur: lead.len * stepDur * 0.9 });
    }
  } else if (counter === 'arp') {
    const every = arr.arpEvery ?? 1;
    if (i % every === 0) {
      const k = (i / every) % 4;
      const semis = k === 3 ? chord[0] + 12 : chord[k];
      const f = hz(song.key + 12 * song.arpOct + semis);
      playTone(out, t, { ...PATCH.counter, vol: PATCH.counter.vol * busy, f, dur: stepDur * 0.9 });
    }
  } else if (counter) {
    const n = song.notes[counter][pos];
    if (n) {
      const midi = song.key + 12 * (section.counterOct ?? song.arpOct) + degreePitch(scale, n.deg);
      playTone(out, t, { ...PATCH.counter, f: hz(midi), dur: n.len * stepDur * 0.9 });
    }
  }

  const bass = BASS_LINES[arr.bass ?? song.bass][i];
  if (bass) {
    const semis = bass.ch === 'F' ? chord[2] : chord[0] + (bass.ch === 'O' ? 12 : 0);
    playTone(out, t, {
      ...PATCH.bass,
      vol: PATCH.bass.vol * (song.bassLevel ?? 1),
      f: hz(song.key + 12 * song.bassOct + semis),
      dur: bass.len * stepDur * 0.92,
    });
  }

  const kit = DRUMS[arr.drums ?? song.drums];
  const level = kit.level ?? 1;
  const fill = tr.barInSection === 3 && (section.fill || arr.fills);
  const k = DRUM_LEVEL[kit.k?.[i]];
  if (k) (kit.deep ? heartKick : kick)(out, t, k * level);
  const sn = DRUM_LEVEL[(fill ? FILL : kit.s)?.[i]];
  if (sn) snare(out, t, sn * level);
  const h = DRUM_LEVEL[kit.h?.[i]];
  if (h) hat(out, t, h * level * busy);

  if (song.pad && i === 0) {
    for (const semis of chord) playTone(out, t, { ...PATCH.pad, f: hz(song.key + semis), dur: song.bar * stepDur });
  }
  if (song.snow && i % 2 === 0 && Math.random() < 0.1) {
    playTone(out, t, { ...PATCH.snow, f: hz(song.key + 24 + pick(MINOR_PENTATONIC)) });
  }
  if (song.wind && i === 0 && tr.bar % 2 === 0) {
    const len = 2 * song.bar * stepDur;
    playNoise(out, t, {
      filter: 'bandpass',
      f: [[0, 320], [len * 0.5, 900], [len, 300]],
      q: 4,
      rate: 0.6,
      vol: 0.05,
      a: len * 0.4,
      s: 1,
      dur: len * 0.6,
      r: len * 0.4,
    });
  }
}

function playLead(tr, t, midi, dur, stepDur) {
  const { song, arr, out } = tr;
  if (song.broken) {
    playMusicBox(out, t, midi);
    return;
  }
  const patch = arr.lead ?? song.lead;
  let detune = 0;
  if (arr.wobble) {
    // Past 0.75 the lead sours: a detuned twin, drifting pitch, the odd wrong note.
    const sour = clamp((tr.heat - 0.75) / 0.25, 0, 1);
    detune = (Math.random() * 2 - 1) * (6 + 18 * sour);
    if (Math.random() < 0.1 * sour) midi -= 1;
    playTone(out, t, { ...patch, vol: patch.vol * 0.6, f: hz(midi), dur: dur * 0.9, detune: detune + 12 + 18 * sour });
  }
  playTone(out, t, { ...patch, f: hz(midi), dur: dur * 0.9, detune });
  if (song.echo) {
    for (const [steps, gain] of ECHOES) {
      playTone(out, t + steps * stepDur, { ...patch, vol: patch.vol * gain, f: hz(midi), dur: dur * 0.9 });
    }
  }
}

// A worn music box: tines out of tune, some missing, some struck twice.
function playMusicBox(out, t, midi) {
  if (Math.random() < 0.12) return;
  const detune = (Math.random() * 2 - 1) * 35;
  const strike = (at) => {
    playTone(out, at, { ...PATCH.musicBox, f: hz(midi), detune });
    playTone(out, at, { wave: 'sine', f: hz(midi) * 4, detune, vol: 0.025, a: 0.001, d: 0.06, s: 0 });
  };
  strike(t);
  if (Math.random() < 0.1) strike(t + 0.11);
}

function kick(out, t, v) {
  playTone(out, t, { wave: 'sine', f: [[0, 150], [0.09, 48]], vol: 0.45 * v, a: 0.002, d: 0.14, s: 0, r: 0.03 });
}

function heartKick(out, t, v) {
  const thump = [[0, 90], [0.1, 40]];
  playTone(out, t, { wave: 'sine', f: thump, vol: 0.55 * v, a: 0.004, d: 0.18, s: 0, r: 0.04 });
  playTone(out, t, { wave: 'triangle', f: thump, vol: 0.12 * v, a: 0.004, d: 0.12, s: 0, r: 0.03 });
}

function snare(out, t, v) {
  playNoise(out, t, { filter: 'bandpass', f: 1800, q: 0.7, vol: 0.2 * v, a: 0.001, d: 0.12 });
  playTone(out, t, { wave: 'triangle', f: [[0, 200], [0.06, 150]], vol: 0.12 * v, a: 0.001, d: 0.06, s: 0 });
}

function hat(out, t, v) {
  playNoise(out, t, { filter: 'highpass', f: 7000, vol: 0.06 * v, a: 0.001, d: 0.03, r: 0.01 });
}

// The scheduler: every PUMP_MS, queue each track's steps up to SCHEDULE_AHEAD
// seconds ahead of the audio clock.
function pump() {
  pumpTimer = null;
  const now = ctx.currentTime;
  for (const tr of tracks) {
    // If the timer stalled (a throttled background tab), skip the missed steps
    // silently instead of firing them all at once.
    while (tr.time < now) advance(tr, false);
    while (tr.time < now + SCHEDULE_AHEAD && tr.time < tr.stopAt) advance(tr, !muted);
  }
  for (const tr of tracks) if (tr.time >= tr.stopAt) tr.out.disconnect();
  tracks = tracks.filter((tr) => tr.time < tr.stopAt);
  if (tracks.length) pumpTimer = setTimeout(pump, PUMP_MS);
}

// Brings the playing music in line with `musicMode`, crossfading if needed.
function syncMusic() {
  const current = tracks.find((tr) => tr.stopAt === Infinity);
  if (current?.mode === musicMode) return;
  const now = ctx.currentTime;
  if (current) {
    const gain = current.out.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(0, now + CROSSFADE);
    current.stopAt = now + CROSSFADE + 0.2;
  }
  if (musicMode !== 'off') {
    const tr = createTrack(musicMode, now);
    tr.out.gain.setValueAtTime(0, now);
    tr.out.gain.linearRampToValueAtTime(1, now + (current ? CROSSFADE : 0.3));
    tracks.push(tr);
  }
  if (!pumpTimer && tracks.length) pump();
}

function applyMaster() {
  if (!ctx) return;
  master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.015);
}

// ---------------------------------------------------------------------------
// Public API

export const audio = {
  /** Creates or resumes the AudioContext. Call from a user gesture; safe to repeat. */
  unlock() {
    if (!ctx) {
      const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!AudioContextClass) return; // no WebAudio: the game stays silent
      ctx = new AudioContextClass();
      buildGraph();
    }
    if (ctx.state === 'closed') return;
    if (ctx.state !== 'running') {
      // Rejected or left pending when the browser doesn't count this as a
      // gesture; the next unlock() from a real gesture tries again.
      ctx.resume().catch(() => {});
    }
    syncMusic();
  },

  /** Mutes or unmutes everything and remembers the choice in localStorage. */
  setMuted(value) {
    muted = Boolean(value);
    writeMuted(muted);
    applyMaster();
  },

  isMuted() {
    return muted;
  },

  /** Master volume, 0..1. */
  setVolume(value) {
    if (!Number.isFinite(value)) return;
    volume = clamp(value, 0, 1);
    applyMaster();
  },

  /**
   * Plays a one-shot by name. `opts.pitch` transposes it by semitones, so a
   * run of clicks can climb.
   */
  sfx(name, opts) {
    if (!ctx) return;
    const recipe = SFX[name];
    if (!recipe) {
      warnOnce(`audio.sfx: unknown sound "${name}"`);
      return;
    }
    if (muted || ctx.state !== 'running') return;
    const voice = startVoice(name, recipe);
    if (!voice) return;
    const pitch = Number.isFinite(opts?.pitch) ? clamp(opts.pitch, -36, 36) : 0;
    recipe.play(sfxBuilder(voice, ctx.currentTime + 0.005, 2 ** (pitch / 12)));
  },

  /** Starts or crossfades to a music mode: title, play, boss, doom, winter, good or off. */
  music(mode) {
    if (mode !== 'off' && !SONGS[mode]) {
      warnOnce(`audio.music: unknown mode "${mode}"`);
      return;
    }
    musicMode = mode;
    if (ctx) syncMusic();
  },

  /** p(doom)/100 during play: speeds up, darkens and sours the 'play' music. */
  setIntensity(value) {
    if (!Number.isFinite(value)) return;
    intensity = clamp(value, 0, 1);
  },

  /** Lowers the music for `seconds`, then brings it back. Overlapping ducks extend. */
  duck(seconds) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const hold = Number.isFinite(seconds) ? Math.max(seconds, 0.1) : 1;
    duckUntil = Math.max(duckUntil, now + hold);
    const gain = duckGain.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(DUCK_LEVEL, now + 0.08);
    gain.setValueAtTime(DUCK_LEVEL, duckUntil);
    gain.linearRampToValueAtTime(1, duckUntil + 0.5);
  },

  /** Ends any duck now (for holds like duck(9999) during a card or pause). */
  unduck() {
    if (!ctx) return;
    const now = ctx.currentTime;
    duckUntil = 0;
    const gain = duckGain.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(1, now + 0.3);
  },

  /** A snapshot of the engine's state, for test pages and debugging. */
  debugState() {
    const current = tracks.find((tr) => tr.stopAt === Infinity);
    return {
      context: ctx?.state ?? 'locked',
      muted,
      volume,
      intensity,
      music: musicMode,
      tracks: tracks.length,
      bpm: current ? Math.round(current.bpm) : null,
      tier: current?.song.tiers ? current.tier : null,
      voices: voices.map((v) => v.name),
    };
  },
};
