/**
 * PromptGenerator — OpenScore's landing screen.
 *
 * Collects the four input dimensions that drive generation:
 *   1. Ensemble      — number of voices / players (no instrument specifics)
 *   2. Character     — mood + energy
 *   3. Duration      — number of sections + approximate total length
 *   4. Constraints   — pitch material, dynamic range, silence, techniques
 *
 * On "Generate", builds a composition-shaped prompt via promptLogic and
 * navigates to the performance view, passing the generated composition (and
 * the voice count) through navigation state.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  generatePrompt,
  randomSeed,
  MOODS,
  ENERGY_LEVELS,
  PITCH_SETS,
  TECHNIQUES,
  DYNAMIC_LADDER,
} from '../utils/promptLogic.js';

const PROMPT_KEY = 'open-score:last-prompt';

export default function PromptGenerator() {
  const navigate = useNavigate();

  // ── Ensemble ──
  const [voiceCount, setVoiceCount] = useState(2);

  // ── Character ──
  const [mood, setMood] = useState('meditative');
  const [energy, setEnergy] = useState('medium');

  // ── Structure ──
  const [sectionCount, setSectionCount] = useState(3);
  const [totalMinutes, setTotalMinutes] = useState(9);

  // ── Constraints ──
  const [pitchSet, setPitchSet] = useState('free');
  const [dynLo, setDynLo] = useState(1);
  const [dynHi, setDynHi] = useState(4);
  const [silenceRatio, setSilenceRatio] = useState(0.3);
  const [techniques, setTechniques] = useState(() => new Set());

  function toggleTechnique(key) {
    setTechniques((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleGenerate() {
    const lo = Math.min(dynLo, dynHi);
    const hi = Math.max(dynLo, dynHi);

    const composition = generatePrompt({
      voiceCount,
      mood,
      energy,
      sectionCount,
      totalMinutes,
      pitchSet,
      dynamicRange: [lo, hi],
      silenceRatio,
      techniques: [...techniques],
      seed: randomSeed(),
    });

    localStorage.setItem(PROMPT_KEY, JSON.stringify(composition));
    navigate('/performance', { state: { composition, voiceCount } });
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-stone-900 font-sans">
      <header className="border-b border-stone-200 px-8 py-8">
        <h1 className="font-serif text-4xl font-normal text-stone-900 tracking-tight">
          /OpenScore
        </h1>
        <p className="text-stone-400 text-sm mt-1">
          Developed by{' '}
          <a
            href="https://thadanderson.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-stone-700 transition-colors"
          >
            Thad Anderson
          </a>
        </p>
        <p className="font-serif text-2xl text-stone-800 mt-5">
          Generate. Prompt. Perform.
        </p>
        <p className="text-stone-500 mt-2 max-w-2xl">
          Use the following parameters to set the ensemble, character, shape, and other
          constraints. /OpenScore composes a guided-improvisation score of written instructions,
          with the occasional graphic to interpret, ready to read on screen.
        </p>
      </header>

      <main className="px-8 py-10 max-w-4xl mx-auto space-y-12">
        {/* ── Ensemble ── */}
        <Section title="1 · Ensemble">
          <Field label="Voices / players">
            <div className="flex items-center gap-4">
              <Stepper value={voiceCount} min={1} max={12} onChange={setVoiceCount} />
              <span className="text-stone-500 text-sm">
                {voiceCount === 1 ? 'voice' : 'voices'}
              </span>
            </div>
            <p className="text-stone-400 text-xs mt-2">
              Any instruments. The prompt is written for open instrumentation — players choose their own sounds.
            </p>
          </Field>
        </Section>

        {/* ── Character ── */}
        <Section title="2 · Character">
          <Field label="Mood">
            <CardChoice
              options={Object.entries(MOODS).map(([k, v]) => ({ key: k, label: v.label }))}
              value={mood}
              onChange={setMood}
            />
          </Field>
          <Field label="Energy">
            <CardChoice
              options={Object.entries(ENERGY_LEVELS).map(([k, v]) => ({ key: k, label: v.label }))}
              value={energy}
              onChange={setEnergy}
            />
          </Field>
        </Section>

        {/* ── Structure ── */}
        <Section title="3 · Duration & structure">
          <div className="flex flex-wrap gap-12">
            <Field label="Sections">
              <Stepper value={sectionCount} min={1} max={10} onChange={setSectionCount} />
            </Field>
            <Field label="Approx. total length">
              <div className="flex items-center gap-3">
                <Stepper value={totalMinutes} min={1} max={30} onChange={setTotalMinutes} />
                <span className="text-stone-500 text-sm">minutes</span>
              </div>
            </Field>
          </div>
        </Section>

        {/* ── Constraints ── */}
        <Section title="4 · Constraints & techniques">
          <Field label="Pitch material">
            <CardChoice
              options={Object.entries(PITCH_SETS).map(([k, v]) => ({ key: k, label: v.label }))}
              value={pitchSet}
              onChange={setPitchSet}
            />
          </Field>

          <Field label={`Dynamic range — ${DYNAMIC_LADDER[Math.min(dynLo, dynHi)]} to ${DYNAMIC_LADDER[Math.max(dynLo, dynHi)]}`}>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-stone-600">
                Softest
                <select
                  value={dynLo}
                  onChange={(e) => setDynLo(parseInt(e.target.value, 10))}
                  className="border border-stone-300 px-2 py-1 bg-white"
                >
                  {DYNAMIC_LADDER.map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-stone-600">
                Loudest
                <select
                  value={dynHi}
                  onChange={(e) => setDynHi(parseInt(e.target.value, 10))}
                  className="border border-stone-300 px-2 py-1 bg-white"
                >
                  {DYNAMIC_LADDER.map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </select>
              </label>
            </div>
          </Field>

          <Field label={`Silence — ${Math.round(silenceRatio * 100)}% rest`}>
            <input
              type="range"
              min="0"
              max="0.7"
              step="0.05"
              value={silenceRatio}
              onChange={(e) => setSilenceRatio(parseFloat(e.target.value))}
              className="w-72 accent-amber-600"
            />
          </Field>

          <Field label="Techniques (optional)">
            <div className="flex flex-wrap gap-2">
              {Object.entries(TECHNIQUES).map(([key, desc]) => (
                <button
                  key={key}
                  type="button"
                  title={desc}
                  onClick={() => toggleTechnique(key)}
                  className={`px-3 py-2 text-sm border rounded-full transition-colors ${
                    techniques.has(key)
                      ? 'bg-stone-900 text-stone-50 border-stone-900'
                      : 'bg-white text-stone-600 border-stone-300 hover:border-stone-500'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* ── Generate ── */}
        <div className="border-t border-stone-200 pt-8">
          <button
            onClick={handleGenerate}
            className="bg-stone-900 text-stone-50 px-10 py-4 text-lg font-serif hover:bg-stone-700 transition-colors"
          >
            Generate Performance Prompt →
          </button>
          <p className="text-stone-400 text-sm mt-3">
            Each generation is unique. Re-generate from the performance view for a new realization.
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── Small presentational helpers ───

function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-400 mb-5">
        {title}
      </h2>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-stone-500 uppercase tracking-wider mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function Stepper({ value, min, max, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-10 h-10 rounded border border-stone-300 hover:border-stone-500 text-xl flex items-center justify-center transition-colors"
      >
        −
      </button>
      <span className="text-2xl font-serif w-12 text-center">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-10 h-10 rounded border border-stone-300 hover:border-stone-500 text-xl flex items-center justify-center transition-colors"
      >
        +
      </button>
    </div>
  );
}

function CardChoice({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={`px-4 py-2 text-sm border rounded transition-colors ${
            value === opt.key
              ? 'bg-stone-900 text-stone-50 border-stone-900'
              : 'bg-white text-stone-700 border-stone-300 hover:border-stone-500'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
