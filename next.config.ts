import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Anchor Turbopack to THIS directory as the source/project root. Without
  // this, running `next dev` from a git worktree under a parent that also
  // has a package-lock.json causes Turbopack to pick the PARENT's lockfile
  // as the project root and serve source from there — which is on the
  // parent's branch (e.g., main), not the worktree's. Surfaced 2026-05-27
  // local smoke when the venue-calendar arc worktree saw the parent's
  // unfixed postAuthSeed even though the worktree had the fix.
  turbopack: {
    root: import.meta.dirname,
  },
  // Server-action body size limit. Default is 1 MB which fails silently for
  // any iPhone camera-roll photo (3–10 MB HEIC is typical). Set to 12 MB so:
  //   - 0–10 MB: passes both Next + uploadImageAction's app-level 10 MB cap
  //   - 10–12 MB: Next accepts, app rejects with friendly "Image must be
  //     10 MB or smaller" message (Lock 22 forgiveness — soft rejection)
  //   - 12 MB+: Next 413; rare in practice
  // Per inbox-cc/processed/2026-05-23-mobile-photo-upload-bug.md (Candidate 2).
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default withNextIntl(nextConfig);
