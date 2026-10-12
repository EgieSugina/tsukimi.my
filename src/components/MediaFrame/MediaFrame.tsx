import * as stylex from '@stylexjs/stylex';
import { motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { ease } from '../../motion/motion';
import { colors, fonts, gradients, media } from '../../tokens/tokens.stylex';
import { bp } from '../../tokens/breakpoints.stylex';
import { Icon } from '../Icon/Icon';

export interface MediaFrameProps {
  /** Image URL. When missing a pastel placeholder labelled 250 × 351 is shown. */
  src?: string;
  alt?: string;
  /** `cover` = video cover, `photo` = cast profile photo (different placeholder). */
  kind?: 'cover' | 'photo';
  /** Darken the bottom third so overlay pills stay readable. */
  shade?: boolean;
  /** Absolutely positioned overlays (badges, play bar…). */
  children?: ReactNode;
  xstyle?: stylex.StyleXStyles;
}

/** Fixed 250 × 351 image slot shared by video covers and cast profile photos. */
export function MediaFrame({ src, alt = '', kind = 'cover', shade = kind === 'cover', children, xstyle }: MediaFrameProps) {
  const [loadedSrc, setLoadedSrc] = useState<string>();
  const loaded = !!src && loadedSrc === src;
  return (
    <div {...stylex.props(styles.frame, kind === 'cover' ? styles.coverBg : styles.photoBg, xstyle)}>
      {src ? (
        <motion.img
          key={src}
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoadedSrc(src)}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={loaded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45, ease: ease.out }}
          {...stylex.props(styles.img)}
        />
      ) : (
        <div {...stylex.props(styles.placeholder)} aria-hidden>
          <Icon name={kind === 'cover' ? 'image' : 'user'} size={kind === 'cover' ? 32 : 40} />
          <span {...stylex.props(styles.size)}>250 × 351</span>
        </div>
      )}
      {shade && <div {...stylex.props(styles.shade)} aria-hidden />}
      {children}
    </div>
  );
}

const styles = stylex.create({
  frame: {
    position: 'relative',
    flexShrink: 0,
    // 250 × 351 on tablet+; 150 wide on phones — ratio always 250:351
    width: { default: media.coverWidth, [bp.mobile]: '150px' },
    aspectRatio: '250 / 351',
    overflow: 'hidden',
  },
  coverBg: { backgroundImage: gradients.placeholderCover },
  photoBg: { backgroundImage: gradients.placeholderPhoto },
  img: { display: 'block', width: '100%', height: '100%', objectFit: 'cover' },
  placeholder: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    color: colors.textOnDark,
  },
  size: { fontFamily: fonts.mono, fontSize: { default: 14, [bp.mobile]: 11 }, fontWeight: 700 },
  shade: { position: 'absolute', inset: 0, backgroundImage: gradients.coverShade, pointerEvents: 'none' },
});
