import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentCaterer } from "@/lib/catr/current-caterer";
import { getCatrNewInquiryCount } from "@/lib/catr/inquiries";

import { Chrome, ChromeSignOut } from "./_components/Chrome";
import s from "./catr.module.css";

/**
 * Catr portal home. Scaffolded to the inquiry vertical only (Lock 77) — the
 * full caterer feature stack (menu builder, BEO, food-safety compliance) is a
 * deferred port. Surfaces a single Inquiries tile with the New-inquiry count
 * so the inquiry-received email recipient lands somewhere coherent.
 */
export default async function CatrHome() {
  const caterer = await getCurrentCaterer();
  if (!caterer) redirect("/login?role=catr");

  const newCount = await getCatrNewInquiryCount(caterer.tenantId);

  return (
    <>
      <Chrome
        catererName={caterer.displayName}
        roleLabel="Catering"
        right={<ChromeSignOut />}
      />

      <div className={s.home}>
        <p className={s.homeIntro}>
          When organizers reach out about catering for their events, their
          inquiries land here.
        </p>

        <Link href="/catr/inquiries" className={s.homeTile}>
          <div>
            <div className={s.homeTileLbl}>Inquiries</div>
            <div className={s.homeTileSub}>Leads from organizers</div>
          </div>
          {newCount > 0 && <span className={s.homeTileCount}>{newCount}</span>}
        </Link>
      </div>
    </>
  );
}
