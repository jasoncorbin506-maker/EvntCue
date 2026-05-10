import { redirect } from "next/navigation";
import { Sidebar } from "./_components/Sidebar";
import { Topbar } from "./_components/Topbar";
import {
  buildTargetIso,
  daysUntil,
  formatStartDateLong,
  formatStartDateShort,
  loadOrgnzContext,
  prettyEventType,
} from "./_lib/load-context";
import styles from "./orgnz.module.css";

export default async function OrgnzLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await loadOrgnzContext();
  if (!ctx) redirect("/login?role=orgnz");

  const { user, event } = ctx;

  // Sidebar event chip
  const eventName = event?.name ?? null;
  const eventMeta = event
    ? `${prettyEventType(event.event_type)} · ${formatStartDateShort(event.start_date)}`
    : null;
  const days = event ? daysUntil(event.start_date) : null;

  // Topbar
  const topbarTitle = event?.name ?? "Your workspace";
  const topbarSubtitle = event
    ? [
        formatStartDateLong(event.start_date),
        event.guest_count ? `${event.guest_count} guests` : null,
        prettyEventType(event.event_type),
      ]
        .filter(Boolean)
        .join(" · ")
    : null;
  const targetIso = event ? buildTargetIso(event.start_date, event.start_time) : null;
  const dateLabel = event
    ? `${formatStartDateShort(event.start_date)}${event.start_time ? "" : " · 5 PM"}`
    : null;

  return (
    <div className={styles.shell}>
      <Sidebar
        eventName={eventName}
        eventMeta={eventMeta}
        daysOut={days}
        userInitials={user.initials}
        userName={user.displayName}
        userRole="Orgnz"
      />
      <main className={styles.main}>
        <Topbar
          title={topbarTitle}
          subtitle={topbarSubtitle}
          targetIso={targetIso}
          dateLabel={dateLabel}
        />
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
