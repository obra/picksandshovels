// Number formatting for money (sim cash is in millions of dollars), compute,
// and percentages.

const UNITS = ['M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'];

export function money(m) {
  if (!Number.isFinite(m)) return '$∞';
  const neg = m < 0;
  let v = Math.abs(m);
  if (v < 1) return `${neg ? '-' : ''}$${Math.round(v * 1000)}K`;
  let i = 0;
  while (v >= 1000 && i < UNITS.length - 1) {
    v /= 1000;
    i++;
  }
  const digits = v < 10 ? 2 : v < 100 ? 1 : 0;
  return `${neg ? '-' : ''}$${v.toFixed(digits)}${UNITS[i]}`;
}

// Compute is counted in thousands of GPUs.
export function gpus(c) {
  let v = c * 1000;
  const u = ['', 'K', 'M', 'B', 'T', 'Qa'];
  let i = 0;
  while (v >= 1000 && i < u.length - 1) {
    v /= 1000;
    i++;
  }
  return `${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)}${u[i]}`;
}

export function pct(x) {
  return `${Math.round(x)}%`;
}

export function rate(perSec) {
  return `${money(perSec)}/s`;
}

const BIG = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

// Plain big-number formatting: 1.2K, 3.4T, ...
export function big(n) {
  let v = Math.abs(n);
  let i = 0;
  while (v >= 1000 && i < BIG.length - 1) {
    v /= 1000;
    i++;
  }
  return `${n < 0 ? '-' : ''}${v < 10 && i > 0 ? v.toFixed(1) : Math.round(v)}${BIG[i]}`;
}
