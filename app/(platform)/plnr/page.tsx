import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentPlanner } from "@/lib/plnr/current-planner";
import { getIncomingPlnrInvites } from "@/lib/plnr/invites";
import { PAYOUTS_COMING_SOON } from "@/lib/labels/payments";

import { Chrome, ChromeSignOut } from "./_components/Chrome";
import s from "./plnr.module.css";

/**
 * Plnr portal home (Lock 30 Phase C pt 2). Mirrors the catr home tile structure.
 * Surfaces an Invites tile (buyers invite planners directly — planners engage
 * via invite, NOT inquiry, per Lock 28) with a count of un-accepted incoming
 * invites, plus a Profile tile. A disabled Payments tile carries the same
 * pre-Stripe touchpoint the other portals show (canonical voice from
 * lib/labels/payments) without adding a route or bottom nav.
 */
export default async function PlnrHome() {
  const planner = await getCurrentPlanner();
  if (!planner) redirect("/login?role=plnr");

  const invites = await getIncomingPlnrInvites(planner.tenantId);
  const pendingCount = invites.filter((i) => i.acceptedAt == null).length;

  return (
    <>
      <Chrome
        plannerName={planner.displayName}
        roleLabel="Planning"
        right={<ChromeSignOut />}
      />

      <div className={s.home}>
        <p className={s.homeIntro}>
          When organizers invite you to plan one of their events, those invites
          land here.
        </p>

        <Link href="/plnr/invites" className={s.homeTile}>
          <div>
            <div className={s.homeTileLbl}>Invites</div>
            <div className={s.homeTileSub}>Requests from organizers</div>
          </div>
          {pendingCount > 0 && <span className={s.homeTileCount}>{pendingCount}</span>}
        </Link>

        <Link href="/plnr/profile" className={s.homeTile}>
          <div>
            <div className={s.homeTileLbl}>Profile</div>
            <div className={s.homeTileSub}>Your listing · specialties · publish to the marketplace</div>
          </div>
        </Link>

        <div
          className={`${s.homeTile} ${s.homeTileDisabled}`}
          aria-disabled="true"
        >
          <div>
            <div className={s.homeTileLbl}>{PAYOUTS_COMING_SOON.title}</div>
            <div className={s.homeTileSub}>{PAYOUTS_COMING_SOON.cta}</div>
          </div>
          <span className={s.homeTilePill}>{PAYOUTS_COMING_SOON.pill}</span>
        </div>
      </div>
    </>
  );
}
