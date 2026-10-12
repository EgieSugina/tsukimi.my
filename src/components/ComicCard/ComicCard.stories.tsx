import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { comics } from '../../mocks/data';
import { ComicCard } from './ComicCard';

const meta = {
  title: 'Comics/ComicCard',
  component: ComicCard,
  args: { ...comics[0], onClick: fn() },
  argTypes: { coverSrc: { control: 'text' } },
} satisfies Meta<typeof ComicCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Manga: Story = {};
export const Manhwa: Story = { args: { ...comics[1] } };
export const Manhua: Story = { args: { ...comics[5] } };
export const Completed: Story = { args: { ...comics[3] } };
export const WithCover: Story = { args: { coverSrc: 'https://picsum.photos/seed/manga/500/702' } };
