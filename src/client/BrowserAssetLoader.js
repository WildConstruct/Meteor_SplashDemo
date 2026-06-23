// BrowserAssetLoader — all image decoding + file fetching lives in the CLIENT
// (build plan §7.1). Produces GPUTextures the engine consumes; the engine never
// loads a URL or decodes an image.

/** Decode an image URL into an ImageBitmap. */
export async function loadImageBitmap(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`asset ${url}: ${res.status}`);
  const blob = await res.blob();
  return createImageBitmap(blob, { colorSpaceConversion: 'none' });
}

/**
 * Upload an ImageBitmap into an rgba8unorm texture (sampled as raw sRGB bytes;
 * the engine's plate_linearize pass converts to linear).
 */
export function uploadImageTexture(device, bitmap, label = 'plate') {
  const tex = device.createTexture({
    label,
    size: { width: bitmap.width, height: bitmap.height },
    format: 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT,
  });
  device.queue.copyExternalImageToTexture({ source: bitmap }, { texture: tex }, {
    width: bitmap.width,
    height: bitmap.height,
  });
  return tex;
}

/** rgba16float micro-normal texture for wet breakup. */
export async function loadMicroNormal(device, url) {
  try {
    const bmp = await loadImageBitmap(url);
    return uploadImageTexture(device, bmp, 'micro-normal');
  } catch {
    // synthesize a flat normal if the asset is missing
    const tex = device.createTexture({
      size: { width: 4, height: 4 }, format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    const data = new Uint8Array(4 * 4 * 4).fill(128);
    for (let i = 0; i < 16; i++) data[i * 4 + 2] = 255; // up-facing
    device.queue.writeTexture({ texture: tex }, data, { bytesPerRow: 16, rowsPerImage: 4 }, { width: 4, height: 4 });
    return tex;
  }
}

/** Fetch + parse a JSON asset (project, splash atlas json, etc.). */
export async function loadJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`json ${url}: ${res.status}`);
  return res.json();
}
