"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import type { EventNotificationResponse } from "@/lib/events/event-notifications-shared";
import {
  presenceDisplayName,
  type VendorPresence,
} from "@/lib/events/vendor-presence-shared";
import type { VendorDetail } from "@/lib/orgnz/vendor-detail-shared";
import { deleteVendorPresence } from "../_actions/delete-vendor-presence";
import { addVendorPresence } from "../_actions/add-vendor-presence";
import { showToast } from "../_lib/toast";
import s from "./VendorDetailSheet.module.css";
import orgnzStyles from "../orgnz.module.css";

type Props = {
  presence: VendorPresence | null;
  /** Booking + notification + thread detail for this presence's vendor. */
  detail: VendorDetail | null;
  onClose: () => void;
};

function formatPrice(cents: number | null | undefined): string {
  if (cents == null) return "—";
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso.length > 10 ? iso : iso + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );
}

const NOTIF_PILL: Record<
  EventNotificationResponse,
  { label: string; tone: "info" | "success" | "warn" | "danger" }
> = {
  pending: { label: "Date change · awaiting response", tone: "info" },
  accepted: { label: "Date change · accepted", tone: "success" },
  declined: { label: "Date change · declined", tone: "danger" },
  expired: { label: "Date change · expired", tone: "warn" },
};

/**
 * Per-vendor detail sheet on the orgnz dashboard.
 *
 * Shows what THIS vendor is doing on THIS event — package + total +
 * confirmed date, plus Lock 24 date-change status when a notification
 * is in flight. Primary action is Quick connect: deep-links to the
 * existing inquiry thread (?thread=<id>) when one exists, else falls
 * back to mailto: against vendors.contact_email so the orgnz isn't
 * stuck behind a stub.
 *
 * The phase coverage list lives on the row itself (VendorRangePill)
 * so it's not duplicated here. Remove Vndr action preserved per the
 * Concept C delete flow.
 */
export function VendorDetailSheet({ presence, detail, onClose }: Props) {
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
  const booking = detail?.booking ?? null;
  const notif = detail?.latestNotification ?? null;
  const inquiryThreadId = detail?.inquiryThreadId ?? null;
  const contactEmail = detail?.contactEmail ?? null;

  function handleDelete() {
    if (!presence || pendingDelete) return;
    const snapshot = presence;
    startDeleteTransition(async () => {
      const res = await deleteVendorPresence(snapshot.id);
      if (!res.ok) {
        showToast(`Couldn't remove vendor: ${res.error}`);
        return;
      }
      setDeleted(true);
      showToast(`<em>${primary}</em> removed from the event.`);
      onClose();
    });
  }

  const mailtoHref = contactEmail
    ? `mailto:${encodeURIComponent(contactEmail)}?subject=${encodeURIComponent(
        `About our booking — ${primary}`,
      )}`
    : null;

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
            {secondary && <div className={s.secondaryName}>{secondary}</div>}
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
          {/* Lock 24 notification status — only when a notification exists. */}
          {notif && (
            <div className={s.section}>
              <div className={s.sectionLabel}>Status</div>
              <div className={`${s.statusPill} ${s[`statusPill_${NOTIF_PILL[notif.response].tone}`]}`}>
                {NOTIF_PILL[notif.response].label}
              </div>
              {notif.oldStartDate && notif.newStartDate && (
                <div className={s.statusMeta}>
                  {formatDate(notif.oldStartDate)} → {formatDate(notif.newStartDate)}
                </div>
              )}
              {notif.emailDeliveryFailed && (
                <div className={s.statusMeta}>
                  Email didn&rsquo;t reach them — try Quick connect or another channel.
                </div>
              )}
            </div>
          )}

          {/* Booking summary. */}
          <div className={s.section}>
            <div className={s.sectionLabel}>Booking</div>
            {booking ? (
              <dl className={s.kvGrid}>
                <dt>Package</dt>
                <dd>{booking.packageName ?? "Custom"}</dd>
                <dt>Total</dt>
                <dd>{formatPrice(booking.totalCents)}</dd>
                <dt>Deposit</dt>
                <dd>
                  {booking.depositPct > 0
                    ? `${booking.depositPct}% of total`
                    : "—"}
                </dd>
                <dt>Confirmed</dt>
                <dd>{formatDate(booking.confirmedAt)}</dd>
                <dt>Status</dt>
                <dd className={s.kvCapitalize}>{booking.status.replace(/_/g, " ")}</dd>
              </dl>
            ) : (
              <p className={s.empty}>No booking on file for this vendor yet.</p>
            )}
          </div>

          {/* Quick connect — deep-link to inquiry thread, mailto fallback. */}
          <div className={s.section}>
            {inquiryThreadId ? (
              <Link
                href={`/orgnz/inquiries?thread=${inquiryThreadId}`}
                className={s.quickConnect}
              >
                Quick connect — open conversation →
              </Link>
            ) : mailtoHref ? (
              <a href={mailtoHref} className={s.quickConnect}>
                Quick connect — email {contactEmail} →
              </a>
            ) : (
              <p className={s.empty}>No contact info on file for this vendor.</p>
            )}
          </div>

          <div className={s.deleteRow}>
            <button
              type="button"
              className={s.deleteBtn}
              onClick={handleDelete}
              disabled={pendingDelete}
            >
              {pendingDelete ? "Removing…" : "Remove Vndr"}
            </button>
            <span className={s.deleteHint}>
              Removes them from the Run of Show. The booking record stays.
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

// Re-export for parent tree access patterns if needed.
export { addVendorPresence };
