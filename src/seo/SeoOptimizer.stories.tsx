import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { seoPresets } from '../mocks/seo';
import { SeoOptimizer } from './SeoOptimizer';

const meta = {
  title: 'SEO/SeoOptimizer',
  component: SeoOptimizer,
  parameters: { layout: 'padded' },
  args: { initialMeta: seoPresets.comicSeries, pathPrefix: '/comics/', initialSlug: 'blue-sky-refrain', h1Count: 1, onChange: fn() },
} satisfies Meta<typeof SeoOptimizer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ComicSeries: Story = {};
export const ComicChapter: Story = { args: { initialMeta: seoPresets.comicChapter, initialSlug: 'blue-sky-refrain/chapter-38' } };
export const VideoEpisode: Story = { args: { initialMeta: seoPresets.video, pathPrefix: '/videos/', initialSlug: 'summer-rooftop-confession-ep-3' } };
export const CastProfile: Story = { args: { initialMeta: seoPresets.cast, pathPrefix: '/cast/', initialSlug: 'misaki-sakurai' } };
/** Weak metadata — shows warnings and suggested fixes. */
export const NeedsWork: Story = { args: { initialMeta: seoPresets.needsWork, pathPrefix: '/videos/', initialSlug: 'Episode_2 FINAL', h1Count: 0 } };
