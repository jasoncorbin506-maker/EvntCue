"use client";

import { useEffect, useState } from "react";
import styles from "../orgnz.module.css";
import { onPadrinoChange, openPadrino } from "../_lib/sheet";
import { showToast } from "../_lib/toast";

type Earmark =
  | "event"
  | "venue"
  | "florals"
  | "dress"
  | "catering"
  | "music"
  | "honeymoon";

const EARMARKS: { value: Earmark; label: string }[] = [
  { value: "event", label: "Whole event" },
  { value: "venue", label: "Venu" },
  { value: "florals", label: "Florals" },
  { value: "dress", label: "Dress" },
  { value: "catering", label: "Catering" },
  { value: "music", label: "Music" },
  { value: "honeymoon", label: "Honeymoon" },
];

const AMOUNTS: { value: string; label: string; custom?: boolean }[] = [
  { value: "250", label: "$250" },
  { value: "500", label: "$500" },
  { value: "1000", label: "$1,000" },
  { value: "2500", label: "$2,500" },
  { value: "open", label: "They choose", custom: true },
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 16);
}

function randomCode(): string {
  return Math.random().toString(36).substring(2, 8);
}

export function PadrinoModal() {
  const [open, setOpen] = useState(false);
  useEffect(() => onPadrinoChange(setOpen), []);
  if (!open) return null;
  return <PadrinoCard />;
}

/**
 * Form state lives here so each open mounts a fresh card — no stale resultLink
 * or pre-filled fields from the previous open.
 */
function PadrinoCard() {
  const [name, setName] = useState("");
  const [earmark, setEarmark] = useState<Earmark>("event");
  const [amount, setAmount] = useState<string>("1000");
  const [note, setNote] = useState("");
  const [resultLink, setResultLink] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") openPadrino(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  function generate() {
    if (!name.trim()) {
      showToast("<em>Tell Cue who it&rsquo;s for.</em>");
      return;
    }
    void earmark; // earmark + amount + note encoded onto the real link in Phase 4
    void amount;
    void note;
    setResultLink(`evntcue.com/give/${slugify(name)}-${randomCode()}`);
  }

  function backdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) openPadrino(false);
  }

  return (
    <div className={styles.padrinoModal} onClick={backdropClick}>
      <div className={styles.padrinoCard}>
        <div className={styles.padrinoHandle} />
        <div className={styles.padrinoEye}>A note from Cue</div>
        <h2 className={styles.padrinoTitle}>
          Invite a <em>contribution</em>
        </h2>
        <p className={styles.padrinoSub}>
          Send Padrino, grandparents, or family a private link. They pay through Stripe — <em>their gift lands in your event escrow</em>, earmarked however they choose.
        </p>

        <div className={styles.pf}>
          <div className={styles.pfL}>Who&rsquo;s contributing?</div>
          <input
            className={styles.pfInput}
            type="text"
            placeholder="Padrino Mateo · Abuela Rosa · Tía Lupita"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.pf}>
          <div className={styles.pfL}>
            Where it goes <span className={styles.pfLHint}>— optional</span>
          </div>
          <div className={styles.pillRow}>
            {EARMARKS.map((em) => (
              <button
                key={em.value}
                type="button"
                className={`${styles.pillBtn} ${earmark === em.value ? styles.pillOn : ""}`}
                onClick={() => setEarmark(em.value)}
              >
                {em.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.pf}>
          <div className={styles.pfL}>
            Suggested amount <span className={styles.pfLHint}>— or let them choose</span>
          </div>
          <div className={styles.pillRow}>
            {AMOUNTS.map((amt) => (
              <button
                key={amt.value}
                type="button"
                className={`${styles.pillBtn} ${amt.custom ? styles.pillCustom : ""} ${
                  amount === amt.value ? styles.pillOn : ""
                }`}
                onClick={() => setAmount(amt.value)}
              >
                {amt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.pf}>
          <div className={styles.pfL}>
            A short note <span className={styles.pfLHint}>— optional</span>
          </div>
          <input
            className={styles.pfInput}
            type="text"
            placeholder="With all our love"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button type="button" className={styles.padrinoCta} onClick={generate}>
          Generate the invite
        </button>

        {resultLink && (
          <div className={styles.padrinoResult}>
            <div className={styles.padrinoResultL}>Your invite is ready · stubbed for v1</div>
            <div className={styles.padrinoLink}>{resultLink}</div>
            <div className={styles.padrinoResultActions}>
              <button
                type="button"
                className={styles.padrinoResultBtn}
                onClick={() => showToast("Link <em>copied</em> — Stripe wiring lands Phase 4.")}
              >
                Copy link
              </button>
              <button
                type="button"
                className={styles.padrinoResultBtn}
                onClick={() => showToast("Opening <em>Mail</em>…")}
              >
                Email it
              </button>
              <button
                type="button"
                className={styles.padrinoResultBtn}
                onClick={() => showToast("Opening <em>Messages</em>…")}
              >
                Text it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
