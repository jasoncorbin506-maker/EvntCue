"use client";

import { useTranslations } from "next-intl";
import styles from "../orgnz.module.css";
import { openCrisis } from "../_lib/sheet";
import { showToast } from "../_lib/toast";

export function HelpBar() {
  const t = useTranslations("dashboard");
  return (
    <nav className={styles.helpBar} aria-label={t("helpAria")}>
      <button
        type="button"
        className={`${styles.hbBtn} ${styles.hbCue}`}
        onClick={() => showToast(t("cueAskToast"))}
      >
        <span className={styles.hbCueSpark} />
        {t("helpAskCue")}
      </button>
      <button
        type="button"
        className={`${styles.hbBtn} ${styles.hbBump}`}
        onClick={() => openCrisis(true)}
      >
        <span className={styles.hbBumpDot} />
        {t("help12Min")}
      </button>
    </nav>
  );
}
