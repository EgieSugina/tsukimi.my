import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchField } from './SearchField';

const meta = {
  title: 'Components/SearchField',
  component: SearchField,
  args: { placeholder: 'Search title, cast or tag…' },
} satisfies Meta<typeof SearchField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
