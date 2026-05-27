"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import s from "../venues.module.css";

/**
 * Door B — self-serve venue front-door at /venues/start.
 *
 * Source: 02_Locked_Prototypes/Venu/EvntCue_Venu_FrontDoor_v1.html (4-screen
 * locked flow). 3-screen state machine + a 4th success state added for the
 * happy path. Two-source verification per Venu_Locked_2026-05-13.md §"Door
 * B": property record + COI parallel checks; both must pass to advance.
 *
 * Chunk D ships the visual layer + state machine. Real verification (county
 * property API + COI OCR + carrier lookup) wires in a later chunk; for the
 * demo, the verification screen runs a 3-second timer then transitions to
 * success (or failure if the URL has `?demo=fail`).
 *
 * Failure state offers offline recourse (email team@evntcue.com) per the
 * lock doc — legitimate edge cases (DBA mismatch, name changes, ownership
 * transitions) are handled async by staff, not in a routine queue.
 */

type Screen = "form" | "verifying" | "success" | "failure";

export default function VenuesStart() {
  const search = useSearchParams();
  const demoFail = search.get("demo") === "fail";

  const [screen, setScreen] = useState<Screen>("form");
  const [venueName, setVenueName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");

  // Verifying → success/failure after 3 sec demo timer.
  useEffect(() => {
    if (screen !== "verifying") return;
    const t = setTimeout(() => {
      setScreen(demoFail ? "failure" : "success");
    }, 3000);
    return () => clearTimeout(t);
  }, [screen, demoFail]);

  const canSubmit =
    venueName.trim().length > 0 &&
    legalName.trim().length > 0 &&
    address.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  if (screen === "form") {
    return (
      <main className={s.phone}>
        <header className={s.formChrome}>
          <Link href="/venues" className={s.formBack} aria-label="Back">
            ‹
          </Link>
          <div className={s.formProgress}>
            <div className={s.formProgressBar} style={{ width: "50%" }} />
          </div>
          <div className={s.formStep}>Step 1 of 2</div>
        </header>

        <div className={s.formBody}>
          <h1 className={s.formH}>
            Tell us about <i>your Venu</i>
          </h1>
          <p className={s.formSub}>
            We verify every Venu against property records and a Certificate of Insurance.
            This protects your listing and keeps the platform real.
          </p>

          <div className={s.formFields}>
            <label className={s.formField}>
              <div className={s.formFieldLbl}>Venu name · how guests know you</div>
              <input
                className={s.formFieldInput}
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="The Lantern Hall"
              />
            </label>
            <label className={s.formField}>
              <div className={s.formFieldLbl}>Legal business name · on the COI</div>
              <input
                className={s.formFieldInput}
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Lantern Hall LLC"
              />
              <div className={s.formFieldHint}>
                Must match the named insured on your policy
              </div>
            </label>
            <label className={s.formField}>
              <div className={s.formFieldLbl}>Street address</div>
              <input
                className={s.formFieldInput}
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="418 Singleton Blvd, Dallas TX 75212"
              />
              <div className={s.formFieldHint}>
                Commercial property only · no PO boxes
              </div>
            </label>
            <label className={s.formField}>
              <div className={s.formFieldLbl}>Your email · this becomes your login</div>
              <input
                className={s.formFieldInput}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@thelanternhall.com"
              />
            </label>
          </div>

          {/* COI upload — visual-only for chunk D. File handling wires later. */}
          <div className={s.formUpload}>
            <div className={s.formUploadIco}>
              <svg viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5-5 5 5" />
                <path d="M12 5v12" />
              </svg>
            </div>
            <div className={s.formUploadH}>Upload your Certificate of Insurance</div>
            <div className={s.formUploadSub}>PDF or photo · we&apos;ll read it automatically</div>
          </div>

          <div className={s.formNote}>
            <div className={s.formNoteIco}>
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4M12 16v.01" />
              </svg>
            </div>
            <div className={s.formNoteTxt}>
              <b>Don&apos;t have a COI handy?</b> Most Venus do — check your existing policy or
              email your broker. Real Venus already carry this.
            </div>
          </div>

          <button
            type="button"
            className={s.formSubmit}
            disabled={!canSubmit}
            onClick={() => setScreen("verifying")}
          >
            Verify my Venu
          </button>
        </div>
      </main>
    );
  }

  if (screen === "verifying") {
    return (
      <main className={s.phone}>
        <header className={s.formChrome}>
          <span className={`${s.formBack} ${s.formBackDisabled}`} aria-hidden="true">
            ‹
          </span>
          <div className={s.formProgress}>
            <div className={s.formProgressBar} style={{ width: "75%" }} />
          </div>
          <div className={s.formStep}>Step 2 of 2</div>
        </header>

        <div className={s.verifyWrap}>
          <div className={s.verifySpinnerWrap}>
            <div className={s.verifySpinner}>
              <div className={s.verifySpinnerInner}>
                <svg viewBox="0 0 24 24">
                  <path d="M12 2l9 4v6c0 5-3.8 9.4-9 10-5.2-.6-9-5-9-10V6l9-4z" />
                </svg>
              </div>
            </div>
          </div>

          <h1 className={s.verifyH}>
            Verifying <b>{venueName || "your venue"}</b>
          </h1>
          <p className={s.verifySub}>
            We&apos;re checking two things. Usually takes 30 seconds.
          </p>

          <div className={s.verifyChecks}>
            <div className={`${s.verifyCheck} ${s.verifyCheckDone}`}>
              <div className={s.verifyCheckStatus}>
                <svg viewBox="0 0 24 24">
                  <path d="M4 12l5 5L20 6" />
                </svg>
              </div>
              <div className={s.verifyCheckBody}>
                <div className={s.verifyCheckName}>Property record</div>
                <div className={s.verifyCheckSub}>
                  {address || "Address"} · commercial · matches
                </div>
              </div>
              <div className={s.verifyCheckMeta}>Verified</div>
            </div>

            <div className={`${s.verifyCheck} ${s.verifyCheckWorking}`}>
              <div className={`${s.verifyCheckStatus} ${s.verifyCheckStatusSpin}`}>
                <svg viewBox="0 0 24 24">
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <div className={s.verifyCheckBody}>
                <div className={s.verifyCheckName}>Certificate of Insurance</div>
                <div className={s.verifyCheckSub}>
                  Reading policy · matching insured name
                </div>
              </div>
              <div className={s.verifyCheckMeta}>Checking</div>
            </div>
          </div>

          <div className={s.verifyFoot}>
            Don&apos;t close this screen. We&apos;ll drop you into your dashboard the moment both
            checks pass.
          </div>
        </div>
      </main>
    );
  }

  if (screen === "success") {
    return (
      <main className={s.phone}>
        <header className={s.formChrome}>
          <span className={`${s.formBack} ${s.formBackDisabled}`} aria-hidden="true">
            ‹
          </span>
          <div className={s.formProgress}>
            <div className={s.formProgressBar} style={{ width: "100%" }} />
          </div>
          <div className={s.formStep}>Verified</div>
        </header>

        <div className={s.successWrap}>
          <div className={s.successIco}>
            <svg viewBox="0 0 24 24">
              <path d="M4 12l5 5L20 6" />
            </svg>
          </div>
          <h1 className={s.successH}>
            You&apos;re verified, <i>{venueName || "venue"}.</i>
          </h1>
          <p className={s.successSub}>
            Property record and Certificate of Insurance both checked out. Build your profile,
            set up your spaces, start taking inquiries.
          </p>
          <Link href="/venu/discover" className={s.successCta}>
            Open your dashboard
          </Link>
        </div>
      </main>
    );
  }

  // failure
  return (
    <main className={s.phone}>
      <header className={s.formChrome}>
        <button type="button" className={s.formBack} onClick={() => setScreen("form")} aria-label="Back to form">
          ‹
        </button>
        <div className={s.formProgress}>
          <div className={`${s.formProgressBar} ${s.formProgressBarFail}`} style={{ width: "100%" }} />
        </div>
        <div className={`${s.formStep} ${s.formStepFail}`}>Hold on</div>
      </header>

      <div className={s.failWrap}>
        <div className={s.failIco}>
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4M12 16v.01" />
          </svg>
        </div>

        <h1 className={s.failH}>
          We couldn&apos;t auto-verify <i>{venueName || "your venue"}</i>
        </h1>
        <p className={s.failSub}>
          Here&apos;s what we found and what we couldn&apos;t confirm:
        </p>

        <div className={s.failDetail}>
          <div className={s.failDetailLbl}>Verification status</div>
          <div className={`${s.failDetailRow} ${s.failDetailRowOk}`}>
            <div className={s.failDetailRowIco}>
              <svg viewBox="0 0 24 24">
                <path d="M4 12l5 5L20 6" />
              </svg>
            </div>
            <div className={s.failDetailRowBody}>
              <div className={s.failDetailRowName}>Property record</div>
              <div className={s.failDetailRowSub}>{address || "Address"} matches</div>
            </div>
          </div>
          <div className={`${s.failDetailRow} ${s.failDetailRowBad}`}>
            <div className={s.failDetailRowIco}>
              <svg viewBox="0 0 24 24">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </div>
            <div className={s.failDetailRowBody}>
              <div className={s.failDetailRowName}>Insurance certificate</div>
              <div className={s.failDetailRowSub}>
                Insured name didn&apos;t match the legal name you entered
              </div>
            </div>
          </div>
        </div>

        <div className={s.failRecourse}>
          <div className={s.failRecourseH}>If this is a mistake</div>
          <div className={s.failRecourseTxt}>
            Send us your business license, lease, or a corrected COI and we&apos;ll review it
            within one business day.
          </div>
          <a href="mailto:team@evntcue.com" className={s.failRecourseCta}>
            Email our team
          </a>
        </div>

        <button type="button" className={s.failBack} onClick={() => setScreen("form")}>
          Start over with different details
        </button>
      </div>
    </main>
  );
}
