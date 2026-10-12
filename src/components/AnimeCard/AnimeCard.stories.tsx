import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { anime } from '../../mocks/data';
import { AnimeCard } from './AnimeCard';

const meta = {
  title: 'Anime/AnimeCard',
  component: AnimeCard,
  args: { ...anime[0], onClick: fn() },
  argTypes: { coverSrc: { control: 'text' } },
} satisfies Meta<typeof AnimeCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Airing: Story = {};
export const Finished: Story = { args: { ...anime[3] } };
export const Movie: Story = { args: { ...anime[4] } };
export const Upcoming: Story = { args: { ...anime[5] } };
