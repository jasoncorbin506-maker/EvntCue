"use client";

import { useEffect, useState, useTransition } from "react";
import {
  PHASE_LABELS,
  PHASE_ORDER,
} from "@/data/run-of-show/dispatch";
import type { RoSPhase } from "@/data/run-of-show/types";
import { addVendorPresence } from "../_actions/add-vendor-presence";
import { showToast } from "../_lib/toast";
import s from "./AddVendorPopup.module.css";
import orgnzStyles from "../orgnz.module.css";

type Props = {
  /** When set, the popup is open + anchored to this phase. Null when closed. */
  prefillPhase: RoSPhase | null;
  eventId: string;
  onClose: () => void;
  onAdded?: (presenceId: string) => void;
};

/**
 * Phase-anchored popup for adding a vendor presence — Concept C session B
 * per Cowork's v2-vertical brief Call 2.
 *
 * Triggered by the "+" affordance in any phase group header. Pre-fills the
 * tapped phase as the initial selection (visually emphasized); user can
 * multi-select additional phases inline. Same submit path as AddVendorSheet.
 *
 * Compact compared to the sheet (no notes, no roster section) — phase-
 * specific entry has narrower intent. User wants to add a vendor present
 * in THIS phase; expansion to multiple phases is one-tap from there.
 *
 * On mobile (390px) the popup expands to nearly full width, anchored from
 * the top per Cowork's spec ("downward-opening dropdown style"). Renders
 * as a scrim + centered card on mobile for tap-outside-to-close UX.
 */
export function AddVendorPopup({
  prefillPhase,
  eventId,
  onClose,
  onAdded,
}: Props) {
  const [vendorName, setVendorName] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [phases, setPhases] = useState<Set<RoSPhase>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (prefillPhase === null) {
      setVendorName("");
      setRoleLabel("");
      setPhases(new Set());
      setError(null);
      return;
    }
    // Open: pre-select the triggering phase.
    setPhases(new Set([prefillPhase]));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [prefillPhase, onClose]);

  if (prefillPhase === null) return null;

  function togglePhase(phase: RoSPhase) {
    setPhases((cur) => {
      const next = new Set(cur);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  }

  const canSubmit = vendorName.trim().length > 0 && phases.size > 0;

  function handleSubmit() {
    if (!canSubmit || pending) return;
    setError(null);
    startTransition(async () => {
      const res = await addVendorPresence({
        eventId,
        vendorName: vendorName.trim(),
        roleLabel: roleLabel.trim() || null,
        phases: Array.from(phases),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      showToast(
        `<em>${roleLabel.trim() || vendorName.trim()}</em> added to ${PHASE_LABELS[prefillPhase!]}.`,
      );
      onAdded?.(res.id);
      onClose();
    });
  }

  return (
    <>
      <div className={orgnzStyles.scrim} onClick={onClose} />
      <div
        className={s.popup}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-vendor-popup-title"
      >
        <div className={s.head}>
          <div className={s.headL}>
            <div className={s.eye}>Add vendor</div>
            <h3 className={s.title} id="add-vendor-popup-title">
              Present in <em>{PHASE_LABELS[prefillPhase]}</em>
            </h3>
          </div>
          <button
            type="button"
            className={s.close}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className={s.body}>
          <label className={s.field}>
            <span className={s.fieldL}>Vendor name</span>
            <input
              type="text"
              className={s.input}
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g., Marigold Photography"
              maxLength={200}
              autoComplete="off"
            />
          </label>

          <label className={s.field}>
            <span className={s.fieldL}>Role (optional)</span>
            <input
              type="text"
              className={s.input}
              value={roleLabel}
              onChange={(e) => setRoleLabel(e.target.value)}
              placeholder="e.g., photographer, officiant"
              maxLength={100}
              autoComplete="off"
            />
          </label>

          <div className={s.field}>
            <span className={s.fieldL}>Also present in (optional)</span>
            <div className={s.chipRow}>
              {PHASE_ORDER.map((phase) => {
                const selected = phases.has(phase);
                const isPrefill = phase === prefillPhase;
                return (
                  <button
                    key={phase}
                    type="button"
                    className={`${s.chip} ${selected ? s.chipOn : ""} ${isPrefill ? s.chipPrefill : ""}`}
                    onClick={() => togglePhase(phase)}
                    aria-pressed={selected}
                  >
                    {PHASE_LABELS[phase]}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className={s.errorBanner} role="alert">
              {error}
            </div>
          )}

          <div className={s.actions}>
            <button type="button" className={s.cancel} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={`${s.submit} ${!canSubmit ? s.submitDisabled : ""}`}
              onClick={handleSubmit}
              disabled={!canSubmit || pending}
            >
              {pending ? "Adding…" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
