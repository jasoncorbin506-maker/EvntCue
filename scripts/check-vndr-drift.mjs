#!/usr/bin/env node
/**
 * Vndr-drift guard (Lock 14/15 — "Vndr" is the canonical user-facing label).
 *
 * Scans the i18n message *values* in messages/{en,es}.json for the banned word
 * "vendor"/"vendors" (case-insensitive, word-boundary). Object KEYS are ignored
 * on purpose — they're code identifiers (`vendorsTitle`, `vendorChipVndr`) and
 * never reach the screen; only the string VALUES are user-facing copy.
 *
 * Scope is deliberately the i18n layer only, NOT app/**\/*.tsx. The component
 * tree is dense with legitimate `vendor` identifiers (vendor.tenantId,
 * VendorDetailSheet, .from("vendors"), vendor_tenant_id, ICON_VENDORS…), so a
 * blanket word-boundary grep there fires constantly on non-copy and is unusable
 * as a gate. The i18n files are the one surface where every value is copy and
 * the check is false-positive-free. New translated strings are the most likely
 * future drift vector, so this catches the case that matters.
 *
 * Run: `npm run check:vndr`. Exits non-zero on a hit so it can gate CI / a hook.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = ["messages/en.json", "messages/es.json"];
const BANNED = /\bvendors?\b/i;

/** Walk a parsed JSON tree, yielding [dottedPath, stringValue] for every string. */
function* strings(node, path = []) {
  if (typeof node === "string") {
    yield [path.join("."), node];
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) yield* strings(v, [...path, k]);
  }
}

let hits = 0;
for (const rel of FILES) {
  const parsed = JSON.parse(readFileSync(join(root, rel), "utf8"));
  for (const [path, value] of strings(parsed)) {
    if (BANNED.test(value)) {
      hits += 1;
      console.error(`✗ ${rel} → ${path}\n    "${value}"`);
    }
  }
}

if (hits > 0) {
  console.error(
    `\n${hits} banned "vendor" string(s) in i18n copy. Use "Vndr"/"Vndrs" (Lock 14/15).`,
  );
  process.exit(1);
}
console.log("✓ No 'vendor' drift in i18n message values.");
