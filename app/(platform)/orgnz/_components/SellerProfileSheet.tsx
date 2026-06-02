"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import type {
  VendorListing,
  VenueListing,
  CatrListing,
} from "@/lib/marketplace/listings";
import {
  inviteSellerToMoodboard,
  revokeSellerMoodboardInvite,
} from "../_actions/moodboard-invite";
import { showToast } from "../_lib/toast";
import orgnzStyles from "../orgnz.module.css";
import s from "./SellerProfileSheet.module.css";

/**
 * Seller profile drawer (Lock 30 Phase A — profile-first marketplace).
 *
 * Opened from a marketplace browse card; shows the seller's full listing
 * (gallery, packages/spaces, location, verifications) so the buyer can size
 * them up before reaching out. The "Inquire" CTA hands off to the same
 * SendInquirySheet the card's quick-inquire pill uses.
 *
 * Phase A renders entirely from the already-fetched listing data (no extra
 * round-trip) for vndr + venu. catr/plnr profiles land in Phase C with their
 * tables; venue photos in Phase B.
 */

function dollars(cents: number | null): string | null {
  if (cents == null) return null;
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

export type SellerProfile =
  | { kind: "vndr"; vendor: VendorListing }
  | { kind: "venu"; venue: VenueListing }
  | { kind: "catr"; caterer: CatrListing };

const EYEBROW = { vndr: "Vndr", venu: "Venu", catr: "Catr" } as const;

type Props = {
  profile: SellerProfile;
  /** Whether this seller's tenant currently holds a live moodboard invite. */
  initiallyInvited?: boolean;
  onClose: () => void;
  onInquire: () => void;
};

export function SellerProfileSheet({
  profile,
  initiallyInvited = false,
  onClose,
  onInquire,
}: Props) {
  const [invited, setInvited] = useState(initiallyInvited);
  const [pendingInvite, startInviteTransition] = useTransition();

  const targetTenantId =
    profile.kind === "vndr"
      ? profile.vendor.tenantId
      : profile.kind === "venu"
        ? profile.venue.tenantId
        : profile.caterer.tenantId;

  function toggleMoodboard() {
    if (pendingInvite) return;
    const next = !invited;
    setInvited(next); // optimistic
    startInviteTransition(async () => {
      const res = next
        ? await inviteSellerToMoodboard(targetTenantId)
        : await revokeSellerMoodboardInvite(targetTenantId);
      if (!res.ok) {
        setInvited(!next); // revert
        showToast(res.error);
        return;
      }
      showToast(next ? "Mood board shared." : "Stopped sharing your mood board.");
    });
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const displayName =
    profile.kind === "vndr"
      ? profile.vendor.displayName
      : profile.kind === "venu"
        ? profile.venue.displayName
        : profile.caterer.displayName;

  return createPortal(
    <>
      <div className={orgnzStyles.scrim} onClick={onClose} aria-hidden="true" />
      <aside
        className={`${orgnzStyles.drawer} ${orgnzStyles.drawerOpen}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-profile-title"
      >
        <div className={orgnzStyles.drawerHandle} />
        <div className={orgnzStyles.drawerHead}>
          <div>
            <div className={orgnzStyles.drawerEye}>{EYEBROW[profile.kind]}</div>
            <h3 className={orgnzStyles.drawerTitle} id="seller-profile-title">
              <em>{displayName}</em>
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
          {profile.kind === "vndr" ? (
            <VndrProfileBody v={profile.vendor} />
          ) : profile.kind === "venu" ? (
            <VenuProfileBody v={profile.venue} />
          ) : (
            <CatrProfileBody v={profile.caterer} />
          )}
        </div>

        <div className={s.cta}>
          <button type="button" className={s.inquireBtn} onClick={onInquire}>
            Inquire with {displayName}
          </button>
          <button
            type="button"
            className={invited ? s.moodboardBtnOn : s.moodboardBtn}
            onClick={toggleMoodboard}
            disabled={pendingInvite}
            aria-pressed={invited}
          >
            {invited ? "✓ Sharing your mood board · tap to stop" : "Invite to your mood board"}
          </button>
        </div>
      </aside>
    </>,
    document.body,
  );
}

function VndrProfileBody({ v }: { v: VendorListing }) {
  return (
    <>
      {v.photos.length > 0 && (
        <div className={s.gallery}>
          {v.photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={p.url}
              alt={p.alt ?? v.displayName}
              loading="lazy"
              className={s.galleryImg}
            />
          ))}
        </div>
      )}

      <div className={s.metaRow}>
        {[v.subType, v.city].filter(Boolean).join(" · ")}
      </div>

      {v.packages.length > 0 && (
        <div className={s.section}>
          <div className={s.sectionLabel}>Packages</div>
          <ul className={s.list}>
            {v.packages.map((p) => (
              <li key={p.id} className={s.listRow}>
                <span className={s.listName}>{p.name}</span>
                <span className={s.listVal}>
                  {[
                    dollars(p.priceCents),
                    p.durationHours != null ? `${p.durationHours}h` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function VenuProfileBody({ v }: { v: VenueListing }) {
  return (
    <>
      {v.photos.length > 0 && (
        <div className={s.gallery}>
          {v.photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={p.url}
              alt={p.alt ?? v.displayName}
              loading="lazy"
              className={s.galleryImg}
            />
          ))}
        </div>
      )}

      <div className={s.metaRow}>
        {[v.city, v.state].filter(Boolean).join(", ")}
      </div>

      {(v.coiVerified || v.propertyVerified) && (
        <div className={s.badges}>
          {v.propertyVerified && <span className={s.badge}>Property verified</span>}
          {v.coiVerified && <span className={s.badge}>Insured</span>}
        </div>
      )}

      {v.spaces.length > 0 && (
        <div className={s.section}>
          <div className={s.sectionLabel}>Spaces</div>
          <ul className={s.list}>
            {v.spaces.map((sp) => (
              <li key={sp.id} className={s.listRow}>
                <span className={s.listName}>{sp.name}</span>
                <span className={s.listVal}>
                  {[
                    sp.capacity != null
                      ? `up to ${sp.capacity.toLocaleString("en-US")}`
                      : null,
                    sp.ratePerDayCents != null
                      ? `${dollars(sp.ratePerDayCents)}/day`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function CatrProfileBody({ v }: { v: CatrListing }) {
  const meta = [v.city, ...v.cuisineTypes].filter(Boolean).join(" · ");
  return (
    <>
      {v.photos.length > 0 && (
        <div className={s.gallery}>
          {v.photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={p.url}
              alt={p.alt ?? v.displayName}
              loading="lazy"
              className={s.galleryImg}
            />
          ))}
        </div>
      )}

      {meta && <div className={s.metaRow}>{meta}</div>}

      {v.serviceStyles.length > 0 && (
        <div className={s.badges}>
          {v.serviceStyles.map((style) => (
            <span key={style} className={s.badge}>{style}</span>
          ))}
        </div>
      )}

      {v.tiers.length > 0 && (
        <div className={s.section}>
          <div className={s.sectionLabel}>Menu tiers</div>
          <ul className={s.list}>
            {v.tiers.map((t) => (
              <li key={t.id} className={s.listRow}>
                <span className={s.listName}>{t.name}</span>
                <span className={s.listVal}>
                  {[
                    t.perGuestCents != null ? `${dollars(t.perGuestCents)}/guest` : null,
                    t.minGuests != null ? `${t.minGuests}+ guests` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
