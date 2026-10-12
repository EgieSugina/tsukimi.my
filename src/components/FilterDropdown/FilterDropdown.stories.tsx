import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FilterDropdown } from './FilterDropdown';

const meta = {
  title: 'Components/FilterDropdown',
  component: FilterDropdown,
  args: { options: ['All Genres', 'Romance', 'Drama', 'School Life'], icon: 'tag', highlighted: false, onChange: fn() },
  decorators: [(Story) => <div style={{ width: 240 }}><Story /></div>],
} satisfies Meta<typeof FilterDropdown>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SortHighlighted: Story = {
  args: { options: ['Sort: Most Viewed', 'Sort: Newest', 'Sort: Top Rated'], icon: 'flame', highlighted: true },
};
