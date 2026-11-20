# Pixele — free image enhancement studio

A browser-only image enhancer and upscaler. No accounts, credits, checkout, API keys or paid inference. Image pixels stay on the user's device.

## Use

Drag in or paste an image, choose a preset, adjust the controls, compare the original and result, then enhance and download. Supports JPG, PNG, WebP and HEIC input, six presets, sharpening, denoising, clarity, levels, contrast, exposure and vibrance. Resize by 1×, 2×, 4× or 6× within device-safe limits. Export PNG/WebP/JPG, or a ZIP with the original and result. History is session-only unless the user enables device storage.

This version uses classical image processing and resampling, not neural reconstruction. It cannot restore genuinely missing detail or perform neural face recovery. Preset suggestions are simple filename/aspect-ratio heuristics. Batch upload is a selectable queue of up to ten files; processing and download are per-image. HEIC output is unsupported. Input limits: 50 MB and 20 MP. Output limits: approximately 24 MP and 8192 pixels per side.

## Develop

Use Node 24 and npm:

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

The production site is in `dist/`. Relative URLs support both a root domain and a GitHub project path such as `/pixele/`. No server or database is needed. Never add credentials to this repository.

## GitHub Pages

The included `.github/workflows/pages.yml` tests, builds and deploys pushes to `main` using GitHub Actions. In the repository's **Settings → Pages**, select **GitHub Actions** as the build source, then run the workflow or push a commit. For a repository named `pixele` under account `dinushan20`, the expected address after successful deployment is `https://dinushan20.github.io/pixele/`. This is an expected address, not a claim that deployment has occurred.

GitHub Free offers Pages from public repositories. Making a repository public also exposes its source. This edition contains no billing backend, credentials or account database. The `pixele.fit` name is branding only; no custom domain has been purchased or connected.

GitHub Pages is suitable for this free static project. Its rules exclude hosting an online business, ecommerce or commercial SaaS; move to suitable hosting before introducing paid services. References: [Pages publishing](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

## Privacy and assets

Processing runs in a Web Worker, without image upload. Session history and optional IndexedDB history stay in the browser. Theme/history preferences use localStorage. The hosting service receives ordinary page/asset requests. Google Fonts provides typefaces; there are no analytics scripts. The bundled alpine sample originates from [this Unsplash photograph](https://images.unsplash.com/photo-1464822759023-fed622ff2c3b). The app compresses and actually processes the sample; it never swaps in a higher-resolution source as a fake enhancement.

Modern browsers need Web Workers, OffscreenCanvas, createImageBitmap and IndexedDB for the corresponding features. The large HEIC decoder loads only when a HEIC file is opened.
