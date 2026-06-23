// ReliefTool — renders relief layer outlines (build plan §16, Milestone 6). The
// raised intake is drawn projected onto the surface so the artist sees where
// wetness/flow will divide. Enable/disable is driven from the ChipStack.

import { svgEl } from './ViewportController.js';

export function renderRelief(group, vp, surface) {
  for (const layer of surface.reliefLayers ?? []) {
    const off = layer.enabled === false;
    const pts = reliefOutline(layer.shape);
    const screen = pts.map(([u, v]) => {
      const s = vp.surfaceUVToScreen(surface.id, u, v);
      return `${s.x},${s.y}`;
    });
    group.appendChild(svgEl('polygon', {
      points: screen.join(' '),
      class: `relief-shape ${layer.mode}${off ? ' off' : ''}`,
    }));
  }
}

function reliefOutline(shape) {
  if (shape.type === 'ellipse') {
    const out = [];
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const lx = Math.cos(a) * shape.radius.u;
      const ly = Math.sin(a) * shape.radius.v;
      const cos = Math.cos(shape.rotation || 0), sin = Math.sin(shape.rotation || 0);
      out.push([shape.center.u + lx * cos - ly * sin, shape.center.v + lx * sin + ly * cos]);
    }
    return out;
  }
  return (shape.points || []).map((p) => [p.u, p.v]);
}
