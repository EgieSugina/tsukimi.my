# Getting started

## Requirements

- Node.js 20+ (developed on Node 26) and npm
- A Chromium-based browser or Firefox for Storybook

## Install & run

```bash
npm install
npm run storybook          # http://localhost:6006
```

| Script | What it does |
| --- | --- |
| `npm run storybook` | Storybook dev server with hot reload |
| `npm run build-storybook` | Static Storybook in `storybook-static/` (deploy anywhere) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run screenshots` | Regenerates `docs/screenshots/*.jpg` from a running Storybook |

> If the dev server ever shows unstyled components after renaming files or packages, stop it,
> delete `node_modules/.cache` and start again — StyleX class names are hashed from file paths.

## Storybook toolbar

| Toolbar | Options |
| --- | --- |
| **Theme** | Dark (default) · Light · System |
| **Device** | Auto (from width) · Mobile · Tablet · Laptop · PC · **TV** (turns on 10-foot scaling and D-pad navigation) |
| **Motion** | Always animate (default) · Respect OS setting · Reduced motion |
| **Viewport** | iPhone 15 · Mobile S · iPad Air (portrait/landscape) · Laptop 1366 · PC 1920 · TV 4K |

Story groups: *Introduction*, *Foundations* (Icon, Theme, Motion, Devices), *Components*, *Cards*,
*Layout*, *Anime*, *Comics*, *Media*, *SEO*, *Pages*.

## Using the library in an app

The package entry is `src/index.ts` (source, compiled by your bundler). Your app must compile
StyleX too — add the same plugin as `vite.config.ts`:

```ts
// vite.config.ts
import react from '@vitejs/plugin-react';
import stylex from '@stylexjs/unplugin';

export default { plugins: [stylex.vite({ useCSSLayers: true }), react()] };
```

Wrap the app once:

```tsx
import { DeviceProvider, ThemeProvider } from '@tsukimi/ui';
import '@tsukimi/ui/src/global.css'; // base reset + TV focus ring

<DeviceProvider>
  <ThemeProvider /* defaultMode="dark" */>
    <App />
  </ThemeProvider>
</DeviceProvider>;
```

Load the fonts (see `.storybook/preview-head.html`): **Playfair Display**, **Plus Jakarta Sans**,
**JetBrains Mono**.

## Replacing sample data

Everything in `src/mocks/` is placeholder content. Real apps pass their own data as props —
e.g. `coverSrc`, `photoSrc`, `sources`, `pages`, `entries`. The demo video and subtitles live in
`public/sample/`.
