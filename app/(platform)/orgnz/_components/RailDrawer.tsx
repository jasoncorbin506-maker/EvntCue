"use client";

import { useEffect } from "react";
import styles from "../orgnz.module.css";
import type { RailPin } from "../_lib/timeline";
import { showToast } from "../_lib/toast";

const DRAWER_ICONS: Record<string, string> = {
  pulse:
    '<svg viewBox="0 0 24 24" stroke-width="1.4" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M3 12h4l3-7 4 14 3-7h4"/></svg>',
  note:
    '<svg viewBox="0 0 24 24" stroke-width="1.4" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M5 4h10l4 4v12H5zM15 4v4h4M8 12h8M8 16h6"/></svg>',
  send:
    '<svg viewBox="0 0 24 24" stroke-width="1.4" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
  heart:
    '<svg viewBox="0 0 24 24" stroke-width="1.4" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M12 21s-7-4.5-7-10a5 5 0 019-3 5 5 0 019 3c0 5.5-7 10-7 10z"/></svg>',
  users:
    '<svg viewBox="0 0 24 24" stroke-width="1.4" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 19a6 6 0 0112 0M14 19a4 4 0 017-2.5"/></svg>',
  plate:
    '<svg viewBox="0 0 24 24" stroke-width="1.4" fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/></svg>',
  plane:
    '<svg viewBox="0 0 24 24" stroke-width="1.4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12l8-1L14 4l3 1-2 7 7 3-1 3-8-2-3 6-3-1 1-7-7-3 1-3z"/></svg>',
  camera:
    '<svg viewBox="0 0 24 24" stroke-width="1.4" fill="none" stroke="currentColor" stroke-linecap="round"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M9 6l1.5-2h3L15 6"/></svg>',
};

type Props = {
  pin: RailPin | null;
  onClose: () => void;
};

export function RailDrawer({ pin, onClose }: Props) {
  useEffect(() => {
    if (!pin) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [pin, onClose]);

  if (!pin) return null;

  const isGate = pin.state === "gate";

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <aside className={`${styles.drawer} ${styles.drawerOpen}`} role="dialog" aria-modal="true">
        <div className={styles.drawerHandle} />
        <div className={styles.drawerHead}>
          <div className={styles.drawerHeadL}>
            <div className={styles.drawerEye}>
              {pin.when} {pin.sub ? `· ${pin.sub}` : ""}
            </div>
            <h3 className={styles.drawerTitle}>
              <em>{pin.label}</em>
            </h3>
          </div>
          <button
            type="button"
            className={styles.drawerClose}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className={styles.drawerBody}>
          {pin.body.length > 0 ? (
            <div className={styles.drSection}>
              <div className={styles.drSectionL}>What&rsquo;s on this day</div>
              {pin.body.map((item, i) => (
                <div key={i} className={styles.drItem}>
                  <div
                    className={styles.drItemIco}
                    dangerouslySetInnerHTML={{
                      __html: DRAWER_ICONS[item.ico] ?? DRAWER_ICONS.note,
                    }}
                  />
                  <div className={styles.drItemBody}>
                    <div className={styles.drItemT}>{item.t}</div>
                    {item.d && (
                      <div
                        className={styles.drItemD}
                        dangerouslySetInnerHTML={{ __html: item.d }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.drEmpty}>
              Nothing scheduled. <em>A quiet day.</em>
            </div>
          )}

          {isGate && (
            <div className={styles.drSection}>
              <div className={styles.drSectionL}>Move it forward</div>
              <button
                type="button"
                className={styles.drItem}
                style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "rgba(255,255,255,0.018)" }}
                onClick={() => {
                  showToast(`<em>${pin.label}</em> marked complete.`);
                  onClose();
                }}
              >
                <div
                  className={styles.drItemIco}
                  dangerouslySetInnerHTML={{ __html: DRAWER_ICONS.note }}
                />
                <div className={styles.drItemBody}>
                  <div className={styles.drItemT}>Mark complete</div>
                  <div className={styles.drItemD}>
                    Tells Cue this is handled. Stops the reminders.
                  </div>
                </div>
              </button>
              <button
                type="button"
                className={styles.drItem}
                style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "rgba(255,255,255,0.018)" }}
                onClick={() => {
                  showToast(`<em>${pin.label}</em> hidden from your timeline.`);
                  onClose();
                }}
              >
                <div
                  className={styles.drItemIco}
                  dangerouslySetInnerHTML={{ __html: DRAWER_ICONS.users }}
                />
                <div className={styles.drItemBody}>
                  <div className={styles.drItemT}>Not for us</div>
                  <div className={styles.drItemD}>
                    Skip this milestone. Cue won&rsquo;t bring it up again.
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
