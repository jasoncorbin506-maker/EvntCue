"use client";

import { useCallback, useEffect, useState } from "react";
import { onSheetChange, openSheet, type SheetName } from "../_lib/sheet";
import { BudgetSheet, type BudgetSheetData } from "./sheets/BudgetSheet";
import { GuestsSheet } from "./sheets/GuestsSheet";
import { OpenItemsSheet } from "./sheets/OpenItemsSheet";
import { VenuSheet } from "./sheets/VenuSheet";
import { NotesTodoSheet, type MilestoneAnchor } from "./sheets/NotesTodoSheet";
import { CrisisModal } from "./CrisisModal";
import { PadrinoModal } from "./PadrinoModal";
import { TravelModal } from "./TravelModal";
import type { OpenItem } from "@/lib/events/open-items";
import type { OrgnzNote, OrgnzTodoItem } from "../_lib/load-context";

type Props = {
  budget: BudgetSheetData;
  hasVenu: boolean;
  openItems: OpenItem[];
  /** PL #91 — aggregated Notes & To-Do sheet inputs. */
  eventId: string;
  milestoneAnchors: MilestoneAnchor[];
  notes: OrgnzNote[];
  todos: OrgnzTodoItem[];
};

export function SheetManager({
  budget,
  hasVenu,
  openItems,
  eventId,
  milestoneAnchors,
  notes,
  todos,
}: Props) {
  const [open, setOpen] = useState<SheetName>(null);

  useEffect(() => onSheetChange(setOpen), []);

  const close = useCallback(() => openSheet(null), []);

  return (
    <>
      <BudgetSheet open={open === "budget"} onClose={close} data={budget} />
      <VenuSheet open={open === "venu"} onClose={close} hasVenu={hasVenu} />
      <GuestsSheet open={open === "guests"} onClose={close} />
      <OpenItemsSheet
        open={open === "openItems"}
        onClose={close}
        items={openItems}
      />
      <NotesTodoSheet
        open={open === "notesTodo"}
        onClose={close}
        eventId={eventId}
        anchors={milestoneAnchors}
        notes={notes}
        todos={todos}
      />
      <PadrinoModal />
      <TravelModal />
      <CrisisModal />
    </>
  );
}
