import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { sampleVideo } from '../../mocks/data';
import { VideoPlayer } from './VideoPlayer';

const meta = {
  title: 'Media/VideoPlayer',
  component: VideoPlayer,
  parameters: { layout: 'padded' },
  args: {
    ...sampleVideo,
    title: 'Blue Sky Refrain',
    subtitle: 'Season 2 · EP 3 — A Letter Never Sent',
    nextEpisode: { label: 'S2 EP 4', title: 'Summer Festival' },
    audioOptions: ['SUB', 'DUB'],
    audio: 'SUB',
    onNext: fn(),
    onAudioChange: fn(),
    onProgress: fn(),
    onTheaterChange: fn(),
  },
  decorators: [(Story) => <div style={{ maxWidth: 1100, margin: '0 auto' }}><Story /></div>],
} satisfies Meta<typeof VideoPlayer>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Click the player, then try: Space, J/L, ←/→, ↑/↓, M, F, C, T, N. */
export const Episode: Story = {};
/** Starts at 0:20 — inside the intro range, so "Skip Intro" is visible. */
export const SkipIntro: Story = { args: { startTime: 20 } };
/** Resume near the end to see the outro "Next Episode" button and the autoplay countdown. */
export const NearEnd: Story = { args: { startTime: 585, autoNextSeconds: 5 } };
export const Movie: Story = { args: { title: 'Ferris Wheel at Dusk — The Movie', subtitle: '1h 52m', nextEpisode: undefined, audioOptions: undefined, intro: undefined, outro: undefined } };
