import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { NavTab } from './NavTab';

const meta = {
  title: 'Components/NavTab',
  component: NavTab,
  args: { label: 'Cast', icon: 'user', active: false, onClick: fn() },
} satisfies Meta<typeof NavTab>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Active: Story = { args: { active: true } };
