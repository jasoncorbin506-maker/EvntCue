"use client";

import { useEffect } from "react";
import s from "../../orgnz.module.css";
import { NotesTodoPanel } from "../NotesTodoPanel";
import { openPrint } from "../../_lib/print";
import type { OrgnzNote, OrgnzTodoItem } from "../../_lib/load-context";

/**
 * PL #91 — aggregated Notes & To-Do sheet. One panel per milestone that has
 * notes or to-do attached, plus an always-present un-anchored group (the only
 * place un-anchored items can be added, since they have no milestone drawer).
 *
 * The per-milestone panels here are the SAME editor used in RailDrawer, just
 * grouped. The "Print packet" button hands off to the shared print primitive
 * (PrintPacket) so an organizer can carry this off-site.
 */

export type MilestoneAnchor = {
  kind: "seed" | "custom";
  /** system_milestone_key for seed pins, custom-milestone id for custom pins. */
  key: string;
  label: string;
  /** Pre-formatted display date from the timeline pin, e.g. "May 17". */
  when: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  anchors: MilestoneAnchor[];
  notes: OrgnzNote[];
  todos: OrgnzTodoItem[];
};

export function NotesTodoSheet({ open, onClose, eventId, anchors, notes, todos }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const notesFor = (a: MilestoneAnchor) =>
    a.kind === "seed"
      ? notes.filter((n) => n.system_milestone_key === a.key)
      : notes.filter((n) => n.milestone_id === a.key);
  const todosFor = (a: MilestoneAnchor) =>
    a.kind === "seed"
      ? todos.filter((t) => t.system_milestone_key === a.key)
      : todos.filter((t) => t.milestone_id === a.key);

  // Only surface milestone groups that already carry something. Empty
  // milestones are added-to from their timeline drawer, not here.
  const populated = anchors.filter(
    (a) => notesFor(a).length > 0 || todosFor(a).length > 0,
  );

  const unanchoredNotes = notes.filter(
    (n) => !n.milestone_id && !n.system_milestone_key,
  );
  const unanchoredTodos = todos.filter(
    (t) => !t.milestone_id && !t.system_milestone_key,
  );

  const totalNotes = notes.length;
  const totalTodos = todos.length;

  return (
    <>
      <div className={s.scrim} onClick={onClose} />
      <aside
        className={`${s.drawer} ${s.drawerOpen}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notes-todo-title"
      >
        <div className={s.drawerHandle} />
        <div className={s.drawerHead}>
          <div className={s.drawerHeadL}>
            <div className={s.drawerEye}>Everything in one place</div>
            <h3 className={s.drawerTitle} id="notes-todo-title">
              <em>Notes &amp; To-Do</em>
            </h3>
          </div>
          <div className={s.ntHeadActions}>
            <button
              type="button"
              className={s.ntPrintBtn}
              onClick={() => openPrint(true)}
            >
              Print packet
            </button>
            <button
              type="button"
              className={s.drawerClose}
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className={s.drawerBody}>
          {totalNotes === 0 && totalTodos === 0 ? (
            <div className={s.openItemsEmpty}>
              Nothing here yet. Open any milestone on your timeline to add a{" "}
              <em>note</em> or a <em>to-do</em>.
            </div>
          ) : (
            <>
              {populated.map((a) => (
                <div key={`${a.kind}:${a.key}`} className={s.ntGroup}>
                  <div className={s.ntGroupHead}>
                    <span className={s.ntGroupLabel}>{a.label}</span>
                    <span className={s.ntGroupWhen}>{a.when}</span>
                  </div>
                  <NotesTodoPanel
                    eventId={eventId}
                    milestoneId={a.kind === "custom" ? a.key : null}
                    systemMilestoneKey={a.kind === "seed" ? a.key : null}
                    notes={notesFor(a)}
                    todos={todosFor(a)}
                  />
                </div>
              ))}

              <div className={s.ntGroup}>
                <div className={s.ntGroupHead}>
                  <span className={s.ntGroupLabel}>Not tied to a milestone</span>
                </div>
                <NotesTodoPanel
                  eventId={eventId}
                  notes={unanchoredNotes}
                  todos={unanchoredTodos}
                />
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
