"use client";

import { useEffect, useState } from "react";
import styles from "../orgnz.module.css";
import type { RailPin } from "../_lib/timeline";
import { showToast } from "../_lib/toast";
import { updateSeedMilestone } from "../_actions/update-seed-milestone";
import { deleteCustomMilestone } from "../_actions/delete-custom-milestone";
import { findTradition } from "@/data/cultural-traditions";
import { DateTimePickerModal } from "./DateTimePickerModal";
import { CustomMilestoneForm } from "./CustomMilestoneForm";

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
  check:
    '<svg viewBox="0 0 24 24" stroke-width="1.6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
  x:
    '<svg viewBox="0 0 24 24" stroke-width="1.6" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  edit:
    '<svg viewBox="0 0 24 24" stroke-width="1.4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10-10-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>',
  up:
    '<svg viewBox="0 0 24 24" stroke-width="1.6" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M6 14l6-6 6 6"/></svg>',
  down:
    '<svg viewBox="0 0 24 24" stroke-width="1.6" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M6 10l6 6 6-6"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24" stroke-width="1.4" fill="none" stroke="currentColor" stroke-linecap="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14"/></svg>',
};

type Props = {
  pin: RailPin | null;
  eventId: string;
  startDateIso: string;
  /** event.event_type — threaded to CustomMilestoneForm in edit mode so
   *  phase chip labels match the event's flavor. */
  eventType: string | null;
  onClose: () => void;
};

