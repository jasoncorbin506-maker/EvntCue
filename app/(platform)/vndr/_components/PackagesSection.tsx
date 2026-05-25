"use client";

import { useState } from "react";
import type { VndrPackage } from "@/lib/vndr/packages-shared";
import { PackageRow } from "./PackageRow";
import { EditPackageSheet } from "./EditPackageSheet";
import s from "../vndr.module.css";

/**
 * V-2b smoke-fix (session 23 — brief G4 + G5): client wrapper around the
 * Home tab's Packages section. Owns the EditPackageSheet open/close state
 * so PackageRow stays focused on its slider + visibility toggle, and the
 * "+ Add package" header button can also trigger the create-mode sheet.
 *
 * Wires:
 *   - "+ Add" button in section header → open sheet in create mode (pkg=null)
 *   - Tap on a PackageRow's "Edit" affordance → open sheet in edit mode
 *   - Sheet save/delete → action revalidates the parent route; sheet closes
 */

type Props = {
  packages: VndrPackage[];
};

export function PackagesSection({ packages }: Props) {
  const [editingPkg, setEditingPkg] = useState<VndrPackage | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <section className={s.section}>
      <div className={s.sectionH}>
        <div className={s.sectionT}>Packages</div>
        <button
          type="button"
          className={s.sectionAddBtn}
          onClick={() => setCreateOpen(true)}
        >
          + Add
        </button>
      </div>
      <div className={s.pkgList}>
        {packages.length === 0 ? (
          <div className={s.emptyState}>
            <div className={s.emptyStateIcon} aria-hidden="true">+</div>
            <div className={s.emptyStateTitle}>No packages yet</div>
            <div className={s.emptyStateBody}>
              Packages are the offerings organizers compare and book. Add at
              least one to start receiving relevant inquiries.
            </div>
          </div>
        ) : (
          packages.map((pkg) => (
            <PackageRow
              key={pkg.id}
              pkg={pkg}
              onEdit={() => setEditingPkg(pkg)}
            />
          ))
        )}
      </div>

      {createOpen && (
        <EditPackageSheet pkg={null} onClose={() => setCreateOpen(false)} />
      )}
      {editingPkg && (
        <EditPackageSheet
          pkg={editingPkg}
          onClose={() => setEditingPkg(null)}
        />
      )}
    </section>
  );
}
