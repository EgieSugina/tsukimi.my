import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { mangaChapters } from '../../mocks/data';
import { ChapterList } from './ChapterList';

const meta = {
  title: 'Comics/ChapterList',
  component: ChapterList,
  args: { chapters: mangaChapters, currentId: 'ch-38', maxHeight: 420, onSelect: fn() },
  decorators: [(Story) => <div style={{ width: 640 }}><Story /></div>],
} satisfies Meta<typeof ChapterList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
