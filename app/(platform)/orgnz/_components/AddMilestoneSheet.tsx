"use client";

import { useEffect, useState } from "react";
import s from "../orgnz.module.css";
import { CulturalTraditionsPicker } from "./CulturalTraditionsPicker";
import { CatalogMilestonePicker } from "./CatalogMilestonePicker";
import { CustomMilestoneForm } from "./CustomMilestoneForm";
import { categoryForSubtype, type CategoryKey } from "@/data/budget-presets";

const VALID_CATEGORIES: CategoryKey[] = ["wedding", "corporate", "nonprofit", "public", "social"];

type Tab = "traditions" | "free";

type Props = {
  open: boolean;
  eventId: string;
  startDateIso: string;
  /** event.event_type — threaded to CustomMilestoneForm so phase chip labels
   *  reflect the event's flavor (wedding-flavored, corporate-flavored, etc.). */
  eventType: string | null;
  subtypeKey: string | null;
  existingKeys: Set<string>;
  dismissedSeedKeys: Set<string>;
  onClose: () => void;
};

export function AddMilestoneSheet({
  open,
  eventId,
  startDateIso,
  eventType,
  subtypeKey,
  existingKeys,
  dismissedSeedKeys,
  onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>("traditions");

  // Category drives which "Browse" picker to show: weddings browse cultural
  // ceremonies; every other category browses its event-type milestone catalog.
  const category: CategoryKey =
    categoryForSubtype(subtypeKey) ??
    (eventType && (VALID_CATEGORIES as string[]).includes(eventType)
      ? (eventType as CategoryKey)
      : "social");
  const isWedding = category === "wedding";

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

  return (
    <>
      <div className={s.scrim} onClick={onClose} />
      <aside
        className={`${s.drawer} ${s.drawerOpen} ${s.addSheet}`}
        role="dialog"
        aria-modal="true"
      >
        <div className={s.drawerHandle} />
        <div className={s.drawerHead}>
          <div className={s.drawerHeadL}>
            <div className={s.drawerEye}>Add to timeline</div>
            <h3 className={s.drawerTitle}>
              <em>What belongs here?</em>
            </h3>
          </div>
          <button type="button" className={s.drawerClose} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={s.addTabs}>
          <button
            type="button"
            className={`${s.addTab} ${tab === "traditions" ? s.addTabOn : ""}`}
            onClick={() => setTab("traditions")}
          >
            {isWedding ? "Browse traditions" : "Suggested milestones"}
          </button>
          <button
            type="button"
            className={`${s.addTab} ${tab === "free" ? s.addTabOn : ""}`}
            onClick={() => setTab("free")}
          >
            Add your own
          </button>
        </div>

        <div className={s.drawerBody}>
          {tab === "traditions" ? (
            isWedding ? (
              <CulturalTraditionsPicker
                eventId={eventId}
                startDateIso={startDateIso}
                subtypeKey={subtypeKey}
                existingKeys={existingKeys}
                dismissedSeedKeys={dismissedSeedKeys}
                onDone={onClose}
              />
            ) : (
              <CatalogMilestonePicker
                eventId={eventId}
                startDateIso={startDateIso}
                category={category}
                subtypeKey={subtypeKey}
                existingKeys={existingKeys}
                onDone={onClose}
              />
            )
          ) : (
            <CustomMilestoneForm
              eventId={eventId}
              defaultDateIso={startDateIso}
              eventType={eventType}
              onDone={onClose}
              note="Type whatever you want. Leave the name blank if you'd rather not say."
            />
          )}
        </div>
      </aside>
    </>
  );
}
