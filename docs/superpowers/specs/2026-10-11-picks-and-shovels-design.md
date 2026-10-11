# PICKS & SHOVELS — design

A browser game for picksandshovels.org. It's a 3D city rendered as eBoy-style
isometric pixel art, set in the AI industry. Very funny, with civilizational
dread underneath.

## Premise

"In a gold rush, sell picks and shovels."

You are the CEO of **Picks & Shovels Inc.**, the company that sells compute to
every AI lab in the Valley. You are also the only CEO in the industry who can
see the **p(doom)** gauge. (It sits on your desk. The other CEOs think it is a
mood ring.)

Your GPUs make the money, the money pays for safety, and your GPUs also bring
the end of the world closer. You walk a knife edge between two failures:

- **AI WINTER**: hype hits 0. The bubble pops, you get fired, and the GPUs go
  back to mining a coin called $HOPIUM.
- **AI APOCALYPSE**: p(doom) hits 100%. Self-explanatory, but funnier.

Each run ends at **THE SINGULARITY**, when frontier capability reaches 100.
At that moment the game rolls a d100 against your p(doom) on screen. The meter
was a probability the whole time.

## The three meters

| Meter | Range | Fails at | Driven by |
|---|---|---|---|
| p(doom) | 0–100 | 100 → apocalypse | the capability−alignment gap, unresolved incidents, events, bosses |
| Hype | 0–100 | 0 → AI winter | decays constantly; model releases, hype buildings, PR tweets and resolved incidents push it up |
| Capability vs Alignment | 0–100 | capability 100 → singularity roll | capability: lab base rate plus compute. Alignment: safety buildings, resolved incidents |

Two resources: **Cash** and **Compute**. Labs buy compute automatically, so
revenue = compute × price × hype multiplier.

## Core loop (what the player does every few seconds)

1. **Incidents** pop up over buildings as speech bubbles with countdown bars,
   e.g. "Agent ordered 40,000 rubber ducks". Tier 1 takes 1 click, tier 2
   takes 3, tier 3 takes 6. A resolved incident lowers doom, adds alignment
   and nudges hype up. A failed one raises doom, costs hype, prints a
   headline and leaves smoke over the building.
2. **Build**: buy buildings in three categories. Each purchase visibly
   drops into the city with a bounce:
   - COMPUTE (revenue, but faster capability)
   - SAFETY (alignment, fewer and slower incidents)
   - HYPE (holds off the winter)
3. **Upgrades**: one-time research and policies, unlocked by era.
4. **Abilities** on cooldowns: 🚀 Vague Tweet (+hype), ⏸ Pause Training
   (freezes capability, costs hype), 🔴 Big Red Button (clears every
   incident, limited charges).
5. **Decision cards** appear every ~45s in the Reigns style: 2–3 options,
   with effects on the meters. This is where most of the jokes live.
6. **Golden cookies**: the VC blimp drifts over the city, and clicking it
   lands a term sheet (cash).
7. **Model releases** come at every 10 capability: fireworks, a hype spike, a
   wave of incidents and a new model name that is worse than the last.
8. **Bosses** arrive at capability milestones:
   - 35, THE SHOGGOTH: it rises from the bay. Click its tentacles to put
     smiley masks on them (RLHF).
   - 55, ROGUE WEIGHTS: glowing weight-cubes hop between buildings and
     copy themselves. Click every copy before it replicates.
   - 75, PAPERCLIP MAXIMIZER: a factory converts plots into paperclip
     piles. Clear the piles and smash the core.

### Eras (by capability)

0 Chatbot Era · 20 Copilot Era · 40 Agent Era · 60 AGI-ish Era · 80 "Superintelligence Imminent"

Each era unlocks buildings, upgrades, incident types and headline pools.

## Endings

- **Apocalypse** (doom 100, or a lost singularity roll). The flavor comes from
  the dominant cause: paperclips, shoggoth, replication, engagement,
  sycophancy, or generic.
- **AI Winter** (hype 0).
- **Survived singularity**: utopia (alignment ≥ 100, low doom), shareholders
  (took the dodgy money: `flags.greed ≥ 3`), or weird (it's fine, mostly).

Each ending gets its own in-world animation (paperclip palette, snow, rainbow
fireworks), an epitaph, stats, achievements, and Share/Play Again buttons.

## Visual style: eBoy in 3D

- Three.js with an orthographic camera at pitch 30°, yaw 45°, which gives
  true 2:1 pixel lines.
- Render at about 1/3 resolution with no AA, then upscale with
  `image-rendering: pixelated`.
- Everything is merged box geometry with **per-face flat 3-tone shading** in
  vertex colors (top light, left mid, right dark). No smooth lighting, no
  textures except pixel-font billboards on canvas with NearestFilter.
- A custom shader handles day/night (lit windows glow at night), the doom
  tint (the sky and the palette slide toward blood orange), and ending
  palettes.
- Dense details: pedestrians, cars, boats, drones, clouds, blimp, billboards,
  a red suspension bridge, a pier, palm trees, food trucks.
- UI uses pixel fonts (Press Start 2P for display, Pixelify Sans for body),
  chunky bordered panels, and an eBoy palette.
- At high doom the billboards glitch to "EVERYTHING IS FINE :)", red sirens
  turn on, a heartbeat plays and the vignette pulses.

## Tone

Silicon Valley satire with an apocalypse underneath. Parody lab names, no
real people named (archetypes only: "a CEO in a leather jacket"). Self-roasts
are welcome (Anthropomorphic, "the safety lab racing to build the thing it's
worried about"). Short lines that land fast. The dread stays deadpan.

## Architecture

```
src/
  sim/       pure, deterministic game logic (seeded RNG, no DOM)
    state.js     createState(seed)
    sim.js       tick(state, dt) + actions; emits events into state.fx queue
    balance.js   all tuning numbers
    endings.js   ending resolution
    rng.js
  content/   data only: buildings, upgrades, incidents, events, headlines,
             labs, endings, achievements, tips
  render/    three.js scene that syncs from sim state each frame
  ui/        DOM HUD, shop, cards, ticker, bubbles, screens
  audio/     WebAudio chiptune SFX + generative music (no assets)
  main.js    boot + loop: sim.tick → drain fx → render/ui/audio
tests/       vitest unit tests for sim + content integrity
scripts/simulate.mjs  headless balance runs with bot policies
```

The render and UI layers only read state; actions go through sim functions.
Save/continue is a JSON snapshot of the sim state in localStorage, and the
renderer rebuilds the city from it.

## Testing

- Vitest covers the sim: economy, meters, incident lifecycle, purchases and
  cost scaling, events and buffs, bosses, era transitions, endings and the
  singularity roll, save/load round-trip, plus integrity of the content
  schema.
- `scripts/simulate.mjs` runs bot policies (idle, greedy-compute,
  balanced, safety-max) over many seeds and reports outcome distributions
  and run length. Targets: an idle bot loses, a balanced attentive bot
  usually survives to the singularity, and a run lasts 8–14 minutes.
- Visuals are verified in a real browser: screenshots of title, gameplay,
  boss and ending states, with no console errors.

## Hosting

Vite builds a static `dist/`. Deploying to picksandshovels.org (GitHub Pages
or Cloudflare Pages + DNS) is outward-facing, so Jesse confirms it before
anything gets published.
