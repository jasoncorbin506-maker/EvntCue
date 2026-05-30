import { getMilestones, type MilestoneWithStatus } from "@/data/event-milestones";
import type { CategoryKey } from "@/data/budget-presets";

export type RailPinState = "today" | "gate" | "dayof" | "travel" | "past" | "default";

export type RailPinBodyItem = {
  ico: string;
  t: string;
  d: string;
};

export type RailPinOrigin = "today" | "seed" | "custom";

export type RailPin = {
  id: string;
  origin: RailPinOrigin;
  /** Stable key from data/event-milestones.ts when origin === "seed". */
  milestoneKey?: string;
  /** event_custom_milestones.id when origin === "custom". */
  customId?: string;
  /** Provenance tag — set on custom pins added from the cultural picker, also reflected from seed cultural pins via the prefix on milestoneKey. */
  traditionKey?: string | null;
  /** Underlying YYYY-MM-DD for the pin's current display date (post-override for seeds). */
  dateIso: string;
  /** Underlying HH:MM:SS for the pin's current time, or null when none set. */
  time: string | null;
  /** Sort-order tiebreaker for same-date-and-time siblings. NULL when default. */
  sortOrder: number | null;
  when: string; // "May 17"
  whenTime: string | null; // "3:00 PM" or null when not specified
  label: string;
  sub: string | null;
  state: RailPinState;
  isDone: boolean;
  body: RailPinBodyItem[];
};

/**
 * Per-seed-milestone override stored in events.milestone_overrides (JSONB).
 * Mirrors migration 024's COMMENT ON COLUMN. All fields optional.
 */
export type MilestoneOverride = {
  status?: "done" | "dismissed";
  custom_date_iso?: string;
  custom_time?: string; // "HH:MM" or "HH:MM:SS"
  sort_order?: number;
};
export type MilestoneOverridesMap = Record<string, MilestoneOverride>;

/**
 * User-authored milestone (one row in event_custom_milestones). Shaped to
 * match what load-context selects.
 */
export type CustomMilestoneRow = {
  id: string;
  label: string | null;
  detail: string | null;
  custom_date: string; // YYYY-MM-DD
  custom_time: string | null; // HH:MM:SS or null
  sort_order: number | null;
  tradition_key: string | null;
};

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const LONG_DATE = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
});
const TIME_FMT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_PER_MONTH = 30.44;

const GATE_KEYWORDS = [
  "save-the-dates",
  "save the date",
  "counseling",
  "pre-cana",
  "paperwork",
  "license",
  "permit",
  "registration",
  "rsvp",
  "guest count",
  "invitations",
];

const TRAVEL_KEYWORDS = ["hotel", "travel", "rehearsal"];

function classify(label: string, isDayOf: boolean, isPast: boolean): RailPinState {
  if (isPast) return "past";
  if (isDayOf) return "dayof";
  const lower = label.toLowerCase();
  if (TRAVEL_KEYWORDS.some((k) => lower.includes(k))) return "travel";
  if (GATE_KEYWORDS.some((k) => lower.includes(k))) return "gate";
  return "default";
}

function pickIcon(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes("save")) return "send";
  if (lower.includes("counsel") || lower.includes("cana")) return "heart";
  if (lower.includes("vndr")) return "users";
  if (lower.includes("invitation")) return "send";
  if (lower.includes("guest count") || lower.includes("rsvp")) return "users";
  if (lower.includes("rehearsal")) return "plate";
  if (lower.includes("hotel") || lower.includes("travel")) return "plane";
  if (lower.includes("ceremony") || lower.includes("wedding")) return "heart";
  if (lower.includes("reception") || lower.includes("banquet") || lower.includes("dinner")) return "plate";
  if (lower.includes("cake") || lower.includes("tasting")) return "plate";
  if (lower.includes("photo") || lower.includes("shoot")) return "camera";
  if (lower.includes("paperwork") || lower.includes("license")) return "note";
  return "note";
}

function timeFromIso(timeStr: string | null | undefined): { display: string | null; minutes: number } {
  if (!timeStr) return { display: null, minutes: 24 * 60 + 1 }; // NULL sorts after all real times
  const m = timeStr.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return { display: null, minutes: 24 * 60 + 1 };
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  const minutes = hh * 60 + mm;
  const display = TIME_FMT.format(new Date(2000, 0, 1, hh, mm));
  return { display, minutes };
}

/**
 * Derive the traditionKey for a seed pin from its milestone key prefix.
 * Keys like "hindu_sangeet", "catholic_pre_cana" carry their tradition
 * in the first segment; "wedding_save_the_dates" and generic "social_*"
 * keys return null.
 */
const TRADITION_PREFIXES = new Set([
  "catholic",
  "protestant",
  "greek_orthodox",
  "jewish",
  "hindu",
  "islamic",
  "sikh",
  "chinese",
  "nigerian",
  "ethiopian",
  "mexican",
  "japanese",
  "korean",
  "civil",
  "multicultural",
]);

function deriveTraditionFromKey(milestoneKey: string): string | null {
  // greek_orthodox is two segments; check it first.
  if (milestoneKey.startsWith("greek_orthodox_")) return "greek_orthodox";
  const firstSeg = milestoneKey.split("_")[0];
  if (TRADITION_PREFIXES.has(firstSeg)) return firstSeg;
  return null;
}

type PinWithSortKey = {
  pin: RailPin;
  sortMs: number; // epoch ms of the date (midnight)
  timeMinutes: number; // 0–1440, or >1440 for unspecified
  sortOrder: number; // tiebreaker (NULL → 99999)
};

