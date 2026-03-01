/**
 * AccumulationBuilder — configure and generate an Accumulation Study.
 *
 * An Accumulation Study is a generative minimalist piece based on an additive
 * process: a short melodic cell grows note-by-note across staggered performer
 * entries, reaches its full length, then contracts back to a single pitch.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateRandomCell, computeAccumulationStages, durationToBeats } from '../utils/accumulationLogic.js';
import AccumulationScore from './AccumulationScore.jsx';

// ── Pitch / duration option tables ────────────────────────────────────────────
const PITCH_OPTIONS = [
  { label: 'E4', value: 'e/4' },
  { label: 'G4', value: 'g/4' },
  { label: 'A4', value: 'a/4' },
  { label: 'B4', value: 'b/4' },
  { label: 'D5', value: 'd/5' },
  { label: 'E5', value: 'e/5' },
];

const DUR_OPTIONS = [
  { label: 'Eighth',   value: '8' },
  { label: 'Quarter',  value: 'q' },
  { label: 'Half',     value: 'h' },
  { label: 'Whole',    value: 'w' },
];

// Total beats of a cell
function cellBeats(cell) {
  return cell.reduce((sum, n) => sum + durationToBeats(n.duration), 0);
}

// ── Default cell ──────────────────────────────────────────────────────────────
function defaultCell() {
  return generateRandomCell(4);
}

// ── Select component (shared style) ───────────────────────────────────────────
function Sel({ value, onChange, options, className = '' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border border-stone-300 bg-white text-stone-800 text-sm px-2 py-1 focus:outline-none focus:border-stone-500 ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ── AccumulationBuilder ───────────────────────────────────────────────────────
export default function AccumulationBuilder() {
  const navigate = useNavigate();

  const [performers,    setPerformers]    = useState(3);
  const [cell,          setCell]          = useState(defaultCell);
  const [bpm,           setBpm]           = useState(60);
  const [staggerBeats,  setStaggerBeats]  = useState(1);
  const [stages,        setStages]        = useState(null);

  // ── Cell editing ──────────────────────────────────────────────────────────
  const updateNote = useCallback((i, field, val) => {
    setCell((prev) => prev.map((n, idx) => idx === i ? { ...n, [field]: val } : n));
    setStages(null);
  }, []);

  const addNote = useCallback(() => {
    if (cell.length >= 8) return;
    setCell((prev) => [...prev, { pitch: 'g/4', duration: 'q' }]);
    setStages(null);
  }, [cell.length]);

  const removeNote = useCallback((i) => {
    if (cell.length <= 1) return;
    setCell((prev) => prev.filter((_, idx) => idx !== i));
    setStages(null);
  }, [cell.length]);

  const randomize = useCallback(() => {
    setCell(generateRandomCell(cell.length));
    setStages(null);
  }, [cell.length]);

  // ── Generate ──────────────────────────────────────────────────────────────
  const generate = useCallback(() => {
    if (cell.length === 0) return;
    const result = computeAccumulationStages({
      cell,
      performers: Math.max(2, performers),
      staggerBeats,
    });
    setStages(result);
    // Smooth-scroll to score
    setTimeout(() => {
      document.getElementById('accumulation-score')?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  }, [cell, performers, staggerBeats]);

  const totalStages = cell.length > 0 ? 2 * cell.length - 1 : 0;
  const beats = cellBeats(cell);

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-stone-900">

      {/* ── Header ── */}
      <header className="border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-8 py-10">
          <button
            onClick={() => navigate('/')}
            className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-600 mb-6 block"
          >
            ← Repository
          </button>
          <p className="text-xs uppercase tracking-[0.25em] text-stone-400 mb-2">
            Composition Generator
          </p>
          <h1 className="font-serif text-5xl font-normal text-stone-900 leading-none mb-3">
            Accumulation Study
          </h1>
          <p className="text-stone-500 text-sm max-w-xl leading-relaxed">
            An additive composition for open instrumentation. Define a short melodic
            cell — the piece builds it note by note across staggered performer entries,
            reaches the full phrase, then releases back to a single pitch.
          </p>
        </div>
      </header>

      {/* ── Builder form ── */}
      <main className="max-w-4xl mx-auto px-8 py-10 space-y-10">

        {/* Performers + Tempo */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-8">

          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">
              Performers
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPerformers((p) => Math.max(2, p - 1))}
                className="w-8 h-8 border border-stone-300 text-stone-600 hover:bg-stone-100 text-lg leading-none"
              >
                −
              </button>
              <span className="font-serif text-3xl text-stone-900 tabular-nums w-8 text-center">
                {performers}
              </span>
              <button
                onClick={() => setPerformers((p) => Math.min(12, p + 1))}
                className="w-8 h-8 border border-stone-300 text-stone-600 hover:bg-stone-100 text-lg leading-none"
              >
                +
              </button>
            </div>
            <p className="text-xs text-stone-400 mt-1">2 – 12 players</p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">
              Tempo (BPM)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={30} max={160} step={2}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="flex-1 accent-stone-700"
              />
              <span className="font-serif text-2xl tabular-nums text-stone-900 w-12 text-right">
                {bpm}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1">♩ = {bpm}</p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-stone-400 mb-2">
              Entry Stagger
            </label>
            <Sel
              value={String(staggerBeats)}
              onChange={(v) => { setStaggerBeats(Number(v)); setStages(null); }}
              options={[
                { label: '1 beat', value: '1' },
                { label: '2 beats', value: '2' },
                { label: '4 beats', value: '4' },
              ]}
            />
            <p className="text-xs text-stone-400 mt-1">
              Offset between each performer entry
            </p>
          </div>

        </section>

        {/* Cell editor */}
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-xs uppercase tracking-widest text-stone-400">
                Melodic Cell
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                {cell.length} note{cell.length !== 1 ? 's' : ''} · {beats.toFixed(beats % 1 === 0 ? 0 : 1)} beat{beats !== 1 ? 's' : ''} · {totalStages} stage{totalStages !== 1 ? 's' : ''} total
              </p>
            </div>
            <button
              onClick={randomize}
              className="text-xs px-3 py-1.5 border border-stone-300 text-stone-600 hover:bg-stone-100 hover:border-stone-400 transition-all"
            >
              Randomize
            </button>
          </div>

          <div className="space-y-2">
            {cell.map((note, i) => (
              <div key={i} className="flex items-center gap-3">
                {/* Note index */}
                <span className="text-xs text-stone-400 tabular-nums w-4 text-right">{i + 1}</span>

                {/* Pitch */}
                <Sel
                  value={note.pitch}
                  onChange={(v) => updateNote(i, 'pitch', v)}
                  options={PITCH_OPTIONS}
                />

                {/* Duration */}
                <Sel
                  value={note.duration}
                  onChange={(v) => updateNote(i, 'duration', v)}
                  options={DUR_OPTIONS}
                />

                {/* Beat count */}
                <span className="text-xs text-stone-400 w-16">
                  {durationToBeats(note.duration)} beat{durationToBeats(note.duration) !== 1 ? 's' : ''}
                </span>

                {/* Remove */}
                {cell.length > 1 && (
                  <button
                    onClick={() => removeNote(i)}
                    className="text-xs text-stone-300 hover:text-stone-600 ml-auto"
                    aria-label={`Remove note ${i + 1}`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {cell.length < 8 && (
            <button
              onClick={addNote}
              className="mt-3 text-xs text-stone-400 hover:text-stone-600 underline"
            >
              + Add note
            </button>
          )}
        </section>

        {/* Generate button */}
        <div className="flex items-center gap-6">
          <button
            onClick={generate}
            className="px-8 py-3 bg-stone-900 text-stone-50 text-sm uppercase tracking-widest hover:bg-stone-700 transition-colors"
          >
            Generate Study
          </button>
          {stages && (
            <p className="text-xs text-stone-400">
              {stages.length} stages · {performers} performer{performers !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Performance notes */}
        <section className="border-t border-stone-200 pt-8">
          <h2 className="text-xs uppercase tracking-widest text-stone-400 mb-4">
            Performance Notes
          </h2>
          <div className="text-sm text-stone-600 leading-relaxed space-y-3 max-w-2xl">
            <p>
              Play softly throughout. Each performer enters one at a time, offset
              by the stagger interval. Listen carefully — the layering of identical
              material at different phases creates the texture.
            </p>
            <p>
              Each stage should be repeated freely until the ensemble feels ready
              to move forward. There is no fixed number of repetitions. The conductor
              (or the first performer) signals the transition to the next stage with
              a nod or a breath.
            </p>
            <p>
              During the descending phase, allow your sound to recede rather than
              stop abruptly. The final pitch should decay naturally into silence.
            </p>
            <p className="text-stone-400 text-xs">
              <strong>Amber notes</strong> indicate the pitch added or removed at each stage.
              Dimmed rests show where performers are waiting before or after their entry.
            </p>
          </div>
        </section>

      </main>

      {/* ── Score ── */}
      {stages && (
        <div id="accumulation-score" className="mt-4 pb-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-baseline justify-between px-4 mb-6">
              <h2 className="font-serif text-2xl text-stone-800">
                Accumulation Study
              </h2>
              <p className="text-xs text-stone-400">
                ♩ = {bpm} · {performers} performer{performers !== 1 ? 's' : ''} · {cell.length}-note cell
              </p>
            </div>
            <AccumulationScore stages={stages} darkMode={true} />
          </div>
        </div>
      )}
    </div>
  );
}
