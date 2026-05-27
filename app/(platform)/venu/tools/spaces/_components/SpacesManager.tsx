"use client";

import { useState } from "react";
import type { VenueSpace } from "@/lib/venu/availability-shared";
import { SpaceSheet } from "./SpaceSheet";
import { SpaceRow } from "./SpaceRow";
import s from "./SpacesManager.module.css";

/**
 * Wraps the list display + Add-Space CTA + SpaceSheet open/close state.
 * Server component (page.tsx) fetches the spaces; this Client Component
 * owns the interaction layer.
 */
type Props = {
  spaces: VenueSpace[];
};

export function SpacesManager({ spaces }: Props) {
  const [sheetMode, setSheetMode] = useState<
    { kind: "closed" } | { kind: "create" } | { kind: "edit"; space: VenueSpace }
  >({ kind: "closed" });

  return (
    <div className={s.page}>
      <section className={s.intro}>
        <h2 className={s.heading}>Your spaces</h2>
        <p className={s.hint}>
          Add the rooms, halls, or outdoor areas you book separately.
          Pricing + capacity show on inquiries; archived spaces stay
          listed here in case you want to bring them back.
        </p>
        <button
          type="button"
          className={s.addBtn}
          onClick={() => setSheetMode({ kind: "create" })}
        >
          + Add a space
        </button>
      </section>

      <section className={s.listSection}>
        {spaces.length === 0 ? (
          <div className={s.emptyState}>
            No spaces yet. Tap <b>Add a space</b> to get started — start with
            your main room.
          </div>
        ) : (
          <div className={s.list}>
            {spaces.map((sp) => (
              <SpaceRow
                key={sp.id}
                space={sp}
                onEdit={() => setSheetMode({ kind: "edit", space: sp })}
              />
            ))}
          </div>
        )}
      </section>

      {sheetMode.kind === "create" && (
        <SpaceSheet
          space={null}
          onClose={() => setSheetMode({ kind: "closed" })}
        />
      )}
      {sheetMode.kind === "edit" && (
        <SpaceSheet
          space={sheetMode.space}
          onClose={() => setSheetMode({ kind: "closed" })}
        />
      )}
    </div>
  );
}
