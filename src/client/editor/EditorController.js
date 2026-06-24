// EditorController — orchestrates the SVG authoring overlay and centralizes all
// pointer interaction (build plan §7.2). Tools render SVG carrying data-handle
// attributes; this controller does generic drag + selection against them. No
// WebGL is used for overlays; the VFX result stays entirely WebGPU-generated.

import { ViewportController, svgEl } from './ViewportController.js';
import { renderSurface } from './SurfaceTool.js';
import { renderQuad } from './PerspectiveTool.js';
import { renderNormal, normalFromDisc } from './NormalTool.js';
import { renderField, renderHeroDots } from './RainFieldTool.js';
import { renderRelief } from './ReliefTool.js';
import { pickImpact } from './ImpactPicking.js';
import { promotePicked, moveHero, retimeHero, setHeroOverride } from './HeroImpactTool.js';
import { suppressedSourceIds } from '../../engine/events/HeroEvents.js';

export class EditorController {
  constructor(svg, viewportEl, state, { notify, getFrame }) {
    this.svg = svg;
    this.viewportEl = viewportEl;
    this.state = state;
    this.notify = notify;
    this.getFrame = getFrame;
    this.vp = new ViewportController(svg);
    this.drag = null;

    this.inspector = document.createElement('div');
    this.inspector.className = 'inspector';
    this.viewportEl.appendChild(this.inspector);
    this._inspectorKey = null; // identity of the inspector's current selection

    this._bindPointer();
    state.addEventListener('change', () => this.render());
  }

  // ---- rendering ----
  render() {
    if (!this.state.project) return;
    const frame = this.getFrame();
    const sel = this.state.selection;
    // recompute homographies (quad may have changed)
    for (const s of this.state.surfaces()) this.vp.cacheHomography(s);

    while (this.svg.firstChild) this.svg.removeChild(this.svg.firstChild);
    const g = svgEl('g');

    const heroSources = suppressedSourceIds(this.state.project.heroEvents);
    const ctx = {
      projectSeed: this.state.project.globalSeed,
      params: this.state.params.toObject(),
      frame,
      frameRate: this.state.project.frameRate,
      heroSources,
    };

    for (const surface of this.state.surfaces()) {
      const surfSelected = sel.type === 'surface' && sel.id === surface.id;
      renderRelief(g, this.vp, surface);
      // Invisible clickable hit region (click the surface to select it). The old
      // filled mask box + grid + label and the per-impact placement dots are
      // intentionally gone — clutter + per-frame DOM churn that made dragging
      // sluggish. The calibration quad below is the visible editable outline.
      renderSurface(g, this.vp, surface, surfSelected);
      renderQuad(g, this.vp, surface, surfSelected);
      renderNormal(g, this.vp, surface, surfSelected);
      for (const field of surface.rainFields ?? []) {
        renderField(g, this.vp, surface, field, sel.type === 'field' && sel.id === field.id, ctx);
      }
    }
    renderHeroDots(g, this.vp, this.state.project.heroEvents, frame);

    this.svg.appendChild(g);

    // Rebuild the inspector DOM ONLY when the selection identity changes — never
    // on a value tweak or per animation frame. Rebuilding it mid-drag (innerHTML
    // = '') destroys the very <input type=range> being dragged, so the browser
    // loses pointer capture and the control feels frozen. The live value readout
    // is updated locally inside each slider's input handler, so the DOM the user
    // is interacting with stays put.
    const key = sel.type ? `${sel.type}:${sel.id}` : '';
    if (key !== this._inspectorKey) {
      this._inspectorKey = key;
      this._renderInspector();
    }
  }

  /** Force the inspector to rebuild on next render (e.g. after a preset apply
   *  mutates the selected field's values out from under the open controls). */
  invalidateInspector() {
    this._inspectorKey = null;
  }

