/**
 * Unit tests for RenderService — runRender + pollRender (Chunk D, Step 3).
 *
 * Coverage: 10 tests across happy paths, processing paths, and the full
 * RenderErrorCode space minus `unexpected_response` (covered implicitly by
 * the happy-path JSON parse).
 *
 * Run with: `npm run test:unit` (globs lib/**\/*.test.ts under
 * Node's --experimental-strip-types mode).
 *
 * Mocking strategy: pass `fetchImpl` into the SUT. No global monkey-patching.
 * REPLICATE_API_TOKEN is set in beforeEach and cleared in afterEach so each
 * test starts from a known env state.
 */

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  runRender,
  pollRender,
  RenderError,
  type RenderOutcome,
} from "./RenderService.ts";

const TEST_TOKEN = "test-replicate-token";

function mockFetch(status: number, body: unknown): typeof fetch {
  return (async () => {
    const init: ResponseInit = { status };
    return new Response(JSON.stringify(body), init);
  }) as unknown as typeof fetch;
}

function mockFetchRaw(status: number, text: string): typeof fetch {
  return (async () => {
    return new Response(text, { status });
  }) as unknown as typeof fetch;
}

function mockFetchThrows(error: Error): typeof fetch {
  return (async () => {
    throw error;
  }) as unknown as typeof fetch;
}

describe("RenderService", () => {
  beforeEach(() => {
    process.env.REPLICATE_API_TOKEN = TEST_TOKEN;
  });
  afterEach(() => {
    delete process.env.REPLICATE_API_TOKEN;
  });

  describe("runRender", () => {
    test("happy path — succeeded prediction returns RenderSuccess", async () => {
      const fetchImpl = mockFetch(200, {
        id: "pred-abc",
        status: "succeeded",
        output: ["https://replicate.delivery/pbxt/output.webp"],
        error: null,
        started_at: "2026-05-22T22:00:00Z",
        completed_at: "2026-05-22T22:00:04Z",
      });

      const outcome = await runRender(
        { prompt: "editorial wedding mood, hero shot" },
        { fetchImpl },
      );

      assert.equal(outcome.status, "succeeded");
      if (outcome.status === "succeeded") {
        assert.equal(outcome.providerJobId, "pred-abc");
        assert.equal(
          outcome.imageUrl,
          "https://replicate.delivery/pbxt/output.webp",
        );
        assert.equal(outcome.startedAt, "2026-05-22T22:00:00Z");
        assert.equal(outcome.completedAt, "2026-05-22T22:00:04Z");
      }
    });

    test("still processing — sync wait elapsed returns RenderProcessing", async () => {
      const fetchImpl = mockFetch(200, {
        id: "pred-slow",
        status: "processing",
        output: null,
        error: null,
        started_at: "2026-05-22T22:00:00Z",
        completed_at: null,
      });

      const outcome: RenderOutcome = await runRender(
        { prompt: "complex render" },
        { fetchImpl },
      );

      assert.equal(outcome.status, "processing");
      if (outcome.status === "processing") {
        assert.equal(outcome.providerJobId, "pred-slow");
      }
    });

    test("missing token throws RenderError(missing_token)", async () => {
      delete process.env.REPLICATE_API_TOKEN;
      const fetchImpl = mockFetch(200, {});

      await assert.rejects(
        runRender({ prompt: "anything" }, { fetchImpl }),
        (err: unknown) =>
          err instanceof RenderError && err.code === "missing_token",
      );
    });

    test("empty prompt throws RenderError(invalid_input)", async () => {
      const fetchImpl = mockFetch(200, {});
      await assert.rejects(
        runRender({ prompt: "   " }, { fetchImpl }),
        (err: unknown) =>
          err instanceof RenderError && err.code === "invalid_input",
      );
    });

    test("auth failure — 401 throws RenderError(auth_failed)", async () => {
      const fetchImpl = mockFetchRaw(401, "unauthorized");

      await assert.rejects(
        runRender({ prompt: "p" }, { fetchImpl }),
        (err: unknown) =>
          err instanceof RenderError &&
          err.code === "auth_failed" &&
          err.status === 401,
      );
    });

    test("rate limit — 429 throws RenderError(rate_limited)", async () => {
      const fetchImpl = mockFetchRaw(429, "rate limit hit");

      await assert.rejects(
        runRender({ prompt: "p" }, { fetchImpl }),
        (err: unknown) =>
          err instanceof RenderError &&
          err.code === "rate_limited" &&
          err.status === 429,
      );
    });

    test("provider error — 502 throws RenderError(provider_error)", async () => {
      const fetchImpl = mockFetchRaw(502, "bad gateway");

      await assert.rejects(
        runRender({ prompt: "p" }, { fetchImpl }),
        (err: unknown) =>
          err instanceof RenderError &&
          err.code === "provider_error" &&
          err.status === 502,
      );
    });

    test("render failed — status:failed throws RenderError(render_failed)", async () => {
      const fetchImpl = mockFetch(200, {
        id: "pred-bad",
        status: "failed",
        output: null,
        error: "NSFW content detected",
        started_at: "2026-05-22T22:00:00Z",
        completed_at: "2026-05-22T22:00:02Z",
      });

      await assert.rejects(
        runRender({ prompt: "p" }, { fetchImpl }),
        (err: unknown) =>
          err instanceof RenderError &&
          err.code === "render_failed" &&
          err.providerJobId === "pred-bad",
      );
    });

    test("fetch throws — network error wrapped as RenderError(fetch_failed)", async () => {
      const fetchImpl = mockFetchThrows(new Error("ECONNREFUSED"));

      await assert.rejects(
        runRender({ prompt: "p" }, { fetchImpl }),
        (err: unknown) =>
          err instanceof RenderError && err.code === "fetch_failed",
      );
    });
  });

  describe("pollRender", () => {
    test("happy path — succeeded prediction returns RenderSuccess", async () => {
      const fetchImpl = mockFetch(200, {
        id: "pred-poll",
        status: "succeeded",
        output: "https://replicate.delivery/pbxt/polled.webp",
        error: null,
        started_at: "2026-05-22T22:00:00Z",
        completed_at: "2026-05-22T22:00:05Z",
      });

      const outcome = await pollRender("pred-poll", { fetchImpl });

      assert.equal(outcome.status, "succeeded");
      if (outcome.status === "succeeded") {
        assert.equal(outcome.providerJobId, "pred-poll");
        assert.equal(
          outcome.imageUrl,
          "https://replicate.delivery/pbxt/polled.webp",
        );
      }
    });

    test("missing providerJobId throws RenderError(invalid_input)", async () => {
      const fetchImpl = mockFetch(200, {});
      await assert.rejects(
        pollRender("", { fetchImpl }),
        (err: unknown) =>
          err instanceof RenderError && err.code === "invalid_input",
      );
    });
  });
});
