import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, iconNames } from './Icon';

const meta = {
  title: 'Foundations/Icon',
  component: Icon,
  args: { name: 'heart', size: 24 },
  argTypes: { name: { control: 'select', options: iconNames } },
} satisfies Meta<typeof Icon>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllIcons: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 96px)', gap: 16, color: '#be185d' }}>
      {iconNames.map((n) => (
        <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontSize: 11, color: '#475569' }}>
          <span style={{ color: '#ec4899' }}><Icon name={n} size={24} /></span>
          {n}
        </div>
      ))}
    </div>
  ),
};
