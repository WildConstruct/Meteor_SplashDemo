// ShaderSourceManifest — the CLIENT loads WGSL files as raw source strings and
// hands them to the host-neutral engine (build plan §6, §8.2). Shaders stay as
// physical source files; nothing is generated at runtime. common.wgsl is included
// here and prepended by the engine before module creation.

const modules = import.meta.glob('../engine/shaders/*.wgsl', {
  query: '?raw',
  import: 'default',
  eager: true,
});

/** @returns {Record<string,string>} filename ("wet_update.wgsl") -> source */
export function loadShaderSources() {
  /** @type {Record<string,string>} */
  const out = {};
  for (const [path, src] of Object.entries(modules)) {
    const name = path.split('/').pop();
    out[name] = src;
  }
  return out;
}
