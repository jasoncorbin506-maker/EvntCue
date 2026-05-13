/**
 * Integration tests for tenant-encryption.ts.
 *
 * These tests hit the real Postgres RPCs (encrypt_for_tenant / decrypt_for_tenant
 * / bulk_decrypt_for_tenant) using a service-role Supabase client. The Postgres
 * RPCs do the actual cryptographic work; the wrapper module is thin so testing
 * the round-trip end-to-end is what matters.
 *
 * Run from the app root:
 *   node --test --import tsx lib/crypto/tenant-encryption.test.ts
 *
 * Required env vars (read from .env.local — Next.js auto-loads, but node --test
 * doesn't, so export them or use a dotenv wrapper):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Tests skip if those env vars are missing.
 */

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import {
  encryptForTenant,
  decryptForTenant,
  bulkDecryptForTenant,
  TenantEncryptionError,
} from "./tenant-encryption.ts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Two arbitrary UUIDs. The RPC derives a per-tenant key from each — they
// don't need to exist as real tenant rows for crypto to work (service-role
// bypasses the user_can_access check; auth.uid() is NULL).
const TENANT_A = "00000000-0000-0000-0000-000000000001";
const TENANT_B = "00000000-0000-0000-0000-000000000002";

function makeAdminClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const skipReason =
  !SUPABASE_URL || !SERVICE_KEY
    ? "Skipping: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set"
    : null;

describe("tenant-encryption", { skip: skipReason ?? undefined }, () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let client: any;

  before(() => {
    client = makeAdminClient();
  });

  test("round-trip: encrypt then decrypt returns original", async () => {
    const plaintext = "the quick brown fox jumps over the lazy dog";
    const ciphertext = await encryptForTenant(TENANT_A, plaintext, client);
    assert.ok(ciphertext, "ciphertext should be non-null");
    assert.notEqual(ciphertext, plaintext, "ciphertext should differ from plaintext");

    const decrypted = await decryptForTenant(TENANT_A, ciphertext, client);
    assert.equal(decrypted, plaintext);
  });

  test("tenant isolation: ciphertext for tenant A throws when decrypted with tenant B", async () => {
    const plaintext = "tenant A's secret";
    const ciphertext = await encryptForTenant(TENANT_A, plaintext, client);
    assert.ok(ciphertext);

    await assert.rejects(
      async () => {
        await decryptForTenant(TENANT_B, ciphertext, client);
      },
      (err: unknown) => {
        // pgp_sym_decrypt with the wrong password raises a Postgres error.
        // Our wrapper surfaces it as TenantEncryptionError.
        assert.ok(err instanceof TenantEncryptionError);
        return true;
      },
    );
  });

  test("malformed input: non-base64 ciphertext throws", async () => {
    await assert.rejects(
      async () => {
        await decryptForTenant(TENANT_A, "not-valid-base64!!!", client);
      },
      (err: unknown) => {
        assert.ok(err instanceof TenantEncryptionError);
        return true;
      },
    );
  });

  test("empty string round-trips", async () => {
    const ciphertext = await encryptForTenant(TENANT_A, "", client);
    assert.ok(ciphertext, "empty string should still encrypt to a non-null ciphertext");
    const decrypted = await decryptForTenant(TENANT_A, ciphertext, client);
    assert.equal(decrypted, "");
  });

  test("null passes through (encrypt) and (decrypt)", async () => {
    assert.equal(await encryptForTenant(TENANT_A, null, client), null);
    assert.equal(await decryptForTenant(TENANT_A, null, client), null);
  });

  test("unicode round-trips (multi-byte + emoji)", async () => {
    const plaintext = "Sangeet at Aunt Priya's · 結婚式 · Кириллица · 🎉";
    const ciphertext = await encryptForTenant(TENANT_A, plaintext, client);
    const decrypted = await decryptForTenant(TENANT_A, ciphertext, client);
    assert.equal(decrypted, plaintext);
  });

  test("100KB plaintext round-trips", async () => {
    const plaintext = "x".repeat(100_000);
    const ciphertext = await encryptForTenant(TENANT_A, plaintext, client);
    assert.ok(ciphertext);
    const decrypted = await decryptForTenant(TENANT_A, ciphertext, client);
    assert.equal(decrypted?.length, 100_000);
    assert.equal(decrypted, plaintext);
  });

  test("bulk decrypt: order preserved, NULLs preserved", async () => {
    const plaintexts = ["alpha", "beta", "gamma"];
    const ciphertexts = await Promise.all(
      plaintexts.map((p) => encryptForTenant(TENANT_A, p, client)),
    );
    const input = [ciphertexts[0], null, ciphertexts[1], ciphertexts[2], null];
    const result = await bulkDecryptForTenant(TENANT_A, input, client);
    assert.deepEqual(result, ["alpha", null, "beta", "gamma", null]);
  });

  test("bulk decrypt: empty array short-circuits to empty array", async () => {
    const result = await bulkDecryptForTenant(TENANT_A, [], client);
    assert.deepEqual(result, []);
  });
});
