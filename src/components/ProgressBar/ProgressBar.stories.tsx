import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar } from './ProgressBar';

const meta = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  args: { value: 50.6, height: 5 },
  argTypes: { value: { control: { type: 'range', min: 0, max: 100 } }, color: { control: 'color' } },
  decorators: [(Story) => <div style={{ width: 320 }}><Story /></div>],
} satisfies Meta<typeof ProgressBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Gradient: Story = {};
export const Solid: Story = { args: { value: 86, color: '#f43f5e', height: 4 } };
