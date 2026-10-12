import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { animeSeasons } from '../../mocks/data';
import { EpisodeList } from './EpisodeList';

const meta = {
  title: 'Anime/EpisodeList',
  component: EpisodeList,
  args: { seasons: animeSeasons, currentEpisodeId: 's2-ep-3', onSelect: fn(), maxHeight: 560 },
  decorators: [(Story) => <div style={{ width: 760 }}><Story /></div>],
} satisfies Meta<typeof EpisodeList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {};
export const Compact: Story = { args: { variant: 'compact' }, decorators: [(Story) => <div style={{ width: 400 }}><Story /></div>] };
