// ProjectMenu — .meteor.json scene export/import + reload demo (build plan §23,
// §4 step 13). Scene state only; look presets are handled by PresetBar.

import { downloadProject, importProjectFile } from '../serialization/ProjectSerializer.js';

export class ProjectMenu {
  constructor(mount, state, { notify, onProjectLoaded, onReloadDemo }) {
    this.mount = mount;
    this.state = state;
    this.notify = notify;
    this.onProjectLoaded = onProjectLoaded;
    this.onReloadDemo = onReloadDemo;
    this._build();
  }

  _build() {
    const el = document.createElement('div');
    el.className = 'project-menu';
    el.innerHTML = `
      <button data-act="export">Export Project</button>
      <button data-act="import">Import Project</button>
      <button data-act="demo">Reload Demo</button>
      <input type="file" accept=".json,.meteor.json" data-act="file" hidden />`;
    this.mount.appendChild(el);

    el.querySelector('[data-act=export]').addEventListener('click', () => {
      downloadProject(this.state.project);
      this.notify?.info('Exported .meteor.json');
    });
    const file = el.querySelector('[data-act=file]');
    el.querySelector('[data-act=import]').addEventListener('click', () => file.click());
    el.querySelector('[data-act=demo]').addEventListener('click', () => this.onReloadDemo?.());
    file.addEventListener('change', async () => {
      const f = file.files?.[0];
      if (!f) return;
      try {
        const { project, warnings } = await importProjectFile(f);
        this.onProjectLoaded?.(project);
        warnings.forEach((w) => this.notify?.warn(w));
        this.notify?.info('Project loaded');
      } catch (err) {
        this.notify?.error(`Load failed: ${err.message}`);
      }
      file.value = '';
    });
  }
}
