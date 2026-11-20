import { enhancePixels, outputSize } from './engine.mjs';
self.onmessage = async ({ data }) => {
  const { id, bitmap, settings, preview, mime, quality } = data;
  try {
    const factor = preview ? Math.min(1, 1100 / Math.max(bitmap.width, bitmap.height)) : 1;
    const w = Math.max(1, Math.round(bitmap.width * factor)), h = Math.max(1, Math.round(bitmap.height * factor));
    const canvas = new OffscreenCanvas(w, h), ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0, w, h); bitmap.close();
    const source = ctx.getImageData(0, 0, w, h);
    const pixels = enhancePixels(source.data, w, h, settings, (progress = 0) => self.postMessage({ id, progress }));
    ctx.putImageData(new ImageData(pixels, w, h), 0, 0);
    const size = preview ? { width: w, height: h, limited: false } : outputSize(w, h, settings.scale);
    const output = new OffscreenCanvas(size.width, size.height), out = output.getContext('2d')!;
    if (mime === 'image/jpeg') { out.fillStyle = '#ffffff'; out.fillRect(0, 0, size.width, size.height); }
    out.imageSmoothingEnabled = true; out.imageSmoothingQuality = 'high';
    out.drawImage(canvas, 0, 0, size.width, size.height);
    self.postMessage({ id, progress: 94 });
    const blob = await output.convertToBlob({ type: preview ? 'image/webp' : mime, quality: preview ? .93 : quality });
    self.postMessage({ id, blob, ...size });
  } catch (error) { self.postMessage({ id, error: error instanceof Error ? error.message : 'Processing failed' }); }
};
