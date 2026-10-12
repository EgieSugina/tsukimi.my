import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Sidebar } from './Sidebar';

const meta = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  parameters: { layout: 'fullscreen' },
  args: { onGenreChange: fn() },
} satisfies Meta<typeof Sidebar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
