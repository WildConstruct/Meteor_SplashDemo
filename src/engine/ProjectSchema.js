// MeteorProject: plate-specific, versioned scene state (build plan §9.2, §23).
// This is NOT a .wcx look preset. It stores surface masks/calibration, rain-field
// placement, relief shapes, chip assignments, and hero events.
//
// Pure + host-neutral: no file I/O, no browser objects. The client serializer
// (src/client/serialization) handles disk reading/writing around these.

export const CURRENT_SCHEMA_VERSION = 1;

/** A clean empty project for the given plate asset id. */
export function createDefaultProject(opts = {}) {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    projectId: opts.projectId ?? 'untitled',
    sourcePlate: opts.sourcePlate ?? { assetId: 'demo/car-hood-demo.png', width: 1920, height: 1080 },
    durationFrames: opts.durationFrames ?? 240,
    frameRate: opts.frameRate ?? 30,
    globalSeed: opts.globalSeed ?? 1337,
    surfaces: [],
    chipInstances: [],
    heroEvents: [],
    selectedIds: [],
    viewportState: { zoom: 1, panX: 0, panY: 0 },
  };
}

const isNum = (x) => typeof x === 'number' && Number.isFinite(x);
const isStr = (x) => typeof x === 'string';

/**
 * Validate a (already-migrated) project. Returns warnings rather than throwing;
 * fatal structural problems set ok=false.
 * @returns {{ ok:boolean, errors:string[], warnings:string[] }}
 */
export function validateProject(p) {
  const errors = [];
  const warnings = [];
  if (!p || typeof p !== 'object') return { ok: false, errors: ['not an object'], warnings };

  if (p.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    errors.push(`schemaVersion ${p.schemaVersion} != current ${CURRENT_SCHEMA_VERSION} (migrate first)`);
  }
  if (!isStr(p.projectId)) errors.push('projectId must be a string');
  if (!p.sourcePlate || !isStr(p.sourcePlate.assetId)) errors.push('sourcePlate.assetId required');
  if (!isNum(p.durationFrames) || p.durationFrames <= 0) errors.push('durationFrames must be > 0');
  if (!isNum(p.frameRate) || p.frameRate <= 0) errors.push('frameRate must be > 0');
  if (!Array.isArray(p.surfaces)) errors.push('surfaces must be an array');
  if (!Array.isArray(p.heroEvents)) errors.push('heroEvents must be an array');

  const surfaceIds = new Set();
  for (const s of p.surfaces || []) {
    if (!isStr(s.id)) errors.push('surface missing id');
    else if (surfaceIds.has(s.id)) errors.push(`duplicate surface id ${s.id}`);
    else surfaceIds.add(s.id);
    if (!Array.isArray(s.calibrationQuad) || s.calibrationQuad.length !== 4) {
      warnings.push(`surface ${s.id}: calibrationQuad should have 4 corners`);
    }
    if (!Array.isArray(s.maskPath) || s.maskPath.length < 3) {
      warnings.push(`surface ${s.id}: maskPath should have >= 3 points`);
    }
  }
  for (const f of allRainFields(p)) {
    if (f.surfaceId && !surfaceIds.has(f.surfaceId)) {
      warnings.push(`rain field ${f.id}: references unknown surface ${f.surfaceId}`);
    }
  }
  for (const h of p.heroEvents || []) {
    if (h.surfaceId && !surfaceIds.has(h.surfaceId)) {
      warnings.push(`hero event ${h.id}: references unknown surface ${h.surfaceId}`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/** Flatten rain fields across surfaces. */
export function allRainFields(p) {
  const out = [];
  for (const s of p.surfaces || []) {
    for (const f of s.rainFields || []) out.push(f);
  }
  return out;
}

// --- Migration registry (build plan §9.2, §23) ---
// Each migration upgrades version N -> N+1. Add new entries; never edit old ones.
const MIGRATIONS = {
  // Example for the future:
  // 1: (p) => ({ ...p, schemaVersion: 2, newField: defaultValue }),
};

/** Migrate a project JSON up to the current schema version. */
export function migrateProject(json) {
  let p = structuredCloneSafe(json);
  let v = p.schemaVersion ?? 1;
  while (v < CURRENT_SCHEMA_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`no migration from schema version ${v}`);
    p = step(p);
    v = p.schemaVersion;
  }
  return p;
}

function structuredCloneSafe(o) {
  if (typeof structuredClone === 'function') return structuredClone(o);
  return JSON.parse(JSON.stringify(o));
}

/**
 * Topology hash for the wet-state cache key (build plan §21.3): changes only when
 * surface masks/calibration/relief change, not on look tweaks.
 */
export function surfaceTopologyHash(p) {
  const parts = [];
  for (const s of p.surfaces || []) {
    parts.push(s.id);
    parts.push(JSON.stringify(s.calibrationQuad));
    parts.push(JSON.stringify(s.maskPath));
    parts.push(`nrm:${s.normalDirection}:${s.normalScale}`);
    parts.push(`res:${s.simulationResolution}`);
    for (const r of s.reliefLayers || []) {
      parts.push(`relief:${r.id}:${r.mode}:${JSON.stringify(r.shape)}`);
    }
  }
  return parts.join('||');
}
