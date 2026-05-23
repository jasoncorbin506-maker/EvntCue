import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import s from "./vndr-onboarding-stage.module.css";

/**
 * Layout for V-1b Stages 1–4 — /vndr-onboarding/[step]/.
 *
 * Auth gate: redirect to /login?role=vndr&intent=claim_listing when no
 * vendor row resolves. postAuthSeed creates the draft vendors row on signup
 * (lib/auth/post-auth-seed.ts vndr branch); if it didn't run, the user lands
 * back at the auth surface and the flow re-runs.
 *
 * Already-published guard: if vendor.claim_status === 'published', the user
 * has finished onboarding and is revisiting an old funnel URL. Send them to
 * the dashboard (V-2 placeholder at /vndr/discover?welcome=signup).
 *
 * Step validation: only "1", "2", "3", "4" are valid. Anything else 404s
 * (notFound throws and Next.js renders the closest not-found.tsx).
 *
 * Chrome: back button + coral progress bar + step indicator. Mirrors Venu
 * Door B (app/(public)/venues/start/page.tsx) but with --coral and per-step
 * width %. The chrome is part of the layout so per-stage components don't
 * have to re-render it; they get the clean `.stageBody` to fill.
 */

const VALID_STEPS = ["1", "2", "3", "4"] as const;
type ValidStep = (typeof VALID_STEPS)[number];

export default async function VndrOnboardingStageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  if (!VALID_STEPS.includes(step as ValidStep)) {
    notFound();
  }

  const vendor = await getCurrentVendor();
  if (!vendor) {
    redirect("/login?role=vndr&intent=claim_listing");
  }

  if (vendor.claimStatus === "published") {
    redirect("/vndr/discover?welcome=signup");
  }

  const stepNum = parseInt(step, 10);
  const progressPct = (stepNum / 4) * 100;
  const prevHref = stepNum > 1 ? `/vndr-onboarding/${stepNum - 1}` : null;

  return (
    <main className={s.phone}>
      <header className={s.formChrome}>
        {prevHref ? (
          <Link href={prevHref} className={s.formBack} aria-label="Back">
            ‹
          </Link>
        ) : (
          <span
            className={`${s.formBack} ${s.formBackDisabled}`}
            aria-hidden="true"
          >
            ‹
          </span>
        )}
        <div className={s.formProgress}>
          <div
            className={s.formProgressBar}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className={s.formStep}>Step {stepNum} of 4</div>
      </header>

      <div className={s.stageBody}>{children}</div>
    </main>
  );
}
