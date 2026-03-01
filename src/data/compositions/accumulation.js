/**
 * Accumulation Study — generative composition entry
 * Thad Anderson, 2025
 */

export default {
  id: 'accumulation-study',
  title: 'Accumulation Study',
  composer: 'Thad Anderson',
  year: 2025,
  duration: 'variable',
  description: `**Accumulation Study** is a generative minimalist composition for open instrumentation based on an additive process.

Define a short melodic cell of up to eight pitches. The piece builds that cell note by note across staggered performer entries — each musician enters in a canon-like offset — until all voices are playing the full phrase. Then the process reverses, releasing back to a single pitch and silence.

Configure the number of performers, tempo, entry stagger, and melodic cell. The full notated score is generated instantly in the browser.`,

  tags: ['generative', 'open instrumentation', 'minimalist', 'canon', 'additive process', 'any ensemble'],

  // Signals to the UI that this composition routes to its own generator page
  isGenerator: true,
  generatorRoute: '/accumulation',
};
