import { SuspendedAppealForm } from "./SuspendedAppealForm";
import s from "./suspended.module.css";

/**
 * Suspended-account notice + appeal off-ramp. The ONE user-facing surface of
 * the moderation system, so: generic ("community standards" — never the
 * internal reason), dignified, and not a dead-end (the appeal form is the path
 * back). Reached when the per-request gate bounces a suspended tenant here.
 */
export const metadata = { title: "Account suspended · EvntCue" };

export default function SuspendedPage() {
  return (
    <main className={s.wrap}>
      <div className={s.card}>
        <div className={s.brand}>EvntCue</div>
        <h1 className={s.title}>Your account is suspended</h1>
        <p className={s.body}>
          This account has been suspended for activity that goes against our
          community standards. While it’s suspended, you won’t be able to use
          your portal.
        </p>
        <p className={s.body}>
          If you think this was a mistake, tell us below — a real person will
          review it.
        </p>
        <SuspendedAppealForm />
      </div>
    </main>
  );
}
