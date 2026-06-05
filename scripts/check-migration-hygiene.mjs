#!/usr/bin/env node
/**
 * Migration-hygiene gate (PL #82 / pre-launch hard blocker — "ENABLE RLS + log row").
 *
 * The silent-drift class that bit twice: migration 014 shipped a broken
 * `current_role_claim()` that sat undetected for ~60 migrations, and PL #82
 * found `migration_log` had drifted 8 entries behind reality. Root cause both
 * times: a convention with no enforcement. This is the enforcement.
 *
 * Migrations live in the hand-applied deploy tree (NOT in this repo) —
 * `~/Desktop/evntcue/00_Live/deploy/*.sql` by default; override with
 * EVNTCUE_DEPLOY_DIR. If the tree isn't present (e.g. CI without the Desktop
 * workspace), the check skips with a notice and exits 0 — there's nothing to
 * scan, and the migrations can't be in CI anyway.
 *
 * Two rules, enforced on NEW migrations only:
 *   R1  every migration writes its own `INSERT INTO migration_log` row.
 *   R2  every `CREATE TABLE` in public is followed by `ENABLE ROW LEVEL
 *       SECURITY` on that table (deny-all minimum) in the same file.
 *
 * WATERMARK: migrations numbered <= the watermark are grandfathered — they are
 * already applied, their log rows were backfilled (PL #82), and the live RLS
 * audit on 2026-06-05 confirmed 0 public tables without RLS (123/123). History
 * is clean by audit, not by per-file INSERT, so scanning it yields only noise.
 * Bump the watermark only when a fresh live audit re-confirms clean.
 *
 * Exemptions:
 *   - test / smoke / stub files (by name) never need a log row or RLS.
 *   - an inline `-- hygiene-exempt: <reason>` marker opts a file out of a rule
 *     it legitimately can't satisfy (data-only backfills, pure grant sweeps,
 *     function repoints). The reason is required so exemptions stay auditable.
 *
 * Run: `npm run check:migrations`. Exits non-zero on a violation so it can gate
 * a pre-apply hook or CI.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const WATERMARK = 93; // migrations <= this are grandfathered (see header)

const DEPLOY_DIR =
  process.env.EVNTCUE_DEPLOY_DIR ||
  join(homedir(), "Desktop", "evntcue", "00_Live", "deploy");

if (!existsSync(DEPLOY_DIR)) {
  console.log(
    `• migration-hygiene: deploy tree not found at ${DEPLOY_DIR} — skipping ` +
      `(set EVNTCUE_DEPLOY_DIR to point at it).`,
  );
  process.exit(0);
}

/** Leading migration number, e.g. "094" / "074b" -> 94. Null if unnumbered. */
function migNumber(file) {
  const m = /^(\d+)/.exec(file);
  return m ? Number(m[1]) : null;
}

const SKIP_NAME = /(_tests?|_smoke|STUB)/i;
const HAS_LOG_INSERT = /insert\s+into\s+(public\.)?migration_log\b/i;
const EXEMPT_R1 = /--\s*hygiene-exempt:\s*\S/i; // any reason exempts the log-row rule
const EXEMPT_R2 = /--\s*hygiene-exempt-rls:\s*\S/i; // narrower marker for the RLS rule

/**
 * Public tables created in this SQL that lack a matching ENABLE ROW LEVEL
 * SECURITY in the same file. Quoting/schema-qualification tolerated.
 */
function tablesMissingRls(sql) {
  const created = new Set();
  const createRe =
    /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z0-9_]+)"?/gi;
  let m;
  while ((m = createRe.exec(sql))) created.add(m[1].toLowerCase());

  const rlsEnabled = new Set();
  const rlsRe =
    /alter\s+table\s+(?:only\s+)?(?:public\.)?"?([a-z0-9_]+)"?[\s\S]*?enable\s+row\s+level\s+security/gi;
  while ((m = rlsRe.exec(sql))) rlsEnabled.add(m[1].toLowerCase());

  return [...created].filter((t) => !rlsEnabled.has(t));
}

const files = readdirSync(DEPLOY_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let enforced = 0;
const violations = [];

for (const file of files) {
  const num = migNumber(file);
  if (num !== null && num <= WATERMARK) continue; // grandfathered
  if (SKIP_NAME.test(file)) continue; // test/smoke/stub
  enforced += 1;

  const sql = readFileSync(join(DEPLOY_DIR, file), "utf8");

  // R1 — migration_log row
  if (!HAS_LOG_INSERT.test(sql) && !EXEMPT_R1.test(sql)) {
    violations.push(
      `✗ ${file}\n    R1: no \`INSERT INTO migration_log\` row. Add one, or ` +
        `mark \`-- hygiene-exempt: <reason>\` if data-only.`,
    );
  }

  // R2 — RLS on every new public table
  if (!EXEMPT_R2.test(sql)) {
    const missing = tablesMissingRls(sql);
    for (const t of missing) {
      violations.push(
        `✗ ${file}\n    R2: table "${t}" created without ENABLE ROW LEVEL ` +
          `SECURITY. Add it (deny-all minimum), or mark ` +
          `\`-- hygiene-exempt-rls: <reason>\`.`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error(violations.join("\n"));
  console.error(
    `\n${violations.length} migration-hygiene violation(s) across ${enforced} ` +
      `enforced migration(s) (> #${WATERMARK}).`,
  );
  process.exit(1);
}

console.log(
  `✓ Migration hygiene clean — ${enforced} enforced migration(s) > #${WATERMARK} ` +
    `(<= #${WATERMARK} grandfathered; live RLS audit 2026-06-05 = 123/123).`,
);
