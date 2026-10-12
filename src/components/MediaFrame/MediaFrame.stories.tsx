import type { Meta, StoryObj } from '@storybook/react-vite';
import { MediaFrame } from './MediaFrame';

const meta = {
  title: 'Components/MediaFrame (250×351)',
  component: MediaFrame,
  args: { kind: 'cover' },
  argTypes: { src: { control: 'text' } },
} satisfies Meta<typeof MediaFrame>;
export default meta;
type Story = StoryObj<typeof meta>;

export const CoverPlaceholder: Story = {};
export const PhotoPlaceholder: Story = { args: { kind: 'photo' } };
export const WithImage: Story = { args: { src: 'https://picsum.photos/seed/tsukimi/500/702', alt: 'Sample cover' } };
