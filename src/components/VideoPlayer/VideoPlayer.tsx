import * as stylex from '@stylexjs/stylex';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ease, pop, spring } from '../../motion/motion';
import { useDevice } from '../../device/device';
import { bp } from '../../tokens/breakpoints.stylex';
import { fonts, gradients, radius, shadows } from '../../tokens/tokens.stylex';
import { Icon, type IconName } from '../Icon/Icon';

export interface VideoSource {
  /** "1080p", "720p", "Auto" … */
  label: string;
  src: string;
  type?: string;
}

export interface SubtitleTrack {
  label: string;
  /** BCP-47, e.g. "en", "id", "ja" */
  srcLang: string;
  /** WebVTT file */
  src: string;
  default?: boolean;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface NextEpisodeInfo {
  title: string;
  /** e.g. "EP 4" */
  label: string;
  thumbnailSrc?: string;
}

export interface VideoPlayerProps {
  /** One source per quality. First one is the default. */
  sources: VideoSource[];
  poster?: string;
  title?: string;
  /** e.g. "Season 1 · EP 3 — The Aquarium" */
  subtitle?: string;
  subtitles?: SubtitleTrack[];
  /** Audio versions (SUB / DUB). Switching calls `onAudioChange` — swap `sources` from the parent. */
  audioOptions?: string[];
  audio?: string;
  onAudioChange?: (audio: string) => void;
  /** Shows a "Skip Intro" button inside the range. Seconds. */
  intro?: TimeRange;
  /** Shows a "Skip Outro / Next" button inside the range. Seconds. */
  outro?: TimeRange;
  /** Chapter markers drawn on the seek bar. */
  markers?: { time: number; label: string }[];
  nextEpisode?: NextEpisodeInfo;
  onNext?: () => void;
  /** Seconds of countdown before auto-playing the next episode. 0 disables autoplay. */
  autoNextSeconds?: number;
  /** Resume position in seconds. */
  startTime?: number;
  autoPlay?: boolean;
  /** Fires every ~5s and on pause — persist watch progress here. */
  onProgress?: (seconds: number, duration: number) => void;
  onTheaterChange?: (theater: boolean) => void;
  xstyle?: stylex.StyleXStyles;
}

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

function fmt(t: number) {
  if (!Number.isFinite(t)) return '0:00';
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * HTML5 video player for episodes & movies.
 * Keys: Space/K play · J/L ∓10s · ←/→ ∓5s · ↑/↓ volume · M mute · F fullscreen · C captions · T theater · N next.
 * For HLS (.m3u8) attach hls.js to the exposed <video> or use a browser with native HLS.
 */
export function VideoPlayer({
  sources,
  poster,
  title,
  subtitle,
  subtitles = [],
  audioOptions,
  audio,
  onAudioChange,
  intro,
  outro,
  markers = [],
  nextEpisode,
  onNext,
  autoNextSeconds = 8,
  startTime = 0,
  autoPlay = false,
  onProgress,
  onTheaterChange,
  xstyle,
}: VideoPlayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | undefined>(undefined);
  const lastReport = useRef(0);
  const { isTouch, device } = useDevice();
  const lastTap = useRef<{ t: number; x: number }>({ t: 0, x: 0 });
  const tapTimer = useRef<number | undefined>(undefined);
  const pointerType = useRef<string>('mouse');

  const [quality, setQuality] = useState(sources[0]?.label);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(startTime);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [captions, setCaptions] = useState<string | null>(subtitles.find((s) => s.default)?.srcLang ?? null);
  const [fullscreen, setFullscreen] = useState(false);
  const [theater, setTheater] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [menu, setMenu] = useState<null | 'settings' | 'captions'>(null);
  const [hover, setHover] = useState<{ x: number; t: number } | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState<{ icon: IconName; text?: string; key: number } | null>(null);
  const [waiting, setWaiting] = useState(false);

  const src = sources.find((s) => s.label === quality) ?? sources[0];
  const v = () => videoRef.current;

  /* ---------- actions ---------- */
  const showFlash = (icon: IconName, text?: string) => setFlash({ icon, text, key: Date.now() });
  const togglePlay = useCallback(() => {
    const el = v();
    if (!el) return;
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  }, []);
  const seekBy = useCallback((d: number) => {
    const el = v();
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + d));
    showFlash(d > 0 ? 'forward' : 'rewind', `${d > 0 ? '+' : ''}${d}s`);
  }, []);
  const seekTo = (t: number) => {
    const el = v();
    if (el) el.currentTime = t;
  };
  const setVol = useCallback((val: number) => {
    const el = v();
    if (!el) return;
    el.volume = Math.max(0, Math.min(1, val));
    el.muted = el.volume === 0;
  }, []);
  const toggleMute = useCallback(() => {
    const el = v();
    if (el) el.muted = !el.muted;
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.();
  }, []);
  const toggleTheater = useCallback(() => {
    setTheater((t) => {
      onTheaterChange?.(!t);
      return !t;
    });
  }, [onTheaterChange]);
  const togglePip = async () => {
    const el = v();
    if (!el) return;
    if (document.pictureInPictureElement) await document.exitPictureInPicture();
    else await el.requestPictureInPicture?.().catch(() => {});
  };
  const toggleCaptions = useCallback(() => {
    setCaptions((c) => (c ? null : subtitles[0]?.srcLang ?? null));
  }, [subtitles]);
  const goNext = useCallback(() => {
    setCountdown(null);
    onNext?.();
  }, [onNext]);

