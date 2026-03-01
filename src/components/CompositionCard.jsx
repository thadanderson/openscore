/**
 * CompositionCard — card component for the repository grid.
 */

import { useNavigate } from 'react-router-dom';

export default function CompositionCard({ composition }) {
  const navigate = useNavigate();

  function handleClick() {
    if (composition.isGenerator) {
      navigate(composition.generatorRoute);
    } else {
      navigate(`/configure/${composition.id}`);
    }
  }

  return (
    <article
      onClick={handleClick}
      className="border border-stone-200 bg-white hover:border-stone-400 hover:shadow-md cursor-pointer transition-all duration-200 p-6 flex flex-col group"
    >
      {/* Title */}
      <h2 className="font-serif text-2xl font-normal text-stone-900 group-hover:text-stone-700 transition-colors leading-tight mb-1">
        {composition.title}
      </h2>

      {/* Composer / Year */}
      <p className="text-stone-500 text-sm mb-4">
        {composition.composer} · {composition.year}
      </p>

      {/* Duration + instrumentation */}
      <div className="flex items-center gap-4 text-stone-400 text-sm mb-4">
        <span className="flex items-center gap-1">
          <span className="text-stone-300">◷</span>
          {composition.duration}
        </span>
        {composition.isGenerator ? (
          <span className="text-xs border border-stone-200 px-2 py-0.5 text-stone-400">
            generative
          </span>
        ) : composition.sections && (
          <span>
            {composition.sections.length} sections
          </span>
        )}
      </div>

      {/* Description snippet */}
      {composition.description && (
        <p className="text-stone-500 text-sm leading-relaxed flex-1 mb-4 line-clamp-3">
          {composition.description.replace(/\*\*/g, '').replace(/\*/g, '')}
        </p>
      )}

      {/* Tags */}
      {composition.tags && (
        <div className="flex flex-wrap gap-2 mt-auto">
          {composition.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="text-xs text-stone-400 border border-stone-200 px-2 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-5 pt-4 border-t border-stone-100 text-xs text-stone-400 group-hover:text-stone-600 transition-colors flex items-center justify-between">
        <span>{composition.isGenerator ? 'Open generator' : 'Configure & perform'}</span>
        <span>→</span>
      </div>
    </article>
  );
}
