import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { castRoster } from '../../mocks/data';
import { CastRosterCard } from './CastRosterCard';

const meta = {
  title: 'Cards/CastRosterCard',
  component: CastRosterCard,
  args: { ...castRoster[0], onProfile: fn(), onFollow: fn(), onWatch: fn() },
  argTypes: { photoSrc: { control: 'text' } },
} satisfies Meta<typeof CastRosterCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};
export const OnHiatus: Story = { args: { name: castRoster[5].name, castId: castRoster[5].castId, videoCount: castRoster[5].videoCount, bio: castRoster[5].bio, rankNo: castRoster[5].rankNo, status: 'hiatus' } };
export const WithPhoto: Story = { args: { photoSrc: 'https://picsum.photos/seed/roster/500/702' } };