  /* ---------- quality switch keeps position ---------- */
  const changeQuality = (label: string) => {
    const el = v();
    const t = el?.currentTime ?? 0;
    const wasPlaying = el ? !el.paused : false;
    setQuality(label);
    setMenu(null);
    requestAnimationFrame(() => {
      const nv = v();
      if (!nv) return;
      const restore = () => {
        nv.currentTime = t;
        if (wasPlaying) void nv.play().catch(() => {});
        nv.removeEventListener('loadedmetadata', restore);
      };
      nv.addEventListener('loadedmetadata', restore);
    });
  };

  /* ---------- captions: show only the selected track ---------- */
  const applyCaptions = useCallback(() => {
    const el = v();
    if (!el) return;
    for (const tt of Array.from(el.textTracks)) tt.mode = tt.language === captions ? 'showing' : 'disabled';
  }, [captions]);
  useEffect(() => {
    applyCaptions();
    // <track default> can flip itself back on after load — re-apply when tracks change
    const tracks = v()?.textTracks;
    tracks?.addEventListener('change', applyCaptions);
    tracks?.addEventListener('addtrack', applyCaptions);
    return () => {
      tracks?.removeEventListener('change', applyCaptions);
      tracks?.removeEventListener('addtrack', applyCaptions);
    };
  }, [applyCaptions, src?.src]);

  useEffect(() => {
    const el = v();
    if (el) el.playbackRate = rate;
  }, [rate, src?.src]);

