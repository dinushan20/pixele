/** Natural-first, non-generative processing. Kept pure for worker and unit tests. */
export function outputSize(width, height, scale, maxPixels = 24_000_000) {
  const ratio = Math.min(scale, Math.sqrt(maxPixels / (width * height)), 8192 / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)), limited: ratio < scale - 0.001 };
}
const clamp = (v, low = 0, high = 255) => Math.min(high, Math.max(low, v));
function boxBlur(data, w, h, radius) {
  const temp = new Float32Array(w * h * 3), out = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) for (let c = 0; c < 3; c++) {
    let sum = 0;
    for (let k = -radius; k <= radius; k++) sum += data[(y * w + clamp(k, 0, w - 1)) * 4 + c];
    for (let x = 0; x < w; x++) {
      temp[(y * w + x) * 3 + c] = sum / (radius * 2 + 1);
      sum += data[(y * w + clamp(x + radius + 1, 0, w - 1)) * 4 + c] - data[(y * w + clamp(x - radius, 0, w - 1)) * 4 + c];
    }
  }
  for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) {
    let sum = 0;
    for (let k = -radius; k <= radius; k++) sum += temp[(clamp(k, 0, h - 1) * w + x) * 3 + c];
    for (let y = 0; y < h; y++) {
      out[(y * w + x) * 3 + c] = sum / (radius * 2 + 1);
      sum += temp[(clamp(y + radius + 1, 0, h - 1) * w + x) * 3 + c] - temp[(clamp(y - radius, 0, h - 1) * w + x) * 3 + c];
    }
  }
  return out;
}
export function enhancePixels(input, w, h, settings, progress = (_progress = 0) => {}) {
  const s = settings.strength / 100;
  if (!s) return new Uint8ClampedArray(input);
  const out = new Uint8ClampedArray(input), smooth = new Uint8ClampedArray(input);
  const amount = settings.noise / 100 * 0.85;
  // Range-weighted neighborhood: similar colors denoise together; edges stay distinct.
  if (amount) for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let sums = [0, 0, 0], total = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const j = (clamp(y + dy, 0, h - 1) * w + clamp(x + dx, 0, w - 1)) * 4;
        if (input[j + 3] === 0) continue;
        const delta = Math.abs(input[i] - input[j]) + Math.abs(input[i + 1] - input[j + 1]) + Math.abs(input[i + 2] - input[j + 2]);
        const weight = Math.exp(-delta / 26) * (dx === 0 && dy === 0 ? 2 : 1);
        total += weight;
        for (let c = 0; c < 3; c++) sums[c] += input[j + c] * weight;
      }
      if (total) for (let c = 0; c < 3; c++) smooth[i + c] = input[i + c] * (1 - amount) + sums[c] / total * amount;
    }
    if (y % 64 === 0) progress(8 + y / h * 30);
  }
  progress(40);
  const detail = boxBlur(smooth, w, h, 1), clarity = boxBlur(smooth, w, h, Math.max(2, Math.round(Math.min(w, h) / 120)));
  progress(58);
  let black = 0, white = 255;
  if (settings.autoLevels) {
    const hist = new Uint32Array(256); let count = 0;
    for (let i = 0; i < input.length; i += 4) if (input[i + 3] > 128) { hist[Math.round(input[i] * 0.2126 + input[i + 1] * 0.7152 + input[i + 2] * 0.0722)]++; count++; }
    let low = 0, high = 0;
    for (let i = 0; i < 256; i++) { low += hist[i]; if (low > count * .005) { black = Math.min(i, 24); break; } }
    for (let i = 255; i >= 0; i--) { high += hist[i]; if (high > count * .005) { white = Math.max(i, 231); break; } }
  }
  for (let p = 0; p < w * h; p++) {
    const i = p * 4, j = p * 3;
    if (!input[i + 3]) continue;
    const lum = smooth[i] * .2126 + smooth[i + 1] * .7152 + smooth[i + 2] * .0722;
    const sat = (Math.max(smooth[i], smooth[i + 1], smooth[i + 2]) - Math.min(smooth[i], smooth[i + 1], smooth[i + 2])) / 255;
    for (let c = 0; c < 3; c++) {
      const edge = smooth[i + c] - detail[j + c];
      // Limit both high-frequency gain and wide-radius contrast to avoid harsh halos.
      const sharp = clamp(edge * settings.detail / 100 * 1.55, -14, 14);
      const micro = clamp((smooth[i + c] - clarity[j + c]) * settings.clarity / 100 * .65, -12, 12);
      let v = smooth[i + c] + sharp + micro;
      v = (v - black) * 255 / (white - black);
      v = (v - 128) * (1 + settings.contrast / 100 * .65) + 128 + settings.exposure * 0.45;
      v += (v - lum) * settings.vibrance / 100 * (1 - sat) * .65;
      out[i + c] = clamp(input[i + c] + (v - input[i + c]) * s);
    }
    if (p % (w * 64) === 0) progress(60 + p / (w * h) * 28);
  }
  return out;
}
