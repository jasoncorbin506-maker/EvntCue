"use client";

import { useEffect, useState } from "react";
import s from "../orgnz.module.css";
import { onPrintChange } from "../_lib/print";
import { PHASE_ORDER, type MergedRoSRow } from "@/data/run-of-show/dispatch";
import { phaseLabel } from "@/data/run-of-show/phase-labels-by-event-type";
import type { RoSPhase } from "@/data/run-of-show/types";
import type { RailPin } from "../_lib/timeline";
import type { OrgnzNote, OrgnzTodoItem } from "../_lib/load-context";
import type { MilestoneAnchor } from "./sheets/NotesTodoSheet";

/**
 * PL #91 — shared print primitive. One packet, four toggleable sections
 * (Timeline / Run of Show / Notes / To-Do). Browser-native: window.print() +
 * an @media print block in globals.css that hides the app and the packet's own
 * controls, leaving only [data-print-root] on the page. Zero new deps.
 *
 * Opened via openPrint(true) from any surface (today: the Notes & To-Do sheet).
 */

type Props = {
  eventName: string;
  longDate: string;
  pins: RailPin[];
  rosByPhase: Record<RoSPhase, MergedRoSRow[]>;
  rosRecipeLabel: string;
  eventType: string | null;
  anchors: MilestoneAnchor[];
  notes: OrgnzNote[];
  todos: OrgnzTodoItem[];
};

type SectionKey = "timeline" | "ros" | "notes" | "todo";

export function PrintPacket({
  eventName,
  longDate,
  pins,
  rosByPhase,
  rosRecipeLabel,
  eventType,
  anchors,
  notes,
  todos,
}: Props) {
  const [open, setOpen] = useState(false);
  const [on, setOn] = useState<Record<SectionKey, boolean>>({
    timeline: true,
    ros: true,
    notes: true,
    todo: true,
  });

  useEffect(() => onPrintChange(setOpen), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  const toggle = (k: SectionKey) => setOn((p) => ({ ...p, [k]: !p[k] }));

  const timelinePins = pins.filter((p) => p.origin !== "today");
  const rosPhases = PHASE_ORDER.flatMap((phase) => {
    const rows = rosByPhase[phase];
    return rows && rows.length > 0 ? [{ phase, rows }] : [];
  });

  const notesFor = (a: MilestoneAnchor) =>
    a.kind === "seed"
      ? notes.filter((n) => n.system_milestone_key === a.key)
      : notes.filter((n) => n.milestone_id === a.key);
  const todosFor = (a: MilestoneAnchor) =>
    a.kind === "seed"
      ? todos.filter((t) => t.system_milestone_key === a.key)
      : todos.filter((t) => t.milestone_id === a.key);

  const unanchoredNotes = notes.filter((n) => !n.milestone_id && !n.system_milestone_key);
  const unanchoredTodos = todos.filter((t) => !t.milestone_id && !t.system_milestone_key);

  const noteGroups = [
    ...anchors
      .map((a) => ({ label: a.label, when: a.when, items: notesFor(a) }))
      .filter((g) => g.items.length > 0),
    ...(unanchoredNotes.length > 0
      ? [{ label: "Not tied to a milestone", when: "", items: unanchoredNotes }]
      : []),
  ];
  const todoGroups = [
    ...anchors
      .map((a) => ({ label: a.label, when: a.when, items: todosFor(a) }))
      .filter((g) => g.items.length > 0),
    ...(unanchoredTodos.length > 0
      ? [{ label: "Not tied to a milestone", when: "", items: unanchoredTodos }]
      : []),
  ];

  return (
    <div className={s.pkOverlay} role="dialog" aria-modal="true" aria-label="Print packet">
      <div className={s.pkBar} data-print-hide>
        <div className={s.pkBarTitle}>Print packet</div>
        <div className={s.pkToggles}>
          {(
            [
              ["timeline", "Timeline"],
              ["ros", "Run of Show"],
              ["notes", "Notes"],
              ["todo", "To-Do"],
            ] as [SectionKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`${s.pkToggle} ${on[key] ? s.pkToggleOn : ""}`}
              onClick={() => toggle(key)}
              aria-pressed={on[key]}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={s.pkBarActions}>
          <button type="button" className={s.pkPrint} onClick={() => window.print()}>
            Print
          </button>
          <button type="button" className={s.pkClose} onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </div>

      <div className={s.pkScroll}>
        <div className={s.pkDoc} data-print-root>
          <div className={s.pkDocHead}>
            <div className={s.pkDocTitle}>{eventName}</div>
            <div className={s.pkDocDate}>{longDate}</div>
          </div>

          {on.timeline && (
            <section className={s.pkSection}>
              <h2 className={s.pkSectionH}>Timeline</h2>
              {timelinePins.length === 0 ? (
                <div className={s.pkEmpty}>No milestones yet.</div>
              ) : (
                <ul className={s.pkList}>
                  {timelinePins.map((p) => (
                    <li key={p.id} className={s.pkRow}>
                      <span className={s.pkWhen}>
                        {p.when}
                        {p.whenTime ? ` · ${p.whenTime}` : ""}
                      </span>
                      <span className={s.pkRowMain}>
                        <span className={s.pkRowT}>{p.label}</span>
                        {p.sub && <span className={s.pkRowSub}>{p.sub}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {on.ros && (
            <section className={s.pkSection}>
              <h2 className={s.pkSectionH}>Run of Show · {rosRecipeLabel}</h2>
              {rosPhases.length === 0 ? (
                <div className={s.pkEmpty}>No run-of-show moments tagged yet.</div>
              ) : (
                rosPhases.map(({ phase, rows }) => (
                  <div key={phase} className={s.pkPhase}>
                    <h3 className={s.pkPhaseH}>{phaseLabel(eventType, phase)}</h3>
                    <ul className={s.pkList}>
                      {rows.map((row) => (
                        <li key={row.key} className={s.pkRow}>
                          <span className={s.pkWhen}>{row.time}</span>
                          <span className={s.pkRowMain}>
                            <span className={s.pkRowT}>{row.title}</span>
                            {row.vendor && <span className={s.pkRowSub}>{row.vendor}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </section>
          )}

          {on.notes && (
            <section className={s.pkSection}>
              <h2 className={s.pkSectionH}>Notes</h2>
              {noteGroups.length === 0 ? (
                <div className={s.pkEmpty}>No notes yet.</div>
              ) : (
                noteGroups.map((g, i) => (
                  <div key={i} className={s.pkPhase}>
                    <h3 className={s.pkPhaseH}>
                      {g.label}
                      {g.when && <span className={s.pkPhaseWhen}> · {g.when}</span>}
                    </h3>
                    <ul className={s.pkList}>
                      {g.items.map((n) => (
                        <li key={n.id} className={s.pkNote}>
                          {n.body}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </section>
          )}

          {on.todo && (
            <section className={s.pkSection}>
              <h2 className={s.pkSectionH}>To-Do</h2>
              {todoGroups.length === 0 ? (
                <div className={s.pkEmpty}>No to-do items yet.</div>
              ) : (
                todoGroups.map((g, i) => (
                  <div key={i} className={s.pkPhase}>
                    <h3 className={s.pkPhaseH}>
                      {g.label}
                      {g.when && <span className={s.pkPhaseWhen}> · {g.when}</span>}
                    </h3>
                    <ul className={s.pkList}>
                      {g.items.map((t) => (
                        <li key={t.id} className={s.pkTodo}>
                          <span className={s.pkBox}>{t.completed_at ? "[x]" : "[ ]"}</span>
                          <span className={t.completed_at ? s.pkTodoDone : ""}>{t.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
