import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { mangaChapters, mangaPages, manhwaPages } from '../../mocks/data';
import { ComicReader, type ComicReaderProps } from './ComicReader';

function Stateful(args: ComicReaderProps) {
  const [chapter, setChapter] = useState(args.currentChapterId);
  return <ComicReader {...args} currentChapterId={chapter} onChapterChange={(id) => { setChapter(id); args.onChapterChange?.(id); }} />;
}

const meta = {
  title: 'Comics/ComicReader',
  component: ComicReader,
  parameters: { layout: 'fullscreen' },
  args: {
    comicTitle: 'Blue Sky Refrain',
    format: 'manga',
    chapters: mangaChapters,
    currentChapterId: 'ch-38',
    pages: mangaPages,
    onBack: fn(),
    onChapterChange: fn(),
    onPageChange: fn(),
  },
  render: (args) => <Stateful {...args} />,
} satisfies Meta<typeof ComicReader>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Manga: paged, right-to-left (← goes forward). */
export const MangaPaged: Story = {};
/** Manga with two-page spreads. */
export const MangaDoubleSpread: Story = { args: { initialSpread: 'double', initialMode: 'paged' } };
/** Manhwa / webtoon: continuous vertical scroll. */
export const ManhwaVertical: Story = { args: { comicTitle: 'Rooftop After School', format: 'manhwa', pages: manhwaPages } };
/** Real images (any URL works). */
export const WithImages: Story = {
  args: {
    format: 'manhwa',
    comicTitle: 'Rooftop After School',
    pages: Array.from({ length: 6 }, (_, i) => ({ src: `https://picsum.photos/seed/strip${i}/720/1400`, width: 720, height: 1400 })),
  },
};
