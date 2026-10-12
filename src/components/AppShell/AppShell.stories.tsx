import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppShell } from './AppShell';

const meta = {
  title: 'Layout/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' },
  args: {
    children: <div style={{ padding: 24, border: '2px dashed #fbcfe8', borderRadius: 16, color: '#be185d' }}>Page content</div>,
  },
} satisfies Meta<typeof AppShell>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithoutSidebar: Story = { args: { hideSidebar: true } };
