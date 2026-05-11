"use client";

import { useEffect, useState } from "react";
import styles from "../orgnz.module.css";
import { onTravelChange, openTravel } from "../_lib/sheet";
import { showToast } from "../_lib/toast";

type Audience = "all" | "oot" | "custom" | "single";
type Include = "std" | "travel" | "registry" | "contrib";

const AUDIENCE: { value: Audience; label: string }[] = [
  { value: "all", label: "Everyone · 175" },
  { value: "oot", label: "Out-of-town · 38" },
  { value: "custom", label: "Pick a list" },
  { value: "single", label: "Just one guest" },
];

const INCLUDE: { value: Include; label: string; locked?: boolean; contrib?: boolean }[] = [
  { value: "std", label: "✓ Save-the-date", locked: true },
  { value: "travel", label: "+ Travel · for out-of-towners" },
  { value: "registry", label: "+ Registry link" },
  { value: "contrib", label: "+ Contribution path", contrib: true },
];

const STAGES = [
  { num: 1, tone: "rose", title: "Save the date", detail: "Yes / Maybe / No" },
  { num: 2, tone: "blue", title: "Travel", detail: "If out-of-town" },
  { num: 3, tone: "teal", title: "Registry", detail: "If you have one" },
  { num: 4, tone: "rose", title: "Contribute", detail: "Optional · graceful" },
] as const;

export function TravelModal() {
  const [open, setOpen] = useState(false);
  useEffect(() => onTravelChange(setOpen), []);
  if (!open) return null;
  return <TravelCard />;
}

