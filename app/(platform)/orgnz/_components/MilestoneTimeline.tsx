import { getMilestones, type MilestoneWithStatus } from "@/data/event-milestones";
import type { CategoryKey } from "@/data/budget-presets";
import styles from "../dashboard.module.css";

type Props = {
  category: CategoryKey | null;
  startDateIso: string; // YYYY-MM-DD
};

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthsUntil(startDateIso: string): number {
  const start = new Date(startDateIso + "T00:00:00").getTime();
  const now = Date.now();
  return Math.max(0, (start - now) / (1000 * 60 * 60 * 24 * 30.44));
}

function milestoneDate(startDateIso: string, lead: number): { mo: string; dy: string } {
  const start = new Date(startDateIso + "T00:00:00");
  const target = new Date(start);
  target.setDate(target.getDate() - Math.round(lead * 30.44));
  return {
    mo: MONTH_LABELS[target.getMonth()],
    dy: String(target.getDate()).padStart(2, "0"),
  };
}

function statusToTag(status: MilestoneWithStatus["status"]): {
  label: string;
  className: string;
} {
  if (status === "now") return { label: "This week", className: styles.ttNow };
  if (status === "next") return { label: "Up next", className: styles.ttNext };
  if (status === "done") return { label: "Done", className: styles.ttDone };
  return { label: "Open", className: styles.ttOpen };
}

export function MilestoneTimeline({ category, startDateIso }: Props) {
  const horizonMonths = monthsUntil(startDateIso);
  // event_subtype isn't persisted yet (PARKING_LOT #10) — pass null and let
  // getMilestones() fall through to the generic timeline. When the subtype
  // column lands, pass it through here.
  const milestones = getMilestones(category ?? "wedding", null, horizonMonths);

  return (
    <div className={styles.timelineCard}>
      {milestones.map((m, i) => {
        const date = milestoneDate(startDateIso, m.lead);
        const tag = statusToTag(m.status);
        return (
          <div key={m.label + i} className={styles.tli}>
            <div className={styles.tlL}>
              <div className={styles.tlMo}>{date.mo}</div>
              <div className={styles.tlDy}>{date.dy}</div>
            </div>
            <div className={styles.tlLine} />
            <div className={styles.tlBody}>
              <div className={styles.tlT}>{m.label}</div>
              {m.detail ? <div className={styles.tlS}>{m.detail}</div> : null}
            </div>
            <div className={`${styles.tlTag} ${tag.className}`}>{tag.label}</div>
          </div>
        );
      })}
    </div>
  );
}
