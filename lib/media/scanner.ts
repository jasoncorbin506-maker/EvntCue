/**
 * MediaService — the scan seam.
 *
 * This is the provider-agnostic door for CSAM + nudity detection. The funnel
 * (lib/media/index.ts) calls `scanner.scan(...)` on every ingested object,
 * BEFORE it can reach a visible state. Today the active scanner is a no-op that
 * returns `clean`, so behavior is identical to pre-chokepoint uploads.
 *
 * When a provider is chosen (waiting on Thorn contact + Hive/PhotoDNA cost):
 *   - implement MediaScanner against that provider,
 *   - call setMediaScanner(new HiveScanner(...)) at server boot,
 *   - and the funnel starts enforcing promote-on-pass with zero caller changes.
 *
 * Ordering law (do not break): upload → scan → only-if-clean → visible.
 */

import type { MediaKind, ScanVerdict } from "./types.ts";

export type ScanInput = {
  bytes: Buffer;
  contentType: string;
  kind: MediaKind;
  /** bucket/objectKey, useful for provider audit logs once live. */
  ref: { bucket: string; storagePath: string };
};

export interface MediaScanner {
  /** Provider name(s) this scanner represents, for the verdict's `sources`. */
  readonly id: string;
  scan(input: ScanInput): Promise<ScanVerdict>;
}

/**
 * No-op scanner. Returns `clean` for everything. This is intentional: it lets
 * the chokepoint + reroute ship and capture every upload path NOW, while the
 * real detector is still a cost/vendor decision. Swapping it in later is a
 * one-line change and requires no caller edits.
 */
export class NoopScanner implements MediaScanner {
  readonly id = "noop";
  async scan(input: ScanInput): Promise<ScanVerdict> {
    void input; // no-op until a provider is wired
    return { status: "clean", sources: [] };
  }
}

// ---------------------------------------------------------------------------
// FUTURE PROVIDER ADAPTERS (not wired — placeholders so the decision has a home)
//
// Whichever provider(s) you pick, each implements MediaScanner and is composed
// behind a CompositeScanner so PhotoDNA (hash) + Hive (Thorn known/novel +
// nudity classifier) can run together. Promote only if EVERY layer is clean.
//
//   class PhotoDnaScanner implements MediaScanner { id = "photodna"; ... }
//   class HiveScanner     implements MediaScanner { id = "hive";     ... }
//
//   export class CompositeScanner implements MediaScanner {
//     constructor(private readonly scanners: MediaScanner[]) {}
//     readonly id = "composite";
//     async scan(input: ScanInput): Promise<ScanVerdict> {
//       const verdicts = await Promise.all(this.scanners.map((s) => s.scan(input)));
//       const flagged = verdicts.find((v) => v.status === "flagged");
//       if (flagged) return flagged;                 // any hit → flagged
//       if (verdicts.some((v) => v.status === "error")) return { status: "error", sources: [] };
//       return { status: "clean", sources: verdicts.flatMap((v) => v.sources) };
//     }
//   }
// ---------------------------------------------------------------------------

let activeScanner: MediaScanner = new NoopScanner();

/** Swap the active scanner (provider wiring, or test doubles). */
export function setMediaScanner(scanner: MediaScanner): void {
  activeScanner = scanner;
}

export function getMediaScanner(): MediaScanner {
  return activeScanner;
}
