/**
 * Unit tests for the Phase 2 booking-lifecycle email templates.
 *
 * Run with: `node --test lib/email/templates/booking-lifecycle.test.ts`
 * (or the test:unit npm script). Same posture as the Phase 1 transactional
 * tests: structure + content invariants over the parameterized variant matrix
 * (template_type × locale × variant = 22 render targets), not pixel snapshots.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  renderInquiryReceivedEmail,
  renderBookingConfirmedEmail,
  renderDeclineEmail,
  type EmailLocale,
  type SellerPortal,
  type BuyerRole,
} from "./booking-lifecycle.ts";
import { EMAIL_ACCENTS } from "./_layout.ts";

const SELLER_PORTALS: SellerPortal[] = ["vndr", "venu", "plnr", "catr"];
const LOCALES: EmailLocale[] = ["en", "es"];

/** Generic jargon the sacred vocab rule forbids in user-facing copy. */
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

function assertLangAndCta(c: Content, locale: EmailLocale, ctaUrl: string) {
  assert.ok(c.html.includes(`<html lang="${locale}"`), "html lang must match locale");
  assert.ok(c.html.includes(ctaUrl), "html must link the CTA url");
  assert.ok(c.text.includes(ctaUrl), "text must include the CTA url");
}

// ── inquiry-received: 4 seller portals × EN/ES = 8 ──────────────────────────

describe("renderInquiryReceivedEmail", () => {
  for (const portal of SELLER_PORTALS) {
    for (const locale of LOCALES) {
      test(`${portal} / ${locale} — well-formed, accent, real names`, () => {
        const ctaUrl = `https://evntcue.com/${portal}/inquiries/abc`;
        const c = renderInquiryReceivedEmail({
          sellerPortal: portal,
          buyerName: "The Corbin Wedding",
          buyerRole: "orgnz",
          eventName: "Spring Gala",
          eventDate: "Saturday, May 1, 2027 · 4:30 PM",
          city: "Dallas, TX",
          budget: "$8,000–$12,000",
          message: "We loved your portfolio and would like to discuss availability.",
          ctaUrl,
          locale,
        });

        assertWellFormed(c);
        assertNoBannedJargon(c);
        assertLangAndCta(c, locale, ctaUrl);
        assert.ok(c.html.includes(EMAIL_ACCENTS[portal]), `must carry ${portal} accent`);
        // Real-name policy: buyer name surfaces in subject + body.
        assert.ok(c.subject.includes("The Corbin Wedding"), "subject carries real buyer name");
        assert.ok(c.html.includes("The Corbin Wedding"), "body carries real buyer name");
        // Disclosed budget renders.
        assert.ok(c.html.includes("$8,000"), "budget row renders when disclosed");
      });
    }
  }

  test("budget row omitted when undisclosed", () => {
    const c = renderInquiryReceivedEmail({
      sellerPortal: "vndr",
      buyerName: "Acme Org",
      buyerRole: "orgnz",
      eventName: "Launch",
      eventDate: "May 1, 2027",
      city: "Fort Worth, TX",
      message: "Interested.",
      ctaUrl: "https://x",
      locale: "en",
    });
    assert.ok(!c.html.includes("Budget"), "no budget row when undisclosed");
  });

  test("venue-buyer carries the venu accent treatment on a non-venu seller", () => {
    // vndr seller so venu accent only appears via the buyer-name underline.
    const c = renderInquiryReceivedEmail({
      sellerPortal: "vndr",
      buyerName: "Grand Hall",
      buyerRole: "venue",
      eventName: "Reception",
      eventDate: "May 1, 2027",
      city: "Dallas, TX",
      message: "Inquiry.",
      ctaUrl: "https://x",
      locale: "en",
    });
    assert.ok(c.html.includes(EMAIL_ACCENTS.venu), "venue-buyer name treatment uses venu accent");
  });

  test("user message is HTML-escaped", () => {
    const c = renderInquiryReceivedEmail({
      sellerPortal: "vndr",
      buyerName: "Org",
      buyerRole: "orgnz",
      eventName: "E",
      eventDate: "D",
      city: "C",
      message: "<script>alert('x')</script> & more",
      ctaUrl: "https://x",
      locale: "en",
    });
    assert.ok(!c.html.includes("<script>"), "raw script tag must not survive into html");
    assert.ok(c.html.includes("&lt;script&gt;"), "angle brackets must be escaped");
  });

  test("long message is truncated", () => {
    const long = "x".repeat(900);
    const c = renderInquiryReceivedEmail({
      sellerPortal: "vndr",
      buyerName: "Org",
      buyerRole: "orgnz",
      eventName: "E",
      eventDate: "D",
      city: "C",
      message: long,
      ctaUrl: "https://x",
      locale: "en",
    });
    assert.ok(c.text.includes("…"), "truncated message carries an ellipsis");
    assert.ok(!c.text.includes("x".repeat(600)), "full long body must not appear");
  });

  test("EN and ES differ", () => {
    const base = {
      sellerPortal: "vndr" as const,
      buyerName: "Org",
      buyerRole: "orgnz" as const,
      eventName: "E",
      eventDate: "D",
      city: "C",
      message: "M",
      ctaUrl: "https://x",
    };
    const en = renderInquiryReceivedEmail({ ...base, locale: "en" });
    const es = renderInquiryReceivedEmail({ ...base, locale: "es" });
    assert.notEqual(en.subject, es.subject);
    assert.notEqual(en.html, es.html);
  });
});

