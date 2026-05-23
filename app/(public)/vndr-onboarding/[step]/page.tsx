import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor } from "@/lib/vndr/current-vendor";
import { Stage1 } from "./_components/Stage1";
import { Stage2 } from "./_components/Stage2";
import { Stage3 } from "./_components/Stage3";
import { Stage4 } from "./_components/Stage4";
import type { CertTypeKey } from "@/lib/labels/cert-types";
import s from "./vndr-onboarding-stage.module.css";

/**
 * V-1b dynamic stage router — /vndr-onboarding/[step]/.
 *
 * Switches on params.step ∈ {"1","2","3","4"} and renders the right stage
 * component. Auth gate + step validation + chrome live in layout.tsx; this
 * file just routes.
 *
 * Stage components live in _components/StageN.tsx (server or client based on
 * needs). Each stage handles its own data-binding via per-stage server
 * actions in _actions/save-stage-N.ts.
 *
 * The vendor row passed down is the resolver-trimmed shape (just the fields
 * the chrome + Stage 4 conditional reveal need). Stages that need additional
 * columns from vendors do their own fetch with a tightened select-list —
 * keeps the resolver lean and prevents tightly-coupled data flow.
 */

export default async function VndrOnboardingStagePage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;

  // Layout already validated step + auth + redirect-on-published. If
  // getCurrentVendor returns null here we'd be in an unreachable state
  // (layout would have redirected). Defensive null check so TS narrows.
  const vendor = await getCurrentVendor();
  if (!vendor) return null;

  switch (step) {
    case "1":
      return (
        <Stage1
          initialCategory={vendor.primaryCategory}
          initialSubType={vendor.primarySubType}
        />
      );
    case "2": {
      // Scoped fetch — the resolver returns the layout/gate fields; Stage 2
      // needs the business form columns too. Single round-trip via select-list.
      const supabase = await createClient();
      const [{ data: authData }, { data: extra }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("vendors")
          .select(
            "display_name, contact_phone, years_in_business, website_url, founding_story, service_zips",
          )
          .eq("id", vendor.id)
          .maybeSingle(),
      ]);
      const authEmail = authData.user?.email ?? "";
      // display_name is NOT NULL but postAuthSeed seeds it with the email
      // placeholder; we render that placeholder as-is so the vendor sees what
      // will appear on their public profile until they overwrite it.
      return (
        <Stage2
          authEmail={authEmail}
          initial={{
            displayName: (extra?.display_name as string | null) ?? "",
            contactPhone: (extra?.contact_phone as string | null) ?? "",
            yearsInBusiness:
              (extra?.years_in_business as number | null) ?? null,
            websiteUrl: (extra?.website_url as string | null) ?? "",
            foundingStory: (extra?.founding_story as string | null) ?? "",
            serviceZips: (extra?.service_zips as string[] | null) ?? [],
          }}
        />
      );
    }
    case "3": {
      const supabase = await createClient();
      const { data: extra } = await supabase
        .from("vendors")
        .select(
          "starting_price_cents, concurrent_max, pricing_model, booking_mode, referral_rate_pct",
        )
        .eq("id", vendor.id)
        .maybeSingle();
      return (
        <Stage3
          initial={{
            startingPriceCents:
              (extra?.starting_price_cents as number | null) ?? null,
            concurrentMax: (extra?.concurrent_max as number | null) ?? null,
            pricingModel: (extra?.pricing_model as string | null) ?? null,
            bookingMode: (extra?.booking_mode as string | null) ?? null,
            referralRatePct: (() => {
              const v = extra?.referral_rate_pct;
              if (v == null) return null;
              const n = typeof v === "string" ? parseFloat(v) : (v as number);
              return Number.isFinite(n) ? n : null;
            })(),
          }}
        />
      );
    }
    case "4": {
      const supabase = await createClient();
      const { data: certs } = await supabase
        .from("tenant_certifications")
        .select("cert_type")
        .eq("tenant_id", vendor.tenantId);
      const uploadedInitial = (certs ?? []).map(
        (c) => c.cert_type as CertTypeKey,
      );
      return <Stage4 uploadedInitial={uploadedInitial} />;
    }
    default:
      notFound();
  }
}

/**
 * Placeholder pending each stage's real component. Each subsequent task
 * (Stage 1 → Stage 4) replaces one of these `case` arms with an import of
 * the stage component plus a real render.
 */
function StagePlaceholder({ n }: { n: number }) {
  return (
    <div className={s.stagePlaceholder}>
      <p>Stage {n} — coming next.</p>
    </div>
  );
}
