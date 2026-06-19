/**
 * PerformanceView — full-screen score display for live reading.
 *
 * Renders a generated prompt as TEXT (section title, performance note, and
 * instruction blocks) with the occasional abstract GRAPHIC score. Uses the
 * same warm, readable light theme as the generator so it is legible in a
 * rehearsal room or on stage.
 *
 * Features:
 * - Section navigation (← → keys + buttons)
 * - Section timer with duration target; per-performer toggle for whether the
 *   timer starts automatically on each section or waits for a manual start
 *   (preference persisted in localStorage)
 * - Controls fade after 4s of inactivity
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SectionTimer from './SectionTimer.jsx';
import GraphicScore from './GraphicScore.jsx';

const PROMPT_KEY = 'open-score:last-prompt';
const AUTOSTART_KEY = 'open-score:auto-start-timer';

function loadLastPrompt() {
  try {
    const raw = localStorage.getItem(PROMPT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore malformed cache */
  }
  return null;
}

// Each performer's preference: should the section timer start automatically
// when a section is revealed, or wait to be started manually? Defaults to
// manual (false) and is remembered across sessions.
function loadAutoStart() {
  return localStorage.getItem(AUTOSTART_KEY) === 'true';
}

export default function PerformanceView() {
  const location = useLocation();
  const navigate = useNavigate();

  // Generated composition arrives via navigation state; fall back to the last
  // generated prompt in localStorage so a page refresh doesn't lose the score.
  const composition = location.state?.composition || loadLastPrompt();
  const voiceCount =
    location.state?.voiceCount ?? composition?.input?.voiceCount ?? null;

  const [sectionIndex, setSectionIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [autoStart, setAutoStart] = useState(loadAutoStart);
  const [timerRunning, setTimerRunning] = useState(autoStart);
  const [timerKey, setTimerKey] = useState(0); // reset timer on section change

  function toggleAutoStart() {
    setAutoStart((prev) => {
      const next = !prev;
      localStorage.setItem(AUTOSTART_KEY, String(next));
      return next;
    });
  }

  const fadeTimerRef = useRef(null);

  // NOTE: all hooks run unconditionally; the "no prompt" early return lives
  // below the hooks so hook order is stable across renders.
  const sections = composition?.sections || [];
  const currentSection = sections[sectionIndex];

  // ─── Controls fade on inactivity ───
  const resetFadeTimer = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => setControlsVisible(false), 4000);
  }, []);

  useEffect(() => {
    resetFadeTimer();
    return () => clearTimeout(fadeTimerRef.current);
  }, [resetFadeTimer]);

  useEffect(() => {
    const handler = () => resetFadeTimer();
    window.addEventListener('mousemove', handler);
    window.addEventListener('touchstart', handler);
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      window.removeEventListener('touchstart', handler);
      window.removeEventListener('keydown', handler);
    };
  }, [resetFadeTimer]);

  // ─── Keyboard navigation ───
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setSectionIndex((i) => Math.min(i + 1, sections.length - 1));
        setTimerKey((k) => k + 1);
        setTimerRunning(autoStart);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setSectionIndex((i) => Math.max(i - 1, 0));
        setTimerKey((k) => k + 1);
        setTimerRunning(autoStart);
      } else if (e.key === 'Escape') {
        navigate('/');
      } else if (e.key === ' ') {
        e.preventDefault();
        setTimerRunning((r) => !r);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sections.length, navigate, autoStart]);

  function goToSection(idx) {
    setSectionIndex(Math.max(0, Math.min(idx, sections.length - 1)));
    setTimerKey((k) => k + 1);
    setTimerRunning(autoStart); // honour the performer's auto-start preference
  }

  // Early return lives here — after all hooks — so hook order is stable.
  if (!composition) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] text-stone-700 flex flex-col items-center justify-center gap-4">
        <p className="text-stone-500">No prompt to perform yet.</p>
        <button
          onClick={() => navigate('/')}
          className="border border-stone-400 px-5 py-2 text-sm hover:border-stone-700 transition-colors"
        >
          Generate a prompt
        </button>
      </div>
    );
  }

  const blocks = currentSection?.instructionBlocks || [];

  return (
    <div
      className="min-h-screen bg-[#f7f4ef] text-stone-900 font-sans flex flex-col"
    >
      {/* ── Top bar ── */}
      <div
        className="sticky top-0 z-10 bg-[#f7f4ef]/90 backdrop-blur border-b border-stone-200"
        style={{ transition: 'opacity 0.8s ease', opacity: controlsVisible ? 1 : 0.25 }}
      >
        <div className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => navigate('/')}
              className="text-stone-400 hover:text-stone-700 text-sm transition-colors whitespace-nowrap"
            >
              ← New prompt
            </button>
            <span className="text-stone-300">|</span>
            <span className="font-serif text-stone-800 text-lg truncate">{composition.title}</span>
          </div>
          {voiceCount != null && (
            <div className="text-stone-400 text-sm whitespace-nowrap">
              {voiceCount} {voiceCount === 1 ? 'voice' : 'voices'}
            </div>
          )}
        </div>
      </div>

      {/* ── Score area ── */}
      <div className="flex-1 px-8 py-10 max-w-4xl mx-auto w-full">
        {/* Section header */}
        <div className="flex items-baseline justify-between gap-4 border-b border-stone-200 pb-4">
          <h2 className="font-serif text-4xl text-stone-900 font-normal">
            {currentSection?.title}
          </h2>
          <span className="text-stone-400 text-sm font-sans whitespace-nowrap">
            {currentSection?.durationNote}
          </span>
        </div>

        {/* Performance note — the primary written instruction */}
        {currentSection?.performanceNote && (
          <p className="font-serif text-stone-800 text-xl leading-relaxed mt-8 max-w-3xl">
            {currentSection.performanceNote}
          </p>
        )}

        {/* Graphic score — present only on some sections */}
        {currentSection?.visual && (
          <div className="mt-10 border border-stone-200 rounded-lg bg-white/60 px-4 py-6">
            <GraphicScore visual={currentSection.visual} />
          </div>
        )}

        {/* Instruction blocks */}
        {blocks.length > 0 && (
          <div className="mt-10 border-t border-stone-200 pt-6 space-y-4 max-w-3xl">
            {blocks.map((block, bi) => (
              <p key={bi} className="text-stone-600 text-base leading-relaxed italic">
                {block.text}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div
        className="sticky bottom-0 z-10 bg-[#f7f4ef]/90 backdrop-blur border-t border-stone-200"
        style={{ transition: 'opacity 0.8s ease', opacity: controlsVisible ? 1 : 0.25 }}
      >
        <div className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto w-full">
          {/* Section nav */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => goToSection(sectionIndex - 1)}
              disabled={sectionIndex === 0}
              className="w-10 h-10 border border-stone-300 hover:border-stone-600 disabled:opacity-25 flex items-center justify-center text-lg transition-all rounded"
            >
              ‹
            </button>
            <div className="flex gap-2">
              {sections.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goToSection(i)}
                  className={`text-xs px-3 py-1 rounded transition-all ${
                    i === sectionIndex
                      ? 'bg-stone-900 text-stone-50'
                      : 'text-stone-500 hover:text-stone-800 border border-stone-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => goToSection(sectionIndex + 1)}
              disabled={sectionIndex === sections.length - 1}
              className="w-10 h-10 border border-stone-300 hover:border-stone-600 disabled:opacity-25 flex items-center justify-center text-lg transition-all rounded"
            >
              ›
            </button>
          </div>

          {/* Timer + start mode */}
          <div className="flex items-center gap-5">
            <button
              onClick={toggleAutoStart}
              className="flex items-center gap-2 text-xs text-stone-400 hover:text-stone-700 transition-colors"
              title="When a section is revealed, start its timer automatically or wait for a manual start"
            >
              <span
                className={`inline-flex h-4 w-7 items-center rounded-full px-0.5 transition-colors ${
                  autoStart ? 'bg-amber-600' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`h-3 w-3 rounded-full bg-white transition-transform ${
                    autoStart ? 'translate-x-3' : 'translate-x-0'
                  }`}
                />
              </span>
              <span className="uppercase tracking-wider whitespace-nowrap">
                {autoStart ? 'Auto-start' : 'Manual start'}
              </span>
            </button>

            <button
              onClick={() => setTimerRunning((r) => !r)}
              className="flex items-center gap-2 text-stone-700 hover:opacity-60 transition-opacity"
              title="Click to start / pause timer (Space)"
            >
              <SectionTimer
                key={timerKey}
                durationNote={currentSection?.durationNote}
                running={timerRunning}
              />
              <span className="text-stone-400 text-xs">{timerRunning ? '▐▐' : '▶'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
