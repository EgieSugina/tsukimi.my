import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { VideoPoster } from './VideoPoster';

const meta = {
  title: 'Cards/VideoPoster',
  component: VideoPoster,
  args: { title: 'Under the Clear Summer Sky', cast: 'Aoi Kiryu', views: '842K', duration: '48:02', quality: '4K', rank: '#1 Trending', onClick: fn() },
  argTypes: { coverSrc: { control: 'text' } },
} satisfies Meta<typeof VideoPoster>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutRank: Story = { args: { rank: undefined } };
export const WithCoverImage: Story = { args: { coverSrc: 'https://picsum.photos/seed/poster/500/702' } };
export const CoverOnly: Story = { args: { coverOnly: true } };
