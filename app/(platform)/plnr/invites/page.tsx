import { redirect } from "next/navigation";

import { getCurrentPlanner } from "@/lib/plnr/current-planner";
import { getIncomingPlnrInvites } from "@/lib/plnr/invites";

import { Chrome, ChromeSignOut } from "../_components/Chrome";
import { PlnrInviteRow } from "../_components/PlnrInviteRow";
import s from "../plnr.module.css";

/**
 * Plnr Invites tab (Lock 30 Phase C pt 2). Lists incoming, non-revoked
 * plnr_invites rows for this planner (RLS-scoped). A buyer invites a planner
 * directly — planners engage via invite, NOT inquiry (Lock 28). Each row shows
 * the buyer's message + when it arrived, with an Accept action.
 */
export default async function PlnrInvites() {
  const planner = await getCurrentPlanner();
  if (!planner) redirect("/login?role=plnr");

  const invites = await getIncomingPlnrInvites(planner.tenantId);

  return (
    <>
      <Chrome
        plannerName={planner.displayName}
        roleLabel="Invites"
        backHref="/plnr"
        right={<ChromeSignOut />}
      />

      {invites.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyStateIcon} aria-hidden="true">✦</div>
          <div className={s.emptyStateTitle}>No invites yet</div>
          <div className={s.emptyStateBody}>
            When organizers invite you to plan one of their events, those
            invites land here. Make sure your profile is published so they can
            find you.
          </div>
        </div>
      ) : (
        <div className={s.inviteList}>
          {invites.map((invite) => (
            <PlnrInviteRow key={invite.id} invite={invite} />
          ))}
        </div>
      )}
    </>
  );
}