  // ---- interaction ----
  _bindPointer() {
    this.svg.addEventListener('pointerdown', (e) => this._onDown(e));
    window.addEventListener('pointermove', (e) => this._onMove(e));
    window.addEventListener('pointerup', () => (this.drag = null));
  }

  _onDown(e) {
    const t = e.target;
    const handle = t.dataset?.handle;
    if (!handle) return;
    e.preventDefault();
    this.svg.setPointerCapture?.(e.pointerId);

    if (handle === 'impact') {
      this.state.select('impact', t.dataset.id);
      this._lastPicked = pickImpact(this.state, this.vp, this._evScreen(e), 12);
      return;
    }
    if (handle === 'hero') {
      this.state.select('hero', t.dataset.id);
      this.drag = { type: 'hero', id: t.dataset.id, surfaceId: t.dataset.surface };
      return;
    }
    if (handle === 'surface-select') {
      this.state.select('surface', t.dataset.surface); // click the surface to select; no drag
      return;
    }
    if (handle === 'quad') {
      this.state.select('surface', t.dataset.surface);
      this.drag = { type: 'quad', surfaceId: t.dataset.surface, corner: Number(t.dataset.corner) };
      return;
    }
    if (handle === 'normal-disc') {
      this.state.select('surface', t.dataset.surface);
      this.drag = { type: 'normal-disc', surfaceId: t.dataset.surface };
      return;
    }
    if (handle === 'field-move') {
      this.state.select('field', t.dataset.field);
      this.drag = { type: 'field-move', fieldId: t.dataset.field };
      return;
    }
    if (handle === 'field-scale') {
      this.state.select('field', t.dataset.field);
      this.drag = { type: 'field-scale', fieldId: t.dataset.field };
    }
  }

  _onMove(e) {
    if (!this.drag) return;
    const uv = this.vp.eventToUv(e);
    const screen = this._evScreen(e);

    switch (this.drag.type) {
      case 'quad': {
        const s = this.state.surface(this.drag.surfaceId);
        s.calibrationQuad[this.drag.corner] = { x: uv.u, y: uv.v };
        this.state.emit('surface');
        break;
      }
      case 'normal-disc': {
        const s = this.state.surface(this.drag.surfaceId);
        s.worldNormal = normalFromDisc(this.vp, s, screen);
        this.state.emit('surface');
        break;
      }
      case 'field-move': {
        const f = this.state.rainField(this.drag.fieldId);
        const surfaceId = this._fieldSurface(f);
        const [u, v] = this.vp.imageToSurfaceUV(surfaceId, uv.u, uv.v);
        this.state.updateRainField(f.id, { centerUV: { u, v } });
        break;
      }
      case 'field-scale': {
        const f = this.state.rainField(this.drag.fieldId);
        const surfaceId = this._fieldSurface(f);
        const [u, v] = this.vp.imageToSurfaceUV(surfaceId, uv.u, uv.v);
        const r = Math.max(0.03, Math.hypot(u - f.centerUV.u, v - f.centerUV.v));
        this.state.updateRainField(f.id, { scaleUV: { x: r, y: r * (f.scaleUV.y / f.scaleUV.x || 1) } });
        break;
      }
      case 'hero': {
        const [u, v] = this.vp.imageToSurfaceUV(this.drag.surfaceId, uv.u, uv.v);
        moveHero(this.state, this.drag.id, { u, v });
        break;
      }
    }
  }

  _evScreen(e) {
    const { left, top } = this.vp.size();
    return { x: e.clientX - left, y: e.clientY - top };
  }

  _fieldSurface(field) {
    return field.surfaceId ?? this.state.surfaces().find((s) => (s.rainFields ?? []).includes(field))?.id;
  }

