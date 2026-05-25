"use client";

import { useState, useTransition } from "react";
import { upsertPackage } from "../_actions/upsert-package";
import { deletePackage } from "../_actions/delete-package";
import { upsertPackageAddon } from "../_actions/upsert-package-addon";
import { deletePackageAddon } from "../_actions/delete-package-addon";
import type { VndrPackage } from "@/lib/vndr/packages-shared";
import s from "./InquiryDetailSheet.module.css";
import t from "./EditPackageSheet.module.css";

/**
 * V-2b smoke-fix (session 23 — brief G4/G5/G6): bottom-sheet for creating
 * + editing + deleting vendor packages, plus add/remove addons. Reuses
 * InquiryDetailSheet.module.css for the drawer shell; package-specific
 * controls live in EditPackageSheet.module.css.
 *
 * Modes:
 *   - "create" (no pkg prop): empty form; no delete button; no addons
 *     surface (addons need a parent package_id, so they're add-after-save).
 *   - "edit" (pkg prop set): pre-populated form; delete-package button
 *     with 2-step confirm; addon list with per-row delete + inline "+ Add
 *     addon" form.
 *
 * V-2c follow-ups (out of scope here): editing existing addons (currently
 * delete-then-re-add), addon reorder, package reorder, package archive
 * (vs hard delete).
 */

type Props = {
  pkg: VndrPackage | null; // null = create mode
  onClose: () => void;
};

function dollarsFromCents(cents: number): string {
  return (cents / 100).toString();
}

