import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { SectionHeader } from './SectionHeader';

const meta = {
  title: 'Components/SectionHeader',
  component: SectionHeader,
  args: { overline: 'Popular actress', title: 'Most-watched cast this week', icon: 'crown', linkLabel: 'See all', onLinkClick: fn() },
  decorators: [(Story) => <div style={{ width: 900 }}><Story /></div>],
} satisfies Meta<typeof SectionHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const PopularActress: Story = {};
export const Trending: Story = { args: { overline: 'Trending now', title: 'Top videos today', icon: 'flame' } };
