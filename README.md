# OpenScore

A browser-based **generator for open-instrumentation guided-improvisation prompts**.

Describe an ensemble and an expressive intent, and OpenScore composes a guided-improvisation score — **written instructions**, with the occasional **abstract graphic** to interpret — ready to read on screen by live musicians. There is no staff notation and no fixed pitch content; everything is generated from your input and nothing is stored.

## What it does

You set four things:

- **Ensemble** — how many voices / players (any instruments; the prompt is open)
- **Character** — a mood (8 options, e.g. meditative, turbulent, ceremonial, nocturnal) and an energy level
- **Structure** — number of sections and approximate total length
- **Constraints** — pitch material (described in words), dynamic range, amount of silence, and optional extended techniques

OpenScore then generates a multi-section score. Each section is primarily written text; some sections also include an abstract graphic score for free interpretation. It opens in a full-screen, readable performance view.

Generation is **seeded**, so any prompt — text and graphics — is reproducible and shareable from its seed.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # produces dist/index.html
```

### Single-file distribution

`npm run build` bundles the entire app into one self-contained `dist/index.html` (~1.4 MB). It runs with **no server** — open it directly in any browser (`file://`) or hand the single file to a musician. This is intentional and the reason the app uses `HashRouter` rather than `BrowserRouter`.

## Performance view controls

- `←` / `→` — navigate sections
- `Space` — pause / resume the section timer
- `Esc` — return to the generator

## Tech stack

React 19 · Vite 7 · Tailwind CSS v4 · React Router v7 (`HashRouter`) · `vite-plugin-singlefile`. No music-notation library — graphics are hand-rolled SVG.

## Project notes

See [CLAUDE.md](CLAUDE.md) for architecture, the generation engine (`src/utils/promptLogic.js`), the graphic-score generator (`buildVisual` + `GraphicScore.jsx`), and the generated composition data shape.
