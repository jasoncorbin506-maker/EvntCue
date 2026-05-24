"use client";

import { useEffect } from "react";
import s from "../../orgnz.module.css";
import type { OpenItem } from "@/lib/events/open-items";

type Props = {
  open: boolean;
  onClose: () => void;
  items: OpenItem[];
};

/**
 * Open Items sheet — lists everything that needs attention on this event.
 *
 * Per Cowork's vendor-task-model design brief: tasks are NOT a primitive;
 * this sheet renders a derived view computed at page-render time
 * (lib/events/open-items.ts). V1 source: event_custom_milestones WHERE
 * assignment_status = 'unowned'. Future sources (flagged notes,
 * recipe-seeded checklist items) plug into the same surface.
 *
 * Grouping: by urgency band — Overdue → Due this week → Later / no date.
 * Empty groups don't render. Lock 22 framing — surface what NEEDS attention,
 * don't bury anything.
 */
export function OpenItemsSheet({ open, onClose, items }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const overdue = items.filter((it) => it.isOverdue);
  const dueThisWeek = items.filter((it) => !it.isOverdue && it.isDueThisWeek);
  const later = items.filter((it) => !it.isOverdue && !it.isDueThisWeek);

  return (
    <>
      <div className={s.scrim} onClick={onClose} />
      <aside
        className={`${s.drawer} ${s.drawerOpen}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="open-items-title"
      >
        <div className={s.drawerHandle} />
        <div className={s.drawerHead}>
          <div className={s.drawerHeadL}>
            <div className={s.drawerEye}>Needs your attention</div>
            <h3 className={s.drawerTitle} id="open-items-title">
              <em>Open items</em>
            </h3>
          </div>
          <button
            type="button"
            className={s.drawerClose}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={s.drawerBody}>
          {items.length === 0 ? (
            <div className={s.openItemsEmpty}>
              Nothing needs your attention right now. <em>Breathe.</em>
            </div>
          ) : (
            <>
              {overdue.length > 0 && (
                <OpenItemsGroup
                  label="Overdue"
                  labelClass={s.openItemsGroupOverdue}
                  items={overdue}
                />
              )}
              {dueThisWeek.length > 0 && (
                <OpenItemsGroup label="Due this week" items={dueThisWeek} />
              )}
              {later.length > 0 && (
                <OpenItemsGroup label="Later" items={later} />
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function OpenItemsGroup({
  label,
  labelClass,
  items,
}: {
  label: string;
  labelClass?: string;
  items: OpenItem[];
}) {
  return (
    <div className={s.openItemsGroup}>
      <div className={`${s.openItemsGroupLabel} ${labelClass ?? ""}`}>
        {label} · {items.length}
      </div>
      {items.map((item) => (
        <div key={item.key} className={s.openItemsRow}>
          <div className={s.openItemsRowBody}>
            <div className={s.openItemsRowT}>{item.title}</div>
            <div className={s.openItemsRowMeta}>
              {item.dueDateIso ? formatDueChip(item.dueDateIso) : "No date"}
              {item.vendorName && (
                <>
                  <span className={s.openItemsRowMetaDot} aria-hidden="true">
                    ·
                  </span>
                  <span>{item.vendorName}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDueChip(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}
