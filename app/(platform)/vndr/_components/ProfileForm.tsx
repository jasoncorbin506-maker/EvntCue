"use client";

import { useState, useTransition } from "react";
import { updateVendorProfile, type UpdateVendorProfileInput } from "../_actions/update-vendor-profile";
import type { VendorProfile, VendorPhoto, VendorCertification } from "@/lib/vndr/profile";
import type { VndrPackage } from "@/lib/vndr/packages-shared";
import { PhotosGrid } from "./PhotosGrid";
import { PackagesSection } from "./PackagesSection";
import { CertificationsSection } from "./CertificationsSection";
import s from "../vndr.module.css";

/**
 * V-2b Session B Profile form. Sections with section-level edit toggle —
 * tap Edit on a section, fields go editable, Save/Cancel commits or reverts.
 * Lighter than per-field inline edit (less state per field); reads cleanly
 * on a 390px mobile frame.
 *
 * Sections:
 *   - Basic: display name, founding story (bio), years in business
 *   - Contact: email, phone, website
 *   - Location: city, service ZIPs (chip multi-input)
 *   - Pricing: starting price ($), referral rate (%)
 *   - Photos (separate handler — see PhotosGrid)
 *   - Certifications (list + add/re-upload via CertificationSheet)
 *   - Packages (full create/edit — mirrors the Home tab affordance)
 *
 * Validation runs server-side; surface errors inline under each section.
 */

type Props = {
  profile: VendorProfile;
  photos: VendorPhoto[];
  certifications: VendorCertification[];
  packages: VndrPackage[];
};

type DraftState = {
  displayName: string;
  legalBusinessName: string;
  city: string;
  websiteUrl: string;
  foundingStory: string;
  yearsInBusiness: string;
  contactEmail: string;
  contactPhone: string;
  serviceZipsStr: string; // comma-separated for textarea ergonomics
  startingPriceDollarsStr: string;
  referralRatePctStr: string;
};

function profileToDraft(p: VendorProfile): DraftState {
  return {
    displayName: p.displayName,
    legalBusinessName: p.legalBusinessName ?? "",
    city: p.city ?? "",
    websiteUrl: p.websiteUrl ?? "",
    foundingStory: p.foundingStory ?? "",
    yearsInBusiness: p.yearsInBusiness?.toString() ?? "",
    contactEmail: p.contactEmail ?? "",
    contactPhone: p.contactPhone ?? "",
    serviceZipsStr: p.serviceZips.join(", "),
    startingPriceDollarsStr:
      p.startingPriceCents !== null ? (p.startingPriceCents / 100).toString() : "",
    referralRatePctStr: p.referralRatePct?.toString() ?? "",
  };
}

type Section = "basic" | "contact" | "location" | "pricing";

