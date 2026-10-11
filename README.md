# PICKS & SHOVELS

> In a gold rush, sell picks and shovels. In an AI gold rush, try not to end the world.

A 3D pixel-art browser game about the AI industry, for **picksandshovels.org**.

You run Picks & Shovels Inc. (est. 1849), selling GPUs to every AI lab in the
Valley. You're also the only CEO who can see the **p(doom)** gauge. Sell too
little and the hype collapses into an **AI Winter**. Sell too much and
capability outruns alignment until p(doom) hits 100%. When frontier capability
reaches 100, the singularity rolls a d100 against your p(doom).

## Playing

- **Click incident bubbles** before their timers run out. Big ones take several clicks.
- **Build** compute (money, faster capability), safety (alignment), and hype (investor patience).
- **Labs tab:** favor or embargo the labs you sell to. The lab at the frontier sets the pace, and its recklessness sets how fast doom climbs.
- **Abilities:** `1` vague-tweet, `2` pause training, `3` Big Red Button.
- **Camera:** drag to pan, scroll or pinch to zoom, `Q`/`E` to rotate. `P` pauses, `M` mutes.
- **Endings:** ten of them. Find them all.

## Developing

    npm install
    npm run dev        # local dev server at http://localhost:5173
    npm test           # sim, map and content tests (vitest)
    npm run simulate   # headless balance runs with bot players; --help for options
    npm run build      # static site in dist/

Open `audio-test.html` on the dev server to audition every sound effect and music mode.

### Layout

    src/sim/        deterministic game logic (no DOM); tuning lives in balance.js
    src/content/    buildings, upgrades, incidents, decision cards, headlines, labs, endings, achievements
    src/render/     three.js voxel city with eBoy-style flat shading, rendered at low resolution
    src/ui/         HUD, shop, cards, ticker, bubbles, screens
    src/audio/      WebAudio chiptune SFX and generative music, with no audio files
    src/game.js     wires sim, renderer, UI and audio together
    scripts/        simulate.mjs balance harness

Design notes: `docs/superpowers/specs/2026-10-11-picks-and-shovels-design.md`.

## Deploying to picksandshovels.org

`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on
every push to `main`. `public/CNAME` sets the custom domain. One-time setup:

1. Push this repo to GitHub, then in **Settings → Pages** set the source to **GitHub Actions**.
2. At your DNS provider, point the apex domain at GitHub Pages:
   - `A` records for `picksandshovels.org`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - optional `AAAA` records: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME` for `www` → `<your-github-user>.github.io`
3. Once DNS resolves, tick **Enforce HTTPS** in the Pages settings.

Any static host also works: upload `dist/` to Cloudflare Pages, Netlify, or S3.
