/**
 * Open Items — derived view of "things that need attention on this event."
 *
 * Per Cowork's vendor-task-model design brief (inbox-cc/2026-05-24-vendor-
 * task-model-design.md), Concept C: tasks are NOT a primitive. They're a
 * lens over existing data — open milestones + (future) flagged notes +
 * (future) recipe-seeded checklist items.
 *
 * V1 source: event_custom_milestones WHERE assignment_status = 'unowned'.
 * Future sources (queued, not built):
 *   - notes flagged actionable via the Notes section's "add to checklist"
 *     pill (per Jason's session 18x ask + brief out-of-scope item)
 *   - recipe-seeded checklist items from data/run-of-show/*.ts (per the
 *     "shape this with Cowork" follow-up — TBD)
 *
 * The derivation runs at server-render time in page.tsx and feeds:
 *   - OpenItemsBanner (count + tap-target above the planning timeline)
 *   - OpenItemsSheet (grouped list opened via openSheet("openItems"))
 *
 * If task volume grows large enough that per-render computation becomes a
 * bottleneck, the next step is a materialized view or denormalized cache —
 * but the V1 expectation is single-event reads of < 100 milestones, well
 * within the "compute every read" budget.
 */

import type { OrgnzCustomMilestone } from "../../app/(platform)/orgnz/_lib/load-context";

/** A derived item that needs attention. */
export type OpenItem = {
  /** Stable React key — prefixed by source kind so future sources don't collide. */
  key: string;
  /** Display title. Falls back to "Reserved time" for unlabeled milestones. */
  title: string;
  /** Source kind — V1 only milestones; future sources land here. */
  kind: "milestone";
  /** ID of the source row (event_custom_milestones.id for kind='milestone'). */
  sourceId: string;
  /** Due date in YYYY-MM-DD form, or null when the source has no date. */
  dueDateIso: string | null;
  /** True when dueDateIso is in the past (today exclusive). */
  isOverdue: boolean;
  /** True when dueDateIso falls within the next 7 days (today inclusive). */
  isDueThisWeek: boolean;
  /** Optional vendor name from the source, for display context. */
  vendorName: string | null;
};

/** Counts for the banner — total open items + the urgent subset. */
export type OpenItemsCounts = {
  total: number;
  dueThisWeek: number;
  overdue: number;
};

/**
 * Derive Open Items from the loaded custom-milestone list.
 *
 * Pure function — no I/O. Caller supplies the milestones (already loaded by
 * loadOrgnzContext) and the current date (defaults to system time; tests
 * can pass a fixed date for determinism).
 */
export function deriveOpenItems(
  milestones: OrgnzCustomMilestone[],
  now: Date = new Date(),
): OpenItem[] {
  const todayStart = startOfDay(now);
  const weekHorizon = addDays(todayStart, 7);

  const items: OpenItem[] = [];

  for (const m of milestones) {
    // V1: only "unowned" rows surface. Pre-migration-050 backfill set every
    // existing row to "manually_defined" so existing milestones do NOT
    // suddenly appear in Open Items — preserves behavior per Cowork's rule.
    if (m.assignment_status !== "unowned") continue;

    const dueDate = parseIsoDate(m.custom_date);
    const isOverdue = dueDate !== null && dueDate < todayStart;
    const isDueThisWeek =
      dueDate !== null && dueDate >= todayStart && dueDate <= weekHorizon;

    items.push({
      key: `milestone:${m.id}`,
      title: (m.label ?? "").trim() || "Reserved time",
      kind: "milestone",
      sourceId: m.id,
      dueDateIso: m.custom_date,
      isOverdue,
      isDueThisWeek,
      vendorName: m.vendor_name ?? null,
    });
  }

  // Sort: overdue first (most urgent → least urgent), then due-this-week
  // (sooner first), then everything else (sorted by due date asc, NULL last).
  items.sort(compareOpenItems);

  return items;
}

/**
 * Compute counts from a derived OpenItem[] list. Banner reads these.
 */
export function computeOpenItemsCounts(items: OpenItem[]): OpenItemsCounts {
  let dueThisWeek = 0;
  let overdue = 0;
  for (const item of items) {
    if (item.isOverdue) overdue++;
    else if (item.isDueThisWeek) dueThisWeek++;
  }
  return { total: items.length, dueThisWeek, overdue };
}

// ─── helpers ───────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function parseIsoDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  // Anchor to local-midnight to compare against startOfDay(now).
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function compareOpenItems(a: OpenItem, b: OpenItem): number {
  // Overdue first
  if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
  // Due this week before "no date / future"
  if (a.isDueThisWeek !== b.isDueThisWeek) return a.isDueThisWeek ? -1 : 1;
  // Within same band, sort by due date ascending; NULL last
  if (a.dueDateIso === null && b.dueDateIso === null) return 0;
  if (a.dueDateIso === null) return 1;
  if (b.dueDateIso === null) return -1;
  return a.dueDateIso.localeCompare(b.dueDateIso);
}
