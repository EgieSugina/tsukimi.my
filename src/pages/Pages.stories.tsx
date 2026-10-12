import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimeDetailPage, AnimePage, WatchPage, CastDirectoryPage, CategoriesPage, ComicDetailPage, ComicReaderPage, ComicsPage, HomePage, VideoLibraryPage } from './pages';

const meta = {
  title: 'Pages/Web Stream',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Home: Story = { render: () => <HomePage /> };
export const VideoLibrary: Story = { render: () => <VideoLibraryPage /> };
export const CastDirectory: Story = { render: () => <CastDirectoryPage /> };
export const Categories: Story = { render: () => <CategoriesPage /> };
export const Comics: Story = { render: () => <ComicsPage /> };
export const ComicDetail: Story = { render: () => <ComicDetailPage /> };
export const ReaderManga: Story = { name: 'Reader — Manga (paged, RTL)', render: () => <ComicReaderPage format="manga" /> };
export const ReaderManhwa: Story = { name: 'Reader — Manhwa (vertical)', render: () => <ComicReaderPage format="manhwa" /> };
export const Anime: Story = { render: () => <AnimePage /> };
export const AnimeDetail: Story = { render: () => <AnimeDetailPage /> };
export const Watch: Story = { name: 'Watch (video player)', render: () => <WatchPage /> };
