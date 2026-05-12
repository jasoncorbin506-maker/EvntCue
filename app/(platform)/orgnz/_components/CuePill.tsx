"use client";

import { useTranslations } from "next-intl";
import styles from "../orgnz.module.css";
import { showToast } from "../_lib/toast";

export function CuePill() {
  const t = useTranslations("dashboard");
  return (
    <div className={styles.cuePillWrap}>
      <button
        type="button"
        className={styles.cuePill}
        onClick={() => showToast(t("cueAskToast"))}
        aria-label={t("cuePillAria")}
      >
        <span className={styles.cuePillSpark} />
        <span className={styles.cuePillLabel}>{t("cuePillLabel")}</span>
      </button>
    </div>
  );
}