// ── booking-confirmed: buyer (orgnz) ×2 + seller ×4 portals ×2 = 10 ─────────

describe("renderBookingConfirmedEmail", () => {
  for (const locale of LOCALES) {
    test(`buyer / ${locale} — orgnz accent, real names`, () => {
      const ctaUrl = "https://evntcue.com/orgnz/events/e1";
      const c = renderBookingConfirmedEmail({
        recipient: "buyer",
        sellerPortal: "vndr",
        buyerName: "Acme Org",
        sellerName: "Bloom & Co",
        eventName: "Spring Gala",
        eventDate: "May 1, 2027",
        city: "Dallas, TX",
        total: "$9,500",
        nextMilestone: "Deposit due May 10",
        ctaUrl,
        locale,
      });
      assertWellFormed(c);
      assertNoBannedJargon(c);
      assertLangAndCta(c, locale, ctaUrl);
      assert.ok(c.html.includes(EMAIL_ACCENTS.orgnz), "buyer side uses orgnz accent");
      assert.ok(c.subject.includes("Bloom & Co"), "buyer subject names the seller");
      assert.ok(c.html.includes("Bloom &amp; Co"), "seller name escaped in body");
    });
  }

  for (const portal of SELLER_PORTALS) {
    for (const locale of LOCALES) {
      test(`seller ${portal} / ${locale} — portal accent, real names`, () => {
        const ctaUrl = `https://evntcue.com/${portal}/bookings/b1`;
        const c = renderBookingConfirmedEmail({
          recipient: "seller",
          sellerPortal: portal,
          buyerName: "Acme Org",
          sellerName: "Bloom & Co",
          eventName: "Spring Gala",
          eventDate: "May 1, 2027",
          city: "Dallas, TX",
          total: "$9,500",
          ctaUrl,
          locale,
        });
        assertWellFormed(c);
        assertNoBannedJargon(c);
        assertLangAndCta(c, locale, ctaUrl);
        assert.ok(c.html.includes(EMAIL_ACCENTS[portal]), `seller side uses ${portal} accent`);
        assert.ok(c.subject.includes("Acme Org"), "seller subject names the buyer");
      });
    }
  }

  test("buyer next-milestone row is optional", () => {
    const c = renderBookingConfirmedEmail({
      recipient: "buyer",
      sellerPortal: "vndr",
      buyerName: "Org",
      sellerName: "S",
      eventName: "E",
      eventDate: "D",
      city: "C",
      total: "$1",
      ctaUrl: "https://x",
      locale: "en",
    });
    assert.ok(!c.html.includes(">Next<"), "no Next row when milestone absent");
  });

  test("buyer and seller sides differ", () => {
    const base = {
      sellerPortal: "vndr" as const,
      buyerName: "Org",
      sellerName: "S",
      eventName: "E",
      eventDate: "D",
      city: "C",
      total: "$1",
      ctaUrl: "https://x",
      locale: "en" as const,
    };
    const buyer = renderBookingConfirmedEmail({ ...base, recipient: "buyer" });
    const seller = renderBookingConfirmedEmail({ ...base, recipient: "seller" });
    assert.notEqual(buyer.subject, seller.subject);
    assert.notEqual(buyer.html, seller.html);
  });
});

// ── decline: orgnz / venue buyer ×2 = 4 ─────────────────────────────────────

describe("renderDeclineEmail", () => {
  const BUYER_ROLES: BuyerRole[] = ["orgnz", "venue"];
  for (const role of BUYER_ROLES) {
    for (const locale of LOCALES) {
      test(`${role} / ${locale} — correct accent, names, Cue line`, () => {
        const ctaUrl = `https://evntcue.com/${role === "venue" ? "venu" : "orgnz"}/events/e1`;
        const c = renderDeclineEmail({
          buyerRole: role,
          sellerName: "Bloom & Co",
          eventName: "Spring Gala",
          eventDate: "May 1, 2027",
          reason: "Already booked that weekend.",
          ctaUrl,
          locale,
        });
        assertWellFormed(c);
        assertNoBannedJargon(c);
        assertLangAndCta(c, locale, ctaUrl);
        const expected = role === "venue" ? EMAIL_ACCENTS.venu : EMAIL_ACCENTS.orgnz;
        assert.ok(c.html.includes(expected), `${role} decline uses the right accent`);
        assert.ok(c.subject.includes("Bloom & Co"), "subject names the seller");
        assert.ok(c.html.includes("✦"), "Cue ✦ glyph permitted in decline Cue-context line");
      });
    }
  }

  test("missing reason renders the fallback line, not a quote block", () => {
    const en = renderDeclineEmail({
      buyerRole: "orgnz",
      sellerName: "S",
      eventName: "E",
      eventDate: "D",
      ctaUrl: "https://x",
      locale: "en",
    });
    assert.ok(en.text.includes("They didn't share a reason."), "EN fallback line present");
    assert.ok(!en.text.includes("Here's why:"), "no 'Here's why' lead-in without a reason");
  });

  test("EN and ES differ", () => {
    const base = {
      buyerRole: "orgnz" as const,
      sellerName: "S",
      eventName: "E",
      eventDate: "D",
      ctaUrl: "https://x",
    };
    const en = renderDeclineEmail({ ...base, locale: "en" });
    const es = renderDeclineEmail({ ...base, locale: "es" });
    assert.notEqual(en.subject, es.subject);
    assert.notEqual(en.html, es.html);
  });
});