  /* ---------- fullscreen state ---------- */
  useEffect(() => {
    const onFs = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  /* ---------- auto-hide controls ---------- */
  const poke = useCallback(() => {
    setControlsVisible(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (!v()?.paused) {
        setControlsVisible(false);
        setMenu(null);
      }
    }, 2600);
  }, []);
  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  /* ---------- next-episode countdown ---------- */
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      goNext();
      return;
    }
    const id = window.setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [countdown, goNext]);

  /* ---------- keyboard ---------- */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('input, select, button[role="menuitemradio"]')) return;
    const k = e.key.toLowerCase();
    const map: Record<string, () => void> = {
      ' ': togglePlay,
      k: togglePlay,
      j: () => seekBy(-10),
      l: () => seekBy(10),
      arrowleft: () => seekBy(-5),
      arrowright: () => seekBy(5),
      arrowup: () => {
        setVol((v()?.volume ?? 1) + 0.1);
        showFlash('volume', `${Math.round(Math.min(1, (v()?.volume ?? 1)) * 100)}%`);
      },
      arrowdown: () => {
        setVol((v()?.volume ?? 1) - 0.1);
        showFlash('volume', `${Math.round(Math.max(0, (v()?.volume ?? 1)) * 100)}%`);
      },
      m: toggleMute,
      f: toggleFullscreen,
      c: toggleCaptions,
      t: toggleTheater,
      n: () => nextEpisode && goNext(),
    };
    const fn = map[k];
    if (fn) {
      e.preventDefault();
      fn();
      poke();
    }
  };

  /* ---------- seek bar ---------- */
  const timeAt = (clientX: number) => {
    const r = barRef.current!.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    return { x: ratio * r.width, t: ratio * duration };
  };
  const onBarPointer = (e: React.PointerEvent) => {
    if (!duration) return;
    const h = timeAt(e.clientX);
    setHover(h);
    if (e.type === 'pointerdown' || e.buttons === 1) seekTo(h.t);
  };

  const inIntro = intro && time >= intro.start && time < intro.end;
  const inOutro = outro && time >= outro.start && time < outro.end;
  const pct = (t: number) => `${duration ? (t / duration) * 100 : 0}%`;
  const VolIcon: IconName = muted || volume === 0 ? 'volumeMute' : 'volume';
  const hoverMarker = hover && markers.filter((m) => m.time <= hover.t).at(-1);

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="region"
      data-own-arrows=""
      aria-label={title ? `Video player: ${title}` : 'Video player'}
      onKeyDown={onKeyDown}
      onPointerMove={poke}
      onPointerLeave={() => playing && setControlsVisible(false)}
      {...stylex.props(styles.root, theater && styles.theater, fullscreen && styles.fullscreen, !controlsVisible && styles.hideCursor, xstyle)}
    >
      <video
        ref={videoRef}
        key={src?.src}
        poster={poster}
        autoPlay={autoPlay}
        playsInline
        preload="metadata"
        onPointerDown={(e) => {
          pointerType.current = e.pointerType;
        }}
        onClick={(e) => {
          if (pointerType.current !== 'touch' && !isTouch) return togglePlay();
          // touch: 1 tap = show/hide controls, 2 taps on the left/right third = seek ∓10s
          const r = e.currentTarget.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const now = Date.now();
          if (now - lastTap.current.t < 300) {
            window.clearTimeout(tapTimer.current);
            lastTap.current.t = 0;
            if (x < 0.35) seekBy(-10);
            else if (x > 0.65) seekBy(10);
            else toggleFullscreen();
            return;
          }
          lastTap.current = { t: now, x };
          tapTimer.current = window.setTimeout(() => {
            if (controlsVisible && playing) setControlsVisible(false);
            else poke();
          }, 260);
        }}
        onDoubleClick={() => pointerType.current !== 'touch' && !isTouch && toggleFullscreen()}
        onPlay={() => {
          setPlaying(true);
          poke();
        }}
        onPause={() => {
          setPlaying(false);
          setControlsVisible(true);
          onProgress?.(v()?.currentTime ?? 0, v()?.duration ?? 0);
        }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          if (startTime && e.currentTarget.currentTime === 0) e.currentTarget.currentTime = startTime;
        }}
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          setTime(el.currentTime);
          if (el.buffered.length) setBuffered(el.buffered.end(el.buffered.length - 1));
          if (Math.abs(el.currentTime - lastReport.current) >= 5) {
            lastReport.current = el.currentTime;
            onProgress?.(el.currentTime, el.duration);
          }
        }}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
        onEnded={() => {
          setPlaying(false);
          if (nextEpisode && autoNextSeconds > 0) setCountdown(autoNextSeconds);
        }}
        {...stylex.props(styles.video)}
      >
        {src && <source src={src.src} type={src.type} />}
        {subtitles.map((s) => (
          <track key={s.srcLang} kind="subtitles" src={s.src} srcLang={s.srcLang} label={s.label} />
        ))}
      </video>

      {/* center states */}
      <AnimatePresence>
        {!playing && countdown === null && (
          <motion.button
            key="big-play"
            type="button"
            aria-label="Play"
            onClick={togglePlay}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.4, transition: { duration: 0.2 } }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={spring.snappy}
            {...stylex.props(styles.bigPlay)}
            style={{ x: '-50%', y: '-50%' }}
          >
            <Icon name="play" size={34} />
          </motion.button>
        )}
      </AnimatePresence>
      {waiting && playing && <span {...stylex.props(styles.spinner)} aria-label="Loading" />}
      {flash && (
        <motion.span
          key={flash.key}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.85, 1, 1, 1.05] }}
          transition={{ duration: 0.7, times: [0, 0.2, 0.7, 1] }}
          {...stylex.props(styles.flash)}
          style={{ x: '-50%', y: '-50%' }}
        >
          <Icon name={flash.icon} size={22} />
          {flash.text}
        </motion.span>
      )}

      {/* top gradient + title */}
      <motion.div
        initial={false}
        animate={controlsVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: ease.out }}
        {...stylex.props(styles.top, !controlsVisible && styles.noPointer)}
      >
        {title && <span {...stylex.props(styles.title)}>{title}</span>}
        {subtitle && <span {...stylex.props(styles.subtitle)}>{subtitle}</span>}
      </motion.div>

      {/* skip buttons */}
      <AnimatePresence>
        {(inIntro || inOutro) && (
          <motion.button
            key={inIntro ? 'skip-intro' : 'skip-outro'}
            type="button"
            onClick={() => (inIntro ? seekTo(intro!.end) : nextEpisode ? goNext() : seekTo(outro!.end))}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={spring.soft}
            {...stylex.props(styles.skip)}
          >
            {inIntro ? 'Skip Intro' : nextEpisode ? 'Next Episode' : 'Skip Outro'} <Icon name="skipForward" size={14} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* next episode overlay */}
      <AnimatePresence>
      {countdown !== null && nextEpisode && (
        <motion.div key="next" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} {...stylex.props(styles.nextOverlay)}>
          <span {...stylex.props(styles.nextLabel)}>
            Up next in{' '}
            <motion.span key={countdown} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} {...stylex.props(styles.inline)}>
              {countdown}s
            </motion.span>
          </span>
          <motion.div variants={pop} initial="hidden" animate="show" {...stylex.props(styles.nextCard)}>
            <span {...stylex.props(styles.nextThumb)}>
              {nextEpisode.thumbnailSrc ? <img src={nextEpisode.thumbnailSrc} alt="" {...stylex.props(styles.fill)} /> : nextEpisode.label}
            </span>
            <span {...stylex.props(styles.nextText)}>
              <strong>{nextEpisode.label}</strong>
              <span>{nextEpisode.title}</span>
            </span>
          </motion.div>
          <div {...stylex.props(styles.row)}>
            <button type="button" onClick={() => setCountdown(null)} {...stylex.props(styles.ghostBtn)}>
              Cancel
            </button>
            <button type="button" onClick={goNext} {...stylex.props(styles.primaryBtn)}>
              <Icon name="play" size={14} /> Play now
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* bottom controls */}
      <motion.div
        initial={false}
        animate={controlsVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: 0.25, ease: ease.out }}
        {...stylex.props(styles.bottom, !controlsVisible && styles.noPointer)}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={barRef}
          role="slider"
          tabIndex={-1}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${fmt(time)} of ${fmt(duration)}`}
          onPointerDown={onBarPointer}
          onPointerMove={onBarPointer}
          onPointerLeave={() => setHover(null)}
          {...stylex.props(styles.bar)}
        >
          <span {...stylex.props(styles.track)}>
            <span {...stylex.props(styles.buffered, dyn.width(pct(buffered)))} />
            {intro && <span {...stylex.props(styles.introRange, dyn.left(pct(intro.start)), dyn.width(pct(intro.end - intro.start)))} />}
            <span {...stylex.props(styles.played, dyn.width(pct(time)))} />
            {markers.map((m) => (
              <span key={m.time} {...stylex.props(styles.marker, dyn.left(pct(m.time)))} />
            ))}
          </span>
          <span {...stylex.props(styles.thumb, dyn.left(pct(time)))} />
          {hover && (
            <span {...stylex.props(styles.tooltip, dyn.leftPx(hover.x))}>
              {hoverMarker && <span {...stylex.props(styles.tooltipLabel)}>{hoverMarker.label}</span>}
              {fmt(hover.t)}
            </span>
          )}
        </div>

        <div {...stylex.props(styles.controls)}>
          <CtrlBtn icon={playing ? 'pause' : 'play'} label={playing ? 'Pause (K)' : 'Play (K)'} onClick={togglePlay} />
          {device !== 'mobile' && <CtrlBtn icon="rewind" label="Back 10s (J)" onClick={() => seekBy(-10)} />}
          {device !== 'mobile' && <CtrlBtn icon="forward" label="Forward 10s (L)" onClick={() => seekBy(10)} />}
          {nextEpisode && <CtrlBtn icon="skipForward" label={`Next: ${nextEpisode.label} (N)`} onClick={goNext} />}
          <div {...stylex.props(styles.volume)}>
            <CtrlBtn icon={VolIcon} label="Mute (M)" onClick={toggleMute} />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => setVol(Number(e.target.value))}
              aria-label="Volume"
              {...stylex.props(styles.volSlider)}
            />
          </div>
          <span {...stylex.props(styles.time)}>
            {fmt(time)} / {fmt(duration)}
          </span>
          <span {...stylex.props(styles.grow)} />

          {audioOptions && audioOptions.length > 1 && (
            <div role="radiogroup" aria-label="Audio" {...stylex.props(styles.audio)}>
              {audioOptions.map((a) => (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={a === audio}
                  onClick={() => onAudioChange?.(a)}
                  {...stylex.props(styles.audioBtn, a === audio && styles.audioActive)}
                >
                  {a}
                </button>
              ))}
            </div>
          )}

          {subtitles.length > 0 && (
            <div {...stylex.props(styles.menuWrap)}>
              <CtrlBtn icon="captions" label="Subtitles (C)" active={!!captions} onClick={() => setMenu((m) => (m === 'captions' ? null : 'captions'))} />
              <AnimatePresence>
              {menu === 'captions' && (
                <Menu title="Subtitles">
                  <MenuItem checked={!captions} onClick={() => { setCaptions(null); setMenu(null); }}>Off</MenuItem>
                  {subtitles.map((s) => (
                    <MenuItem key={s.srcLang} checked={captions === s.srcLang} onClick={() => { setCaptions(s.srcLang); setMenu(null); }}>
                      {s.label}
                    </MenuItem>
                  ))}
                </Menu>
              )}
              </AnimatePresence>
            </div>
          )}

          <div {...stylex.props(styles.menuWrap)}>
            <CtrlBtn icon="settings" label="Settings" active={menu === 'settings'} onClick={() => setMenu((m) => (m === 'settings' ? null : 'settings'))} />
            <AnimatePresence>
            {menu === 'settings' && (
              <Menu title="Settings">
                <span {...stylex.props(styles.menuSection)}>Quality</span>
                {sources.map((s) => (
                  <MenuItem key={s.label} checked={s.label === src?.label} onClick={() => changeQuality(s.label)}>
                    {s.label}
                  </MenuItem>
                ))}
                <span {...stylex.props(styles.menuSection)}>Speed</span>
                <div {...stylex.props(styles.speeds)}>
                  {speeds.map((sp) => (
                    <button key={sp} type="button" onClick={() => setRate(sp)} {...stylex.props(styles.speedBtn, sp === rate && styles.speedActive)}>
                      {sp === 1 ? '1×' : `${sp}×`}
                    </button>
                  ))}
                </div>
              </Menu>
            )}
            </AnimatePresence>
          </div>

          {device !== 'mobile' && <CtrlBtn icon="pip" label="Picture in picture" onClick={() => void togglePip()} />}
          {!isTouch && (device === 'laptop' || device === 'pc' || device === 'tv') && (
            <CtrlBtn icon="theater" label="Theater mode (T)" active={theater} onClick={toggleTheater} />
          )}
          <CtrlBtn icon={fullscreen ? 'minimize' : 'maximize'} label="Fullscreen (F)" onClick={toggleFullscreen} />
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- pieces ---------- */

function CtrlBtn({ icon, label, onClick, active }: { icon: IconName; label: string; onClick?: () => void; active?: boolean }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.88 }}
      transition={spring.snappy}
      {...stylex.props(styles.ctrl, active && styles.ctrlActive)}
    >
      <motion.span key={icon} initial={{ opacity: 0, rotate: -30, scale: 0.7 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} transition={spring.snappy} {...stylex.props(styles.inline)}>
        <Icon name={icon} size={20} />
      </motion.span>
    </motion.button>
  );
}

function Menu({ title, children }: { title: string; children: ReactNode }) {
  return (
    <motion.div
      role="menu"
      aria-label={title}
      variants={pop}
      initial="hidden"
      animate="show"
      exit="exit"
      {...stylex.props(styles.menu)}
      style={{ transformOrigin: 'bottom right' }}
    >
      <span {...stylex.props(styles.menuTitle)}>{title}</span>
      {children}
    </motion.div>
  );
}

function MenuItem({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" role="menuitemradio" aria-checked={checked} onClick={onClick} {...stylex.props(styles.menuItem, checked && styles.menuItemOn)}>
      <span {...stylex.props(styles.check)}>{checked && <Icon name="check" size={14} />}</span>
      {children}
    </button>
  );
}

/* ---------- styles ---------- */

const spin = stylex.keyframes({ to: { transform: 'rotate(360deg)' } });

const styles = stylex.create({
  root: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16 / 9',
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: '#000000',
    color: '#ffffff',
    fontFamily: fonts.body,
    outline: { default: 'none', ':focus-visible': '3px solid #ec4899' },
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
    userSelect: 'none',
  },
  theater: { borderRadius: 0, aspectRatio: '21 / 9' },
  fullscreen: { borderRadius: 0, aspectRatio: 'auto' },
  hideCursor: { cursor: 'none' },
  video: { display: 'block', width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000000', '::cue': { backgroundColor: 'rgba(0,0,0,0.6)', fontFamily: fonts.body } },
  fill: { width: '100%', height: '100%', objectFit: 'cover' },
  noPointer: { pointerEvents: 'none' },
  inline: { display: 'inline-flex' },
  grow: { flexGrow: 1 },
  row: { display: 'flex', gap: 10 },

  bigPlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    display: 'inline-flex',
    padding: 22,
    borderRadius: 999,
    borderWidth: 0,
    backgroundImage: gradients.pinkRose,
    color: '#ffffff',
    boxShadow: shadows.glowPink,
    cursor: 'pointer',
  },
  spinner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 48,
    height: 48,
    marginTop: -24,
    marginLeft: -24,
    borderRadius: 999,
    borderWidth: 4,
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.25)',
    borderTopColor: '#ec4899',
    animationName: spin,
    animationDuration: '0.8s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
  flash: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    paddingBlock: 12,
    paddingInline: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    fontFamily: fonts.mono,
    fontWeight: 700,
    pointerEvents: 'none',
  },

  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    paddingTop: 16,
    paddingInline: 20,
    paddingBottom: 40,
    backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.7), transparent)',
  },
  title: { fontFamily: fonts.display, fontSize: { default: 22, [bp.mobile]: 16 }, fontWeight: 700 },
  subtitle: { fontSize: 13, fontWeight: 600, color: '#f9a8d4' },

  skip: {
    position: 'absolute',
    right: 24,
    bottom: { default: 96, [bp.mobile]: 72 },
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    paddingBlock: 10,
    paddingInline: 18,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: { default: 'rgba(15, 23, 42, 0.75)', ':hover': '#ec4899' },
    color: '#ffffff',
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },

  nextOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: 'rgba(11, 16, 32, 0.82)',
    backdropFilter: 'blur(6px)',
  },
  nextLabel: { fontFamily: fonts.mono, fontSize: 14, fontWeight: 700, color: '#f9a8d4' },
  nextCard: { display: 'flex', alignItems: 'center', gap: 14, padding: 10, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.08)' },
  nextThumb: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: { default: 192, [bp.mobile]: 112 },
    aspectRatio: '16 / 9',
    overflow: 'hidden',
    borderRadius: 8,
    backgroundImage: gradients.placeholderCover,
    fontFamily: fonts.mono,
    fontWeight: 700,
  },
  nextText: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 },
  ghostBtn: {
    paddingBlock: 10,
    paddingInline: 18,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
    color: '#ffffff',
    fontFamily: fonts.body,
    fontWeight: 700,
    cursor: 'pointer',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    paddingBlock: 10,
    paddingInline: 18,
    borderRadius: radius.md,
    borderWidth: 0,
    backgroundImage: gradients.primary,
    color: '#ffffff',
    fontFamily: fonts.body,
    fontWeight: 700,
    cursor: 'pointer',
  },

  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    paddingTop: 40,
    paddingInline: 16,
    paddingBottom: 10,
    backgroundImage: 'linear-gradient(0deg, rgba(0,0,0,0.8), transparent)',
  },
  bar: { position: 'relative', height: 18, display: 'flex', alignItems: 'center', cursor: 'pointer', touchAction: 'none' },
  track: {
    position: 'relative',
    width: '100%',
    height: { default: 4, ':hover': 6 },
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    transitionProperty: 'height',
    transitionDuration: '120ms',
  },
  buffered: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: 'rgba(255,255,255,0.35)' },
  introRange: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(251, 191, 36, 0.45)' },
  played: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundImage: gradients.pinkRose },
  marker: { position: 'absolute', top: 0, bottom: 0, width: 3, marginLeft: -1, backgroundColor: 'rgba(0,0,0,0.65)' },
  thumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    boxShadow: '0 0 0 3px rgba(236, 72, 153, 0.3)',
    pointerEvents: 'none',
  },
  tooltip: {
    position: 'absolute',
    bottom: 22,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    paddingBlock: 4,
    paddingInline: 8,
    transform: 'translateX(-50%)',
    borderRadius: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  },
  tooltipLabel: { fontFamily: fonts.body, fontSize: 11, color: '#f9a8d4' },

  controls: { display: 'flex', alignItems: 'center', gap: { default: 4, [bp.mobile]: 0 } },
  ctrl: {
    display: 'inline-flex',
    padding: { default: 7, [bp.mobile]: 6 },
    borderRadius: 10,
    borderWidth: 0,
    backgroundColor: { default: 'transparent', ':hover': 'rgba(255,255,255,0.14)' },
    color: '#ffffff',
    cursor: 'pointer',
  },
  ctrlActive: { color: '#f472b6' },
  volume: { display: 'flex', alignItems: 'center' },
  volSlider: { display: { default: 'block', [bp.touch]: 'none', [bp.mobile]: 'none' }, width: 84, accentColor: '#ec4899', cursor: 'pointer' },
  time: { marginLeft: { default: 8, [bp.mobile]: 2 }, fontFamily: fonts.mono, fontSize: { default: 13, [bp.mobile]: 11 }, fontWeight: 700, whiteSpace: 'nowrap' },
  audio: { display: 'inline-flex', padding: 2, marginRight: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  audioBtn: {
    paddingBlock: 4,
    paddingInline: 10,
    borderRadius: 999,
    borderWidth: 0,
    backgroundColor: 'transparent',
    color: '#e2e8f0',
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },
  audioActive: { backgroundColor: '#ec4899', color: '#ffffff' },
  menuWrap: { position: 'relative' },
  menu: {
    position: 'absolute',
    right: 0,
    bottom: 44,
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 200,
    padding: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(236, 72, 153, 0.35)',
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
  },
  menuTitle: { paddingInline: 8, paddingBlock: 4, fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f9a8d4' },
  menuSection: { paddingInline: 8, paddingTop: 6, fontSize: 11, fontWeight: 700, color: '#94a3b8' },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    paddingBlock: 7,
    paddingInline: 8,
    borderRadius: 8,
    borderWidth: 0,
    backgroundColor: { default: 'transparent', ':hover': 'rgba(255,255,255,0.08)' },
    color: '#e2e8f0',
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: 600,
    textAlign: 'start',
    cursor: 'pointer',
  },
  menuItemOn: { color: '#ffffff' },
  check: { display: 'inline-flex', width: 16, color: '#ec4899' },
  speeds: { display: 'flex', flexWrap: 'wrap', gap: 4, padding: 6 },
  speedBtn: {
    paddingBlock: 5,
    paddingInline: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'transparent',
    color: '#e2e8f0',
    fontFamily: fonts.mono,
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },
  speedActive: { backgroundColor: '#ec4899', borderColor: '#ec4899', color: '#ffffff' },
});

const dyn = stylex.create({
  width: (w: string) => ({ width: w }),
  left: (l: string) => ({ left: l }),
  leftPx: (x: number) => ({ left: x }),
});
