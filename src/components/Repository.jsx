/**
 * Repository — homepage listing all compositions with metadata and filters.
 */

import { useState, useMemo } from 'react';
import compositions from '../data/index.js';
import CompositionCard from './CompositionCard.jsx';

// Collect all unique tags across all compositions
function getAllTags(comps) {
  const tagSet = new Set();
  comps.forEach((c) => (c.tags || []).forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

// Parse duration string like "ca. 8–12'" → average minutes
function parseDurationMins(dur) {
  if (!dur) return null;
  const match = dur.match(/(\d+)[\u2013-](\d+)/);
  if (match) return (parseInt(match[1], 10) + parseInt(match[2], 10)) / 2;
  const single = dur.match(/(\d+)/);
  if (single) return parseInt(single[1], 10);
  return null;
}

export default function Repository() {
  const allTags = getAllTags(compositions);
  const [selectedTags, setSelectedTags] = useState([]);
  const [durationFilter, setDurationFilter] = useState('all'); // 'all' | 'short' | 'medium' | 'long'
  const [query, setQuery] = useState('');

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  const filtered = useMemo(() => {
    return compositions.filter((comp) => {
      // Tag filter
      if (selectedTags.length > 0) {
        const hasAll = selectedTags.every((t) => (comp.tags || []).includes(t));
        if (!hasAll) return false;
      }

      // Duration filter
      if (durationFilter !== 'all') {
        const mins = parseDurationMins(comp.duration);
        if (mins !== null) {
          if (durationFilter === 'short' && mins > 8) return false;
          if (durationFilter === 'medium' && (mins < 5 || mins > 15)) return false;
          if (durationFilter === 'long' && mins < 12) return false;
        }
      }

      // Text search
      if (query.trim()) {
        const q = query.toLowerCase();
        const searchable = [comp.title, comp.composer, comp.description, ...(comp.tags || [])]
          .join(' ')
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      return true;
    });
  }, [selectedTags, durationFilter, query]);

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-stone-900 font-sans">
      {/* ── Masthead ── */}
      <header className="border-b border-stone-200 bg-[#f7f4ef]">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-stone-400 mb-2">
              Open Score
            </p>
            <h1 className="font-serif text-5xl font-normal text-stone-900 leading-none">
              Repository
            </h1>
            <p className="text-stone-500 mt-3 text-sm max-w-md leading-relaxed">
              A collection of open instrumentation guided improvisation compositions
              for live musicians. Fully notated for screen reading.
            </p>
          </div>
        </div>
      </header>

      {/* ── Filter bar ── */}
      <div className="sticky top-0 z-10 bg-[#f7f4ef] border-b border-stone-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search compositions…"
              className="border border-stone-200 px-4 py-2 text-sm focus:outline-none focus:border-stone-500 bg-white w-52"
            />

            {/* Duration */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 uppercase tracking-wider">Duration:</span>
              {[
                { key: 'all', label: 'All' },
                { key: 'short', label: '< 8′' },
                { key: 'medium', label: '5–15′' },
                { key: 'long', label: '> 12′' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setDurationFilter(key)}
                  className={`text-xs px-3 py-1 border transition-all ${
                    durationFilter === key
                      ? 'border-stone-900 bg-stone-900 text-stone-50'
                      : 'border-stone-200 text-stone-500 hover:border-stone-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-stone-400 uppercase tracking-wider">Tags:</span>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2 py-0.5 border transition-all ${
                    selectedTags.includes(tag)
                      ? 'border-stone-700 bg-stone-100 text-stone-700'
                      : 'border-stone-200 text-stone-400 hover:border-stone-400 hover:text-stone-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-stone-400 hover:text-stone-600 ml-1 underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Composition grid ── */}
      <main className="max-w-6xl mx-auto px-8 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-stone-400">
            <p className="text-lg mb-2">No compositions match your filters.</p>
            <button
              onClick={() => { setSelectedTags([]); setDurationFilter('all'); setQuery(''); }}
              className="text-sm underline hover:text-stone-600"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-400 mb-6">
              {filtered.length} {filtered.length === 1 ? 'composition' : 'compositions'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((comp) => (
                <CompositionCard key={comp.id} composition={comp} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-stone-200 mt-16 px-8 py-8 text-center text-stone-400 text-xs">
        Open Score · Contemporary music notation for live performance
      </footer>
    </div>
  );
}
