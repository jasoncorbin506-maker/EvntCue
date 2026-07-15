import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { GATE_COOKIE, gateCookieValue } from "@/lib/site-gate";

// URL path segment (UI side, "Venu" per Lock 1).
const ROLE_PATHS = ["orgnz", "plnr", "vndr", "catr", "venu", "admin"] as const;
type UrlRolePath = (typeof ROLE_PATHS)[number];

// DB enum value (user_roles.role). The URL says "venu", the DB says "venue".
// Lock 15 in spirit: schema speaks engineer-talk, UI speaks customer-talk.
const URL_PATH_TO_DB_ROLE: Record<UrlRolePath, string> = {
  orgnz: "orgnz",
  plnr: "plnr",
  vndr: "vndr",
  catr: "catr",
  venu: "venue",
  admin: "admin",
};

// PL #61 — Orgnz multi-event. Layouts never receive searchParams, so the
// `/orgnz?event=<id>` selection is forwarded to the server as this request
// header for loadOrgnzContext to read. See app/(platform)/orgnz/_lib/load-context.ts.
const ORGNZ_EVENT_HEADER = "x-orgnz-event-id";

export async function proxy(request: NextRequest) {
  // Private-preview gate — active only while SITE_ACCESS_CODE is set. Page
  // requests without the gate cookie bounce to /gate. /api stays open: crons
  // and webhooks authenticate themselves and must not see an HTML lock screen.
  const accessCode = process.env.SITE_ACCESS_CODE;
  const pathname = request.nextUrl.pathname;
  if (accessCode && pathname !== "/gate" && !pathname.startsWith("/api/")) {
    const cookie = request.cookies.get(GATE_COOKIE)?.value;
    if (cookie !== (await gateCookieValue(accessCode))) {
      const redirect = request.nextUrl.clone();
      const original = request.nextUrl.pathname + request.nextUrl.search;
      redirect.pathname = "/gate";
      redirect.search = "";
      if (original !== "/") redirect.searchParams.set("next", original);
      return NextResponse.redirect(redirect);
    }
  }

  // Forward the Orgnz event selection as a request header (scoped to /orgnz;
  // stripped elsewhere so a client can't smuggle it in). The header rides on a
  // copy of the request headers that we keep cookie-synced below.
  const requestHeaders = new Headers(request.headers);
  const isOrgnz = request.nextUrl.pathname.split("/")[1] === "orgnz";
  const eventParam = isOrgnz ? request.nextUrl.searchParams.get("event") : null;
  if (eventParam) {
    requestHeaders.set(ORGNZ_EVENT_HEADER, eventParam);
  } else {
    requestHeaders.delete(ORGNZ_EVENT_HEADER);
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          // Keep the forwarded headers' cookie in sync with the refreshed
          // Supabase session — the #61 header forwarding must not drop a token
          // refresh on its way to the downstream server render.
          const refreshedCookie = request.headers.get("cookie");
          if (refreshedCookie !== null) {
            requestHeaders.set("cookie", refreshedCookie);
          }
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstSeg = request.nextUrl.pathname.split("/")[1];
  const requiresRole = (ROLE_PATHS as readonly string[]).includes(firstSeg);

  if (requiresRole) {
    if (!user) {
      const redirect = request.nextUrl.clone();
      const original = request.nextUrl.pathname + request.nextUrl.search;
      redirect.pathname = "/login";
      redirect.search = "";
      // PARKING_LOT #58 — preserve deep-link destination through signin.
      // signInAction reads `next` and routes there after postAuthSeed.
      redirect.searchParams.set("next", original);
      return NextResponse.redirect(redirect);
    }

    // `/admin` is gated by is_admin() (staff_admins — audited + revocable), NOT
    // a user_roles tenant role. Defense-in-depth: the admin layout + every admin
    // action re-check is_admin() server-side; this is the coarse first gate. A
    // logged-in non-admin is bounced to "/" (not /login — they ARE signed in).
    if (firstSeg === "admin") {
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (!isAdmin) {
        const redirect = request.nextUrl.clone();
        redirect.pathname = "/";
        redirect.search = "";
        return NextResponse.redirect(redirect);
      }
    } else {
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role, tenant_id")
        .eq("user_id", user.id);

      const roles = (roleRows ?? []).map((r) => r.role as string);
      const requiredDbRole = URL_PATH_TO_DB_ROLE[firstSeg as UrlRolePath];
      const allowed = roles.includes(requiredDbRole) || roles.includes("admin");
      if (!allowed) {
        const redirect = request.nextUrl.clone();
        redirect.pathname = "/login";
        redirect.search = "";
        return NextResponse.redirect(redirect);
      }

      // Suspension enforcement — if the tenant the user is acting as (this
      // role's tenant) is suspended, bounce to /suspended. That page isn't a
      // role path, so the user can still reach it to read the notice + appeal.
      // tenants_select_member_or_admin RLS lets the user read their own row.
      const actingTenantIds = (roleRows ?? [])
        .filter((r) => r.role === requiredDbRole)
        .map((r) => (r as { tenant_id: string | null }).tenant_id)
        .filter((id): id is string => Boolean(id));
      if (actingTenantIds.length > 0) {
        const { data: suspended } = await supabase
          .from("tenants")
          .select("id")
          .in("id", actingTenantIds)
          .not("suspended_at", "is", null)
          .limit(1);
        if (suspended && suspended.length > 0) {
          const redirect = request.nextUrl.clone();
          redirect.pathname = "/suspended";
          redirect.search = "";
          return NextResponse.redirect(redirect);
        }
      }
    }
  }

  // While the preview gate is up, keep crawlers out of anything they reach
  // (e.g. /gate itself, or pages fetched with a shared cookie).
  if (accessCode) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
