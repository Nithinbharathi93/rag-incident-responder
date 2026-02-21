
import { resolveIncident } from './services/resolver.js';
const mockStory = [
  "🌱 [CAUSE]   | 2026-01-29T10:00:00Z WARN: Garbage Collection taking longer than 800ms",
  "📈 [BUILD]   | 2026-01-29T10:00:05Z WARN: Heap usage at 92% - Critical pressure",
  "📈 [BUILD]   | 2026-01-29T10:00:10Z WARN: Heap usage at 98% - System unstable",
  "💥 [CRASH]   | 2026-01-29T10:00:12Z FATAL ERROR: JavaScript heap out of memory"
];

const result = await resolveIncident(mockStory);
console.log("🤖 Resolution:", result.solution);