import type { Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import { ThemeProvider, type ThemeMode } from '../src/components/ThemeProvider/ThemeProvider';
import type { ReducedMotionMode } from '../src/motion/motion';
import { DeviceProvider, type Device } from '../src/device/device';
import '../src/global.css';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    controls: { matchers: { color: /(background|color)$/i } },
    backgrounds: { disable: true },
    viewport: {
      options: {
        mobile: { name: 'Mobile — iPhone 15 (390×844)', styles: { width: '390px', height: '844px' }, type: 'mobile' },
        mobileSmall: { name: 'Mobile S — 360×740', styles: { width: '360px', height: '740px' }, type: 'mobile' },
        tablet: { name: 'Tablet — iPad Air (820×1180)', styles: { width: '820px', height: '1180px' }, type: 'tablet' },
        tabletLandscape: { name: 'Tablet landscape (1180×820)', styles: { width: '1180px', height: '820px' }, type: 'tablet' },
        laptop: { name: 'Laptop (1366×768)', styles: { width: '1366px', height: '768px' }, type: 'desktop' },
        pc: { name: 'PC — Full HD (1920×1080)', styles: { width: '1920px', height: '1080px' }, type: 'desktop' },
        tv: { name: 'TV — 4K (3840×2160)', styles: { width: '3840px', height: '2160px' }, type: 'other' },
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'system', title: 'System', icon: 'browser' },
        ],
        dynamicTitle: true,
      },
    },
    device: {
      description: 'Force a device tier (TV turns on 10-foot scaling + D-pad navigation)',
      toolbar: {
        title: 'Device',
        icon: 'mobile',
        items: [
          { value: 'auto', title: 'Auto (from width)' },
          { value: 'mobile', title: 'Mobile' },
          { value: 'tablet', title: 'Tablet' },
          { value: 'laptop', title: 'Laptop' },
          { value: 'pc', title: 'PC' },
          { value: 'tv', title: 'TV (remote / D-pad)' },
        ],
        dynamicTitle: true,
      },
    },
    motion: {
      description: 'Animation preference',
      toolbar: {
        title: 'Motion',
        icon: 'transfer',
        items: [
          { value: 'user', title: 'Respect OS setting' },
          { value: 'never', title: 'Always animate' },
          { value: 'always', title: 'Reduced motion' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'dark', motion: 'never', device: 'auto' },
  decorators: [
    (Story, ctx) => {
      const mode = (ctx.globals.theme ?? 'dark') as ThemeMode;
      const dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
      useEffect(() => {
        document.body.style.backgroundColor = dark ? '#0b1020' : '#fff5f7';
      }, [dark]);
      const fullscreen = ctx.parameters.layout === 'fullscreen';
      const device = ctx.globals.device && ctx.globals.device !== 'auto' ? (ctx.globals.device as Device) : undefined;
      return (
        <DeviceProvider force={device}>
        <ThemeProvider mode={mode} reducedMotion={(ctx.globals.motion ?? 'never') as ReducedMotionMode}>
          <div style={fullscreen ? undefined : { padding: 24 }}>
            <Story />
          </div>
        </ThemeProvider>
        </DeviceProvider>
      );
    },
  ],
};

export default preview;
