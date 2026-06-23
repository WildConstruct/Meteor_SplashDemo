// ProjectSerializer — .meteor.json export/import in the browser (build plan §23).
// Produces a plain, versioned JSON object with no functions, GPU handles, DOM
// references, transient hover, or cached simulation textures.

import { loadAndValidate } from './ProjectMigration.js';
import { CURRENT_SCHEMA_VERSION } from '../../engine/ProjectSchema.js';

const TRANSIENT_KEYS = new Set(['__gpu', '__hover', '__cache', 'selectedIds']);

/** Deep clone keeping only serializable scene state. */
export function serializeProject(project) {
  const clean = JSON.parse(JSON.stringify(project, (key, value) => {
    if (TRANSIENT_KEYS.has(key)) return undefined;
    if (typeof value === 'function') return undefined;
    return value;
  }));
  clean.schemaVersion = CURRENT_SCHEMA_VERSION;
  return clean;
}

/** Trigger a browser download of the project JSON. */
export function downloadProject(project, filename = 'car-hood-demo.meteor.json') {
  const json = JSON.stringify(serializeProject(project), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  triggerDownload(blob, filename);
}

/** Read a .meteor.json File -> validated project. */
export async function importProjectFile(file) {
  const text = await file.text();
  const json = JSON.parse(text);
  return loadAndValidate(json);
}

export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
