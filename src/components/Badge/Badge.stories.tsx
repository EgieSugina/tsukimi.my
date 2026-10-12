import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, type BadgeTone } from './Badge';

const tones: BadgeTone[] = ['amber', 'pink', 'rose', 'indigo', 'green', 'neutral', 'dark', 'solidPink', 'solidRed', 'solidIndigo', 'gradient', 'orange', 'emerald'];

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'FULL HD', tone: 'dark', shape: 'pill', size: 'sm' },
  argTypes: { tone: { control: 'select', options: tones } },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllTones: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 520 }}>
      {tones.map((t) => (
        <Badge key={t} {...args} tone={t}>{t}</Badge>
      ))}
    </div>
  ),
};

export const CastTags: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 6 }}>
      <Badge tone="solidPink" icon="heart" shape="tag">Actress</Badge>
      <Badge tone="solidRed" shape="tag">Rank 2</Badge>
      <Badge tone="solidIndigo" shape="tag">SP 1385</Badge>
      <Badge tone="pink" shape="tag">Romance</Badge>
    </div>
  ),
};
