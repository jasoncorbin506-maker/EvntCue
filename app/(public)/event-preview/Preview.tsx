"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import s from "./preview.module.css";
import type { PreviewData } from "./page";
import { EmailFallbackModal } from "./EmailFallbackModal";
import { DatePickerModal } from "./DatePickerModal";
import { updateSelectedDate } from "./_actions/update-selected-date";
import { commitEventForAuthedUserAction } from "./_actions/commit-event-for-authed-user";
import { LangToggle } from "@/app/_components/LangToggle";

import { DATE_HORIZONS, type LeadTimeSeverity } from "@/data/budget-presets";

function useFormatUSD() {
  const locale = useLocale();
  return (n: number) =>
    new Intl.NumberFormat(locale === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
}

export function Preview({ data, isAuthed }: { data: PreviewData; isAuthed: boolean }) {
  const t = useTranslations("preview");
  const locale = useLocale();
  const formatUSD = useFormatUSD();
  const [emailOpen, setEmailOpen] = useState(false);
  const [committing, startCommit] = useTransition();

  const handleAddEvent = () => {
    startCommit(async () => {
      await commitEventForAuthedUserAction();
    });
  };

  const HORIZON_LABELS: Record<string, string> = Object.fromEntries(
    DATE_HORIZONS.map((h) => [
      h.value,
      t("horizonOut", { label: h.label.replace(" mo", locale === "es" ? " m" : " months").trim() }),
    ]),
  );
  const horizonLabel = HORIZON_LABELS[data.dateHorizon] ?? t("horizonPlanning");
  const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;

  return (
    <main className={s.page}>
      <div className={s.wrap}>
        <div className={s.topbar}>
          <a href="/budget-calculator" className={s.topbarBack}>{t("topbarBack")}</a>
          <span className={s.topbarBrand}>EvntCue</span>
          <LangToggle className={s.topbarLang} />
        </div>

        <header className={s.header}>
          <div className={s.eyebrow}>{t("eyebrow")}</div>
          <h1 className={s.title}>
            {t.rich("titleRich", {
              grand: formatUSD(data.grand),
              noun: data.eventNounSingular,
              em: (chunks) => <em>{chunks}</em>,
              br: () => <br />,
            })}
          </h1>
          <p className={s.sub}>
            {t.rich("forGuests", {
              guests: data.guestCount,
              horizon: horizonLabel,
              perGuest: formatUSD(data.perGuest),
              strong,
            })}
          </p>
        </header>

        <CueWarning data={data} />

        <div className={s.layout}>
          <section className={s.colMain}>
            <DateSelector data={data} />
            <BudgetCard data={data} />
          </section>

          <aside className={s.colAside}>
            <CueCard severity={data.severity} eventNoun={data.eventNounSingular} />
            {data.suggestPlnr && <PlnrSuggestion />}
            <VendorTeaser />
          </aside>
        </div>

        <div className={s.ctaBar}>
          <div className={s.ctaCopy}>
            <div className={s.ctaTitle}>
              {isAuthed ? t("ctaTitleAuthed") : t("ctaTitle")}
            </div>
            <div className={s.ctaSub}>
              {isAuthed ? t("ctaSubAuthed") : t("ctaSub")}
            </div>
          </div>
          <div className={s.ctaActions}>
            {isAuthed ? (
              <>
                <a href="/orgnz" className={s.btnGhost}>
                  {t("goToDashboard")}
                </a>
                <button
                  type="button"
                  className={s.btnPrimary}
                  onClick={handleAddEvent}
                  disabled={committing}
                >
                  {committing ? "…" : t("addToDashboard")}
                </button>
              </>
            ) : (
              <>
                <button type="button" className={s.btnGhost} onClick={() => setEmailOpen(true)}>
                  {t("emailMe")}
                </button>
                <a href="/login?role=orgnz&intent=mood_board" className={s.btnPrimary}>
                  {t("buildMoodBoard")}
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {emailOpen && <EmailFallbackModal onClose={() => setEmailOpen(false)} />}
    </main>
  );
}

/* ---------- Cue-style warning (3 signals: lead time, cover count, per-guest budget) ---------- */
function CueWarning({ data }: { data: PreviewData }) {
  const t = useTranslations("preview");
  const {
    severity,
    leadSeverity,
    coverSig,
    budgetSig,
    recommendedLeadMonths,
    typicalGuests,
    typicalPerGuest,
    guestCount,
    perGuest,
    eventNounSingular,
    eventNounPlural,
  } = data;

  const cls =
    severity === "danger" ? s.cueDanger
    : severity === "warn" ? s.cueWarning
    : severity === "proceed" ? s.cueProceed
    : s.cueCalm;
  const dotCls =
    severity === "danger" ? s.cueDotDanger
    : severity === "warn" ? s.cueDotWarn
    : severity === "proceed" ? s.cueDotProceed
    : s.cueDotCalm;
  const pulse = severity === "warn" || severity === "danger" ? s.cueDotPulse : "";

  // Lock 16 (2026-05-16): proceed is invitational — short editorial body, no multi-signal chain.
  if (severity === "proceed") {
    return (
      <div className={`${s.cueWarn} ${cls}`}>
        <div className={`${s.cueDot} ${dotCls}`} aria-hidden="true" />
        <div className={s.cueBody}>
          <div className={s.cueLine}>
            <em>{t("cueProceedHeadline")}</em> {t("cueProceedSupport")}
          </div>
        </div>
      </div>
    );
  }

  let headlineKey: string;
  if (severity === "calm") {
    headlineKey = "cueCalmHeadline";
  } else if (severity === "danger") {
    headlineKey =
      leadSeverity === "danger"
        ? "cueTightHeadline"
        : budgetSig.severity === "danger"
          ? budgetSig.direction === "low"
            ? "cueBudgetFarBelow"
            : "cueBudgetLuxury"
          : "cueCoverFar";
  } else {
    headlineKey =
      leadSeverity === "warn"
        ? "cueShortNotice"
        : budgetSig.severity === "warn"
          ? budgetSig.direction === "low"
            ? "cueBudgetLean"
            : "cueBudgetAbove"
          : "cueCoverAtypical";
  }

  const strong = (chunks: React.ReactNode) => <strong>{chunks}</strong>;
  const leadKey =
    leadSeverity === "calm" ? "leadCalm" : leadSeverity === "danger" ? "leadTightDanger" : "leadTightWarn";
  const coverKey = coverSig.direction === "low" ? "coverLow" : "coverHigh";
  const perGuestKey =
    budgetSig.severity === "calm"
      ? "perGuestCalm"
      : budgetSig.direction === "low"
        ? "perGuestBelow"
        : "perGuestAbove";

  return (
    <div className={`${s.cueWarn} ${cls}`}>
      <div className={`${s.cueDot} ${dotCls} ${pulse}`} aria-hidden="true" />
      <div className={s.cueBody}>
        <div className={s.cueLine}>
          <em>{t(headlineKey)}</em>{" "}
          {t.rich(leadKey, { plural: eventNounPlural, months: recommendedLeadMonths, strong })}
          {coverSig.severity !== "calm" &&
            t.rich(coverKey, { guests: guestCount, typical: typicalGuests, strong })}
          {budgetSig.severity !== "calm" && typicalPerGuest > 0 &&
            t.rich(perGuestKey, { perGuest, typical: typicalPerGuest, noun: eventNounSingular, strong })}
          {severity === "calm" && typicalPerGuest > 0 &&
            t.rich("perGuestCalm", { perGuest, typical: typicalPerGuest, noun: eventNounSingular, strong })}
        </div>
      </div>
    </div>
  );
}

/* ---------- Budget card (mirrors P2 dashboard prototype) ---------- */
function BudgetCard({ data }: { data: PreviewData }) {
  const t = useTranslations("preview");
  const formatUSD = useFormatUSD();
  const items = Object.entries(data.amounts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const max = items.length > 0 ? items[0][1] : 1;

  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <div className={s.cardTitle}>{t("budgetTitle")}</div>
        <div className={s.cardSub}>
          {t("budgetSub", {
            subtotal: formatUSD(data.subtotal),
            contingency: formatUSD(data.contingency),
            tax: formatUSD(data.tax),
          })}
        </div>
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
  const t = useTranslations("preview");
  const locale = useLocale();
  const [iso, setIso] = useState(data.selectedDateIso);
  // selectedTime is "HH:MM" / "HH:MM:SS" 24h or null = all-day (Q3).
  // Sourced from data.selectedTimeIso (parent passes through from cookie).
  const [time, setTime] = useState<string | null>(data.selectedTimeIso ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function persist(next: { iso: string; timeIso: string | null }) {
    setIso(next.iso);
    setTime(next.timeIso);
    setPickerOpen(false);
    startTransition(async () => {
      await updateSelectedDate({ iso: next.iso, timeIso: next.timeIso });
      router.refresh();
    });
  }

  const intlLocale = locale === "es" ? "es-MX" : "en-US";
  const longDate = new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso + "T00:00:00"));

  const timeLabel = time
    ? new Intl.DateTimeFormat(intlLocale, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(`${iso}T${time.length === 5 ? time + ":00" : time}`))
    : null;

  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <div className={s.cardTitle}>{t("yourDate")}</div>
        <div className={s.cardSub}>
          {t.rich("yourDateSub", {
            horizon: data.horizonLabel,
            em: (chunks) => <em className={s.shortInline}>{chunks}</em>,
          })}
        </div>
      </div>
      <button
        type="button"
        className={`${s.dateTrigger} ${s.dateTriggerHasValue}`}
        onClick={() => setPickerOpen(true)}
      >
        <span className={s.dateTriggerText}>
          {longDate}
          {timeLabel ? ` · ${timeLabel}` : ""}
        </span>
        <span className={s.dateTriggerIcon}>›</span>
      </button>
      <p className={s.dateFoot}>{t("yourDateFoot")}</p>
      <DatePickerModal
        open={pickerOpen}
        selectedIso={iso}
        selectedTime={time}
        onPick={persist}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}

/* ---------- Cue card (calm) ---------- */
function CueCard({
  severity,
  eventNoun,
}: {
  severity: LeadTimeSeverity;
  eventNoun: string;
}) {
  const t = useTranslations("preview");
  const dotClass =
    severity === "danger" ? s.cueDotDanger
    : severity === "warn" ? s.cueDotWarn
    : severity === "proceed" ? s.cueDotProceed
    : s.cueDotCalm;
  const stateText =
    severity === "danger" ? t("cueStateTight")
    : severity === "warn" ? t("cueStateShort")
    : severity === "proceed" ? t("cueStateProceed")
    : t("cueStateReady");
  return (
    <div className={s.card}>
      <div className={s.cueHead}>
        <div className={`${s.cueDot} ${dotClass}`} aria-hidden="true" />
        <div className={s.cueLabel}>Cue · {stateText}</div>
      </div>
      <div className={s.cueText}>
        <em>{t("cueCardEm")}</em>
        {t("cueCardBody", { noun: eventNoun })}
      </div>
    </div>
  );
}

/* ---------- Plnr suggestion (budget in average range) ---------- */
function PlnrSuggestion() {
  const t = useTranslations("preview");
  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <div className={s.cardTitle}>
          {t("plnrTitlePrefix")} <em className={s.shortInline}>{t("plnrTitleShortInline")}</em> {t("plnrTitleSuffix")}
        </div>
        <div className={s.cardSub}>{t("plnrSub")}</div>
      </div>
      <div className={s.cueText}>
        <em>{t("plnrBodyEm")}</em>
        {t("plnrBody")}
      </div>
      <a href="/login?role=orgnz&intent=plnr" className={s.btnGhost} style={{ marginTop: 14, display: "inline-block" }}>
        {t("plnrBrowse")}
      </a>
    </div>
  );
}

/* ---------- Vendor teaser — Lock 5a: vendors gated until venue confirms ---------- */
function VendorTeaser() {
  const t = useTranslations("preview");
  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <div className={s.cardTitle}>{t("vendorsTitle")}</div>
        <div className={s.cardSub}>{t("vendorsSub")}</div>
      </div>
      <div className={s.vendorGrid}>
        <div className={`${s.vendorChip} ${s.vendorChipActive}`}>
          <div className={s.vendorChipPulse} aria-hidden="true">
            <div className={s.vendorChipIcon}>✦</div>
          </div>
          <div className={s.vendorChipBody}>
            <div className={s.vendorChipCat}>{t("vendorChipVenu")} <span className={s.vendorChipShort}>{t("vendorChipVenuShort")}</span></div>
            <div className={s.vendorChipHint}>{t("vendorChipVenuHint")}</div>
          </div>
        </div>
        <div className={`${s.vendorChip} ${s.vendorChipDull}`}>
          <div className={s.vendorChipIcon}>✦</div>
          <div className={s.vendorChipBody}>
            <div className={s.vendorChipCat}>{t("vendorChipCatr")} <span className={s.vendorChipShort}>{t("vendorChipCatrShort")}</span></div>
            <div className={s.vendorChipHint}>{t("vendorChipCatrHint")}</div>
          </div>
        </div>
        <div className={`${s.vendorChip} ${s.vendorChipDull}`}>
          <div className={s.vendorChipIcon}>✦</div>
          <div className={s.vendorChipBody}>
            <div className={s.vendorChipCat}>{t("vendorChipVndr")} <span className={s.vendorChipShort}>{t("vendorChipVndrShort")}</span></div>
            <div className={s.vendorChipHint}>{t("vendorChipVndrHint")}</div>
          </div>
        </div>
      </div>
      <div className={s.vendorFootnote}>{t("vendorFootnote")}</div>
    </div>
  );
}
