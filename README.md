# Virtual Try‑On — Browser Extension (WXT + React)

Virtual Try‑On turns any shopping site into your personal fitting room. Upload a standard photo once, then right‑click any garment image on supported sites to preview an AI‑generated try‑on result.

This repository is an open‑source, privacy‑first Chrome/Firefox extension scaffold built with WXT + React + TypeScript.

## Features
- Right‑click try‑on from product images (context menu)
- Local photo storage and BYO API key (OpenRouter) — nothing sent to our servers
- Simple, responsive UI (React + Tailwind)
- Minimal permissions and domain‑scoped content scripts
- Try‑on flow window with progress and result actions (save/regenerate)

## Demo (Coming Soon)
- Chrome Web Store: tbd
- Intro website (GitHub Pages): tbd

## Getting Started

Prerequisites
- Node.js 18+ and npm

Install
```
npm install
```

Development (Chrome)
```
npm run dev
```
This starts WXT in development mode. If your setup doesn’t auto‑load the extension, you can load the dev build manually from `.output/chrome-mv3-dev` via Chrome’s Extensions page (Developer Mode → Load unpacked).

Development (Firefox)
```
npm run dev:firefox
```

Build (production)
```
npm run build
```

Package (zip for store submission)
```
npm run zip
```
The packaged artifacts are saved under `.output/`.

## How It Works
1. Upload a standard photo in the extension popup.
2. Browse supported e‑commerce sites. Right‑click a garment image → “Virtual Try‑On”.
3. A try‑on window opens; the AI generates a composite preview.
4. Save the result or regenerate.

## Configuration (BYO Key via OpenRouter)
In the popup’s Settings tab:
- API Key: Your OpenRouter key (stored locally)
- Base URL: Defaults to `https://openrouter.ai/api`
- Model ID: Defaults to `google/gemini-2.5-flash-image-preview:free`

Notes
- If no API key is provided, the try‑on flow shows a demo image.
- Network errors are mapped to user‑friendly messages (429, 5xx, timeouts).

## Supported Sites (initial)
Defined in `constants.ts` as `ALLOWED_SHOPPING_SITES` (domain‑scoped for minimal permissions), including examples like:
- Amazon, eBay, Walmart, Target, BestBuy
- Zara, H&M, Uniqlo, Nike, Adidas, Shopify stores, Etsy
- Zalando (EU locales)
- Taobao/Tmall/Alibaba (CN), Shopee/MOMO/PChome (TW)

You can extend the allowlist by editing `constants.ts`.

## Permissions
Declared in `wxt.config.ts` → `manifest`:
- `storage`: Save user photos and settings locally.
- `contextMenus`: Add the right‑click action on images.
- `activeTab`: Read the current tab URL to pass source context.
- `host_permissions`: Limited to the allowlisted shopping sites.

## Project Structure
- `entrypoints/`
  - `background.ts`: Context menu, window creation, messaging
  - `content.ts`: Extract DOM/image context on allowed sites
  - `popup/`: Popup UI (tabs: Upload, Gallery, Settings)
  - `tryon/`: Standalone try‑on window (flow + result)
- `components/`: Reusable React components (uploader, gallery, settings)
- `utils/`: Storage, OpenRouter client, image helpers, logging
- `types/`: Message and data types
- `public/`: Static assets (icons)

## Icons
Place PNGs in `public/icon/`:
- `16.png`, `32.png`, `48.png`, `96.png`, `128.png`
Mapped in `wxt.config.ts` → `manifest.icons`.

## Privacy
- Photos and API keys are stored locally using extension storage.
- We do not operate servers or analytics.
- If you configure a model provider, requests go directly from your device to that provider when you trigger generation.
- See `docs/privacy.md` for details.

## Internationalization (i18n)
The initial UI includes Traditional Chinese strings; an English‑first pass and i18n keys are planned. Suggested approach:
- Introduce `react-i18next`, add `locales/en.json` and `locales/zh-TW.json`.
- Replace hardcoded UI strings with `t('key')`.
- For extension shell (context menu, name/description), use Chrome `_locales`.

## Contributing
We welcome issues and pull requests!
- Open an issue for bugs or feature proposals.
- Keep changes focused and aligned with existing code style (TypeScript, React, Tailwind).
- Avoid broad refactors unless discussed.

Local Development Tips
- Prefer `rg`/ripgrep and small, focused changes.
- Use the popup Settings to test storage quotas and the “Clear All Photos & Key” action.
- Test try‑on flow both with and without an API key (demo vs. real model).

## Security
- Please report security issues privately via email: hengshiousheu@gmail.com

## Roadmap
- Full i18n support (EN default; zh‑TW resources)
- Expanded site allowlist and heuristics for image selection
- Optional on‑device preprocessing for photos
- Better error surfaces and offline handling

## License
Open‑source friendly. Choose and add a license file (MIT recommended) that fits your needs. If you contribute, you agree your contributions will be licensed under the chosen project license.

## Acknowledgments
- Built with [WXT](https://wxt.dev/) and [React]
- Uses [Tailwind CSS] for styles
- Optional model routing via [OpenRouter](https://openrouter.ai/)
