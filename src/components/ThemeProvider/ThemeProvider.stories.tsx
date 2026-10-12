import type { Meta, StoryObj } from '@storybook/react-vite';
import { CastPolaroid } from '../CastPolaroid/CastPolaroid';
import { Chip } from '../Chip/Chip';
import { VideoCard } from '../VideoCard/VideoCard';
import { videos } from '../../mocks/data';
import { ThemeProvider } from './ThemeProvider';
import { ThemeToggle } from './ThemeToggle';

const meta = {
  title: 'Foundations/Theme',
  component: ThemeProvider,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ThemeProvider>;
export default meta;
type Story = StoryObj<typeof meta>;

const Sample = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>
    <ThemeToggle />
    <div style={{ display: 'flex', gap: 8 }}>
      <Chip label="Romance" active />
      <Chip label="Drama" />
    </div>
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <CastPolaroid name="Misaki Sakurai" subtitle="— 128 videos —" rank="#1" />
      <VideoCard {...videos[0]} />
    </div>
  </div>
);

/** Light and dark side by side (independent of the toolbar setting). */
export const SideBySide: Story = {
  args: { children: null },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <ThemeProvider mode="light"><Sample /></ThemeProvider>
      <ThemeProvider mode="dark"><Sample /></ThemeProvider>
    </div>
  ),
};
