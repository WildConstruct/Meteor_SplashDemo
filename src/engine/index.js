// Public engine surface. The client imports ONLY from here. Everything exported
// is host-neutral (no browser globals) per the boundary check.

export { MeteorEngine } from './MeteorEngine.js';
export { ParameterState, PARAM_MANIFEST, WGSL_PARAM_IDS, paramDefById, paramDefByUuid } from './ParameterState.js';
export {
  createDefaultProject, validateProject, migrateProject, CURRENT_SCHEMA_VERSION,
  allRainFields, surfaceTopologyHash,
} from './ProjectSchema.js';
export { RENDER_QUALITY, DEBUG_MODE, SIM_HZ, buildCacheKey, hashString } from './EngineContracts.js';

// deterministic authoring core (used by editor overlays + tests)
export { seededHash, rand01, randRange, streamRand, STREAM } from './events/SeededHash.js';
export {
  generateCandidates, selectAccepted, candidateToSurfaceUV, buildFieldEvents,
  activeEvents, eventImageUV, fieldKey, stringHash, DEFAULT_POOL_SIZE,
} from './events/RainFieldScheduler.js';
export { pickResponse, resolveResponses, makePalette } from './events/ImpactPalette.js';
export { promoteToHero, suppressedSourceIds, applySuppression } from './events/HeroEvents.js';

// geometry
export { computeHomography, applyHomography, invert3x3, quadSignedArea } from './geometry/Homography.js';
export { buildSurfaceTransforms, normalProjection } from './geometry/SurfaceTransforms.js';
export { rasterizeMask, pointInPolygon } from './geometry/SurfaceMask.js';
export { rasterizeRelief } from './geometry/ReliefShapes.js';

// responses
export { RESPONSES, RESPONSES_BY_ID, getResponse, RESPONSE_INDEX, normalizeResponse } from './responses/response-schema.js';
