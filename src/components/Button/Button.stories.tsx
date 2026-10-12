import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { iconNames } from '../Icon/Icon';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Watch Now', variant: 'primary', size: 'md', icon: 'play', onClick: fn() },
  argTypes: { icon: { control: 'select', options: [undefined, ...iconNames] } },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary', icon: 'heart', children: 'Add to Favorites' } };
export const Ghost: Story = {
  args: { variant: 'ghost', icon: 'chevronRight', children: 'See all' },
  globals: { backgrounds: { value: 'night' } },
};
export const Disabled: Story = { args: { disabled: true } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, padding: 16, background: '#334155', borderRadius: 12 }}>
      <Button icon="play">Primary</Button>
      <Button variant="secondary" icon="heart">Secondary</Button>
      <Button variant="ghost" icon="chevronRight">Ghost</Button>
      <Button variant="outline" size="sm" icon="user">Outline</Button>
      <Button variant="soft" size="sm" icon="heart">Soft</Button>
      <Button variant="danger" size="sm" icon="crown">Danger</Button>
    </div>
  ),
};
