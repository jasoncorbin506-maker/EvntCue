import { createHash } from "node:crypto";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ClaimForm } from "./ClaimForm";
import s from "../../venues.module.css";

/**
 * Door A — Ghost-profile claim entry. Server-rendered token validation
 * (lookup by sha256(token), expiry + non-consumption check). If valid,
 * renders the claim form; if not, renders an invalid state with offline
 * recourse. Migration 025 holds the schema.
 *
 * Per Venu_Locked_2026-05-13.md: "the token in the URL *is* the verification."
 * No second factor; possession of the link from a curated warm-intro list is
 * the trust source.
 */

type Outcome =
  | { kind: "valid"; displayName: string; city: string | null }
  | { kind: "invalid" }
  | { kind: "expired" }
  | { kind: "consumed" };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function evaluate(token: string): Promise<Outcome> {
  if (!token || token.length < 16) return { kind: "invalid" };
  const admin = createAdminClient();
  const { data: venue } = await admin
    .from("venues")
    .select(
      "display_name, city, tenant_id, invite_token_expires_at, invite_token_consumed_at",
    )
    .eq("invite_token_hash", hashToken(token))
    .maybeSingle();

  if (!venue) return { kind: "invalid" };
  if (venue.invite_token_consumed_at || venue.tenant_id) return { kind: "consumed" };
  if (
    !venue.invite_token_expires_at ||
    new Date(venue.invite_token_expires_at as string) <= new Date()
  ) {
    return { kind: "expired" };
  }
  return {
    kind: "valid",
    displayName: (venue.display_name as string) ?? "your Venu",
    city: (venue.city as string | null) ?? null,
  };
}

export default async function VenuClaim({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const outcome = await evaluate(token);

  if (outcome.kind === "valid") {
    // If the visitor is already signed in (e.g. an existing Orgnz also owns a
    // venue), skip the credential form — they only need to confirm.
    const supabase = await createClient();
    const { data: existing } = await supabase.auth.getUser();
    return (
      <ClaimForm
        token={token}
        venueDisplayName={outcome.displayName}
        venueCity={outcome.city}
        signedInEmail={existing.user?.email ?? null}
      />
    );
  }

  const copy: Record<
    Exclude<Outcome["kind"], "valid">,
    { headline: string; body: string }
  > = {
    invalid: {
      headline: "This link isn't recognized",
      body: "Double-check the URL in the email we sent. If you copied it by hand, an extra space or missing character will trip this up.",
    },
    expired: {
      headline: "This claim link has expired",
      body: "Invite links are good for 14 days. We can send a fresh one — reply to whoever reached out, or email our team and we'll get you a new link within a business day.",
    },
    consumed: {
      headline: "This Venu has already been claimed",
      body: "If that wasn't you, someone on your team may have completed the claim already. Email us and we'll sort out access.",
    },
  };

  const { headline, body } = copy[outcome.kind];

  return (
    <main className={s.phone}>
      <header className={s.formChrome}>
        <Link href="/venues" className={s.formBack} aria-label="Back">
          ‹
        </Link>
        <div className={s.formProgress}>
          <div
            className={`${s.formProgressBar} ${s.formProgressBarFail}`}
            style={{ width: "100%" }}
          />
        </div>
        <div className={`${s.formStep} ${s.formStepFail}`}>Hold on</div>
      </header>

      <div className={s.failWrap}>
        <div className={s.failIco}>
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4M12 16v.01" />
          </svg>
        </div>

        <h1 className={s.failH}>{headline}</h1>
        <p className={s.failSub}>{body}</p>

        <div className={s.failRecourse}>
          <div className={s.failRecourseH}>Need a hand?</div>
          <div className={s.failRecourseTxt}>
            We&apos;ll sort it out within one business day.
          </div>
          <a href="mailto:team@evntcue.com" className={s.failRecourseCta}>
            Email our team
          </a>
        </div>

        <Link
          href="/venues"
          className={s.failBack}
          style={{ display: "block", textAlign: "center", textDecoration: "none" }}
        >
          Learn about EvntCue for Venus
        </Link>
      </div>
    </main>
  );
}
