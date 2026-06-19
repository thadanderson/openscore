/**
 * SectionTimer — counts up from 0:00, shows target duration,
 * pulses amber when approaching the upper bound.
 *
 * Props:
 *   durationNote  — string like "ca. 2–3'" or "ca. 2–4'"
 *   running       — bool
 *   onReset       — callback
 */

import { useState, useEffect, useRef } from 'react';

/** Parse "ca. 2–3'" → { lower: 120, upper: 180 } (seconds) */
function parseDuration(durationNote) {
  if (!durationNote) return { lower: 0, upper: Infinity };
  const match = durationNote.match(/(\d+)[\u2013\u2014-](\d+)/);
  if (match) {
    return {
      lower: parseInt(match[1], 10) * 60,
      upper: parseInt(match[2], 10) * 60,
    };
  }
  const single = durationNote.match(/(\d+)/);
  if (single) {
    const s = parseInt(single[1], 10) * 60;
    return { lower: s, upper: s + 60 };
  }
  return { lower: 0, upper: Infinity };
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SectionTimer({ durationNote, running = true, onReset }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);
  const { lower, upper } = parseDuration(durationNote);

  // Reset when section changes (durationNote changes)
  useEffect(() => {
    setElapsed(0);
  }, [durationNote]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const isApproaching = upper < Infinity && elapsed >= upper * 0.8;
  const isOver = upper < Infinity && elapsed > upper;

  let colorClass = 'text-stone-700';
  if (isOver) colorClass = 'text-red-600';
  else if (isApproaching) colorClass = 'text-amber-600';

  return (
    <div className="flex items-center gap-3 select-none">
      <span
        className={`text-2xl font-light tabular-nums ${colorClass} transition-colors duration-1000 ${
          isApproaching && !isOver ? 'animate-pulse' : ''
        }`}
      >
        {formatTime(elapsed)}
      </span>
      {durationNote && (
        <span className="text-stone-500 text-sm font-light">
          {durationNote}
        </span>
      )}
      {onReset && (
        <button
          onClick={() => { setElapsed(0); onReset?.(); }}
          className="text-stone-600 hover:text-stone-300 text-xs transition-colors ml-1"
          title="Reset timer"
        >
          ↺
        </button>
      )}
    </div>
  );
}