function centsFromDollarsStr(str: string): number | null {
  const n = Number(str);
  if (!str.trim() || !Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function EditPackageSheet({ pkg, onClose }: Props) {
  const isCreate = pkg === null;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Local form state mirrors the package shape.
  const [name, setName] = useState(pkg?.name ?? "");
  const [description, setDescription] = useState(pkg?.description ?? "");
  const [priceStr, setPriceStr] = useState(
    pkg ? dollarsFromCents(pkg.priceCents) : "",
  );
  const [referralPct, setReferralPct] = useState(pkg?.referralPct ?? 10);
  const [isVisible, setIsVisible] = useState(pkg?.isVisible ?? true);

  // Addon-related state (edit mode only).
  const [addons, setAddons] = useState(pkg?.addons ?? []);
  const [addonFormOpen, setAddonFormOpen] = useState(false);
  const [addonName, setAddonName] = useState("");
  const [addonPriceStr, setAddonPriceStr] = useState("");

  function handleSave() {
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Package name is required.");
      return;
    }
    const cents = centsFromDollarsStr(priceStr);
    if (cents === null) {
      setError("Price must be a number ≥ 0.");
      return;
    }
    if (referralPct < 0 || referralPct > 100) {
      setError("Referral % must be 0–100.");
      return;
    }

    startTransition(async () => {
      const res = await upsertPackage({
        id: pkg?.id,
        name: trimmedName,
        description: description.trim() || null,
        priceCents: cents,
        referralPct,
        isVisible,
        displayOrder: pkg?.displayOrder,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onClose();
    });
  }

  function handleDeletePackage() {
    if (!pkg) return;
    setError(null);
    startTransition(async () => {
      const res = await deletePackage(pkg.id);
      if (!res.ok) {
        setError(res.error);
        setConfirmDelete(false);
        return;
      }
      onClose();
    });
  }

  function handleAddAddon() {
    if (!pkg) return;
    setError(null);
    const trimmedName = addonName.trim();
    if (!trimmedName) {
      setError("Addon name is required.");
      return;
    }
    const cents = centsFromDollarsStr(addonPriceStr);
    if (cents === null) {
      setError("Addon price must be a number ≥ 0.");
      return;
    }
    startTransition(async () => {
      const res = await upsertPackageAddon({
        packageId: pkg.id,
        name: trimmedName,
        priceCents: cents,
        displayOrder: addons.length,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Optimistic — the server has the real id; we render with a placeholder
      // until next page revalidation pulls authoritative state.
      setAddons((prev) => [
        ...prev,
        {
          id: res.id,
          packageId: pkg.id,
          name: trimmedName,
          description: null,
          priceCents: cents,
          displayOrder: prev.length,
        },
      ]);
      setAddonName("");
      setAddonPriceStr("");
      setAddonFormOpen(false);
    });
  }

  function handleDeleteAddon(addonId: string) {
    setError(null);
    startTransition(async () => {
      const res = await deletePackageAddon(addonId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setAddons((prev) => prev.filter((a) => a.id !== addonId));
    });
  }

  return (
    <>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <div className={s.drawer} role="dialog" aria-label={isCreate ? "Add package" : "Edit package"}>
        <div className={s.header}>
          <div>
            <div className={s.title}>{isCreate ? "Add package" : "Edit package"}</div>
            {!isCreate && (
              <div className={s.subtitle}>{pkg!.name}</div>
            )}
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

        <div className={t.field}>
          <label className={t.label} htmlFor="pkg-name">Name</label>
          <input
            id="pkg-name"
            type="text"
            className={t.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            placeholder="e.g. Photography — Full Day"
          />
        </div>

        <div className={t.field}>
          <label className={t.label} htmlFor="pkg-desc">Description</label>
          <textarea
            id="pkg-desc"
            className={t.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What's included? Hours, deliverables, anything that helps organizers compare."
          />
        </div>

        <div className={t.field}>
          <label className={t.label} htmlFor="pkg-price">Base price (USD)</label>
          <div className={t.priceRow}>
            <span className={t.dollar}>$</span>
            <input
              id="pkg-price"
              type="number"
              inputMode="numeric"
              className={t.priceInput}
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              min={0}
              step={1}
              placeholder="0"
            />
          </div>
        </div>

        <div className={t.field}>
          <label className={t.label} htmlFor="pkg-ref">
            Planner referral
            <span className={t.refVal}>{referralPct}%</span>
          </label>
          <input
            id="pkg-ref"
            type="range"
            min={0}
            max={30}
            step={1}
            value={referralPct}
            onChange={(e) => setReferralPct(Number(e.target.value))}
            className={t.slider}
          />
          <div className={t.hint}>
            How much of each booking you'll share with the matching planner.
          </div>
        </div>

        <div className={t.toggleRow}>
          <span className={t.label}>Visible to organizers</span>
          <button
            type="button"
            className={`${t.toggle} ${isVisible ? t.toggleOn : ""}`.trim()}
            onClick={() => setIsVisible(!isVisible)}
            aria-pressed={isVisible}
          >
            <span className={t.toggleDot} />
          </button>
        </div>

        {/* Addons — edit mode only. Create mode: addons attach after save. */}
        {!isCreate && (
          <>
            <div className={t.addonsHead}>
              <span className={t.label}>Add-ons</span>
              {!addonFormOpen && (
                <button
                  type="button"
                  className={t.addonAdd}
                  onClick={() => setAddonFormOpen(true)}
                >
                  + Add
                </button>
              )}
            </div>
            {addons.length === 0 && !addonFormOpen ? (
              <div className={t.addonsEmpty}>
                Add-ons let organizers tack extras onto this package (e.g. extended hours, second shooter).
              </div>
            ) : (
              <div className={t.addonList}>
                {addons.map((a) => (
                  <div key={a.id} className={t.addonRow}>
                    <div className={t.addonInfo}>
                      <div className={t.addonName}>{a.name}</div>
                      <div className={t.addonPrice}>
                        ${(a.priceCents / 100).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={t.addonDel}
                      onClick={() => handleDeleteAddon(a.id)}
                      disabled={pending}
                      aria-label={`Remove addon ${a.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {addonFormOpen && (
              <div className={t.addonForm}>
                <input
                  type="text"
                  className={t.input}
                  value={addonName}
                  onChange={(e) => setAddonName(e.target.value)}
                  placeholder="Addon name"
                  maxLength={200}
                />
                <div className={t.priceRow}>
                  <span className={t.dollar}>$</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    className={t.priceInput}
                    value={addonPriceStr}
                    onChange={(e) => setAddonPriceStr(e.target.value)}
                    placeholder="0"
                    min={0}
                    step={1}
                  />
                </div>
                <div className={t.addonFormActions}>
                  <button
                    type="button"
                    className={s.btn}
                    onClick={() => {
                      setAddonFormOpen(false);
                      setAddonName("");
                      setAddonPriceStr("");
                    }}
                    disabled={pending}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`${s.btn} ${s.btnPrimary}`}
                    onClick={handleAddAddon}
                    disabled={pending}
                  >
                    {pending ? "Adding…" : "Add"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {error && <div className={s.errMsg}>{error}</div>}

        {confirmDelete ? (
          <div className={s.declineConfirm}>
            <div className={s.declineConfirmTxt}>
              Delete <b>{pkg!.name}</b>? Its add-ons go with it. Bookings
              that reference this package keep their reference (it becomes
              orphaned).
            </div>
            <div className={s.footer}>
              <button
                type="button"
                className={s.btn}
                onClick={() => setConfirmDelete(false)}
                disabled={pending}
              >
                Keep
              </button>
              <button
                type="button"
                className={`${s.btn} ${s.btnDanger}`}
                onClick={handleDeletePackage}
                disabled={pending}
              >
                {pending ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        ) : (
          <div className={s.footer}>
            {!isCreate && (
              <button
                type="button"
                className={`${s.btn} ${s.btnGhost}`}
                onClick={() => setConfirmDelete(true)}
                disabled={pending}
              >
                Delete
              </button>
            )}
            <button
              type="button"
              className={s.btn}
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`${s.btn} ${s.btnPrimary}`}
              onClick={handleSave}
              disabled={pending}
            >
              {pending ? "Saving…" : isCreate ? "Add package" : "Save"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
