// ParameterPanel — UI-generated scalar controls from plugin.params.json
// (build plan §9.1: "Use the shared UI generator for ordinary controls"). Grouped
// by section; every change routes through ClientState.setParam.

import { PARAM_MANIFEST } from '../../engine/ParameterState.js';

export class ParameterPanel {
  constructor(mount, state) {
    this.mount = mount;
    this.state = state;
    this.inputs = new Map();
    this._build();
    state.addEventListener('change', (e) => {
      if (e.detail.kind === 'preset' || e.detail.kind === 'project') this.syncAll();
    });
  }

  _build() {
    const sections = new Map();
    for (const p of PARAM_MANIFEST.params) {
      if (!sections.has(p.section)) sections.set(p.section, []);
      sections.get(p.section).push(p);
    }
    const frag = document.createElement('div');
    frag.className = 'panel param-panel';
    frag.innerHTML = '<h3>Parameters</h3>';

    for (const [section, params] of sections) {
      const grp = document.createElement('details');
      grp.open = section === 'Splash' || section === 'Look';
      grp.className = 'param-section';
      grp.innerHTML = `<summary>${section}</summary>`;
      for (const p of params) grp.appendChild(this._control(p));
      frag.appendChild(grp);
    }
    this.mount.appendChild(frag);
  }

  _control(p) {
    const row = document.createElement('label');
    row.className = 'param-row';
    const value = this.state.params.get(p.id);

    if (p.type === 'enum') {
      const sel = document.createElement('select');
      (p.options || []).forEach((opt, i) => {
        const o = document.createElement('option');
        o.value = String(i);
        o.textContent = opt;
        sel.appendChild(o);
      });
      sel.value = String(value);
      sel.addEventListener('change', () => this.state.setParam(p.id, Number(sel.value)));
      row.innerHTML = `<span>${p.name}</span>`;
      row.appendChild(sel);
      this.inputs.set(p.id, { kind: 'enum', el: sel });
      return row;
    }

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = String(p.min);
    slider.max = String(p.max);
    slider.step = String(p.step ?? 0.01);
    slider.value = String(value);
    const out = document.createElement('span');
    out.className = 'param-value';
    out.textContent = fmt(value);
    slider.addEventListener('input', () => {
      const v = Number(slider.value);
      out.textContent = fmt(v);
      this.state.setParam(p.id, v);
    });
    row.innerHTML = `<span>${p.name}</span>`;
    row.appendChild(slider);
    row.appendChild(out);
    this.inputs.set(p.id, { kind: 'range', el: slider, out });
    return row;
  }

  syncAll() {
    for (const [id, ref] of this.inputs) {
      const v = this.state.params.get(id);
      ref.el.value = String(v);
      if (ref.out) ref.out.textContent = fmt(v);
    }
  }
}

function fmt(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}
