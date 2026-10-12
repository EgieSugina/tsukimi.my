import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { airingNow, airingSchedule } from '../../mocks/data';
import { AiringCalendar } from './AiringCalendar';

const meta = {
  title: 'Anime/AiringCalendar',
  component: AiringCalendar,
  parameters: { layout: 'padded' },
  args: { entries: airingSchedule, now: airingNow, initialDate: airingNow, timeZone: 'Asia/Tokyo', onSelect: fn() },
  argTypes: { timeZone: { control: 'select', options: ['Asia/Tokyo', 'Asia/Jakarta', 'Europe/London', 'America/Los_Angeles'] } },
} satisfies Meta<typeof AiringCalendar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ThisWeek: Story = {};
export const JakartaTime: Story = { args: { timeZone: 'Asia/Jakarta' } };
export const FollowedOnly: Story = { args: { onlyFollowedDefault: true } };
