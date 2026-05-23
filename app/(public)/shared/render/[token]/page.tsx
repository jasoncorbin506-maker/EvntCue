import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import s from "./shared-render.module.css";

/**
 * Mood Board Chunk E — public share surface for a single rendered photo.
 *
 * Per Lock 18 (image sourcing + share semantics): a pin with a non-NULL
 * `public_share_token` is publicly accessible at /shared/render/[token].
 * No auth required — the token IS the consent grant.
 *
 * Per Lock 21 (editorial framing): stable single-photo page with
 * Cormorant footer caption "An inspiration, not a guarantee. Built on
 * EvntCue." — that footer is the funnel re-entry hook for anyone who
 * sees the share and wants their own.
 *
 * Per Lock 22 (forgiveness): if the underlying pin is soft-deleted, this
 * route 404s. Restoring the pin (via Recently Removed) re-activates the
 * share URL with the same token.
 *
 * Per Lock 18 (image durability): the image is served via a 1h signed
 * URL into the private `mood-board-renders` bucket. We re-host on every
 * page view rather than baking the signed URL into the response — that
 * keeps the URL fresh for shares that might be opened hours after the
 * initial Web Share API call.
 */

export const dynamic = "force-dynamic";

type Params = Promise<{ token: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { token } = await params;
  const t = await getTranslations("moodboard");
  const admin = createAdminClient();
  const { data: pin } = await admin
    .from("mood_board_pins")
    .select("frame_subject_key")
    .eq("public_share_token", token)
    .is("deleted_at", null)
    .maybeSingle();
  if (!pin) {
    return { title: "EvntCue", description: t("spreadFooterCaption") };
  }
  return {
    title: `EvntCue — ${pin.frame_subject_key ?? "render"}`,
    description: t("spreadFooterCaption"),
  };
}

export default async function SharedRenderPage({ params }: { params: Params }) {
  const { token } = await params;
  if (!token || typeof token !== "string") notFound();

  const t = await getTranslations("moodboard");
  const admin = createAdminClient();

  const { data: pin, error: pinErr } = await admin
    .from("mood_board_pins")
    .select("id, url, frame_subject_key, aspect_ratio, deleted_at")
    .eq("public_share_token", token)
    .is("deleted_at", null)
    .maybeSingle();

  if (pinErr || !pin) notFound();

  const { data: signed, error: signErr } = await admin.storage
    .from("mood-board-renders")
    .createSignedUrl(pin.url as string, 60 * 60);

  if (signErr || !signed?.signedUrl) notFound();

  const aspectClass =
    pin.aspect_ratio === "16:9"
      ? s.frame16x9
      : pin.aspect_ratio === "4:3"
        ? s.frame4x3
        : pin.aspect_ratio === "3:4"
          ? s.frame3x4
          : s.frame1x1;

  return (
    <main className={s.page}>
      <header className={s.pubChrome}>
        <Link href="/" className={s.pubBrand}>
          <span className={s.pubMark} aria-hidden="true" />
          <span className={s.pubWordmark}>EvntCue</span>
        </Link>
      </header>

      <section className={s.frameSection}>
        <div className={`${s.frame} ${aspectClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={signed.signedUrl}
            alt={(pin.frame_subject_key as string | null) ?? "Rendered mood board photo"}
            className={s.frameImg}
          />
        </div>
        <p className={s.caption}>{t("spreadFooterCaption")}</p>
      </section>

      <footer className={s.cta}>
        <p className={s.ctaText}>{t("sharedPageCta")}</p>
        <Link href="/landing" className={s.ctaButton}>
          {t("sharedPageCtaButton")}
        </Link>
      </footer>
    </main>
  );
}
