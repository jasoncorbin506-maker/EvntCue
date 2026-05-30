"use client";

import { useState } from "react";
import { CsvImportSheet } from "./CsvImportSheet";
import type { VenueSpace } from "@/lib/venu/availability-shared";
import s from "./ImportCsvButton.module.css";

/**
 * Trigger pill that mounts the CsvImportSheet wizard. Lives in the CSV-import
 * section header on /venu/availability.
 */

type Props = {
  spaces: VenueSpace[];
};

export function ImportCsvButton({ spaces }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={s.button} onClick={() => setOpen(true)}>
        Import from CSV
      </button>
      {open && <CsvImportSheet spaces={spaces} onClose={() => setOpen(false)} />}
    </>
  );
}
