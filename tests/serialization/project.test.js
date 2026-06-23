import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import {
  createDefaultProject, validateProject, migrateProject, CURRENT_SCHEMA_VERSION,
} from '../../src/engine/ProjectSchema.js';

const here = dirname(fileURLToPath(import.meta.url));
const demo = JSON.parse(
  readFileSync(resolve(here, '../../src/client/projects/car-hood-demo.meteor.json'), 'utf8')
);

describe('ProjectSchema', () => {
  it('default project validates', () => {
    const p = createDefaultProject();
    expect(validateProject(p).ok).toBe(true);
  });

  it('the bundled demo project validates without errors', () => {
    const result = validateProject(migrateProject(demo));
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('demo has Hood + Ground surfaces, a relief intake, and rain fields', () => {
    expect(demo.surfaces.map((s) => s.id).sort()).toEqual(['ground', 'hood']);
    const hood = demo.surfaces.find((s) => s.id === 'hood');
    expect(hood.reliefLayers[0].mode).toBe('raised');
    expect(hood.rainFields.length).toBeGreaterThan(0);
  });

  it('flags missing required fields', () => {
    const bad = { schemaVersion: CURRENT_SCHEMA_VERSION, surfaces: [], heroEvents: [] };
    const result = validateProject(bad);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('migrateProject returns current schema version', () => {
    const migrated = migrateProject(demo);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('every bundled scene project validates', () => {
    const dir = resolve(here, '../../src/client/projects');
    const files = readdirSync(dir).filter((f) => f.endsWith('.meteor.json'));
    expect(files.length).toBeGreaterThanOrEqual(4);
    for (const f of files) {
      const json = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      const result = validateProject(migrateProject(json));
      expect(result.errors, `${f}: ${result.errors.join(', ')}`).toEqual([]);
    }
  });

  it('round-trips through JSON without losing scene state', () => {
    const json = JSON.parse(JSON.stringify(demo));
    const again = migrateProject(json);
    expect(again.surfaces.length).toBe(demo.surfaces.length);
    expect(validateProject(again).ok).toBe(true);
  });
});
