# Responsive & devices

## Tiers

| Tier | Width | Layout |
| --- | --- | --- |
| **mobile** | < 640 | Compact top bar (hamburger), **bottom tab bar**, drawer, 150px covers, swipe carousels, single-column grids, one-day calendar, touch gestures in the player |
| **tablet** | 640–1023 | Hamburger + **drawer** (nav + sidebar), 250px covers, single-column cast cards, one-day calendar |
| **laptop** | 1024–1439 | Full top nav + 380px sidebar, stat pills hidden |
| **pc** | 1440–2559 | Full layout (designed at 1920); extra chrome (mode pill, FAV) only ≥ 2200 |
| **tv** | ≥ 2560, or a smart-TV browser | Laptop/PC layout scaled 1–2.4× (`zoom`), overscan-safe padding, big focus ring, **D-pad navigation** |

## CSS — `bp`

```ts
import { bp } from '../../tokens/breakpoints.stylex';

const s = stylex.create({
  grid: { gridTemplateColumns: { default: 'repeat(3, 1fr)', [bp.belowLaptop]: '1fr' } },
});
```

`bp`: `mobile`, `tablet`, `belowLaptop`, `laptop`, `belowPc`, `pc`, `tv`, `touch`.

## JS — `useDevice()`

```tsx
const { device, isHandheld, isTouch, isTV, width, scale } = useDevice();
```

Use it only when the **structure** changes (e.g. `AppShell` drawer vs sidebar, `AiringCalendar`
day picker, `VideoPlayer` touch gestures, `ComicReader` single page on phones).

## TV

- Detected by user agent (Tizen, webOS, Android TV, Fire TV, Roku, Bravia, HbbTV, …) or width ≥ 2560.
- Force it for a TV build: `<DeviceProvider force="tv">`.
- Remote arrow keys move focus to the nearest control in that direction (`useSpatialNavigation`);
  Enter presses it. The reader and the player keep their own arrow keys (`data-own-arrows`).
- Focus ring: 4px pink outline (`html[data-device='tv'] :focus-visible` in `global.css`).

## Touch gestures

| Where | Gesture |
| --- | --- |
| Video player | tap = show/hide controls · double-tap left/right third = ∓10s · double-tap centre = fullscreen |
| Drawer | swipe left to close |
| Carousels | horizontal swipe with scroll-snap |
| Comic reader | tap left/right third = previous/next page, centre = toolbars |

## Testing

Use the Storybook **Viewport** toolbar (iPhone 15, iPad, Laptop, PC, TV 4K) and the **Device**
toolbar to force a tier. *Foundations → Devices* shows the detected tier live and a D-pad test grid.
