import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { CastPolaroid } from './CastPolaroid';

const meta = {
  title: 'Cards/CastPolaroid',
  component: CastPolaroid,
  args: { name: 'Misaki Sakurai', subtitle: '— 128 videos · 2.4M views —', rank: '#1', tape: true, tilt: 0, onClick: fn() },
  argTypes: { photoSrc: { control: 'text' }, tilt: { control: { type: 'range', min: -8, max: 8 } } },
  decorators: [(Story) => <div style={{ paddingTop: 16 }}><Story /></div>],
} satisfies Meta<typeof CastPolaroid>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Tilted: Story = { args: { tilt: -4, rank: undefined } };
export const WithPhoto: Story = { args: { photoSrc: 'https://picsum.photos/seed/cast/500/702' } };
