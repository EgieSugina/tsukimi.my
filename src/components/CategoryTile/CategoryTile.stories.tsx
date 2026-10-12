import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CategoryTile } from './CategoryTile';

const meta = {
  title: 'Components/CategoryTile',
  component: CategoryTile,
  args: { title: 'Drama & Romance', description: 'Story-driven series, love stories & slice of life', icon: 'film', active: false, onClick: fn() },
  decorators: [(Story) => <div style={{ width: 480 }}><Story /></div>],
} satisfies Meta<typeof CategoryTile>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Active: Story = { args: { active: true } };
