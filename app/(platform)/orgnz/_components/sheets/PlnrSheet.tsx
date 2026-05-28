"use client";

import { useRouter } from "next/navigation";
import styles from "../../orgnz.module.css";
import { Sheet } from "../Sheet";
import { showToast } from "../../_lib/toast";

type PlnrSample = {
  initial: string;
  name: string;
  region: string;
  specs: string;
  meta: string;
  rate: string;
  rateSub: string;
};

const SAMPLE_PLNRS: PlnrSample[] = [
  {
    initial: "E",
    name: "Eliana Marquez",
    region: "DFW",
    specs: "Catholic · multicultural · 150+ guests",
    meta: "★ 4.9 · 47 weddings · responds in 2h",
    rate: "$2,800",
    rateSub: "flat · day-of",
  },
  {
    initial: "T",
    name: "Theo Alvarez",
    region: "DFW",
    specs: "Latino traditions · padrinos · bilingual",
    meta: "★ 4.95 · 31 events · responds in 1h",
    rate: "$3,200",
    rateSub: "full · 90 days",
  },
  {
    initial: "M",
    name: "Margaux Hill",
    region: "Fort Worth",
    specs: "Editorial · luxury · 200+ guests",
    meta: "★ 4.8 · 58 events · responds in 4h",
    rate: "$4,500",
    rateSub: "full service",
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function PlnrSheet({ open, onClose }: Props) {
  const router = useRouter();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      eyebrow="Plnr"
      eyebrowAccent="gold"
      title={
        <>
          Your <em>second pair of eyes</em>
        </>
      }
    >
      <div className={styles.plnrSplash}>
        <div className={styles.plnrSplashEye}>No Plnr yet</div>
        <h3 className={styles.plnrSplashT}>
          A Plnr is the <em>steady hand</em> on the day.
        </h3>
        <p className={styles.plnrSplashB}>
          They check the timeline, line up the vendors, catch what you can&rsquo;t. Cue-trained Plnrs work at flat rates — no day-of surprises.
        </p>
      </div>

      <div className={styles.sectionL}>Cue&rsquo;s matches for your event</div>

      {SAMPLE_PLNRS.map((p) => (
        <button
          key={p.name}
          type="button"
          className={styles.plnrCard}
          onClick={() => showToast(`<em>${p.name}</em> profile lands when Plnr portal ships.`)}
        >
          <div className={styles.plnrAvatar}>{p.initial}</div>
          <div className={styles.plnrBody}>
            <div className={styles.plnrName}>
              {p.name}
              <em>· {p.region}</em>
            </div>
            <div className={styles.plnrSpec}>{p.specs}</div>
            <div className={styles.plnrCardMeta}>{p.meta}</div>
          </div>
          <div className={styles.plnrRate}>
            {p.rate}
            <small>{p.rateSub}</small>
          </div>
        </button>
      ))}

      <button
        type="button"
        className={`${styles.browseCta} ${styles.browseCtaGold}`}
        onClick={() => router.push("/orgnz/browse")}
        style={{ marginTop: 14 }}
      >
        <div className={styles.browseCtaL}>
          <div className={styles.browseCtaEye}>See all DFW Plnrs</div>
          <div className={styles.browseCtaT}>Browse the Plnr Marketplace →</div>
        </div>
        <span className={styles.browseCtaArrow}>→</span>
      </button>
    </Sheet>
  );
}
