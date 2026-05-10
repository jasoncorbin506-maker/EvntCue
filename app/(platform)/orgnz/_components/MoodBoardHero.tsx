import Link from "next/link";
import styles from "../dashboard.module.css";

type Props = {
  imageCount: number;
  paletteHex: string[]; // length 0 = empty state, otherwise up to 5
  vibeLabel: string | null;
};

// Default ambient palette for empty state — dark-luxe rose/garden, reads as
// a placeholder until the user adds images and palette extraction runs.
const DEFAULT_SLABS = [
  "linear-gradient(160deg,#180F28,#3A1A2A)",
  "linear-gradient(160deg,#0F1A14,#2A3A22)",
  "linear-gradient(160deg,#280F18,#5A2030)",
  "linear-gradient(160deg,#0A1A1A,#1A3030)",
  "linear-gradient(160deg,#1A0A18,#3A1828)",
  "linear-gradient(160deg,#1A1208,#3A2418)",
];

export function MoodBoardHero({ imageCount, paletteHex, vibeLabel }: Props) {
  const isEmpty = imageCount === 0;
  const eyebrow = vibeLabel
    ? `Mood Board · ${vibeLabel}`
    : "Mood Board · Not started yet";
  const title = isEmpty ? "Start your visual brief." : "Your visual brief.";
  const paletteLabel = isEmpty
    ? "Add 5+ images to extract your palette"
    : `Your palette · ${imageCount} ${imageCount === 1 ? "image" : "images"} added`;

  return (
    <div className={styles.mbHero}>
      <div className={styles.mbBg}>
        {DEFAULT_SLABS.map((bg, i) => (
          <div key={i} className={styles.mbBgSlab} style={{ background: bg }} />
        ))}
      </div>
      <div className={styles.mbOverlay} />
      <div className={styles.mbOverlayB} />
      <div className={styles.mbContent}>
        <p className={styles.mbEye}>{eyebrow}</p>
        <h2 className={styles.mbTitle}>{title}</h2>
        <div className={styles.mbPalette}>
          {isEmpty
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={styles.mbPaletteEmpty} />
              ))
            : paletteHex.slice(0, 5).map((hex, i) => (
                <div
                  key={i}
                  className={styles.mbSwatch}
                  style={{ background: hex }}
                />
              ))}
          <span className={styles.mbPaletteLabel}>{paletteLabel}</span>
        </div>
        <div className={styles.mbActions}>
          <Link
            href="/orgnz/mood-board"
            className={`${styles.mbBtn} ${styles.mbBtnPrimary}`}
          >
            {isEmpty ? "+ Start with images" : "+ Add images"}
          </Link>
          <Link
            href="/orgnz/mood-board"
            className={`${styles.mbBtn} ${styles.mbBtnGhost}`}
          >
            Full board →
          </Link>
        </div>
      </div>
      {isEmpty ? (
        <Link
          href="/orgnz/mood-board"
          className={styles.mbThumbAdd}
          aria-label="Add images"
          style={{ position: "absolute", right: 28, bottom: 24, zIndex: 3 }}
        >
          +
        </Link>
      ) : null}
    </div>
  );
}
