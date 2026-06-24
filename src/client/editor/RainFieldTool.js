// RainFieldTool — draggable/scalable/rotatable rain-field chip + the dot-authoring
// view (build plan §13, §13.3, Milestone 3). Dots are the stable candidate pool
// projected through the surface homography; moving/scaling the field transforms
// the SAME pattern. Dot brightness encodes timeline relationship.

import { svgEl } from './ViewportController.js';
import { buildFieldEvents } from '../../engine/events/RainFieldScheduler.js';
import { getResponse } from '../../engine/responses/response-schema.js';

export function renderField(group, vp, surface, field, selected, ctx) {
  const center = vp.surfaceUVToScreen(surface.id, field.centerUV.u, field.centerUV.v);
  // footprint outline (project a few rim points)
  const rim = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const lx = Math.cos(a), ly = Math.sin(a);
    const cos = Math.cos(field.rotation || 0), sin = Math.sin(field.rotation || 0);
    const u = field.centerUV.u + (field.scaleUV.x * lx) * cos - (field.scaleUV.y * ly) * sin;
    const v = field.centerUV.v + (field.scaleUV.x * lx) * sin + (field.scaleUV.y * ly) * cos;
    const s = vp.surfaceUVToScreen(surface.id, u, v);
    rim.push(`${s.x},${s.y}`);
  }
  group.appendChild(svgEl('polygon', {
    points: rim.join(' '), class: `field-footprint${selected ? ' selected' : ''}`,
  }));

  if (selected) {
    // move handle (center)
    group.appendChild(svgEl('circle', {
      cx: center.x, cy: center.y, r: 8, class: 'handle field-move',
      'data-handle': 'field-move', 'data-field': field.id,
    }));
    // scale handle along +u axis
    const sh = vp.surfaceUVToScreen(surface.id,
      field.centerUV.u + field.scaleUV.x * Math.cos(field.rotation || 0),
      field.centerUV.v + field.scaleUV.x * Math.sin(field.rotation || 0));
    group.appendChild(svgEl('circle', {
      cx: sh.x, cy: sh.y, r: 6, class: 'handle field-scale',
      'data-handle': 'field-scale', 'data-field': field.id,
    }));
  }
}

// Cap the number of authoring dots drawn per field. The dots are a placement aid
// rebuilt every frame; with dense rain a field can hold many hundreds of events,
// and drawing them all as SVG nodes each frame thrashes the DOM enough to make
// the editor unresponsive (dragging stops) and can crash the tab. Drawing a
// representative, evenly-spaced subset keeps the overlay readable and fast — the
// GPU sim still uses every event.
const MAX_DOTS = 140;

export function renderDots(group, vp, surface, field, ctx) {
  const events = buildFieldEvents(field, ctx.projectSeed, ctx.params);
  const frame = ctx.frame;
  const heroSources = ctx.heroSources;
  const step = Math.max(1, Math.ceil(events.length / MAX_DOTS));

  for (let i = 0; i < events.length; i += step) {
    const ev = events[i];
    if (heroSources.has(ev.stableId)) continue; // promoted -> hidden as generated
    const resp = getResponse(ev.responseId);
    const life = resp.lifetime * ctx.frameRate * (ctx.params.lifetime ?? 1);
    const s = vp.surfaceUVToScreen(surface.id, ev.surfaceUV.u, ev.surfaceUV.v);
    let cls = 'dot future';
    if (frame >= ev.frame && frame <= ev.frame + life) cls = 'dot current';
    else if (frame > ev.frame + life && frame <= ev.frame + life * 3) cls = 'dot recent';
    const r = 2 + ev.dropSize * 1.5;
    group.appendChild(svgEl('circle', {
      cx: s.x, cy: s.y, r, class: cls,
      'data-handle': 'impact', 'data-field': field.id, 'data-id': ev.stableId,
      'data-frame': ev.frame, 'data-surface': surface.id,
    }));
  }
}

export function renderHeroDots(group, vp, heroEvents, frame) {
  for (const h of heroEvents) {
    if (!h.enabled) continue;
    const s = vp.surfaceUVToScreen(h.surfaceId, h.surfaceUV.u, h.surfaceUV.v);
    group.appendChild(svgEl('circle', {
      cx: s.x, cy: s.y, r: 9, class: 'dot hero',
      'data-handle': 'hero', 'data-id': h.id, 'data-surface': h.surfaceId,
    }));
    const t = svgEl('text', { x: s.x + 11, y: s.y + 4, class: 'handle-label hero-label' });
    t.textContent = `★ f${h.frame}`;
    group.appendChild(t);
  }
}
