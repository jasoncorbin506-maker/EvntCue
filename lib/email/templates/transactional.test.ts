/**
 * Unit tests for the Phase 1 transactional email templates.
 *
 * Run with: `node --test lib/email/templates/transactional.test.ts`
 * (or the test:unit npm script). Uses Node's built-in test runner — matches
 * the existing pattern in lib/crypto/tenant-encryption.test.ts.
 *
 * These are pure string builders, so the tests assert structure + content
 * invariants rather than pixel-exact snapshots: every variant must produce a
 * non-empty subject, a plain-text body, a full HTML document carrying the CTA
 * URL and the correct lang, and must honor the brand-vocab discipline.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  renderWelcomeEmail,
  renderPasswordResetRequestEmail,
  renderPasswordChangedEmail,
  type EmailLocale,
  type WelcomePortal,
} from "./transactional.ts";
import { EMAIL_ACCENTS } from "./_layout.ts";

const PORTALS: WelcomePortal[] = ["orgnz", "vndr", "venu", "plnr", "catr"];
const LOCALES: EmailLocale[] = ["en", "es"];

/** Generic jargon the sacred vocab rule forbids in user-facing copy. */
const BANNED = ["service provider", "supplier", "vendor "];

function assertWellFormed(content: { subject: string; text: string; html: string }) {
  assert.ok(content.subject.length > 0, "subject must be non-empty");
  assert.ok(content.text.length > 0, "text must be non-empty");
  assert.match(content.html, /^<!doctype html>/i, "html must be a full document");
  assert.ok(content.html.includes("</html>"), "html must close the document");
}

function assertNoBannedJargon(content: { subject: string; text: string; html: string }) {
  const haystack = `${content.subject}\n${content.text}`.toLowerCase();
  for (const term of BANNED) {
    assert.ok(
      !haystack.includes(term),
      `copy must not contain banned jargon "${term.trim()}"`,
    );
  }
}

describe("renderWelcomeEmail", () => {
  for (const portal of PORTALS) {
    for (const locale of LOCALES) {
      test(`${portal} / ${locale} — well-formed, carries CTA + accent`, () => {
        const ctaUrl = "https://evntcue.com/example";
        const content = renderWelcomeEmail({ portal, ctaUrl, locale });

        assertWellFormed(content);
        assertNoBannedJargon(content);

        // CTA URL appears in both the button href and the plain-text body.
        assert.ok(content.html.includes(ctaUrl), "html must link the CTA url");
        assert.ok(content.text.includes(ctaUrl), "text must include the CTA url");

        // lang attribute matches the locale.
        assert.ok(
          content.html.includes(`<html lang="${locale}"`),
          "html lang must match locale",
        );

        // The portal's Lock 18 accent hue appears (eyebrow / button).
        const accentKey = portal; // welcome accent key == portal key
        assert.ok(
          content.html.includes(EMAIL_ACCENTS[accentKey]),
          `html must carry the ${portal} accent ${EMAIL_ACCENTS[accentKey]}`,
        );
      });
    }
  }

  test("EN and ES variants differ (Lock 9 parity, not a copy-paste)", () => {
    const en = renderWelcomeEmail({ portal: "orgnz", ctaUrl: "https://x", locale: "en" });
    const es = renderWelcomeEmail({ portal: "orgnz", ctaUrl: "https://x", locale: "es" });
    assert.notEqual(en.subject, es.subject);
    assert.notEqual(en.html, es.html);
  });

  test("canonical labels stay English in ES copy", () => {
    const vndr = renderWelcomeEmail({ portal: "vndr", ctaUrl: "https://x", locale: "es" });
    assert.ok(vndr.html.includes("Vndr"), "ES Vndr welcome keeps the canonical label");
    // Plnr ES body references the label inline — it must stay "Vndrs", not be
    // translated to "proveedores".
    const plnr = renderWelcomeEmail({ portal: "plnr", ctaUrl: "https://x", locale: "es" });
    assert.ok(plnr.text.includes("Vndrs"), "ES Plnr body keeps the canonical plural");
  });
});

describe("renderPasswordResetRequestEmail", () => {
  for (const locale of LOCALES) {
    test(`${locale} — well-formed, carries the action link`, () => {
      const actionUrl = "https://evntcue.com/auth/recover?token_hash=abc&type=recovery";
      const content = renderPasswordResetRequestEmail({ actionUrl, locale });

      assertWellFormed(content);
      assertNoBannedJargon(content);
      assert.ok(content.html.includes(actionUrl), "html must link the action url");
      assert.ok(content.text.includes(actionUrl), "text must include the action url");
      assert.ok(
        content.html.includes(`<html lang="${locale}"`),
        "html lang must match locale",
      );
    });
  }

  test("EN and ES differ", () => {
    const en = renderPasswordResetRequestEmail({ actionUrl: "https://x", locale: "en" });
    const es = renderPasswordResetRequestEmail({ actionUrl: "https://x", locale: "es" });
    assert.notEqual(en.subject, es.subject);
    assert.notEqual(en.html, es.html);
  });
});

describe("renderPasswordChangedEmail", () => {
  for (const locale of LOCALES) {
    test(`${locale} — well-formed, carries the sign-in link`, () => {
      const signInUrl = "https://evntcue.com/login";
      const content = renderPasswordChangedEmail({ signInUrl, locale });

      assertWellFormed(content);
      assertNoBannedJargon(content);
      assert.ok(content.html.includes(signInUrl), "html must link the sign-in url");
      assert.ok(content.text.includes(signInUrl), "text must include the sign-in url");
      assert.ok(
        content.html.includes(`<html lang="${locale}"`),
        "html lang must match locale",
      );
    });
  }

  test("EN and ES differ", () => {
    const en = renderPasswordChangedEmail({ signInUrl: "https://x", locale: "en" });
    const es = renderPasswordChangedEmail({ signInUrl: "https://x", locale: "es" });
    assert.notEqual(en.subject, es.subject);
    assert.notEqual(en.html, es.html);
  });
});
