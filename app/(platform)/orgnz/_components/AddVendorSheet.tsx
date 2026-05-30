"use client";

import { useEffect, useState, useTransition } from "react";
import {
  PHASE_LABELS,
  PHASE_ORDER,
} from "@/data/run-of-show/dispatch";
import type { RoSPhase } from "@/data/run-of-show/types";
import { addVendorPresence } from "../_actions/add-vendor-presence";
import { showToast } from "../_lib/toast";
import s from "./AddVendorSheet.module.css";
import orgnzStyles from "../orgnz.module.css";

type Props = {
  open: boolean;
  eventId: string;
  onClose: () => void;
  onAdded?: (presenceId: string) => void;
};

/**
 * Generic-entry bottom sheet for adding a vendor presence — Concept C
 * session B per Cowork's v2-vertical brief Call 2.
 *
 * Triggered by the "+ Add vendor" affordance in VendorsAtEventSection.
 * Content (top → bottom): roster picker placeholder → "or" divider →
 * manual vendor name + role label → multi-select phase chips → optional
 * notes (collapsed disclosure) → Cancel / Add footer.
 *
 * Phase chips are multi-select, all 12 RoS phases. At least one phase
 * required; submit button disabled with inline hint until vendor name +
 * 1 phase set (Lock 22 — warnings inform, never modal-block).
 *
 * Vndr roster integration (V-2b) populates the placeholder section with
 * real roster data when shipped. V-1 ships the "Connect your Vndr roster"
 * CTA stub.
 */
export function AddVendorSheet({ open, eventId, onClose, onAdded }: Props) {
  const [vendorName, setVendorName] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [phases, setPhases] = useState<Set<RoSPhase>>(new Set());
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Reset state when sheet closes (so re-open is fresh).
  useEffect(() => {
    if (!open) {
      setVendorName("");
      setRoleLabel("");
      setPhases(new Set());
      setNotes("");
      setNotesOpen(false);
      setError(null);
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
  }, [open, onClose]);

  if (!open) return null;

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
        notes: notes.trim() || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      showToast(
        `<em>${roleLabel.trim() || vendorName.trim()}</em> added to your Vndrs.`,
      );
      onAdded?.(res.id);
      onClose();
    });
  }

  return (
    <>
      <div className={orgnzStyles.scrim} onClick={onClose} />
      <aside
        className={`${orgnzStyles.drawer} ${orgnzStyles.drawerOpen}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-vendor-title"
      >
        <div className={orgnzStyles.drawerHandle} />
        <div className={orgnzStyles.drawerHead}>
          <div className={orgnzStyles.drawerHeadL}>
            <div className={orgnzStyles.drawerEye}>Add to event</div>
            <h3 className={orgnzStyles.drawerTitle} id="add-vendor-title">
              <em>Add a Vndr</em>
            </h3>
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
          {/* Roster picker — V-1 placeholder; V-2b populates with real data. */}
          <div className={s.rosterSection}>
            <div className={s.sectionLabel}>From your Vndr roster</div>
            <div className={s.rosterPlaceholder}>
              <p className={s.rosterPlaceholderText}>
                Connect your Vndr roster to pick saved vendors with one tap.
              </p>
              <button
                type="button"
                className={s.rosterCta}
                onClick={() =>
                  showToast("Vndr roster connection opens when Vndr Discover launches.")
                }
              >
                Connect Vndr roster →
              </button>
            </div>
          </div>

          <div className={s.divider} aria-hidden="true">
            <span>or</span>
          </div>

          {/* Manual vendor entry */}
          <label className={s.field}>
            <span className={s.fieldL}>Vndr name</span>
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
              placeholder="e.g., photographer, officiant, Venu coordinator"
              maxLength={100}
              autoComplete="off"
            />
            <span className={s.hint}>
              Shown as the primary label in the cast list. Vndr name appears beneath.
            </span>
          </label>

          {/* Multi-select phase chips */}
          <div className={s.field}>
            <span className={s.fieldL}>Active during which phases?</span>
            <div className={s.chipRow}>
              {PHASE_ORDER.map((phase) => {
                const selected = phases.has(phase);
                return (
                  <button
                    key={phase}
                    type="button"
                    className={`${s.chip} ${selected ? s.chipOn : ""}`}
                    onClick={() => togglePhase(phase)}
                    aria-pressed={selected}
                  >
                    {PHASE_LABELS[phase]}
                  </button>
                );
              })}
            </div>
            <span className={s.hint}>
              {phases.size === 0
                ? "Pick at least one phase. Multi-select OK — a photographer might cover 4–5 phases."
                : `${phases.size} of 12 phases selected.`}
            </span>
          </div>

          {/* Optional notes (collapsed disclosure) */}
          <div className={s.field}>
            {!notesOpen ? (
              <button
                type="button"
                className={s.notesToggle}
                onClick={() => setNotesOpen(true)}
              >
                + Add a note about this Vndr
              </button>
            ) : (
              <>
                <span className={s.fieldL}>Notes (optional)</span>
                <textarea
                  className={s.textarea}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything you want to remember about this Vndr"
                  maxLength={1000}
                  rows={3}
                />
              </>
            )}
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
              title={
                !canSubmit
                  ? vendorName.trim().length === 0
                    ? "Enter a Vndr name"
                    : "Select at least one phase"
                  : undefined
              }
            >
              {pending ? "Adding…" : "Add to event"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
