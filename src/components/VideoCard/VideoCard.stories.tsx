import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { videos } from '../../mocks/data';
import { VideoCard } from './VideoCard';

const meta = {
  title: 'Cards/VideoCard',
  component: VideoCard,
  args: { ...videos[0], selected: false, onPlay: fn() },
  argTypes: { coverSrc: { control: 'text' } },
} satisfies Meta<typeof VideoCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const WithCoverImage: Story = { args: { coverSrc: 'https://picsum.photos/seed/card/500/702' } };
