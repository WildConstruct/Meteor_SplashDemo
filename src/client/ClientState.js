// ClientState — the single source of authoring truth in the browser. Holds the
// MeteorProject, the ParameterState, current selection, and viewport. Mutations
// emit a 'change' so the app re-pushes project/params into the engine and redraws
// overlays. (build plan §22.1: the client compiles chip/scene state into a
// normalized project the engine consumes.)

import { ParameterState } from '../engine/ParameterState.js';

export class ClientState extends EventTarget {
  constructor() {
    super();
    this.params = new ParameterState();
    this.project = null;
    this.selection = { type: null, id: null };
  }

  setProject(project) {
    this.project = project;
    if (project.globalSeed != null) this.params.set('globalSeed', project.globalSeed);
    this.emit('project');
  }

  emit(kind) {
    this.dispatchEvent(new CustomEvent('change', { detail: { kind } }));
  }

  // ---- lookups ----
  surfaces() {
    return this.project?.surfaces ?? [];
  }
  surface(id) {
    return this.surfaces().find((s) => s.id === id);
  }
  rainFields(surfaceId) {
    const s = this.surface(surfaceId);
    return s?.rainFields ?? [];
  }
  allRainFields() {
    return this.surfaces().flatMap((s) => s.rainFields ?? []);
  }
  rainField(id) {
    return this.allRainFields().find((f) => f.id === id);
  }

  // ---- selection ----
  select(type, id) {
    this.selection = { type, id };
    this.emit('selection');
  }

  // ---- mutations ----
  setParam(id, value) {
    if (this.params.set(id, value)) {
      if (id === 'globalSeed' && this.project) this.project.globalSeed = this.params.get('globalSeed');
      this.emit('param');
    }
  }

  updateRainField(id, patch) {
    const f = this.rainField(id);
    if (!f) return;
    Object.assign(f, patch);
    this.emit('field');
  }

  addHeroEvent(hero) {
    this.project.heroEvents.push(hero);
    this.emit('hero');
  }

  setReliefEnabled(surfaceId, enabled) {
    const s = this.surface(surfaceId);
    if (!s) return;
    for (const r of s.reliefLayers ?? []) r.enabled = enabled;
    this.emit('relief');
  }
}
