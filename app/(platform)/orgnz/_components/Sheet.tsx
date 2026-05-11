"use client";

import { useEffect } from "react";
import styles from "../orgnz.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  eyebrowAccent?: "rose" | "gold" | "blue" | "coral";
  title: React.ReactNode;
  children: React.ReactNode;
};

const EYE_CLASS: Record<NonNullable<Props["eyebrowAccent"]>, string> = {
  rose: "",
  gold: styles.sheetEyeGold,
  blue: styles.sheetEyeBlue,
  coral: styles.sheetEyeCoral,
};

export function Sheet({ open, onClose, eyebrow, eyebrowAccent = "rose", title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.sheet} role="dialog" aria-modal="true">
      <header className={styles.sheetHead}>
        <button
          type="button"
          className={styles.sheetBack}
          onClick={onClose}
          aria-label="Back"
        >
          ‹
        </button>
        <div className={styles.sheetHeadL}>
          <div className={`${styles.sheetEye} ${EYE_CLASS[eyebrowAccent]}`}>{eyebrow}</div>
          <div className={styles.sheetTitle}>{title}</div>
        </div>
      </header>
      <div className={styles.sheetBody}>{children}</div>
    </div>
  );
}
