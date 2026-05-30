/**
 * Unit tests for the Phase 3 / Workstream 2 cross-party delivery-failure email.
 *
 * Run with: `node --test lib/email/templates/delivery-failure.test.ts`
 * (or the test:unit npm script). Same posture as the Phase 2 booking-lifecycle
 * tests: structure + content invariants over the buyer-role × locale ×
 * bounce-kind matrix, not pixel snapshots.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { renderDeliveryFailureCrossPartyEmail } from "./delivery-failure.ts";
import type { EmailLocale, BuyerRole } from "./booking-lifecycle.ts";
import { EMAIL_ACCENTS } from "./_layout.ts";

const LOCALES: EmailLocale[] = ["en", "es"];
const BUYER_ROLES: BuyerRole[] = ["orgnz", "venue"];
const BANNED = ["service provider", "supplier", "vendor ", "client", "customer"];

type Content = { subject: string; text: string; html: string };

function assertWellFormed(c: Content) {
  assert.ok(c.subject.length > 0, "subject must be non-empty");
  assert.ok(c.text.length > 0, "text must be non-empty");
  assert.match(c.html, /^<!doctype html>/i, "html must be a full document");
  assert.ok(c.html.includes("</html>"), "html must close the document");
}

function assertNoBannedJargon(c: Content) {
  const haystack = `${c.subject}\n${c.text}`.toLowerCase();
  for (const term of BANNED) {
    assert.ok(!haystack.includes(term), `copy must not contain banned jargon "${term.trim()}"`);
  }
}

describe("renderDeliveryFailureCrossPartyEmail", () => {
  for (const role of BUYER_ROLES) {
    for (const locale of LOCALES) {
      test(`${role} / ${locale} — well-formed, accent, names, CTA, Cue line`, () => {
        const portal = role === "venue" ? "venu" : "orgnz";
        const ctaUrl = `https://evntcue.com/${portal}/inquiries/abc`;
        const c = renderDeliveryFailureCrossPartyEmail({
          buyerRole: role,
          sellerName: "Bloom & Co",
          eventName: "Spring Gala",
          failedKind: "inquiry",
          bounceKind: "hard",
          sentAt: "May 30, 2026 · 2:14 PM",
          ctaUrl,
          locale,
        });

        assertWellFormed(c);
        assertNoBannedJargon(c);
        assert.ok(c.html.includes(`<html lang="${locale}"`), "html lang matches locale");
        assert.ok(c.html.includes(ctaUrl), "html links the CTA url");
        assert.ok(c.text.includes(ctaUrl), "text includes the CTA url");

        const expected = role === "venue" ? EMAIL_ACCENTS.venu : EMAIL_ACCENTS.orgnz;
        assert.ok(c.html.includes(expected), `${role} buyer uses the right accent`);

        // Real-name policy: seller name surfaces in subject + body.
        assert.ok(c.subject.includes("Bloom & Co"), "subject names the seller");
        assert.ok(c.html.includes("Bloom &amp; Co"), "seller name escaped in body");
        assert.ok(c.subject.includes("Spring Gala"), "subject names the event");

        // Cue ✦ context line permitted here.
        assert.ok(c.html.includes("✦"), "Cue ✦ glyph present in the reassurance line");
      });
    }
  }

  test("hard vs soft failure label differs (humanized)", () => {
    const base = {
      buyerRole: "orgnz" as const,
      sellerName: "S",
      eventName: "E",
      failedKind: "inquiry" as const,
      sentAt: "May 1, 2026",
      ctaUrl: "https://x",
      locale: "en" as const,
    };
    const hard = renderDeliveryFailureCrossPartyEmail({ ...base, bounceKind: "hard" });
    const soft = renderDeliveryFailureCrossPartyEmail({ ...base, bounceKind: "soft" });
    assert.ok(hard.text.includes("Permanent (hard bounce)"), "hard label humanized");
    assert.ok(soft.text.includes("Temporary (retrying)"), "soft label humanized");
    assert.notEqual(hard.html, soft.html);
  });

  test("seller name with markup is HTML-escaped", () => {
    const c = renderDeliveryFailureCrossPartyEmail({
      buyerRole: "orgnz",
      sellerName: "<script>alert('x')</script>",
      eventName: "E",
      failedKind: "inquiry",
      bounceKind: "hard",
      sentAt: "May 1, 2026",
      ctaUrl: "https://x",
      locale: "en",
    });
    assert.ok(!c.html.includes("<script>"), "raw script tag must not survive into html");
    assert.ok(c.html.includes("&lt;script&gt;"), "angle brackets must be escaped");
  });

  test("failedKind drives the noun in the body", () => {
    const inquiry = renderDeliveryFailureCrossPartyEmail({
      buyerRole: "orgnz",
      sellerName: "S",
      eventName: "E",
      failedKind: "inquiry",
      bounceKind: "hard",
      sentAt: "May 1, 2026",
      ctaUrl: "https://x",
      locale: "en",
    });
    assert.ok(inquiry.text.includes("your inquiry"), "inquiry noun renders");
  });

  test("EN and ES differ", () => {
    const base = {
      buyerRole: "orgnz" as const,
      sellerName: "S",
      eventName: "E",
      failedKind: "inquiry" as const,
      bounceKind: "hard" as const,
      sentAt: "May 1, 2026",
      ctaUrl: "https://x",
    };
    const en = renderDeliveryFailureCrossPartyEmail({ ...base, locale: "en" });
    const es = renderDeliveryFailureCrossPartyEmail({ ...base, locale: "es" });
    assert.notEqual(en.subject, es.subject);
    assert.notEqual(en.html, es.html);
  });
});
