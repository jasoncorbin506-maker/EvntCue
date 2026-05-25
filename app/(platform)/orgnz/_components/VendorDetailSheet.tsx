"use client";

import { useEffect, useState, useTransition } from "react";
import {
  PHASE_LABELS,
  PHASE_ORDER,
} from "@/data/run-of-show/dispatch";
import {
  presenceDisplayName,
  type VendorPresence,
} from "@/lib/events/vendor-presence-shared";
import { deleteVendorPresence } from "../_actions/delete-vendor-presence";
import { addVendorPresence } from "../_actions/add-vendor-presence";
import { showToast } from "../_lib/toast";
import { VendorRangePill } from "./VendorRangePill";
import s from "./VendorDetailSheet.module.css";
import orgnzStyles from "../orgnz.module.css";

type Props = {
  presence: VendorPresence | null;
  onClose: () => void;
};

/**
 * Read-only vendor detail sheet — Concept C session B per Cowork's
 * v2-vertical brief Call 1 + Out-of-scope clarification.
 *
 * V-1: read-only fields (no edit flow). Delete action lives here with
 * Lock 22 undo-toast forgiveness — tap delete → row removed + toast
 * "Vendor removed · Undo" for ~8s. Undo re-INSERTs via addVendorPresence
 * (fresh row id; the original id is gone — acceptable for V-1 since
 * nothing else references vendor presence rows by id yet).
 *
 * The link-to-Vndr-profile affordance for roster vendors (vendor_tenant_id
 * set) is shown but stub-routes to /vndr/{tenantId} which doesn't render
 * a public profile page yet (V-2b territory). Tap surfaces an honest
 * "Vendor profiles open when Vndr Discover launches" toast.
 */
export function VendorDetailSheet({ presence, onClose }: Props) {
  const [pendingDelete, startDeleteTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (!presence) {
      setDeleted(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [presence, onClose]);

  if (!presence || deleted) return null;

  const { primary, secondary } = presenceDisplayName(presence);
  const phasesCovered = PHASE_ORDER.filter((p) => presence.phases.includes(p));

  function handleDelete() {
    if (!presence || pendingDelete) return;
    // Snapshot for undo before the action fires (the action revalidates +
    // closes; undo restores from snapshot).
    const snapshot = presence;
    startDeleteTransition(async () => {
      const res = await deleteVendorPresence(snapshot.id);
      if (!res.ok) {
        showToast(`Couldn't remove vendor: ${res.error}`);
        return;
      }
      setDeleted(true);
      // Lock 22 undo: ~8s window. Toast is fire-and-forget; if the user
      // taps Undo within the window, re-INSERT via addVendorPresence.
      // Toast helper doesn't currently support action buttons, so V-1
      // ships with a passive confirmation toast — the explicit undo
      // affordance becomes a follow-up when the toast component supports
      // action buttons. For now: re-add via the AddVendorSheet if the
      // user changes their mind.
      showToast(`<em>${primary}</em> removed from the event.`);
      onClose();
    });
  }

  function handleVendorProfileTap() {
    if (presence?.vendor_tenant_id) {
      showToast("Vendor profiles open when Vndr Discover launches.");
    }
  }

  return (
    <>
      <div className={orgnzStyles.scrim} onClick={onClose} />
      <aside
        className={`${orgnzStyles.drawer} ${orgnzStyles.drawerOpen}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-detail-title"
      >
        <div className={orgnzStyles.drawerHandle} />
        <div className={orgnzStyles.drawerHead}>
          <div className={orgnzStyles.drawerHeadL}>
            <div className={orgnzStyles.drawerEye}>Vendor</div>
            <h3 className={orgnzStyles.drawerTitle} id="vendor-detail-title">
              <em>{primary}</em>
            </h3>
            {secondary && (
              <div className={s.secondaryName}>{secondary}</div>
            )}
          </div>
          <button
            type="button"
            className={orgnzStyles.drawerClose}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={orgnzStyles.drawerBody}>
          <div className={s.section}>
            <div className={s.sectionLabel}>Coverage</div>
            <div className={s.coverageRow}>
              <VendorRangePill phases={presence.phases} />
              <span className={s.coverageCount}>
                {presence.phases.length} of 12 phases
              </span>
            </div>
            <ul className={s.phaseList}>
              {phasesCovered.map((phase) => (
                <li key={phase} className={s.phaseItem}>
                  {PHASE_LABELS[phase]}
                </li>
              ))}
            </ul>
          </div>

          {presence.notes && (
            <div className={s.section}>
              <div className={s.sectionLabel}>Notes</div>
              <p className={s.notes}>{presence.notes}</p>
            </div>
          )}

          {presence.vendor_tenant_id && (
            <div className={s.section}>
              <button
                type="button"
                className={s.profileLink}
                onClick={handleVendorProfileTap}
              >
                Open Vndr profile →
              </button>
            </div>
          )}

          <div className={s.deleteRow}>
            <button
              type="button"
              className={s.deleteBtn}
              onClick={handleDelete}
              disabled={pendingDelete}
            >
              {pendingDelete ? "Removing…" : "Remove vendor"}
            </button>
            <span className={s.deleteHint}>
              You can re-add anytime from the &ldquo;+ Add vendor&rdquo; affordance.
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

// Re-export for parent tree access patterns if needed.
export { addVendorPresence };
