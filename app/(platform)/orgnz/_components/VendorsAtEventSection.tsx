"use client";

import {
  presenceDisplayName,
  type VendorPresence,
} from "@/lib/events/vendor-presence-shared";
import { VendorRangePill } from "./VendorRangePill";
import s from "./VendorsAtEventSection.module.css";

type Props = {
  /** Already-sorted presences (parent sorts via sortPresences before passing). */
  presences: VendorPresence[];
  onAddTap: () => void;
  onRowTap: (presenceId: string) => void;
};

/**
 * Top cast-list section — Concept C session B per Cowork's v2-vertical
 * brief Call 1.
 *
 * Lives above the first phase group in RunOfShow. Renders all event-level
 * vendors as rows: role label (primary) + vendor name (secondary if both
 * set) + VendorRangePill showing phase coverage. "+ Add vendor" affordance
 * at the bottom. Warm-prose empty state when no presences exist yet.
 *
 * Each row carries `data-presence-id` so parent can smooth-scroll to it
 * when a VendorPresenceDots dot is tapped (the orientation pulse).
 */
export function VendorsAtEventSection({
  presences,
  onAddTap,
  onRowTap,
}: Props) {
  return (
    <section className={s.section} data-vendors-section>
      <div className={s.header}>Vndrs</div>

      {presences.length === 0 ? (
        <div className={s.empty}>
          No Vndrs added yet.{" "}
          <em>Tap + to add the people making your event happen.</em>
        </div>
      ) : (
        <div className={s.rows}>
          {presences.map((presence) => {
            const { primary, secondary } = presenceDisplayName(presence);
            return (
              <button
                key={presence.id}
                type="button"
                className={s.row}
                data-presence-id={presence.id}
                onClick={() => onRowTap(presence.id)}
                aria-label={`${primary} — view details`}
              >
                <div className={s.rowL}>
                  <div className={s.primary}>{primary}</div>
                  {secondary && <div className={s.secondary}>{secondary}</div>}
                </div>
                <div className={s.rowR}>
                  <VendorRangePill phases={presence.phases} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button type="button" className={s.addBtn} onClick={onAddTap}>
        <span className={s.addPlus} aria-hidden="true">
          +
        </span>
        <span>Add Vndr</span>
      </button>
    </section>
  );
}
