// Tiny DOM helpers. h('div.cls#id', { onclick, style, ...attrs }, ...children)

export function h(spec, props = {}, ...children) {
  const [tagAndClasses, id] = spec.split('#');
  const [tag, ...classes] = tagAndClasses.split('.');
  const el = document.createElement(tag || 'div');
  if (classes.length) el.className = classes.join(' ');
  if (id) el.id = id;
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// Sets textContent only when it changed (cheap per-frame updates).
export function setText(el, text) {
  if (el._t !== text) {
    el._t = text;
    el.textContent = text;
  }
}

export function setStyle(el, key, value) {
  const k = `_s_${key}`;
  if (el[k] !== value) {
    el[k] = value;
    el.style[key] = value;
  }
}

export function toggle(el, cls, on) {
  const k = `_c_${cls}`;
  if (el[k] !== on) {
    el[k] = on;
    el.classList.toggle(cls, on);
  }
}
