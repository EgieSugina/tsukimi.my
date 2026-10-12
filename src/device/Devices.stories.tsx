import type { Meta, StoryObj } from '@storybook/react-vite';
import * as stylex from '@stylexjs/stylex';
import { Badge } from '../components/Badge/Badge';
import { Button } from '../components/Button/Button';
import { colors, fonts, radius } from '../tokens/tokens.stylex';
import { bp } from '../tokens/breakpoints.stylex';
import { useDevice, type Device } from './device';

const tiers: [Device, string, string][] = [
  ['mobile', '< 640px', 'Bottom tab bar + drawer, 150px covers, swipe carousels, one-day calendar, touch gestures in the player'],
  ['tablet', '640–1023px', 'Drawer navigation, 250px covers, single-column cast cards, one-day calendar'],
  ['laptop', '1024–1439px', 'Full top nav + sidebar, stat pills hidden'],
  ['pc', '1440–2559px', 'Full layout (designed at 1920)'],
  ['tv', '≥ 2560px or smart-TV browser', 'UI scaled 1–2.4×, overscan-safe padding, big focus ring, D-pad (arrow key) navigation'],
];

function Readout() {
  const d = useDevice();
  return (
    <div {...stylex.props(s.wrap)}>
      <div {...stylex.props(s.card)}>
        <strong {...stylex.props(s.big)}>{d.device.toUpperCase()}</strong>
        <span {...stylex.props(s.mono)}>
          width {d.width}px · scale {d.scale.toFixed(2)}× · {d.isTouch ? 'touch' : 'pointer'} · {d.isHandheld ? 'handheld' : 'desktop'}
        </span>
        <span {...stylex.props(s.hint)}>Resize with the Viewport toolbar, or force a tier with the Device toolbar.</span>
      </div>
      <div {...stylex.props(s.table)}>
        {tiers.map(([t, range, what]) => (
          <div key={t} {...stylex.props(s.row, t === d.device && s.rowOn)}>
            <Badge tone={t === d.device ? 'solidPink' : 'neutral'}>{t}</Badge>
            <span {...stylex.props(s.mono)}>{range}</span>
            <span {...stylex.props(s.what)}>{what}</span>
          </div>
        ))}
      </div>
      {d.isTV && (
        <div {...stylex.props(s.card)}>
          <strong>D-pad test — use the arrow keys, Enter to press</strong>
          <div {...stylex.props(s.grid)}>
            {Array.from({ length: 8 }, (_, i) => (
              <Button key={i} variant={i === 0 ? 'primary' : 'soft'}>Tile {i + 1}</Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const meta = { title: 'Foundations/Devices', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
export const Breakpoints: StoryObj = { render: () => <Readout /> };

const s = stylex.create({
  wrap: { display: 'flex', flexDirection: 'column', gap: 16, fontFamily: fonts.body, color: colors.textPrimary, maxWidth: 960 },
  card: { display: 'flex', flexDirection: 'column', gap: 8, padding: 18, borderRadius: radius.md, borderWidth: 1, borderStyle: 'solid', borderColor: colors.borderSubtle, backgroundColor: colors.surfaceStrong },
  big: { fontFamily: fonts.display, fontSize: { default: 40, [bp.mobile]: 28 } },
  mono: { fontFamily: fonts.mono, fontSize: 12, color: colors.textAccent },
  hint: { fontSize: 13, color: colors.textSecondary },
  table: { display: 'flex', flexDirection: 'column', gap: 6 },
  row: {
    display: 'grid',
    gridTemplateColumns: { default: '90px 200px 1fr', [bp.mobile]: '1fr' },
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceSoft,
  },
  rowOn: { borderColor: colors.pink, backgroundColor: colors.chipPink },
  what: { fontSize: 13, color: colors.textSecondary },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
});
