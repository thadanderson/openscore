/**
 * ScoreConfigurator — per-player clef/transposition setup panel.
 * Allows N players to configure their instrument settings before
 * entering Performance Mode.
 *
 * Props:
 *   composition  — composition object
 *   onStart      — callback(playersConfig, playerCount)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TRANSPOSITION_PRESETS = [
  { label: 'Concert Pitch', semitones: 0, examples: 'Piano, Flute, Violin, Oboe' },
  { label: 'Bb (sounds M2 lower)', semitones: 2, examples: 'Clarinet, Trumpet, Tenor Sax, Soprano Sax' },
  { label: 'Eb (sounds M6 lower)', semitones: 9, examples: 'Alto Sax, Baritone Sax, Eb Clarinet' },
  { label: 'F (sounds P5 lower)', semitones: 7, examples: 'French Horn, English Horn' },
  { label: 'Bb 8vb (octave lower)', semitones: 2, examples: 'Bass Clarinet' },
  { label: 'Custom', semitones: 'custom', examples: 'Enter semitones manually' },
];

const CLEF_OPTIONS = ['treble', 'bass', 'alto', 'tenor', 'percussion'];

const STORAGE_KEY = 'open-score:player-configs';

function defaultPlayer(index) {
  return {
    id: `player-${index + 1}`,
    instrumentLabel: `Player ${index + 1}`,
    clef: 'treble',
    transpositionPreset: 0,
    customSemitones: 0,
    preferFlats: false,
  };
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export default function ScoreConfigurator({ composition }) {
  const navigate = useNavigate();
  const saved = loadSaved();

  const [playerCount, setPlayerCount] = useState(saved?.length || 2);
  const [players, setPlayers] = useState(
    saved || Array.from({ length: 2 }, (_, i) => defaultPlayer(i))
  );

  // Keep players array in sync with playerCount
  useEffect(() => {
    setPlayers((prev) => {
      if (playerCount > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: playerCount - prev.length }, (_, i) =>
            defaultPlayer(prev.length + i)
          ),
        ];
      }
      return prev.slice(0, playerCount);
    });
  }, [playerCount]);

  function updatePlayer(index, field, value) {
    setPlayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function getEffectiveSemitones(player) {
    const preset = TRANSPOSITION_PRESETS[player.transpositionPreset];
    if (!preset) return 0;
    if (preset.semitones === 'custom') return player.customSemitones || 0;
    return preset.semitones;
  }

  function handleStart() {
    const configs = players.map((p) => ({
      ...p,
      transposition: getEffectiveSemitones(p),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    // Navigate to performance with state
    navigate(`/performance/${composition.id}`, { state: { playersConfig: configs } });
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Header */}
      <header className="border-b border-stone-200 px-8 py-6">
        <button
          onClick={() => navigate('/')}
          className="text-stone-400 hover:text-stone-700 text-sm mb-4 transition-colors"
        >
          ← Back to repository
        </button>
        <div>
          <h1 className="font-serif text-3xl font-normal text-stone-900">
            {composition.title}
          </h1>
          <p className="text-stone-500 mt-1">
            {composition.composer} · {composition.year} · {composition.duration}
          </p>
        </div>
      </header>

      <main className="px-8 py-8 max-w-5xl mx-auto">
        {/* Player count */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-400 mb-4">
            Ensemble Size
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPlayerCount((n) => Math.max(1, n - 1))}
              className="w-10 h-10 rounded border border-stone-300 hover:border-stone-500 text-xl flex items-center justify-center transition-colors"
            >
              −
            </button>
            <span className="text-2xl font-serif w-20 text-center">{playerCount}</span>
            <button
              onClick={() => setPlayerCount((n) => Math.min(12, n + 1))}
              className="w-10 h-10 rounded border border-stone-300 hover:border-stone-500 text-xl flex items-center justify-center transition-colors"
            >
              +
            </button>
            <span className="text-stone-500 text-sm ml-2">
              {playerCount === 1 ? 'player' : 'players'}
            </span>
          </div>
        </section>

        {/* Player configs */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-stone-400 mb-6">
            Player Configuration
          </h2>

          <div className="space-y-4">
            {players.map((player, i) => (
              <PlayerRow
                key={player.id}
                index={i}
                player={player}
                onChange={(field, value) => updatePlayer(i, field, value)}
              />
            ))}
          </div>
        </section>

        {/* Start button */}
        <div className="border-t border-stone-200 pt-8">
          <button
            onClick={handleStart}
            className="bg-stone-900 text-stone-50 px-10 py-4 text-lg font-serif hover:bg-stone-700 transition-colors"
          >
            Begin Performance
          </button>
          <p className="text-stone-400 text-sm mt-3">
            Configuration is saved locally for this session.
          </p>
        </div>
      </main>
    </div>
  );
}

function PlayerRow({ index, player, onChange }) {
  const preset = TRANSPOSITION_PRESETS[player.transpositionPreset];
  const isCustom = preset?.semitones === 'custom';

  return (
    <div className="border border-stone-200 rounded p-5 bg-white">
      <div className="flex flex-wrap gap-4 items-start">
        {/* Player number */}
        <div className="w-8 pt-2 text-stone-400 font-serif text-lg text-center">
          {index + 1}
        </div>

        {/* Instrument label */}
        <div className="flex-1 min-w-40">
          <label className="block text-xs text-stone-400 uppercase tracking-wider mb-1">
            Instrument
          </label>
          <input
            type="text"
            value={player.instrumentLabel}
            onChange={(e) => onChange('instrumentLabel', e.target.value)}
            className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-stone-500 bg-stone-50"
            placeholder="e.g. Violin I"
          />
        </div>

        {/* Clef */}
        <div className="min-w-32">
          <label className="block text-xs text-stone-400 uppercase tracking-wider mb-1">
            Clef
          </label>
          <select
            value={player.clef}
            onChange={(e) => onChange('clef', e.target.value)}
            className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-stone-500 bg-stone-50 capitalize"
          >
            {CLEF_OPTIONS.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Transposition */}
        <div className="flex-1 min-w-60">
          <label className="block text-xs text-stone-400 uppercase tracking-wider mb-1">
            Transposition
          </label>
          <select
            value={player.transpositionPreset}
            onChange={(e) => onChange('transpositionPreset', parseInt(e.target.value, 10))}
            className="w-full border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-stone-500 bg-stone-50"
          >
            {TRANSPOSITION_PRESETS.map((p, pi) => (
              <option key={pi} value={pi}>
                {p.label}
              </option>
            ))}
          </select>
          {isCustom && (
            <div className="mt-2 flex items-center gap-2">
              <label className="text-xs text-stone-400">Semitones:</label>
              <input
                type="number"
                value={player.customSemitones}
                onChange={(e) => onChange('customSemitones', parseInt(e.target.value, 10) || 0)}
                className="w-20 border border-stone-200 px-2 py-1 text-sm focus:outline-none focus:border-stone-500 bg-stone-50"
              />
            </div>
          )}
          <p className="text-xs text-stone-400 mt-1">{preset?.examples}</p>
        </div>

        {/* Prefer flats */}
        <div className="min-w-28 pt-5">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-600">
            <input
              type="checkbox"
              checked={player.preferFlats}
              onChange={(e) => onChange('preferFlats', e.target.checked)}
              className="accent-stone-700"
            />
            Prefer flats
          </label>
        </div>
      </div>
    </div>
  );
}