  // ---- inspector (selected field / hero / impact) ----
  _renderInspector() {
    const sel = this.state.selection;
    const ins = this.inspector;
    ins.innerHTML = '';
    if (!sel.type) { ins.style.display = 'none'; return; }
    ins.style.display = 'block';

    if (sel.type === 'field') {
      const f = this.state.rainField(sel.id);
      if (!f) return;
      ins.appendChild(this._title(`Rain Field: ${f.name || f.id}`));
      ins.appendChild(this._slider('Density', f.density, 0, 1, 0.01, (v) => this.state.updateRainField(f.id, { density: v })));
      ins.appendChild(this._slider('Rotation', f.rotation || 0, -3.14, 3.14, 0.01, (v) => this.state.updateRainField(f.id, { rotation: v })));
      ins.appendChild(this._slider('Falloff', f.falloff || 0, 0, 1, 0.01, (v) => this.state.updateRainField(f.id, { falloff: v })));
      ins.appendChild(this._paletteSelect(f));
    } else if (sel.type === 'hero') {
      const h = this.state.project.heroEvents.find((x) => x.id === sel.id);
      if (!h) return;
      ins.appendChild(this._title('Hero Impact'));
      ins.appendChild(this._slider('Frame', h.frame, 0, this.state.project.durationFrames - 1, 1, (v) => retimeHero(this.state, h.id, v)));
      ins.appendChild(this._slider('Height ×', h.heightOverride ?? 1.5, 0.2, 6, 0.05, (v) => setHeroOverride(this.state, h.id, 'heightOverride', v)));
      ins.appendChild(this._slider('Width ×', h.widthOverride ?? 1.3, 0.2, 6, 0.05, (v) => setHeroOverride(this.state, h.id, 'widthOverride', v)));
      ins.appendChild(this._slider('Spread ×', h.spreadOverride ?? 1.2, 0.2, 6, 0.05, (v) => setHeroOverride(this.state, h.id, 'spreadOverride', v)));
    } else if (sel.type === 'impact') {
      ins.appendChild(this._title(`Impact ${sel.id}`));
      const btn = document.createElement('button');
      btn.textContent = '★ Promote to Hero';
      btn.addEventListener('click', () => {
        const picked = this._lastPicked;
        if (picked) {
          const hero = promotePicked(this.state, picked, { notify: this.notify });
          this.state.select('hero', hero.id);
        } else {
          this.notify?.warn('Click an impact dot first, then promote.');
        }
      });
      ins.appendChild(btn);
    } else if (sel.type === 'surface') {
      const s = this.state.surface(sel.id);
      ins.appendChild(this._title(`Surface: ${s.name || s.id}`));
      const note = document.createElement('div');
      note.className = 'muted';
      note.textContent = 'Drag A·B·C·D to calibrate · drag N to aim splash';
      ins.appendChild(note);
    }
  }

  _title(text) {
    const h = document.createElement('div');
    h.className = 'inspector-title';
    h.textContent = text;
    return h;
  }

  _slider(label, value, min, max, step, onInput) {
    const row = document.createElement('label');
    row.className = 'param-row';
    const out = document.createElement('span');
    out.className = 'param-value';
    out.textContent = fmt(value);
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min; input.max = max; input.step = step; input.value = value;
    input.addEventListener('input', () => {
      const v = Number(input.value);
      out.textContent = fmt(v);
      onInput(v);
    });
    row.innerHTML = `<span>${label}</span>`;
    row.appendChild(input);
    row.appendChild(out);
    return row;
  }

  _paletteSelect(field) {
    const row = document.createElement('label');
    row.className = 'param-row';
    const sel = document.createElement('select');
    const palettes = this.state.project.palettes ?? [];
    sel.innerHTML = '<option value="">(default)</option>' +
      palettes.map((p) => `<option value="${p.id}">${p.name}</option>`).join('');
    sel.value = field.paletteId ?? '';
    sel.addEventListener('change', () => this.state.updateRainField(field.id, { paletteId: sel.value || null }));
    row.innerHTML = '<span>Palette</span>';
    row.appendChild(sel);
    return row;
  }
}

function fmt(v) {
  return Number.isInteger(v) ? String(v) : Number(v).toFixed(2);
}
