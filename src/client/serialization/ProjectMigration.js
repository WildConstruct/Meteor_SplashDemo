// ProjectMigration — thin client wrapper over the engine's pure migration +
// validation (build plan §23). Kept separate so the client never re-implements
// schema logic.

import { migrateProject, validateProject, CURRENT_SCHEMA_VERSION } from '../../engine/ProjectSchema.js';

export { migrateProject, validateProject, CURRENT_SCHEMA_VERSION };

/** Migrate then validate; throws on fatal errors, returns warnings. */
export function loadAndValidate(json) {
  const migrated = migrateProject(json);
  const result = validateProject(migrated);
  if (!result.ok) {
    throw new Error(`Invalid project:\n  ${result.errors.join('\n  ')}`);
  }
  return { project: migrated, warnings: result.warnings };
}
