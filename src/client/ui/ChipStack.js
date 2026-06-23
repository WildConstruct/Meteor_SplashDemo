// ChipStack — the Magic-Bullet-style authoring metaphor (build plan §22). A fixed
// set of chip categories presenting surfaces, rain fields, relief, responses, and
// look. Selecting a chip drives ClientState.selection (which the editor overlay
// reads). It is an authoring metaphor — NOT literal GPU execution order (§22.1).

const CATEGORIES = [
  { key: 'DIRECT', label: 'Direct' },
  { key: 'RECEIVE', label: 'Receive' },
  { key: 'RESPOND', label: 'Respond' },
  { key: 'ACCUMULATE', label: 'Accumulate' },
  { key: 'LOOK', label: 'Look' },
];

export class ChipStack {
  constructor(mount, state, { notify }) {
    this.mount = mount;
    this.state = state;
    this.notify = notify;
    this._build();
    state.addEventListener('change', (e) => {
      if (['project', 'selection', 'field', 'relief'].includes(e.detail.kind)) this._render();
    });
  }

  _build() {
    this.root = document.createElement('div');
    this.root.className = 'panel chip-stack';
    this.root.innerHTML = '<h3>Chip Stack</h3>';
    this.list = document.createElement('div');
    this.list.className = 'chip-list';
    this.root.appendChild(this.list);
    this.mount.appendChild(this.root);
    this._render();
  }

  _render() {
    if (!this.state.project) {
      this.list.innerHTML = '<div class="muted">No project loaded</div>';
      return;
    }
    const sel = this.state.selection;
    const chips = [];

    chips.push(group('RECEIVE'));
    for (const s of this.state.surfaces()) {
      chips.push(chip('surface', s.id, `🧩 ${s.name || s.id}`, sel));
      for (const r of s.reliefLayers ?? []) {
        const onOff = r.enabled === false ? 'off' : 'on';
        chips.push(`<div class="chip sub relief-toggle ${onOff}" data-relief="${r.id}" data-surface="${s.id}">⛰ Relief: ${r.mode} (${onOff}) — click to toggle</div>`);
      }
    }
    chips.push(group('DIRECT'));
    for (const f of this.state.allRainFields()) {
      chips.push(chip('field', f.id, `🌧 ${f.name || f.id}`, sel));
    }
    chips.push(group('RESPOND'));
    for (const f of this.state.allRainFields()) {
      chips.push(`<div class="chip-sub">${f.name || f.id}: palette ${f.paletteId ?? '—'}</div>`);
    }
    chips.push(group('ACCUMULATE'));
    chips.push('<div class="chip-sub">Wetness · Runoff · Ripple · Evaporation</div>');

    this.list.innerHTML = chips.join('');
    this.list.querySelectorAll('[data-chip]').forEach((el) => {
      el.addEventListener('click', () => {
        this.state.select(el.dataset.type, el.dataset.id);
      });
    });
    this.list.querySelectorAll('.relief-toggle').forEach((el) => {
      el.addEventListener('click', () => {
        const s = this.state.surface(el.dataset.surface);
        const layer = (s?.reliefLayers ?? []).find((r) => r.id === el.dataset.relief);
        if (!layer) return;
        this.state.setReliefEnabled(el.dataset.surface, layer.enabled === false);
        this.notify?.info(`Relief ${layer.enabled === false ? 'enabled' : 'disabled'}`);
      });
    });
  }
}

function group(name) {
  const meta = CATEGORIES.find((c) => c.key === name);
  return `<div class="chip-group">${meta ? meta.label : name}</div>`;
}

function chip(type, id, label, sel, sub = false) {
  const active = sel.type === type && sel.id === id ? ' active' : '';
  return `<div class="chip${active}${sub ? ' sub' : ''}" data-chip data-type="${type}" data-id="${id}">${label}</div>`;
}
