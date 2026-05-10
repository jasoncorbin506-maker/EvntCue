"use client";

import { useMemo, useState } from "react";
import styles from "../orgnz.module.css";
import { showToast } from "../_lib/toast";

export type FeedCardKind = "cueSuggest" | "payment" | "vendor" | "cueWarn";

export type FeedCard = {
  id: string;
  kind: FeedCardKind;
  eyebrow: string;
  when: string;
  body: string; // raw HTML — internal copy only
  primaryCta?: { label: string; toast: string };
  secondaryCta?: { label: string; toast: string };
  dismissable?: boolean;
};

const ICONS: Record<FeedCardKind, string> = {
  cueSuggest:
    '<svg viewBox="0 0 24 24" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-4.5-7-10a5 5 0 019-3 5 5 0 019 3c0 5.5-7 10-7 10z"/></svg>',
  payment:
    '<svg viewBox="0 0 24 24" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h2"/></svg>',
  vendor:
    '<svg viewBox="0 0 24 24" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l9 6 9-6M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9-4 9 4"/></svg>',
  cueWarn:
    '<svg viewBox="0 0 24 24" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16v.01"/></svg>',
};

const KIND_CLASS: Record<FeedCardKind, string> = {
  cueSuggest: styles.cueSuggest,
  payment: styles.payment,
  vendor: styles.vendor,
  cueWarn: styles.cueWarn,
};

type Props = { initial: FeedCard[] };

export function Feed({ initial }: Props) {
  const [cards, setCards] = useState(initial);
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());
  const visibleCount = useMemo(
    () => cards.filter((c) => !dismissing.has(c.id)).length,
    [cards, dismissing],
  );

  function dismiss(id: string, toast: string) {
    setDismissing((prev) => new Set(prev).add(id));
    showToast(toast);
    window.setTimeout(() => {
      setCards((prev) => prev.filter((c) => c.id !== id));
      setDismissing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 360);
  }

  if (cards.length === 0) {
    return null;
  }

  return (
    <section className={styles.feed}>
      <div className={styles.feedHead}>
        <span className={styles.feedHeadL}>Needs you now</span>
        <span className={styles.feedHeadR}>
          {visibleCount} item{visibleCount === 1 ? "" : "s"}
        </span>
      </div>
      <div className={styles.feedList}>
        {cards.map((card) => (
          <article
            key={card.id}
            className={`${styles.fcard} ${KIND_CLASS[card.kind]} ${
              dismissing.has(card.id) ? styles.dismissing : ""
            }`}
          >
            <div
              className={styles.fcIco}
              dangerouslySetInnerHTML={{ __html: ICONS[card.kind] }}
            />
            <div className={styles.fcBody}>
              <div className={styles.fcEye}>
                {card.eyebrow}
                <span className={styles.fcEyeWhen}>{card.when}</span>
              </div>
              <p
                className={styles.fcText}
                dangerouslySetInnerHTML={{ __html: card.body }}
              />
              <div className={styles.fcActions}>
                {card.primaryCta && (
                  <button
                    type="button"
                    className={`${styles.fcBtn} ${styles.fcBtnPrimary}`}
                    onClick={() => showToast(card.primaryCta!.toast)}
                  >
                    {card.primaryCta.label}
                  </button>
                )}
                {card.secondaryCta && (
                  <button
                    type="button"
                    className={styles.fcBtn}
                    onClick={() => showToast(card.secondaryCta!.toast)}
                  >
                    {card.secondaryCta.label}
                  </button>
                )}
                {card.dismissable !== false && (
                  <button
                    type="button"
                    className={`${styles.fcBtn} ${styles.fcBtnDismiss}`}
                    onClick={() =>
                      dismiss(card.id, "<em>Got it.</em> Hidden from this event.")
                    }
                  >
                    Not for us
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
