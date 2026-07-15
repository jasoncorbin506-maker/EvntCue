import { GateForm } from "./GateForm";
import s from "./gate.module.css";

/**
 * Private-preview lock screen. Every page request is bounced here by the
 * proxy while SITE_ACCESS_CODE is set (see lib/site-gate.ts). Deliberately
 * quiet — no marketing copy, no hint at what's behind it.
 */
export const metadata = {
  title: "Private preview · EvntCue",
  robots: { index: false, follow: false },
};

export default async function GatePage(props: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await props.searchParams;
  return (
    <main className={s.wrap}>
      <div className={s.card}>
        <div className={s.brand}>EvntCue</div>
        <h1 className={s.title}>Private preview</h1>
        <p className={s.body}>
          EvntCue isn’t open to the public yet. If you have an access code,
          enter it below.
        </p>
        <GateForm next={sp.next ?? null} />
      </div>
    </main>
  );
}