function TravelCard() {
  const [audience, setAudience] = useState<Audience>("all");
  const [includes, setIncludes] = useState<Set<Include>>(
    () => new Set<Include>(["std", "travel"]),
  );
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") openTravel(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  function toggleInclude(value: Include) {
    if (value === "std") return; // save-the-date is always on
    setIncludes((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function generate() {
    void audience;
    void note;
    setSent(true);
  }

  function audienceCount(): string {
    if (audience === "all") return "175 invites";
    if (audience === "oot") return "38 invites";
    if (audience === "custom") return "A custom list";
    return "1 invite";
  }

  function backdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) openTravel(false);
  }

  const showContribCue = includes.has("contrib");

  return (
    <div
      className={`${styles.padrinoModal} ${styles.travelModal}`}
      onClick={backdropClick}
    >
      <div className={`${styles.padrinoCard} ${styles.travelCard}`}>
        <div className={styles.padrinoHandle} />
        <div className={`${styles.padrinoEye} ${styles.travelEye}`}>A note from Cue</div>
        <h2 className={`${styles.padrinoTitle} ${styles.travelTitle}`}>
          Send the <em>save-the-date</em>
        </h2>
        <p className={styles.padrinoSub}>
          One link, one event card, layered options. Guests reply <em>Yes / Maybe / No</em>{" "}
          first — then for those who want, <em className={styles.travelEmBlue}>travel booking</em>,
          registry, and <em>a graceful door for gifts</em> unfold below.
        </p>

        <button
          type="button"
          className={styles.helpToggle}
          onClick={() => setHelpOpen((v) => !v)}
          aria-expanded={helpOpen}
        >
          <span className={styles.helpToggleEye}>How this works</span>
          <span className={styles.helpToggleCaret}>{helpOpen ? "▾" : "▸"}</span>
        </button>

        {helpOpen && (
          <div className={styles.helpCard}>
            <div className={styles.helpCardIco}>✦</div>
            <div className={styles.helpCardBody}>
              <div className={styles.helpCardEye}>A note from Cue</div>
              <p className={styles.helpCardP}>
                <em>Each send is a separate batch.</em> Pick who and pick what. Save-the-date
                is always the base — the floor everyone gets.
              </p>
              <p className={styles.helpCardP}>
                You can come back as often as you need: send the <em>save-the-date</em> to
                everyone today, then <em>travel</em> to just the 38 out-of-towners next
                month, then a <em>contribution path</em> closer to the date. Each send goes
                out as its own batch — guests aren&rsquo;t spammed.
              </p>
              <p className={styles.helpCardP}>
                Want different copy for different groups? Send to <em>Pick a list</em> or{" "}
                <em>Just one guest</em> and fine-tune the note.
              </p>
            </div>
          </div>
        )}

        <div className={styles.travelStages}>
          <div className={styles.travelStagesEye}>What guests see · scroll, never required</div>
          <div className={styles.travelStagesRow}>
            {STAGES.map((s) => (
              <div key={s.num} className={styles.travelStage}>
                <div
                  className={`${styles.travelStageNum} ${
                    s.tone === "rose"
                      ? styles.travelStageRose
                      : s.tone === "blue"
                      ? styles.travelStageBlue
                      : styles.travelStageTeal
                  }`}
                >
                  {s.num}
                </div>
                <div
                  className={`${styles.travelStageT} ${
                    s.tone === "rose"
                      ? styles.travelStageTRose
                      : s.tone === "blue"
                      ? styles.travelStageTBlue
                      : styles.travelStageTTeal
                  }`}
                >
                  {s.title}
                </div>
                <div className={styles.travelStageD}>{s.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.pf}>
          <div className={styles.pfL}>Send to</div>
          <div className={styles.pillRow}>
            {AUDIENCE.map((a) => (
              <button
                key={a.value}
                type="button"
                className={`${styles.pillBtn} ${audience === a.value ? styles.pillOn : ""}`}
                onClick={() => setAudience(a.value)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.pf}>
          <div className={styles.pfL}>Include</div>
          <div className={styles.pillRow}>
            {INCLUDE.map((inc) => (
              <button
                key={inc.value}
                type="button"
                className={`${styles.pillBtn} ${
                  includes.has(inc.value) ? styles.pillOn : ""
                } ${inc.locked ? styles.pillLocked : ""} ${
                  inc.contrib ? styles.pillContrib : ""
                }`}
                onClick={() => toggleInclude(inc.value)}
                disabled={inc.locked}
              >
                {inc.label}
              </button>
            ))}
          </div>
          <div className={styles.travelHint}>
            Save-the-date is always included. Travel only shows for guests with out-of-town
            addresses.
          </div>

          {showContribCue && (
            <div className={styles.contribCue}>
              <div className={styles.contribCueIco}>✦</div>
              <div className={styles.contribCueBody}>
                <div className={styles.contribCueEye}>A note from Cue</div>
                <div className={styles.contribCueT}>
                  Contributions go to your <em>event escrow</em> — same place Padrino gifts
                  land. Guests choose their amount, optionally earmark to a line item, and
                  you see them roll into the Budget tile.
                </div>
                <div className={styles.contribCueDefault}>
                  <strong>Default copy:</strong> &ldquo;If you&rsquo;d like to give a gift,
                  you can do that here — but your presence is the gift we&rsquo;re asking
                  for.&rdquo; <em>Edit anytime.</em>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.pf}>
          <div className={styles.pfL}>
            Personal note <span className={styles.pfLHint}>— optional</span>
          </div>
          <input
            className={styles.pfInput}
            type="text"
            placeholder="Can&rsquo;t wait to celebrate with you"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          type="button"
          className={`${styles.padrinoCta} ${styles.travelCta}`}
          onClick={generate}
        >
          Generate &amp; send the save-the-dates
        </button>

        {sent && (
          <div className={`${styles.padrinoResult} ${styles.travelResult}`}>
            <div className={`${styles.padrinoResultL} ${styles.travelResultL}`}>
              {audienceCount()} ready · personalized links (stubbed for v1)
            </div>
            <div className={styles.padrinoLink}>evntcue.com/save/&#123;guest&#125;</div>
            <div className={styles.padrinoResultActions}>
              <button
                type="button"
                className={`${styles.padrinoResultBtn} ${styles.travelResultBtn}`}
                onClick={() => showToast("Stripe + email send lands in <em>Phase 4</em>.")}
              >
                Send by email
              </button>
              <button
                type="button"
                className={`${styles.padrinoResultBtn} ${styles.travelResultBtn}`}
                onClick={() => showToast("Stripe + SMS send lands in <em>Phase 4</em>.")}
              >
                Send by text
              </button>
              <button
                type="button"
                className={`${styles.padrinoResultBtn} ${styles.travelResultBtn}`}
                onClick={() => showToast("Sample link <em>copied</em>.")}
              >
                Copy sample
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
