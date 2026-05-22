/**
 * Unit tests for fetchAndRehostImage (Chunk C, C-4).
 *
 * Four fixtures per the brief:
 *   1. happy path — 2MB JPEG → returns storagePath + signedUrl
 *   2. too large — 11MB → throws RehostError("too_large")
 *   3. unsupported type — image/gif → throws RehostError("unsupported_type")
 *   4. fetch failure — 404 → throws RehostError("fetch_failed")
 *
 * Run with: `npm run test:unit` (which globs lib/**\/*.test.ts under
 * Node's experimental-strip-types mode — see package.json).
 *
 * Mocking strategy: pass `fetchImpl` into the helper and stub the
 * Supabase client minimally. No global monkey-patching, no jest deps.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { fetchAndRehostImage, RehostError } from "./pinterest-import.ts";

type StubSupabase = {
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        body: Buffer,
        opts: { contentType: string; upsert: boolean },
      ) => Promise<{ error: null | { message: string } }>;
      createSignedUrl: (
        path: string,
        ttl: number,
      ) => Promise<{
        data: { signedUrl: string } | null;
        error: null | { message: string };
      }>;
    };
  };
};

function makeStubSupabase(): {
  client: StubSupabase;
  uploads: Array<{ path: string; size: number; contentType: string }>;
} {
  const uploads: Array<{ path: string; size: number; contentType: string }> = [];
  const client: StubSupabase = {
    storage: {
      from: (_bucket: string) => ({
        upload: async (path, body, opts) => {
          uploads.push({ path, size: body.length, contentType: opts.contentType });
          return { error: null };
        },
        createSignedUrl: async (path, _ttl) => ({
          data: { signedUrl: `https://signed.example/${path}?token=abc` },
          error: null,
        }),
      }),
    },
  };
  return { client, uploads };
}

function mockFetch(
  status: number,
  bytes: Uint8Array,
  contentType: string,
): typeof fetch {
  return (async () => {
    return new Response(bytes.buffer as ArrayBuffer, {
      status,
      headers: {
        "content-type": contentType,
        "content-length": String(bytes.byteLength),
      },
    });
  }) as unknown as typeof fetch;
}

describe("fetchAndRehostImage", () => {
  test("happy path — 2MB JPEG returns storagePath + signedUrl", async () => {
    const bytes = new Uint8Array(2 * 1024 * 1024); // 2MB
    const { client, uploads } = makeStubSupabase();
    const result = await fetchAndRehostImage({
      sourceUrl: "https://i.pinimg.com/originals/ab/cd/ef.jpg",
      tenantId: "tenant-uuid",
      boardId: "board-uuid",
      // The shape we pass is the same as the real Supabase client surface
      // we use — storage.from(...).upload/createSignedUrl — typed loosely.
      supabase: client as unknown as Parameters<
        typeof fetchAndRehostImage
      >[0]["supabase"],
      fetchImpl: mockFetch(200, bytes, "image/jpeg"),
    });

    assert.equal(uploads.length, 1);
    assert.match(uploads[0].path, /^tenant-uuid\/board-uuid\/.+\.jpg$/);
    assert.equal(uploads[0].size, bytes.byteLength);
    assert.equal(uploads[0].contentType, "image/jpeg");
    assert.equal(result.storagePath, uploads[0].path);
    assert.match(result.signedUrl, /^https:\/\/signed\.example\//);
    assert.equal(result.sizeBytes, bytes.byteLength);
  });

  test("too large — 11MB throws RehostError(too_large)", async () => {
    const bytes = new Uint8Array(11 * 1024 * 1024); // 11MB
    const { client } = makeStubSupabase();
    await assert.rejects(
      fetchAndRehostImage({
        sourceUrl: "https://i.pinimg.com/originals/big.jpg",
        tenantId: "tenant-uuid",
        boardId: "board-uuid",
        supabase: client as unknown as Parameters<
          typeof fetchAndRehostImage
        >[0]["supabase"],
        fetchImpl: mockFetch(200, bytes, "image/jpeg"),
      }),
      (err: unknown) =>
        err instanceof RehostError && err.code === "too_large",
    );
  });

  test("unsupported type — image/gif throws RehostError(unsupported_type)", async () => {
    const bytes = new Uint8Array(1024);
    const { client } = makeStubSupabase();
    await assert.rejects(
      fetchAndRehostImage({
        sourceUrl: "https://i.pinimg.com/originals/anim.gif",
        tenantId: "tenant-uuid",
        boardId: "board-uuid",
        supabase: client as unknown as Parameters<
          typeof fetchAndRehostImage
        >[0]["supabase"],
        fetchImpl: mockFetch(200, bytes, "image/gif"),
      }),
      (err: unknown) =>
        err instanceof RehostError && err.code === "unsupported_type",
    );
  });

  test("fetch failure — 404 throws RehostError(fetch_failed)", async () => {
    const bytes = new Uint8Array(0);
    const { client } = makeStubSupabase();
    await assert.rejects(
      fetchAndRehostImage({
        sourceUrl: "https://i.pinimg.com/originals/missing.jpg",
        tenantId: "tenant-uuid",
        boardId: "board-uuid",
        supabase: client as unknown as Parameters<
          typeof fetchAndRehostImage
        >[0]["supabase"],
        fetchImpl: mockFetch(404, bytes, "text/html"),
      }),
      (err: unknown) =>
        err instanceof RehostError && err.code === "fetch_failed",
    );
  });
});
