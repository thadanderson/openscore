# OpenScore

A browser-based **generator** for open-instrumentation guided-improvisation prompts. The user describes an ensemble and an expressive intent, and OpenScore composes a guided-improvisation score — **written instructions** plus, occasionally, an **abstract graphic score** to interpret — readable directly on-screen by live musicians.

> **Direction note:** OpenScore began as a *repository* of authored open-instrumentation works, then became a generator of fully-notated prompts. It has since been narrowed again: generated prompts contain **no staff notation and no fixed pitch content**. A prompt is primarily *text*; some sections also carry an *abstract graphic* for free interpretation. Pitch material, when constrained, is described in words. The repository UI, the static composition data, the per-piece configurator, the VexFlow-based stave renderer, and the standalone Accumulation Study have all been removed — there is no music-notation rendering left anywhere in the app.

## Tech stack

- **React 19** + **Vite 7** (ES modules, `type: "module"`)
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin
- **React Router v7** — `HashRouter` (required for local file:// access)
- **vite-plugin-singlefile** — bundles everything into one self-contained `dist/index.html`

There is no music-notation library: graphics are hand-rolled SVG, and there is no staff notation. (VexFlow was removed along with the Accumulation Study.)

## Development

```bash
npm run dev      # dev server at http://localhost:5173
npm run build    # produces dist/index.html (single self-contained file, ~1.4 MB)
```

The built `dist/index.html` can be opened directly in any browser without a server — no hosting required. This is intentional: the app is designed to be shared as a single file with musicians.

## Concept & flow

1. **Generate** (`/`) — the user sets four input dimensions:
   - **Ensemble** — number of voices / players only (no instrument, clef, or transposition — the prompt is for open instrumentation)
   - **Character** — mood (8 options) + energy (3 levels)
   - **Structure** — number of sections + approximate total length
   - **Constraints** — pitch material (8 verbal options), dynamic range, silence ratio, optional extended techniques
2. On submit, `generatePrompt()` produces a **composition-shaped object** and the app navigates to the performance view.
3. **Perform** (`/performance`) — full-screen display (warm light theme) of the generated score for live reading: section title, written performance note, an optional graphic, and instruction blocks.

## Routing

`HashRouter` is used (not `BrowserRouter`). Routes use `#` hashes so navigation works when the file is opened locally via `file://`. All route changes go through `src/App.jsx`.

| Route | Component | Notes |
|---|---|---|
| `/` | `PromptGenerator` | Input screen — the landing page |
| `/performance` | `PerformanceView` | Full-screen score display; reads the generated composition from navigation state (localStorage fallback) |

## Project structure

```
src/
  App.jsx                          # Router + route definitions
  index.css                        # Global styles + Tailwind import
  components/
    PromptGenerator.jsx            # Landing screen — collects the four input dimensions, calls generatePrompt
    PerformanceView.jsx            # Full-screen performance mode (light theme; renders text + optional graphic)
    GraphicScore.jsx               # Renders an abstract graphic-score spec as SVG
    SectionTimer.jsx               # Count-up timer with duration parsing
  utils/
    promptLogic.js                 # ★ Core generation engine (input → composition object, incl. graphics)
```

There is no `src/data/` directory (scores are generated at runtime), and no notation code (`StaveRenderer` / `transposition` / `notationHelpers`) or Accumulation Study (`AccumulationBuilder` / `AccumulationScore` / `accumulationLogic`) — all removed.

## Generation engine

`src/utils/promptLogic.js` is the heart of the app. `generatePrompt(input)` returns a composition-shaped object renderable by `PerformanceView` directly.

**Key properties:**
- **Seeded** — uses a `mulberry32` PRNG (`makeRng(seed)`), so the same input + seed always yields the same prompt (text *and* graphics). The seed and full `input` are stored on the returned object, making a prompt reproducible and shareable.
- **Vocabularies are data** — `PITCH_SETS`, `ENERGY_LEVELS`, `MOODS`, `TECHNIQUES`, and `DYNAMIC_LADDER` are exported objects. The generator UI reads them directly, so adding an entry makes a new option appear automatically.
- **Text first, graphics occasional** — every section has a `performanceNote` + `instructionBlocks`. `maybeBuildVisual()` decides (probabilistically, biased by energy/mood/techniques, rarely on the first section) whether a section also gets a `visual` graphic spec.
- **Composed for variety** — each `performanceNote` is assembled from several pools: a mood `opening`/`listening` line, plus optional sentences drawn from *different* pools — mood-agnostic `INTERACTION`/`TEXTURE`, an `ENERGY_LEVELS[x].texts` variant, and an `ENDINGS` close on the last section. Which sentences appear is randomised, `dynamicsText`/`silenceText`/`GRAPHIC_GUIDANCE` have multiple phrasings, and a per-prompt `used` Set (via `pickUnique`) keeps a prompt from repeating a line. Each optional sentence comes from a distinct pool so a section never repeats itself.
- **Pitch material is verbal** — each `PITCH_SETS` entry has a `label` (for the UI) and an `instruction` (woven into the text). No pitches are notated. Selecting several pitch options makes sections vary between them.

**To add a mood / pitch option / energy level / technique:** add an entry to the corresponding exported table in `promptLogic.js`. Moods also carry a `visual` keyword (see graphic pools below); pitch sets carry an `instruction` string.

### Generated composition shape

```js
{
  id: 'prompt-<seed>',
  title: 'Tessera',
  composer: 'OpenScore (generated)',
  year: 2026,
  duration: "ca. 8–10'",
  description: '…',
  tags: ['turbulent', 'octatonic', 'high energy', 'generated'],
  seed: 123456,
  input: { voiceCount: 4, mood: 'turbulent', /* …the full generation input… */ },

  sections: [
    {
      id: 'section-1',
      title: 'I',
      durationNote: "ca. 2–3'",          // string, parsed by SectionTimer
      performanceNote: 'Primary written instruction (shown large in serif).',
      instructionBlocks: [               // shown below, italic
        { position: 'instruction', text: 'Pitch / dynamics / silence guidance.' },
        { position: 'instruction', text: 'Technique invitations (if any).' },
        { position: 'instruction', text: 'How to read the graphic (only when a visual is present).' },
      ],
      visual: null,                       // or a graphic spec — see below
    },
  ],
}
```

## Graphic score

`buildVisual()` in `promptLogic.js` generates an abstract graphic spec; `GraphicScore.jsx` renders it as SVG.

**Spec shape:**
```js
{
  width: 1000, height: 320,
  marks: [
    { type: 'dot',   x, y, r, weight, accent },
    { type: 'ring',  x, y, r, weight, accent },
    { type: 'line',  x, y, x2, y2, weight, accent },
    { type: 'arc',   x, y, x2, y2, cx, cy, weight, accent },   // quadratic curve
    { type: 'wave',  x, y, x2, amp, weight, accent },          // sinusoid
    { type: 'bar',   x, y, w, h, weight, accent },
    { type: 'cloud', x, y, w, h, dots: [{ dx, dy, r }], accent }, // stipple scatter
  ],
}
```

**Generation rules:**
- **Mark count** rises with energy `density` and falls with `silenceRatio`.
- **Mark vocabulary** comes from `MARK_POOLS[mood.visual]` (e.g. `calm` → dots/arcs/rings/lines; `jagged` → lines/clouds/bars; `grid` → bars/lines) plus extra types contributed by selected techniques (`TECHNIQUE_MARKS`: glissando→arc/line, tremolo→wave, noise→cloud, …).
- **Stroke weight** scales with the middle of the dynamic range; ~10% of marks use the amber accent.
- All geometry is precomputed in the engine (seeded), so `GraphicScore` is a dumb, deterministic renderer.

Interpretation guidance (left-to-right ≈ time, height ≈ register/intensity, weight ≈ force) is added as an instruction block whenever a section has a visual.

## CSS — Tailwind v4 cascade order

Button styles must be inside `@layer base` or they will override Tailwind utility classes (`bg-stone-900`, etc.) because unlayered author CSS beats `@layer utilities`:

```css
/* index.css */
@layer base {
  button {
    background: transparent;
    border: none;
    /* ... */
  }
}
```

## Performance mode

`PerformanceView` renders a generated prompt in a warm **light** theme (`#f7f4ef`), matching the generator for legibility on stage / in rehearsal. Key behaviours:
- The generated composition arrives via `location.state.composition`; on refresh it falls back to `localStorage` (`open-score:last-prompt`). Voice count comes from state or `composition.input.voiceCount`.
- All hooks run unconditionally; the "no prompt to perform" early return lives **after** the hooks (rules-of-hooks).
- Layout per section: large serif section title + duration, the `performanceNote` in large serif, an optional `GraphicScore`, then the italic instruction blocks.
- Controls (top/bottom bars) fade after 4 s of inactivity.
- Keyboard: `←`/`→` navigate sections, `Space` pause/resume timer, `Esc` returns to the generator.

## Design language

- **Light theme (both generator and performance):** warm off-white `#f7f4ef`, stone colour palette
- **Typography — two roles only:** EB Garamond (serif) for display & score text (titles, performance note); the system sans stack (`--font-sans`) for all interface text, including the timer (with `tabular-nums`). EB Garamond is the only loaded webfont; there is no monospace and no Inter. Font utilities map through Tailwind v4 `@theme` (`--font-sans`, `--font-serif`) in `index.css`.
- **Accent:** amber `#d97706` (silence slider; occasional graphic marks)
- **Graphic ink:** warm near-black `#3a342c`
- Performance notes and instructions use general, instrument-agnostic language so any ensemble can read them.
