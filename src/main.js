import './style.css';
import { createSim, MAP } from './sim/sim.js';
import { CONTENT } from './content/index.js';
import { World } from './render/world.js';

const sim = createSim(CONTENT);
const world = new World(document.getElementById('stage'), MAP, CONTENT);
let state = sim.newGame(1);
world.reset(state);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  sim.tick(state, dt);
  for (const f of sim.drainFx(state)) world.onFx(f, state);
  world.update(dt, state);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.ps = { sim, world, get state() { return state; }, set state(s) { state = s; } };
