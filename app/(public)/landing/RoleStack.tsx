"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import styles from "./landing.module.css";

export function RoleStack() {
  const router = useRouter();
  const t = useTranslations("landing");

  return (
    <div className={styles.stack}>
        <button
          type="button"
          className={`${styles.card} ${styles.cardOrgnz}`}
          onClick={() => router.push("/budget-calculator")}
        >
          <div className={styles.icon}>
            <svg viewBox="0 0 44 44" width="44" height="44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <line x1="22" y1="5"  x2="38" y2="22" stroke="#D4778A" strokeWidth="1" strokeOpacity="0.55" />
              <line x1="38" y1="22" x2="22" y2="39" stroke="#D4778A" strokeWidth="1" strokeOpacity="0.55" />
              <line x1="22" y1="39" x2="6"  y2="22" stroke="#D4778A" strokeWidth="1" strokeOpacity="0.55" />
              <line x1="6"  y1="22" x2="22" y2="5"  stroke="#D4778A" strokeWidth="1" strokeOpacity="0.55" />
              <circle cx="38" cy="22" r="1.7" fill="#D4778A" opacity="0.75" />
              <circle cx="22" cy="39" r="1.7" fill="#D4778A" opacity="0.75" />
              <circle cx="6"  cy="22" r="1.7" fill="#D4778A" opacity="0.75" />
              <circle cx="22" cy="5"  r="3.8" fill="none" stroke="#E8A0B0" strokeWidth="0.8" opacity="0.4" />
              <circle cx="22" cy="5"  r="2.4" fill="#E8A0B0" />
              <circle cx="22" cy="5"  r="1.2" fill="#F9E4EA" />
            </svg>
          </div>
          <div className={styles.text}>
            <div className={styles.name}>{t("orgnzName")}</div>
            <div className={styles.pitch}>{t("orgnzPitch")}</div>
          </div>
          <div className={styles.arrow}>›</div>
        </button>

        <button
          type="button"
          className={`${styles.card} ${styles.cardVndr}`}
          onClick={() => router.push("/vndr-onboarding")}
        >
          <div className={styles.icon}>
            <svg viewBox="0 0 44 44" width="44" height="44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <line x1="22" y1="6"  x2="22" y2="22" stroke="#E8622A" strokeWidth="1.2" strokeOpacity="0.6" />
              <line x1="22" y1="22" x2="10" y2="38" stroke="#E8622A" strokeWidth="1" strokeOpacity="0.55" />
              <line x1="22" y1="22" x2="22" y2="38" stroke="#E8622A" strokeWidth="1" strokeOpacity="0.55" />
              <line x1="22" y1="22" x2="34" y2="38" stroke="#E8622A" strokeWidth="1" strokeOpacity="0.55" />
              <circle cx="10" cy="38" r="1.7" fill="#F5A882" opacity="0.8" />
              <circle cx="22" cy="38" r="1.7" fill="#F5A882" opacity="0.75" />
              <circle cx="34" cy="38" r="1.7" fill="#F5A882" opacity="0.8" />
              <circle cx="22" cy="6"  r="3.8" fill="none" stroke="#E8622A" strokeWidth="0.8" opacity="0.4" />
              <circle cx="22" cy="6"  r="2.4" fill="#E8622A" />
              <circle cx="22" cy="6"  r="1.2" fill="#F5A882" />
            </svg>
          </div>
          <div className={styles.text}>
            <div className={styles.name}>{t("vndrName")}</div>
            <div className={styles.pitch}>{t("vndrPitch")}</div>
          </div>
          <div className={styles.arrow}>›</div>
        </button>

        <button
          type="button"
          className={`${styles.card} ${styles.cardVenu}`}
          onClick={() => router.push("/venues")}
        >
          <div className={styles.icon}>
            <svg viewBox="0 0 44 44" width="44" height="44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <line x1="10" y1="38" x2="10" y2="18" stroke="#2A6BDB" strokeWidth="1" strokeOpacity="0.55" />
              <line x1="34" y1="38" x2="34" y2="18" stroke="#2A6BDB" strokeWidth="1" strokeOpacity="0.55" />
              <polyline points="10,18 12,13 16,9 22,7 28,9 32,13 34,18" fill="none" stroke="#2A6BDB" strokeWidth="1" strokeOpacity="0.55" />
              <line x1="10" y1="26" x2="34" y2="26" stroke="#2A6BDB" strokeWidth="0.8" strokeOpacity="0.35" />
              <circle cx="10" cy="38" r="1.7" fill="#7EB3F5" opacity="0.8" />
              <circle cx="34" cy="38" r="1.7" fill="#7EB3F5" opacity="0.8" />
              <circle cx="22" cy="7"  r="3.8" fill="none" stroke="#2A6BDB" strokeWidth="0.8" opacity="0.4" />
              <circle cx="22" cy="7"  r="2.4" fill="#2A6BDB" />
              <circle cx="22" cy="7"  r="1.2" fill="#7EB3F5" />
            </svg>
          </div>
          <div className={styles.text}>
            <div className={styles.name}>{t("venuName")}</div>
            <div className={styles.pitch}>{t("venuPitch")}</div>
          </div>
          <div className={styles.arrow}>›</div>
        </button>
    </div>
  );
}
