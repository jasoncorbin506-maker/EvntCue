/**
 * Tenant-suspension reason taxonomy — ADMIN-INTERNAL only. Text + allowlist
 * (NOT a pg enum) so the set grows without a migration. The suspended user
 * NEVER sees these — the email + /suspended screen are fully generic
 * ("violated our community standards"). Tuned for an in-person event
 * marketplace (sellers physically attend strangers' events → safety matters).
 *
 * The line this draws: pass/reject = "no to this deal"; suspend = "no to this
 * conduct."
 */
export type SuspensionReason =
  | "fraud"
  | "harassment"
  | "safety"
  | "impersonation"
  | "circumvention"
  | "no_show"
  | "spam"
  | "other";

export const SUSPENSION_REASONS: SuspensionReason[] = [
  "fraud",
  "harassment",
  "safety",
  "impersonation",
  "circumvention",
  "no_show",
  "spam",
  "other",
];

const LABELS: Record<SuspensionReason, string> = {
  fraud: "Fraud / scam",
  harassment: "Harassment / abuse",
  safety: "Safety concern",
  impersonation: "Impersonation / fake identity",
  circumvention: "Off-platform circumvention",
  no_show: "No-show / non-delivery",
  spam: "Spam",
  other: "Other",
};

export function suspensionReasonLabel(code: string): string {
  return LABELS[code as SuspensionReason] ?? code;
}

export function isSuspensionReason(v: string): v is SuspensionReason {
  return (SUSPENSION_REASONS as string[]).includes(v);
}
