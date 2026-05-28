import { redirect } from "next/navigation";
import { Chrome } from "./_components/Chrome";
import { HelpBar } from "./_components/HelpBar";
import { ModeToggle } from "./_components/ModeToggle";
import { Toast } from "./_components/Toast";
import {
  daysUntil,
  formatStartDateShort,
  loadOrgnzContext,
} from "./_lib/load-context";
import { getUnreadCountForBuyer } from "@/lib/messaging/inquiry-thread";
import styles from "./orgnz.module.css";

export default async function OrgnzLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await loadOrgnzContext();
  if (!ctx) redirect("/login?role=orgnz");

  const { event, tenantId, events, selectedEventId, eventNotFound } = ctx;
  const eventName = event?.name ?? null;
  const startDateShort = event ? formatStartDateShort(event.start_date) : null;
  const daysOut = event ? daysUntil(event.start_date) : null;
  const unreadInquiriesCount = tenantId ? await getUnreadCountForBuyer(tenantId) : 0;

  return (
    <>
      <div id="orgnz-app" className={styles.app}>
        <Chrome
          eventName={eventName}
          startDateShort={startDateShort}
          daysOut={daysOut}
          unreadInquiriesCount={unreadInquiriesCount}
          events={events}
          selectedEventId={selectedEventId}
          eventNotFound={eventNotFound}
        />
        {children}
        {/* HelpBar (Ask Cue + 12-Min Bump) is day-of-only — gated inside .app via .app.dayof. */}
        <HelpBar />
      </div>
      <ModeToggle />
      <Toast />
    </>
  );
}