export function buildRailPins(args: {
  category: CategoryKey;
  subtypeKey: string | null;
  startDateIso: string;
  overrides?: MilestoneOverridesMap;
  customMilestones?: CustomMilestoneRow[];
  now?: Date;
}): RailPin[] {
  const overrides = args.overrides ?? {};
  const customs = args.customMilestones ?? [];
  const now = args.now ?? new Date();
  // Strip to midnight for stable comparisons
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(args.startDateIso + "T00:00:00");
  const monthsUntil = Math.max(0, (start.getTime() - today.getTime()) / (MS_PER_DAY * DAYS_PER_MONTH));

  const milestones: MilestoneWithStatus[] = getMilestones(
    args.category,
    args.subtypeKey,
    monthsUntil,
  );

  const items: PinWithSortKey[] = [];

  // Today's marker (always pinned chronologically wherever today falls).
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  items.push({
    pin: {
      id: "today",
      origin: "today",
      dateIso: todayIso,
      time: null,
      sortOrder: null,
      when: SHORT_DATE.format(today),
      whenTime: null,
      label: "Today",
      sub: "Where you are right now",
      state: "today",
      isDone: false,
      body: [
        {
          ico: "pulse",
          t: "Right now",
          d: "You’re looking at your dashboard. <em>It’s about time.</em>",
        },
      ],
    },
    sortMs: today.getTime(),
    timeMinutes: 0, // today's pin sorts to the front of its date
    sortOrder: -1,
  });

  // Seed milestones, with overrides applied.
  for (const m of milestones) {
    const override = overrides[m.key];
    if (override?.status === "dismissed") continue;

    const seedDate =
      m.lead === 0
        ? start
        : new Date(start.getTime() - m.lead * DAYS_PER_MONTH * MS_PER_DAY);

    // If override carries a custom date, use it. Otherwise fall back to the
    // computed seed date.
    const milestoneDate = override?.custom_date_iso
      ? new Date(override.custom_date_iso + "T00:00:00")
      : seedDate;

    const { display: timeDisplay, minutes: timeMinutes } = timeFromIso(override?.custom_time ?? null);
    const milestoneMidnight = new Date(
      milestoneDate.getFullYear(),
      milestoneDate.getMonth(),
      milestoneDate.getDate(),
    );

    const isPast = milestoneMidnight < today;
    const isDayOf = milestoneMidnight.getTime() === start.getTime() && m.lead === 0;
    const isDone = override?.status === "done";
    const state = classify(m.label, isDayOf, isPast);

    const seedIso = `${milestoneDate.getFullYear()}-${String(milestoneDate.getMonth() + 1).padStart(2, "0")}-${String(milestoneDate.getDate()).padStart(2, "0")}`;
    items.push({
      pin: {
        id: `seed:${m.key}`,
        origin: "seed",
        milestoneKey: m.key,
        traditionKey: deriveTraditionFromKey(m.key),
        dateIso: seedIso,
        time: override?.custom_time ?? null,
        sortOrder: override?.sort_order ?? null,
        when: SHORT_DATE.format(milestoneDate),
        whenTime: timeDisplay,
        label: m.label,
        sub: m.detail ?? null,
        state,
        isDone,
        body: [
          {
            ico: pickIcon(m.label),
            t: m.label,
            d: m.detail ?? "",
          },
        ],
      },
      sortMs: milestoneMidnight.getTime(),
      timeMinutes,
      sortOrder: override?.sort_order ?? 99999,
    });
  }

  // Custom milestones.
  for (const c of customs) {
    const customDate = new Date(c.custom_date + "T00:00:00");
    const customMidnight = new Date(
      customDate.getFullYear(),
      customDate.getMonth(),
      customDate.getDate(),
    );
    const isPast = customMidnight < today;
    const isDayOf = customMidnight.getTime() === start.getTime();
    const displayLabel = c.label?.trim() || "Reserved time";
    const state = classify(displayLabel, isDayOf, isPast);
    const { display: timeDisplay, minutes: timeMinutes } = timeFromIso(c.custom_time);

    items.push({
      pin: {
        id: `custom:${c.id}`,
        origin: "custom",
        customId: c.id,
        traditionKey: c.tradition_key,
        dateIso: c.custom_date,
        time: c.custom_time,
        sortOrder: c.sort_order,
        when: SHORT_DATE.format(customDate),
        whenTime: timeDisplay,
        label: displayLabel,
        sub: c.detail ?? null,
        state,
        isDone: false, // custom pins use delete instead of done in v1
        body: [
          {
            ico: pickIcon(displayLabel),
            t: displayLabel,
            d: c.detail ?? "",
          },
        ],
      },
      sortMs: customMidnight.getTime(),
      timeMinutes,
      sortOrder: c.sort_order ?? 99999,
    });
  }

  // Sort: date asc, then time asc (NULL last), then sort_order asc (NULL last).
  items.sort((a, b) => {
    if (a.sortMs !== b.sortMs) return a.sortMs - b.sortMs;
    if (a.timeMinutes !== b.timeMinutes) return a.timeMinutes - b.timeMinutes;
    return a.sortOrder - b.sortOrder;
  });

  return items.map((item) => item.pin);
}

export function formatPinLongDate(pin: RailPin, refIso: string): string {
  void refIso;
  return pin.whenTime ? `${pin.when} · ${pin.whenTime}` : pin.when;
}

export function formatStartLongDate(startDateIso: string): string {
  return LONG_DATE.format(new Date(startDateIso + "T00:00:00"));
}
