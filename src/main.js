import '@fontsource/press-start-2p';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/600.css';
import './style.css';
import { Game } from './game.js';

const game = new Game();
game.start();
// Handy in the console: ps.state, ps.sim, ps.world.
window.ps = game;
