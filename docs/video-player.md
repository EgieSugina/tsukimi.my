# Video player

```tsx
<VideoPlayer
  title="Blue Sky Refrain"
  subtitle="Season 2 · EP 3 — A Letter Never Sent"
  sources={[
    { label: '1080p', src: 'https://cdn…/ep3-1080.mp4', type: 'video/mp4' },
    { label: '720p', src: 'https://cdn…/ep3-720.mp4', type: 'video/mp4' },
  ]}
  subtitles={[
    { label: 'English', srcLang: 'en', src: '/subs/ep3.en.vtt', default: true },
    { label: 'Bahasa Indonesia', srcLang: 'id', src: '/subs/ep3.id.vtt' },
  ]}
  audioOptions={['SUB', 'DUB']} audio={audio} onAudioChange={setAudio}
  intro={{ start: 9, end: 90 }}
  outro={{ start: 1320, end: 1410 }}
  markers={[{ time: 9, label: 'Opening' }, { time: 600, label: 'Part B' }]}
  nextEpisode={{ label: 'S2 EP 4', title: 'Summer Festival' }}
  onNext={goNext}
  startTime={savedPosition}
  onProgress={(t, d) => save(t, d)}
/>
```

## Features

- Quality switch keeps the current position; speeds 0.5×–2×.
- WebVTT subtitles (one active track at a time).
- SUB / DUB toggle — the parent swaps `sources` in `onAudioChange`.
- **Skip Intro** / **Skip Outro → Next Episode** buttons inside the given ranges.
- Chapter markers and the intro range drawn on the seek bar; hover shows time + chapter.
- Autoplay-next countdown (`autoNextSeconds`, `0` disables).
- `onProgress` every ~5s and on pause → resume with `startTime`.
- Picture-in-picture, theater mode (laptop+), fullscreen.

## Keyboard

| Key | Action |
| --- | --- |
| Space / K | play / pause |
| J / L | −10s / +10s |
| ← / → | −5s / +5s |
| ↑ / ↓ | volume |
| M | mute |
| F | fullscreen |
| C | subtitles on/off |
| T | theater mode |
| N | next episode |

## Touch

Tap = show/hide controls · double-tap left/right third = ∓10s · double-tap centre = fullscreen.
On phones PiP, theater, ±10 buttons and the volume slider are hidden (use the device volume).

## Streaming formats

The player uses a native `<video>`. MP4/WebM work everywhere; **HLS (`.m3u8`)** plays natively in
Safari — for other browsers attach [hls.js](https://github.com/video-dev/hls.js) to the video element.

The demo clip and subtitles are in `public/sample/`.