export function RailDrawer({ pin, eventId, startDateIso, eventType, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Session 18w fix E — track in-flight sort bumps to disable buttons
  // momentarily (prevents double-bump from rapid taps) and to keep the
  // drawer open across taps. The previous bumpSort closed the drawer on
  // every action, which on mobile led to stray taps landing on whatever
  // was now exposed underneath (commonly the Mood board tile).
  const [pendingSort, setPendingSort] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (!pin) {
      setEditing(false);
      setPickerOpen(false);
      return;
    }
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

  const isToday = pin.origin === "today";
  const isSeed = pin.origin === "seed";
  const isCustom = pin.origin === "custom";
  const traditionLabel = pin.traditionKey ? findTradition(pin.traditionKey)?.label : null;

  async function toggleDone() {
    if (!isSeed || !pin?.milestoneKey) return;
    const next = pin.isDone ? null : "done";
    const res = await updateSeedMilestone({
      eventId,
      milestoneKey: pin.milestoneKey,
      patch: { status: next },
    });
    if (!res.ok) {
      showToast(`Couldn’t update: ${res.error}`);
      return;
    }
    showToast(
      pin.isDone
        ? `<em>${pin.label}</em> back on your list.`
        : `<em>${pin.label}</em> marked complete.`,
    );
    onClose();
  }

  async function dismiss() {
    if (!isSeed || !pin?.milestoneKey) return;
    const res = await updateSeedMilestone({
      eventId,
      milestoneKey: pin.milestoneKey,
      patch: { status: "dismissed" },
    });
    if (!res.ok) {
      showToast(`Couldn’t update: ${res.error}`);
      return;
    }
    showToast(`<em>${pin.label}</em> hidden. Cue won’t bring it up again.`);
    onClose();
  }

  async function bumpSort(delta: number) {
    if (!pin) return;
    if (pendingSort !== null) return; // ignore taps while an action is in flight
    setPendingSort(delta < 0 ? "up" : "down");
    try {
      const current = pin.sortOrder;
      const next = (current ?? 0) + delta;
      if (isSeed && pin.milestoneKey) {
        const res = await updateSeedMilestone({
          eventId,
          milestoneKey: pin.milestoneKey,
          patch: { sortOrder: next },
        });
        if (!res.ok) {
          showToast(`Couldn’t reorder: ${res.error}`);
          return;
        }
      } else if (isCustom && pin.customId) {
        // Imported here to avoid circular imports.
        const { updateCustomMilestone } = await import("../_actions/update-custom-milestone");
        const res = await updateCustomMilestone({ id: pin.customId, sortOrder: next });
        if (!res.ok) {
          showToast(`Couldn’t reorder: ${res.error}`);
          return;
        }
      }
      showToast(delta < 0 ? "Moved earlier." : "Moved later.");
      // Deliberately do NOT call onClose() here — leaving the drawer open
      // lets the user tap arrows multiple times in a row. Closing after each
      // tap was the source of the "took me to mood board" stray-tap bug
      // reported in session 18v smoke.
    } finally {
      setPendingSort(null);
    }
  }

  async function handlePickerConfirm(iso: string, time: string | null) {
    if (!pin) return;
    if (isSeed && pin.milestoneKey) {
      const res = await updateSeedMilestone({
        eventId,
        milestoneKey: pin.milestoneKey,
        patch: { customDateIso: iso, customTime: time },
      });
      if (!res.ok) {
        showToast(`Couldn’t reschedule: ${res.error}`);
        return;
      }
      showToast(`<em>${pin.label}</em> rescheduled.`);
    } else if (isCustom && pin.customId) {
      const { updateCustomMilestone } = await import("../_actions/update-custom-milestone");
      const res = await updateCustomMilestone({
        id: pin.customId,
        customDateIso: iso,
        customTime: time,
      });
      if (!res.ok) {
        showToast(`Couldn’t reschedule: ${res.error}`);
        return;
      }
      showToast(`<em>${pin.label}</em> rescheduled.`);
    }
    setPickerOpen(false);
    onClose();
  }

  async function deleteCustom() {
    if (!isCustom || !pin?.customId) return;
    const res = await deleteCustomMilestone({ id: pin.customId });
    if (!res.ok) {
      showToast(`Couldn’t delete: ${res.error}`);
      return;
    }
    showToast(`<em>${pin.label}</em> removed from your timeline.`);
    onClose();
  }

  return (
    <>
      <div className={styles.scrim} onClick={onClose} />
      <aside className={`${styles.drawer} ${styles.drawerOpen}`} role="dialog" aria-modal="true">
        <div className={styles.drawerHandle} />
        <div className={styles.drawerHead}>
          <div className={styles.drawerHeadL}>
            <div className={styles.drawerEye}>
              {pin.when}
              {pin.whenTime ? ` · ${pin.whenTime}` : ""}
              {pin.sub ? ` · ${pin.sub}` : ""}
            </div>
            <h3 className={styles.drawerTitle}>
              <em>{pin.label}</em>
              {pin.isDone && <span className={styles.drawerDoneFlag}> · Done</span>}
            </h3>
            {traditionLabel && (
              <div className={styles.drawerTraditionChip}>{traditionLabel}</div>
            )}
          </div>
          <button type="button" className={styles.drawerClose} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={styles.drawerBody}>
          {editing && isCustom && pin.customId ? (
            <CustomMilestoneForm
              eventId={eventId}
              defaultDateIso={startDateIso}
              eventType={eventType}
              initial={{
                customId: pin.customId,
                label: pin.label === "Reserved time" ? null : pin.label,
                detail: pin.sub,
                dateIso: pin.dateIso,
                time: pin.time,
                traditionKey: pin.traditionKey ?? null,
              }}
              onDone={onClose}
            />
          ) : (
            <>
              {pin.body.length > 0 && !isToday && (
                <div className={styles.drSection}>
                  <div className={styles.drSectionL}>What this is</div>
                  {pin.body.map((item, i) => (
                    <div key={i} className={styles.drItem}>
                      <div
                        className={styles.drItemIco}
                        dangerouslySetInnerHTML={{ __html: DRAWER_ICONS[item.ico] ?? DRAWER_ICONS.note }}
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
              )}

              {isToday && (
                <div className={styles.drSection}>
                  <div className={styles.drSectionL}>Right now</div>
                  <div className={styles.drEmpty}>
                    You’re looking at your dashboard. <em>It’s about time.</em>
                  </div>
                </div>
              )}

              {!isToday && (
                <div className={styles.drSection}>
                  <div className={styles.drSectionL}>Move it</div>

                  {isSeed && (
                    <button
                      type="button"
                      className={styles.drActionRow}
                      onClick={toggleDone}
                    >
                      <div
                        className={styles.drItemIco}
                        dangerouslySetInnerHTML={{ __html: DRAWER_ICONS.check }}
                      />
                      <div className={styles.drItemBody}>
                        <div className={styles.drItemT}>
                          {pin.isDone ? "Mark not done" : "Mark complete"}
                        </div>
                        <div className={styles.drItemD}>
                          {pin.isDone
                            ? "Move it back to your active list."
                            : "Tells Cue this is handled. Stops the reminders."}
                        </div>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.drActionRow}
                    onClick={() => setPickerOpen(true)}
                  >
                    <div
                      className={styles.drItemIco}
                      dangerouslySetInnerHTML={{ __html: DRAWER_ICONS.edit }}
                    />
                    <div className={styles.drItemBody}>
                      <div className={styles.drItemT}>Reschedule</div>
                      <div className={styles.drItemD}>
                        Change date or set a specific time. Useful for day-of ceremonies.
                      </div>
                    </div>
                  </button>

                  <div className={styles.drSortRow}>
                    <span className={styles.drSortL}>Order on same time</span>
                    <button
                      type="button"
                      className={`${styles.drSortBtn} ${pendingSort === "up" ? styles.drSortBtnPending : ""}`}
                      onClick={() => bumpSort(-1)}
                      disabled={pendingSort !== null}
                      aria-label="Move earlier"
                    >
                      <span
                        className={styles.drSortBtnIco}
                        dangerouslySetInnerHTML={{ __html: DRAWER_ICONS.up }}
                      />
                      <span className={styles.drSortBtnLbl}>Earlier</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.drSortBtn} ${pendingSort === "down" ? styles.drSortBtnPending : ""}`}
                      onClick={() => bumpSort(1)}
                      disabled={pendingSort !== null}
                      aria-label="Move later"
                    >
                      <span
                        className={styles.drSortBtnIco}
                        dangerouslySetInnerHTML={{ __html: DRAWER_ICONS.down }}
                      />
                      <span className={styles.drSortBtnLbl}>Later</span>
                    </button>
                  </div>

                  {isCustom && (
                    <button
                      type="button"
                      className={styles.drActionRow}
                      onClick={() => setEditing(true)}
                    >
                      <div
                        className={styles.drItemIco}
                        dangerouslySetInnerHTML={{ __html: DRAWER_ICONS.edit }}
                      />
                      <div className={styles.drItemBody}>
                        <div className={styles.drItemT}>Edit details</div>
                        <div className={styles.drItemD}>
                          Change the name, notes, or cultural tag.
                        </div>
                      </div>
                    </button>
                  )}

                  {isSeed && (
                    <button
                      type="button"
                      className={styles.drActionRow}
                      onClick={dismiss}
                    >
                      <div
                        className={styles.drItemIco}
                        dangerouslySetInnerHTML={{ __html: DRAWER_ICONS.x }}
                      />
                      <div className={styles.drItemBody}>
                        <div className={styles.drItemT}>Not for us</div>
                        <div className={styles.drItemD}>
                          Hide this from your timeline. You can re-add it from the traditions picker.
                        </div>
                      </div>
                    </button>
                  )}

                  {isCustom && (
                    <button
                      type="button"
                      className={`${styles.drActionRow} ${styles.drActionDanger}`}
                      onClick={deleteCustom}
                    >
                      <div
                        className={styles.drItemIco}
                        dangerouslySetInnerHTML={{ __html: DRAWER_ICONS.trash }}
                      />
                      <div className={styles.drItemBody}>
                        <div className={styles.drItemT}>Delete</div>
                        <div className={styles.drItemD}>
                          Remove from your timeline.
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      <DateTimePickerModal
        open={pickerOpen}
        selectedDateIso={pin.dateIso}
        selectedTime={pin.time}
        allowPast
        onConfirm={handlePickerConfirm}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
