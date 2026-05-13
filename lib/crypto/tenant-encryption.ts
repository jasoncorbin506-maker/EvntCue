/**
 * Per-tenant encryption wrapper for Bucket-3 columns.
 *
 * Thin TS layer over the Postgres RPCs `encrypt_for_tenant`,
 * `decrypt_for_tenant`, and `bulk_decrypt_for_tenant` that landed in
 * migration 023a. The actual cryptography (HKDF-style key derivation +
 * AES-via-pgp_sym_encrypt) happens server-side in SECURITY DEFINER
 * functions so per-tenant key material never crosses the network.
 *
 * Authorization model: `encrypt/decrypt_for_tenant` enforce that the
 * calling auth.uid() owns the tenant_id (or is admin, or is service-role).
 * Reads through the user-session client surface a "permission denied"
 * error if the user doesn't belong to that tenant.
 *
 * Usage from a Server Action / Route Handler:
 *
 *   import { encryptForTenant, decryptForTenant } from "@/lib/crypto/tenant-encryption";
 *
 *   // Write path
 *   const ciphertext = await encryptForTenant(tenantId, plnrNotes);
 *   await supabase.from("plnr_clients").update({ plnr_notes_enc: ciphertext }).eq("id", clientId);
 *
 *   // Read path
 *   const { data } = await supabase.from("plnr_clients").select("plnr_notes_enc").single();
 *   const plnrNotes = await decryptForTenant(tenantId, data.plnr_notes_enc);
 *
 *   // Bulk read (single round-trip for many rows)
 *   const ciphertexts = rows.map(r => r.plnr_notes_enc);
 *   const plaintexts = await bulkDecryptForTenant(tenantId, ciphertexts);
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Custom error class lets callers distinguish encryption errors from generic
 * Supabase errors. Carries the Postgres error code when surfaced from RLS.
 */
export class TenantEncryptionError extends Error {
  readonly code: string | undefined;
  readonly cause: unknown;
  constructor(message: string, code?: string, cause?: unknown) {
    super(message);
    this.name = "TenantEncryptionError";
    this.code = code;
    this.cause = cause;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any, any, any>;

/**
 * Lazy-loads the Next.js server client so this module can be imported in
 * non-Next contexts (e.g., the integration test runner under raw Node).
 */
async function getClient(client?: AnyClient): Promise<AnyClient> {
  if (client) return client;
  const mod = await import("@/lib/supabase/server");
  return (await mod.createClient()) as AnyClient;
}

/**
 * Encrypt a single string for a tenant. NULL/undefined passes through as
 * null (matches the Postgres RPC contract). Returns base64 ciphertext.
 *
 * @param tenantId The UUID of the tenant whose key will be derived.
 * @param plaintext UTF-8 string. Empty string is valid (round-trips).
 * @param client Optional Supabase client; defaults to user-session server client.
 */
export async function encryptForTenant(
  tenantId: string,
  plaintext: string | null | undefined,
  client?: AnyClient,
): Promise<string | null> {
  if (plaintext === null || plaintext === undefined) return null;

  const supabase = await getClient(client);
  const { data, error } = await supabase.rpc("encrypt_for_tenant", {
    p_tenant_id: tenantId,
    p_plaintext: plaintext,
  });

  if (error) {
    throw new TenantEncryptionError(
      `encrypt_for_tenant failed: ${error.message}`,
      error.code,
      error,
    );
  }
  return data as string;
}

/**
 * Decrypt a single ciphertext for a tenant. Throws if the ciphertext was
 * encrypted for a different tenant (tenant isolation) or if the master key
 * lookup fails.
 *
 * @param tenantId The UUID of the tenant whose key will be derived.
 * @param ciphertextB64 Base64-encoded ciphertext from encryptForTenant.
 */
export async function decryptForTenant(
  tenantId: string,
  ciphertextB64: string | null | undefined,
  client?: AnyClient,
): Promise<string | null> {
  if (ciphertextB64 === null || ciphertextB64 === undefined) return null;

  const supabase = await getClient(client);
  const { data, error } = await supabase.rpc("decrypt_for_tenant", {
    p_tenant_id: tenantId,
    p_ciphertext_b64: ciphertextB64,
  });

  if (error) {
    throw new TenantEncryptionError(
      `decrypt_for_tenant failed: ${error.message}`,
      error.code,
      error,
    );
  }
  return data as string;
}

/**
 * Bulk-decrypt many ciphertexts for the same tenant in a single round-trip.
 * Useful when loading 50+ SafeTab waivers for an event. Order is preserved.
 * NULL entries in the input array become NULL in the output.
 */
export async function bulkDecryptForTenant(
  tenantId: string,
  ciphertextsB64: (string | null | undefined)[],
  client?: AnyClient,
): Promise<(string | null)[]> {
  if (ciphertextsB64.length === 0) return [];

  const supabase = await getClient(client);
  // The RPC accepts TEXT[] — supabase-js serializes undefined → null automatically.
  const normalized = ciphertextsB64.map((c) => (c === undefined ? null : c));
  const { data, error } = await supabase.rpc("bulk_decrypt_for_tenant", {
    p_tenant_id: tenantId,
    p_ciphertexts_b64: normalized,
  });

  if (error) {
    throw new TenantEncryptionError(
      `bulk_decrypt_for_tenant failed: ${error.message}`,
      error.code,
      error,
    );
  }
  return data as (string | null)[];
}
