"use client";

import { useCallback, useEffect, useState } from "react";
import { onSheetChange, openSheet, type SheetName } from "../_lib/sheet";
import { BudgetSheet, type BudgetSheetData } from "./sheets/BudgetSheet";
import { GuestsSheet } from "./sheets/GuestsSheet";
import { OpenItemsSheet } from "./sheets/OpenItemsSheet";
import { VendorsSheet } from "./sheets/VendorsSheet";
import { PlnrSheet } from "./sheets/PlnrSheet";
import { VenuSheet } from "./sheets/VenuSheet";
import { CrisisModal } from "./CrisisModal";
import { PadrinoModal } from "./PadrinoModal";
import { TravelModal } from "./TravelModal";
import type { OpenItem } from "@/lib/events/open-items";

type Props = {
  budget: BudgetSheetData;
  hasVenu: boolean;
  openItems: OpenItem[];
};

export function SheetManager({ budget, hasVenu, openItems }: Props) {
  const [open, setOpen] = useState<SheetName>(null);

  useEffect(() => onSheetChange(setOpen), []);

  const close = useCallback(() => openSheet(null), []);

  return (
    <>
      <BudgetSheet open={open === "budget"} onClose={close} data={budget} />
      <VendorsSheet open={open === "vendors"} onClose={close} hasVenu={hasVenu} />
      <PlnrSheet open={open === "plnr"} onClose={close} />
      <VenuSheet open={open === "venu"} onClose={close} hasVenu={hasVenu} />
      <GuestsSheet open={open === "guests"} onClose={close} />
      <OpenItemsSheet
        open={open === "openItems"}
        onClose={close}
        items={openItems}
      />
      <PadrinoModal />
      <TravelModal />
      <CrisisModal />
    </>
  );
}
