"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import styles from "../orgnz.module.css";

type Mode = "planning" | "dayof";

const APP_ID = "orgnz-app";

export function ModeToggle() {
  const t = useTranslations("dashboard");
  const [mode, setMode] = useState<Mode>("planning");

  useEffect(() => {
    const app = document.getElementById(APP_ID);
    if (!app) return;
    if (mode === "dayof") app.classList.add(styles.dayof);
    else app.classList.remove(styles.dayof);
  }, [mode]);

  return (
    <aside className={styles.modeToggle} aria-label={t("modeAria")}>
      <div className={styles.mtLabel}>{t("modeLabel")}</div>
      <button
        type="button"
        className={`${styles.mtBtn} ${mode === "planning" ? styles.mtActive : ""}`}
        onClick={() => setMode("planning")}
      >
        {t("modePlanning")}
      </button>
      <button
        type="button"
        className={`${styles.mtBtn} ${styles.mtDayofBtn} ${mode === "dayof" ? styles.mtActive : ""}`}
        onClick={() => setMode("dayof")}
      >
        {t("modeDayOf")}
      </button>
    </aside>
  );
}
