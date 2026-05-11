"use client";

import { useState, useTransition } from "react";
import s from "./preview.module.css";
import type { PreviewData } from "./page";
import { EmailFallbackModal } from "./EmailFallbackModal";
import { DatePickerModal } from "./DatePickerModal";
import { updateSelectedDate } from "./_actions/update-selected-date";

import { DATE_HORIZONS } from "@/data/budget-presets";

const HORIZON_LABELS: Record<string, string> = Object.fromEntries(
  DATE_HORIZONS.map((h) => [h.value, `${h.label.replace(" mo", " months").trim()} out`]),
);

function formatUSD(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}


export function Preview({ data }: { data: PreviewData }) {
  const [emailOpen, setEmailOpen] = useState(false);

  const titleSubject = data.subtypeLabel ?? data.categoryLabel;
  const horizonLabel = HORIZON_LABELS[data.dateHorizon] ?? "in planning";

  return (
    <main className={s.page}>
      <div className={s.wrap}>
        <div className={s.topbar}>
          <a href="/budget-calculator" className={s.topbarBack}>← Calculator</a>
          <span className={s.topbarBrand}>EvntCue</span>
        </div>

        <header className={s.header}>
          <div className={s.eyebrow}>Your event · preview</div>
          <h1 className={s.title}>
            Your <em>{formatUSD(data.grand)}</em>
            <br />
            {titleSubject.toLowerCase()} budget.
          </h1>
          <p className={s.sub}>
            For <strong>{data.guestCount}</strong> guests · {horizonLabel} · {formatUSD(data.perGuest)} per guest
          </p>
        </header>

        <CueWarning data={data} subject={titleSubject} />

        <div className={s.layout}>
          <section className={s.colMain}>
            <DateSelector data={data} />
            <BudgetCard data={data} />
          </section>

          <aside className={s.colAside}>
            <CueCard severity={data.severity} subject={titleSubject} />
            {data.suggestPlnr && <PlnrSuggestion />}
            <VendorTeaser categoryLabel={titleSubject} />
          </aside>
        </div>

        <div className={s.ctaBar}>
          <div className={s.ctaCopy}>
            <div className={s.ctaTitle}>Start your mood board</div>
            <div className={s.ctaSub}>Sign up free — your budget carries over, vendor browsing unlocks, escrow is ready.</div>
          </div>
          <div className={s.ctaActions}>
            <button type="button" className={s.btnGhost} onClick={() => setEmailOpen(true)}>
              Email me this →
            </button>
            <a href="/login?role=orgnz&intent=mood_board" className={s.btnPrimary}>
              Build Mood Board →
            </a>
          </div>
        </div>
      </div>

      {emailOpen && <EmailFallbackModal onClose={() => setEmailOpen(false)} />}
    </main>
  );
}

