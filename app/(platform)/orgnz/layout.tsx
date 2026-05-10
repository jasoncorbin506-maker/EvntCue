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
import styles from "./orgnz.module.css";

export default async function OrgnzLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await loadOrgnzContext();
  if (!ctx) redirect("/login?role=orgnz");

  const { event } = ctx;
  const eventName = event?.name ?? null;
  const startDateShort = event ? formatStartDateShort(event.start_date) : null;
  const daysOut = event ? daysUntil(event.start_date) : null;

  return (
    <>
      <div id="orgnz-app" className={styles.app}>
        <Chrome
          eventName={eventName}
          startDateShort={startDateShort}
          daysOut={daysOut}
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
