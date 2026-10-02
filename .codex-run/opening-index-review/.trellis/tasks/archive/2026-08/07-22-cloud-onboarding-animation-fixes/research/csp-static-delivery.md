# CSP and production static-delivery research

## Findings

* `worker-src` controls Worker, SharedWorker, and ServiceWorker script origins. When absent, browsers fall back through `child-src`, `script-src`, and `default-src`, which explains the observed fallback to `script-src 'self'`.
* PixiJS 8 bundles Blob-backed workers for image bitmap checks/loading and compressed texture handling. The local dependency creates workers with `URL.createObjectURL(new Blob(...))`.
* The narrow policy for this application is `worker-src 'self' blob:`. Adding `blob:` or `unsafe-eval` to `script-src` is unnecessary and would weaken the main script policy.
* The repo already imports `pixi.js/unsafe-eval`, which despite its package name installs CSP-compatible static synchronization polyfills and avoids runtime `new Function` use. That compatibility path should remain.
* The existing Nginx template enables gzip for JavaScript, CSS, JSON, XML, and SVG, serves `/opt/sigrikago/dist`, makes hashed bundles immutable, keeps named assets on a shorter revalidation window, and prevents HTML caching. Live responses show the application cache headers but no compressed transfer, indicating the deployed HTTPS server block is not fully aligned with the template.

## Effect scope

* Procedural/no-texture board effects: Sigrika `erase-point`, Aemeath `hidden-hand`, Chisa `liberty-purge`, Lynae `spray-stone`, Mornye `protocol-takeover`, Nabomo passive, and Qiuyuan `row-slash` do not directly depend on the registered texture asset list.
* Texture-backed effects: Changli `double-move` (SVG), Danea `flip-stone` (50-frame animated WebP), Baconbits `random-blast` (WebP), and Aemeath derived `voyage-star` (WebP) go through Pixi asset loading and must work under the Worker CSP.

## Sources

* MDN `Worker()` CSP guidance: https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker
* MDN CSP fallback behavior: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/default-src
* Local PixiJS worker implementation: `node_modules/pixi.js/lib/_virtual/loadImageBitmap.worker.mjs`
* Local PixiJS CSP compatibility module: `node_modules/pixi.js/lib/unsafe-eval/init.mjs`

## Recommended approach

1. Add explicit Helmet `workerSrc: ["'self'", "blob:"]`.
2. Assert both worker permission and strict script policy in tests.
3. Retain the CSP-compatible Pixi import and test the complete texture-backed effect catalog.
4. Deploy the repo Nginx static contract to both HTTP and HTTPS blocks, validate with `nginx -t`, and verify `Content-Encoding: gzip` using an `Accept-Encoding: gzip` request.
