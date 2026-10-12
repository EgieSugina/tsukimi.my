import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { Chip } from './Chip';

const meta = {
  title: 'Components/Chip',
  component: Chip,
  args: { label: 'Romance', active: false, icon: 'tag', onClick: fn() },
} satisfies Meta<typeof Chip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Active: Story = { args: { active: true } };

export const GenreGroup: Story = {
  render: () => {
    const genres = ['All', 'Romance', 'Drama', 'School Life', 'Comedy', 'Idol'];
    const [active, setActive] = useState('All');
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        {genres.map((g) => (
          <Chip key={g} label={g} icon="tag" active={g === active} onClick={() => setActive(g)} />
        ))}
      </div>
    );
  },
};
