import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { TopBar } from './TopBar';

const meta = {
  title: 'Layout/TopBar',
  component: TopBar,
  parameters: { layout: 'fullscreen' },
  args: { activeNav: 'home', onNavigate: fn() },
  argTypes: { activeNav: { control: 'select', options: ['home', 'videos', 'cast', 'genres', 'categories'] } },
} satisfies Meta<typeof TopBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Interactive: Story = {
  render: (args) => {
    const [active, setActive] = useState('home');
    return <TopBar {...args} activeNav={active} onNavigate={setActive} />;
  },
};
