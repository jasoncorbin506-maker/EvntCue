"use client";

import { useState } from "react";
import { AvailabilityBlockSheet } from "./AvailabilityBlockSheet";
import type { VenueSpace } from "@/lib/venu/availability-shared";
import s from "./AddBlockButton.module.css";

/**
 * Trigger pill that mounts the AvailabilityBlockSheet. Lives in the
 * Manual blocks section header.
 */

type Props = {
  spaces: VenueSpace[];
};

export function AddBlockButton({ spaces }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={s.button}
        onClick={() => setOpen(true)}
      >
        + Add block
      </button>
      {open && (
        <AvailabilityBlockSheet
          spaces={spaces}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