export function ProfileForm({ profile, photos, certifications, packages }: Props) {
  const [draft, setDraft] = useState<DraftState>(profileToDraft(profile));
  const [editing, setEditing] = useState<Section | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [committed, setCommitted] = useState<VendorProfile>(profile);

  function reset() {
    setDraft(profileToDraft(committed));
    setEditing(null);
    setError(null);
  }

  function submit(patch: UpdateVendorProfileInput, section: Section) {
    setError(null);
    startTransition(async () => {
      const res = await updateVendorProfile(patch);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Optimistic commit — fold patched values into committed state so
      // the next reset returns the user to the just-saved values.
      const next: VendorProfile = { ...committed };
      if (patch.displayName !== undefined) next.displayName = patch.displayName;
      if (patch.legalBusinessName !== undefined) next.legalBusinessName = patch.legalBusinessName;
      if (patch.city !== undefined) next.city = patch.city;
      if (patch.websiteUrl !== undefined) next.websiteUrl = patch.websiteUrl;
      if (patch.foundingStory !== undefined) next.foundingStory = patch.foundingStory;
      if (patch.yearsInBusiness !== undefined) next.yearsInBusiness = patch.yearsInBusiness;
      if (patch.contactEmail !== undefined) next.contactEmail = patch.contactEmail;
      if (patch.contactPhone !== undefined) next.contactPhone = patch.contactPhone;
      if (patch.serviceZips !== undefined) next.serviceZips = patch.serviceZips;
      if (patch.startingPriceCents !== undefined) next.startingPriceCents = patch.startingPriceCents;
      if (patch.referralRatePct !== undefined) next.referralRatePct = patch.referralRatePct;
      setCommitted(next);
      setEditing(null);
      if (section) void section; // satisfy linter
    });
  }

  function saveBasic() {
    submit(
      {
        displayName: draft.displayName,
        foundingStory: draft.foundingStory || null,
        yearsInBusiness:
          draft.yearsInBusiness.trim() === ""
            ? null
            : Number(draft.yearsInBusiness),
      },
      "basic",
    );
  }

  function saveContact() {
    submit(
      {
        contactEmail: draft.contactEmail || null,
        contactPhone: draft.contactPhone || null,
        websiteUrl: draft.websiteUrl || null,
      },
      "contact",
    );
  }

  function saveLocation() {
    const zips = draft.serviceZipsStr
      .split(/[,\s]+/)
      .map((z) => z.trim())
      .filter(Boolean);
    submit(
      {
        city: draft.city || null,
        serviceZips: zips,
      },
      "location",
    );
  }

  function savePricing() {
    const dollars = Number(draft.startingPriceDollarsStr);
    const startingPriceCents =
      draft.startingPriceDollarsStr.trim() === ""
        ? null
        : Math.round(dollars * 100);
    const referralRatePct =
      draft.referralRatePctStr.trim() === ""
        ? null
        : Number(draft.referralRatePctStr);
    submit({ startingPriceCents, referralRatePct }, "pricing");
  }

  // Display helpers
  const fmtDollars = (cents: number | null) =>
    cents === null ? "—" : `$${(cents / 100).toLocaleString()}`;

  return (
    <div className={s.profileForm}>
      {/* ── BASIC ─────────────────────────────────────────── */}
      <SectionShell
        title="Basics"
        editing={editing === "basic"}
        pending={pending}
        onEdit={() => setEditing("basic")}
        onCancel={reset}
        onSave={saveBasic}
      >
        {editing === "basic" ? (
          <>
            <Field label="Display name" required>
              <input
                className={s.formInput}
                value={draft.displayName}
                onChange={(e) =>
                  setDraft({ ...draft, displayName: e.target.value })
                }
                maxLength={80}
              />
            </Field>
            <Field label="Bio">
              <textarea
                className={s.formTextarea}
                value={draft.foundingStory}
                onChange={(e) =>
                  setDraft({ ...draft, foundingStory: e.target.value })
                }
                placeholder="Tell organizers the story of your business."
                rows={5}
                maxLength={2000}
              />
              <div className={s.formCount}>
                {draft.foundingStory.length}/2000
              </div>
            </Field>
            <Field label="Years in business">
              <input
                type="number"
                className={s.formInput}
                value={draft.yearsInBusiness}
                onChange={(e) =>
                  setDraft({ ...draft, yearsInBusiness: e.target.value })
                }
                min={0}
                max={100}
              />
            </Field>
          </>
        ) : (
          <>
            <ReadField label="Display name" value={committed.displayName} />
            <ReadField
              label="Bio"
              value={committed.foundingStory ?? "—"}
              multi
            />
            <ReadField
              label="Years in business"
              value={committed.yearsInBusiness?.toString() ?? "—"}
            />
          </>
        )}
      </SectionShell>

      {/* ── CONTACT ───────────────────────────────────────── */}
      <SectionShell
        title="Contact"
        editing={editing === "contact"}
        pending={pending}
        onEdit={() => setEditing("contact")}
        onCancel={reset}
        onSave={saveContact}
      >
        {editing === "contact" ? (
          <>
            <Field label="Email">
              <input
                type="email"
                className={s.formInput}
                value={draft.contactEmail}
                onChange={(e) =>
                  setDraft({ ...draft, contactEmail: e.target.value })
                }
              />
            </Field>
            <Field label="Phone">
              <input
                type="tel"
                className={s.formInput}
                value={draft.contactPhone}
                onChange={(e) =>
                  setDraft({ ...draft, contactPhone: e.target.value })
                }
              />
            </Field>
            <Field label="Website">
              <input
                type="url"
                className={s.formInput}
                value={draft.websiteUrl}
                onChange={(e) =>
                  setDraft({ ...draft, websiteUrl: e.target.value })
                }
                placeholder="https://"
              />
            </Field>
          </>
        ) : (
          <>
            <ReadField label="Email" value={committed.contactEmail ?? "—"} />
            <ReadField label="Phone" value={committed.contactPhone ?? "—"} />
            <ReadField label="Website" value={committed.websiteUrl ?? "—"} />
          </>
        )}
      </SectionShell>

      {/* ── LOCATION ──────────────────────────────────────── */}
      <SectionShell
        title="Service area"
        editing={editing === "location"}
        pending={pending}
        onEdit={() => setEditing("location")}
        onCancel={reset}
        onSave={saveLocation}
      >
        {editing === "location" ? (
          <>
            <Field label="Home city">
              <input
                className={s.formInput}
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                maxLength={80}
              />
            </Field>
            <Field label="Service ZIPs (comma-separated, up to 25)">
              <textarea
                className={s.formTextarea}
                value={draft.serviceZipsStr}
                onChange={(e) =>
                  setDraft({ ...draft, serviceZipsStr: e.target.value })
                }
                placeholder="75201, 75202, 75203"
                rows={3}
              />
            </Field>
          </>
        ) : (
          <>
            <ReadField label="Home city" value={committed.city ?? "—"} />
            <ReadField
              label="Service ZIPs"
              value={
                committed.serviceZips.length > 0
                  ? committed.serviceZips.join(", ")
                  : "—"
              }
              multi
            />
          </>
        )}
      </SectionShell>

      {/* ── PRICING ───────────────────────────────────────── */}
      <SectionShell
        title="Pricing"
        editing={editing === "pricing"}
        pending={pending}
        onEdit={() => setEditing("pricing")}
        onCancel={reset}
        onSave={savePricing}
      >
        {editing === "pricing" ? (
          <>
            <Field label="Starting price (USD)">
              <input
                type="number"
                className={s.formInput}
                value={draft.startingPriceDollarsStr}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    startingPriceDollarsStr: e.target.value,
                  })
                }
                min={0}
                step={1}
              />
            </Field>
            <Field label="Planner referral rate (0–25%)">
              <input
                type="number"
                className={s.formInput}
                value={draft.referralRatePctStr}
                onChange={(e) =>
                  setDraft({ ...draft, referralRatePctStr: e.target.value })
                }
                min={0}
                max={25}
                step={0.5}
              />
            </Field>
            <div className={s.formHint}>
              This is your profile-level referral rate. Per-package referrals
              live in the Packages section below.
            </div>
          </>
        ) : (
          <>
            <ReadField
              label="Starting price"
              value={fmtDollars(committed.startingPriceCents)}
            />
            <ReadField
              label="Planner referral rate"
              value={
                committed.referralRatePct === null
                  ? "—"
                  : `${committed.referralRatePct}%`
              }
            />
          </>
        )}
      </SectionShell>

      {/* ── PHOTOS ────────────────────────────────────────── */}
      <div className={s.profileSection}>
        <div className={s.sectionHead}>
          <span className={s.sectionTitle}>Photos</span>
        </div>
        <PhotosGrid initial={photos} />
      </div>

      {/* ── CERTIFICATIONS (list + add/re-upload sheet) ─────────
         Previously read-only with "Upload via the onboarding flow"
         pointer; vendors who skipped Stage 4 cert upload had no recovery
         path. CertificationsSection adds an Add button + CertificationSheet
         (mirrors EditPackageSheet pattern) that reuses uploadCertAction
         from the onboarding _actions/ — same server logic, new entry
         point. */}
      <CertificationsSection certifications={certifications} />

      {/* ── PACKAGES (full create/edit affordance — was Home-only pre-fix) ───
         Mounts the same PackagesSection used on /vndr Home. PackagesSection
         owns the EditPackageSheet open/close state, so the Profile tab now
         has full package management parity with Home. Removed the prior
         "edit on Home tab" pointer because the user can do everything here. */}
      <PackagesSection packages={packages} />

      {error && <div className={s.formErr}>{error}</div>}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────

function SectionShell({
  title,
  editing,
  pending,
  onEdit,
  onCancel,
  onSave,
  children,
}: {
  title: string;
  editing: boolean;
  pending: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={s.profileSection}>
      <div className={s.sectionHead}>
        <span className={s.sectionTitle}>{title}</span>
        {editing ? (
          <div className={s.sectionActions}>
            <button
              type="button"
              className={s.sectionBtn}
              onClick={onCancel}
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="button"
              className={`${s.sectionBtn} ${s.sectionBtnPrimary}`}
              onClick={onSave}
              disabled={pending}
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={s.sectionBtn}
            onClick={onEdit}
          >
            Edit
          </button>
        )}
      </div>
      <div className={s.sectionBody}>{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={s.formField}>
      <span className={s.formLabel}>
        {label}
        {required && <span className={s.formReq}>*</span>}
      </span>
      {children}
    </label>
  );
}

function ReadField({
  label,
  value,
  multi,
}: {
  label: string;
  value: string;
  multi?: boolean;
}) {
  return (
    <div className={s.formField}>
      <span className={s.formLabel}>{label}</span>
      <div className={multi ? s.readValueMulti : s.readValue}>{value}</div>
    </div>
  );
}