/* ---------- Cue-style warning (3 signals: lead time, cover count, per-guest budget) ---------- */
function CueWarning({ data, subject }: { data: PreviewData; subject: string }) {
  const { severity, leadSeverity, coverSig, budgetSig, recommendedLeadMonths, typicalGuests, typicalPerGuest, guestCount, perGuest } = data;

  const cls =
    severity === "danger" ? s.cueDanger : severity === "warn" ? s.cueWarning : s.cueCalm;
  const dotCls =
    severity === "danger" ? s.cueDotDanger : severity === "warn" ? s.cueDotWarn : s.cueDotCalm;
  const pulse = severity !== "calm" ? s.cueDotPulse : "";

  let headline: string;
  if (severity === "calm") {
    headline = "Cue says — you're in the normal planning window.";
  } else if (severity === "danger") {
    headline =
      leadSeverity === "danger"
        ? "Cue says — this is very tight."
        : budgetSig.severity === "danger"
          ? budgetSig.direction === "low"
            ? "Cue says — this budget is far below DFW typical."
            : "Cue says — this budget is luxury-tier territory."
          : "Cue says — your cover count is well outside DFW typical.";
  } else {
    headline =
      leadSeverity === "warn"
        ? "Cue says — this is short notice."
        : budgetSig.severity === "warn"
          ? budgetSig.direction === "low"
            ? "Cue says — your budget is on the lean side for DFW."
            : "Cue says — your budget runs above DFW typical."
          : "Cue says — your cover count is atypical for DFW.";
  }

  return (
    <div className={`${s.cueWarn} ${cls}`}>
      <div className={`${s.cueDot} ${dotCls} ${pulse}`} aria-hidden="true" />
      <div className={s.cueBody}>
        <div className={s.cueLine}>
          <em>{headline}</em>{" "}
          {/* Lead-time line */}
          {leadSeverity === "calm" ? (
            <>
              {subject} events typically need <strong>{recommendedLeadMonths}+ months</strong> of lead time —
              you&rsquo;ve got room to breathe.
            </>
          ) : (
            <>
              {subject} events typically need <strong>{recommendedLeadMonths}+ months</strong> of lead time
              — venue holds and {leadSeverity === "danger" ? "permits" : "specialty bookings"} fill up early.
            </>
          )}
          {/* Cover-count line */}
          {coverSig.severity !== "calm" && (
            <>
              {" "}At <strong>{guestCount} guests</strong>, your event runs{" "}
              {coverSig.direction === "low" ? "smaller" : "larger"} than DFW typical (
              {typicalGuests} guests).{" "}
              {coverSig.direction === "low"
                ? "Cue can scope a tighter, more intimate vendor list."
                : "Larger venues, expanded AV, and tier-up catering are likely needed."}
            </>
          )}
          {/* Budget per-guest line */}
          {budgetSig.severity !== "calm" && typicalPerGuest > 0 && (
            <>
              {" "}Per-guest at <strong>${perGuest}</strong> sits{" "}
              {budgetSig.direction === "low" ? "below" : "above"} DFW typical (~${typicalPerGuest}/guest)
              for {subject.toLowerCase()}.{" "}
              {budgetSig.direction === "low"
                ? "Vendor matches will favor budget-tier; some specialty options will be out of reach."
                : "Cue can scope premium and luxury-tier vendor matches."}
            </>
          )}
          {/* Calm reassurance for budget if everything is calm */}
          {severity === "calm" && typicalPerGuest > 0 && (
            <>
              {" "}Per-guest at <strong>${perGuest}</strong> aligns with DFW typical
              (~${typicalPerGuest}/guest) for {subject.toLowerCase()}.
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Budget card (mirrors P2 dashboard prototype) ---------- */
function BudgetCard({ data }: { data: PreviewData }) {
  const items = Object.entries(data.amounts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const max = items.length > 0 ? items[0][1] : 1;

  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <div className={s.cardTitle}>Budget</div>
        <div className={s.cardSub}>{formatUSD(data.subtotal)} subtotal · {formatUSD(data.contingency)} contingency · {formatUSD(data.tax)} tax</div>
      </div>
      <div className={s.itemsList}>
        {items.map(([key, amt]) => (
          <div key={key} className={s.itemRow}>
            <div className={s.itemLabel}>{data.itemLabels[key] ?? key}</div>
            <div className={s.itemBar}>
              <div className={s.itemBarFill} style={{ width: `${(amt / max) * 100}%` }} />
            </div>
            <div className={s.itemAmt}>{formatUSD(amt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Date selector (replaces the milestone timeline) ---------- */
function DateSelector({ data }: { data: PreviewData }) {
  const [iso, setIso] = useState(data.selectedDateIso);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, startTransition] = useTransition();

  function persist(next: string) {
    setIso(next);
    setPickerOpen(false);
    startTransition(async () => {
      await updateSelectedDate({ iso: next });
    });
  }

  const longDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso + "T00:00:00"));

  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <div className={s.cardTitle}>Your date</div>
        <div className={s.cardSub}>
          Picked from your <em className={s.shortInline}>{data.horizonLabel}</em> window — adjust anytime.
        </div>
      </div>
      <button
        type="button"
        className={`${s.dateTrigger} ${s.dateTriggerHasValue}`}
        onClick={() => setPickerOpen(true)}
      >
        <span className={s.dateTriggerText}>{longDate}</span>
        <span className={s.dateTriggerIcon}>›</span>
      </button>
      <p className={s.dateFoot}>
        This is what locks first — your Venu confirms against this date, then everything else
        scopes around it. You can change it later in the dashboard.
      </p>
      <DatePickerModal
        open={pickerOpen}
        selectedIso={iso}
        onPick={persist}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}

/* ---------- Cue card (calm) ---------- */
function CueCard({
  severity,
  subject,
}: {
  severity: "calm" | "warn" | "danger";
  subject: string;
}) {
  const dotClass =
    severity === "danger" ? s.cueDotDanger : severity === "warn" ? s.cueDotWarn : s.cueDotCalm;
  const stateText = severity === "danger" ? "tight" : severity === "warn" ? "short notice" : "ready";
  return (
    <div className={s.card}>
      <div className={s.cueHead}>
        <div className={`${s.cueDot} ${dotClass}`} aria-hidden="true" />
        <div className={s.cueLabel}>Cue · {stateText}</div>
      </div>
      <div className={s.cueText}>
        <em>I&rsquo;ve sketched a starting plan</em> for your {subject.toLowerCase()}. Sign up and
        I&rsquo;ll match vendors who fit your budget and style, draft your timeline, and send you
        five board-matched shortlists you can compare side by side.
      </div>
    </div>
  );
}

/* ---------- Plnr suggestion (budget in average range) ---------- */
function PlnrSuggestion() {
  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <div className={s.cardTitle}>
          A Planner — <em className={s.shortInline}>Plnr</em> — would help here
        </div>
        <div className={s.cardSub}>Cue&rsquo;s read on your budget tier</div>
      </div>
      <div className={s.cueText}>
        <em>Your event sits where a full-service Plnr earns their keep.</em>
        They own your timeline end-to-end, fight for you on vendor contracts and
        commission stacking, know the cultural traditions cold, and save you weeks
        of late-night coordination.
      </div>
      <a href="/login?role=orgnz&intent=plnr" className={s.btnGhost} style={{ marginTop: 14, display: "inline-block" }}>
        Browse DFW Plnrs →
      </a>
    </div>
  );
}

/* ---------- Vendor teaser — Lock 5a: vendors gated until venue confirms ---------- */
function VendorTeaser({ categoryLabel }: { categoryLabel: string }) {
  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <div className={s.cardTitle}>Vendors</div>
        <div className={s.cardSub}>Venu first — everything else scopes around it</div>
      </div>
      <div className={s.vendorGrid}>
        <div className={`${s.vendorChip} ${s.vendorChipActive}`}>
          <div className={s.vendorChipPulse} aria-hidden="true">
            <div className={s.vendorChipIcon}>✦</div>
          </div>
          <div className={s.vendorChipBody}>
            <div className={s.vendorChipCat}>Venu <span className={s.vendorChipShort}>(venue)</span></div>
            <div className={s.vendorChipHint}>4 DFW matches ready · lock first</div>
          </div>
        </div>
        <div className={`${s.vendorChip} ${s.vendorChipDull}`}>
          <div className={s.vendorChipIcon}>✦</div>
          <div className={s.vendorChipBody}>
            <div className={s.vendorChipCat}>Catr <span className={s.vendorChipShort}>(caterers)</span></div>
            <div className={s.vendorChipHint}>Unlocks when Venu confirms</div>
          </div>
        </div>
        <div className={`${s.vendorChip} ${s.vendorChipDull}`}>
          <div className={s.vendorChipIcon}>✦</div>
          <div className={s.vendorChipBody}>
            <div className={s.vendorChipCat}>Vndr <span className={s.vendorChipShort}>(everything else)</span></div>
            <div className={s.vendorChipHint}>Florals, photo, music, AV — unlocks with Venu</div>
          </div>
        </div>
      </div>
      <div className={s.vendorFootnote}>
        Catr and Vndr matches unlock once your Venu is booked. Every other vendor
        scopes around the venue&rsquo;s catering rules, AV setup, and date — so locking
        the {categoryLabel.toLowerCase()} venue first saves rework.
      </div>
    </div>
  );
}
