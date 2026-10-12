import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatPill } from './StatPill';

const meta = {
  title: 'Components/StatPill',
  component: StatPill,
  args: { children: 'VIDEOS 12,480', tone: 'rose' },
} satisfies Meta<typeof StatPill>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const AllTones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <StatPill tone="rose">VIDEOS 12,480</StatPill>
      <StatPill tone="indigo">CAST 356</StatPill>
      <StatPill tone="slate">ONLINE 3.2K</StatPill>
      <StatPill tone="amber">★ 4.9</StatPill>
      <StatPill tone="green">LIVE</StatPill>
    </div>
  ),
};
