// Captures the README / docs screenshots from a running Storybook.
//   npm run storybook            (in another terminal)
//   npm run screenshots          → docs/screenshots/*.jpg
// Env: STORYBOOK_URL (default http://localhost:6006), CHROME_PATH (default: Playwright's bundled
// Chromium, falling back to /usr/bin/google-chrome-stable).
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const OUT = process.argv[2] ?? path.join(__dirname, '..', 'docs', 'screenshots');
const BASE = `${process.env.STORYBOOK_URL ?? 'http://localhost:6006'}/iframe.html`;
fs.mkdirSync(OUT, { recursive: true });

const vp = {
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  tablet: { width: 820, height: 1180, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
  laptop: { width: 1366, height: 768, deviceScaleFactor: 1 },
  pc: { width: 1920, height: 1080, deviceScaleFactor: 1 },
};

// [file, story id, viewport, { theme, device, full, maxHeight, action }]
const shots = [
  ['home-pc', 'pages-web-stream--home', 'pc', { full: true, maxHeight: 2400 }],
  ['home-light-pc', 'pages-web-stream--home', 'pc', { theme: 'light' }],
  ['video-library-laptop', 'pages-web-stream--video-library', 'laptop', { full: true, maxHeight: 1500 }],
  ['cast-directory-pc', 'pages-web-stream--cast-directory', 'pc', {}],
  ['anime-pc', 'pages-web-stream--anime', 'pc', { full: true, maxHeight: 2200 }],
  ['anime-detail-pc', 'pages-web-stream--anime-detail', 'pc', {}],
  ['watch-pc', 'pages-web-stream--watch', 'pc', {}],
  ['comics-pc', 'pages-web-stream--comics', 'pc', {}],
  ['comic-detail-pc', 'pages-web-stream--comic-detail', 'pc', {}],
  ['reader-manga-spread', 'comics-comicreader--manga-double-spread', 'pc', {}],
  ['reader-manhwa-mobile', 'comics-comicreader--manhwa-vertical', 'mobile', {}],
  ['airing-calendar-pc', 'anime-airingcalendar--this-week', 'pc', {}],
  ['seo-optimizer', 'seo-seooptimizer--needs-work', 'laptop', { full: true, maxHeight: 1500 }],
  ['theme-side-by-side', 'foundations-theme--side-by-side', 'pc', {}],
  ['home-mobile', 'pages-web-stream--home', 'mobile', { full: true, maxHeight: 2600 }],
  ['watch-mobile', 'pages-web-stream--watch', 'mobile', {}],
  ['calendar-mobile', 'anime-airingcalendar--this-week', 'mobile', {}],
  ['cast-tablet', 'pages-web-stream--cast-directory', 'tablet', {}],
  ['drawer-tablet', 'pages-web-stream--anime', 'tablet', { action: 'drawer' }],
  ['home-tv', 'pages-web-stream--home', 'pc', { device: 'tv' }],
];

(async () => {
  const executablePath = process.env.CHROME_PATH || (fs.existsSync('/usr/bin/google-chrome-stable') ? '/usr/bin/google-chrome-stable' : undefined);
  const browser = await chromium.launch({ executablePath, args: ['--autoplay-policy=no-user-gesture-required'] });
  for (const [file, id, vpName, opt] of shots) {
    const ctx = await browser.newContext({ viewport: { width: vp[vpName].width, height: vp[vpName].height }, ...vp[vpName], colorScheme: 'dark' });
    const page = await ctx.newPage();
    const globals = [`theme:${opt.theme ?? 'dark'}`, `motion:never`, `device:${opt.device ?? 'auto'}`].join(';');
    await page.goto(`${BASE}?id=${id}&viewMode=story&globals=${globals}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    // scroll through so every whileInView reveal has fired, then back to top
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 400) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    if (opt.action === 'drawer') {
      await page.getByRole('button', { name: 'Open menu' }).click();
    }
    await page.waitForTimeout(1200);
    const target = path.join(OUT, `${file}.jpg`);
    const full = opt.full ? { fullPage: true, clip: undefined } : {};
    if (opt.full && opt.maxHeight) {
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      await page.setViewportSize({ width: vp[vpName].width, height: Math.min(total, opt.maxHeight) });
      await page.waitForTimeout(600);
      await page.screenshot({ path: target, type: 'jpeg', quality: 82 });
    } else {
      await page.screenshot({ path: target, type: 'jpeg', quality: 82, ...full });
    }
    console.log('saved', file);
    await ctx.close();
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
