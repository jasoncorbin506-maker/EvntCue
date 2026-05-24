import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
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
