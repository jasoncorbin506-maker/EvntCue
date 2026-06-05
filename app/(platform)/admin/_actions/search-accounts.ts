"use server";

import { getAdminUser } from "@/lib/admin/current-admin";
import { findAccountsByEmail, type LookupAccount } from "@/lib/admin/lookup";

/**
 * Client-callable wrapper for the admin user lookup. Gated on getAdminUser()
 * (the lib self-gates too — belt and suspenders). Returns [] for non-admins.
 */
export async function searchAccounts(query: string): Promise<LookupAccount[]> {
  if (!(await getAdminUser())) return [];
  return findAccountsByEmail(query);
}
