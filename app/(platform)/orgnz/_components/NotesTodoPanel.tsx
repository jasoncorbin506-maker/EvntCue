"use client";

import { useState, useTransition } from "react";
import s from "../orgnz.module.css";
import { showToast } from "../_lib/toast";
import {
  addEventNote,
  updateEventNote,
  softDeleteEventNote,
} from "../_actions/notes";
import {
  addTodoItem,
  toggleTodoItem,
  updateTodoItem,
  softDeleteTodoItem,
} from "../_actions/todo";
import type { OrgnzNote, OrgnzTodoItem } from "../_lib/load-context";

/**
 * PL #91 - shared notes + to-do editor. Rendered both inside RailDrawer
 * (anchored to one milestone) and inside NotesTodoSheet (one panel per
 * milestone group + an un-anchored group).
 *
 * Anchoring: pass milestoneId (custom milestone row) OR systemMilestoneKey
 * (seed milestone key) OR neither (un-anchored). Those values flow straight
 * into the add* server actions; reads are pre-filtered by the parent.
 *
 * Mutations call server actions that revalidatePath("/orgnz"), so the server
 * re-renders with fresh rows. We keep only transient input state local.
 */

type Props = {
  eventId: string;
  milestoneId?: string | null;
  systemMilestoneKey?: string | null;
  notes: OrgnzNote[];
  todos: OrgnzTodoItem[];
};

export function NotesTodoPanel({
  eventId,
  milestoneId = null,
  systemMilestoneKey = null,
  notes,
  todos,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [noteDraft, setNoteDraft] = useState("");
  const [todoDraft, setTodoDraft] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");

  const incompleteTodos = todos.filter((t) => !t.completed_at);
  const completeTodos = todos.filter((t) => t.completed_at);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        showToast(`Couldn&rsquo;t save: ${res.error ?? "try again"}`);
        return;
      }
      after?.();
    });
  }

  function submitNote() {
    const body = noteDraft.trim();
    if (!body) return;
    run(
      () => addEventNote({ eventId, milestoneId, systemMilestoneKey, body }),
      () => {
        setNoteDraft("");
        showToast("Note added.");
      },
    );
  }

  function submitTodo() {
    const label = todoDraft.trim();
    if (!label) return;
    run(
      () => addTodoItem({ eventId, milestoneId, systemMilestoneKey, label }),
      () => {
        setTodoDraft("");
        showToast("Added to your to-do.");
      },
    );
  }

  function saveNoteEdit(noteId: string) {
    const body = editingNoteBody.trim();
    if (!body) return;
    run(
      () => updateEventNote({ noteId, body }),
      () => {
        setEditingNoteId(null);
        setEditingNoteBody("");
      },
    );
  }

  return (
    <div className={s.ntPanel}>
      {/* NOTES */}
      <div className={s.ntBlock}>
        <div className={s.ntBlockHead}>Notes</div>

        {notes.length > 0 && (
          <div className={s.ntList}>
            {notes.map((note) =>
              editingNoteId === note.id ? (
                <div key={note.id} className={s.ntNoteEdit}>
                  <textarea
                    className={s.ntTextarea}
                    rows={2}
                    value={editingNoteBody}
                    onChange={(e) => setEditingNoteBody(e.target.value)}
                    maxLength={2000}
                    autoFocus
                  />
                  <div className={s.ntEditActions}>
                    <button
                      type="button"
                      className={s.ntMiniCancel}
                      onClick={() => {
                        setEditingNoteId(null);
                        setEditingNoteBody("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={s.ntMiniSave}
                      onClick={() => saveNoteEdit(note.id)}
                      disabled={pending || !editingNoteBody.trim()}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div key={note.id} className={s.ntNote}>
                  <div className={s.ntNoteBody}>{note.body}</div>
                  <div className={s.ntRowActions}>
                    <button
                      type="button"
                      className={s.ntRowBtn}
                      onClick={() => {
                        setEditingNoteId(note.id);
                        setEditingNoteBody(note.body);
                      }}
                      aria-label="Edit note"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={s.ntRowBtn}
                      onClick={() =>
                        run(
                          () => softDeleteEventNote({ noteId: note.id }),
                          () => showToast("Note removed."),
                        )
                      }
                      disabled={pending}
                      aria-label="Delete note"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        <div className={s.ntAddRow}>
          <textarea
            className={s.ntTextarea}
            rows={2}
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Add a note &mdash; directions, what to bring, reminders&hellip;"
            maxLength={2000}
          />
          <button
            type="button"
            className={s.ntAddBtn}
            onClick={submitNote}
            disabled={pending || !noteDraft.trim()}
          >
            Add note
          </button>
        </div>
      </div>

      {/* TO-DO */}
      <div className={s.ntBlock}>
        <div className={s.ntBlockHead}>To-Do</div>

        {todos.length > 0 && (
          <div className={s.ntList}>
            {incompleteTodos.map((item) => (
              <TodoRow key={item.id} item={item} pending={pending} run={run} />
            ))}
            {completeTodos.map((item) => (
              <TodoRow key={item.id} item={item} pending={pending} run={run} />
            ))}
          </div>
        )}

        <div className={s.ntAddRow}>
          <input
            type="text"
            className={s.ntInput}
            value={todoDraft}
            onChange={(e) => setTodoDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitTodo();
            }}
            placeholder="Add a to-do item&hellip;"
            maxLength={500}
          />
          <button
            type="button"
            className={s.ntAddBtn}
            onClick={submitTodo}
            disabled={pending || !todoDraft.trim()}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function TodoRow({
  item,
  pending,
  run,
}: {
  item: OrgnzTodoItem;
  pending: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.label);
  const done = Boolean(item.completed_at);

  if (editing) {
    return (
      <div className={s.ntNoteEdit}>
        <input
          type="text"
          className={s.ntInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          autoFocus
        />
        <div className={s.ntEditActions}>
          <button type="button" className={s.ntMiniCancel} onClick={() => setEditing(false)}>
            Cancel
          </button>
          <button
            type="button"
            className={s.ntMiniSave}
            onClick={() =>
              run(
                () => updateTodoItem({ itemId: item.id, label: draft.trim() }),
                () => setEditing(false),
              )
            }
            disabled={pending || !draft.trim()}
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${s.ntTodo} ${done ? s.ntTodoDone : ""}`}>
      <button
        type="button"
        className={`${s.ntCheck} ${done ? s.ntCheckOn : ""}`}
        onClick={() => run(() => toggleTodoItem({ itemId: item.id }))}
        disabled={pending}
        role="checkbox"
        aria-checked={done}
        aria-label={done ? "Mark not done" : "Mark done"}
      >
        {done ? "✓" : ""}
      </button>
      <span className={s.ntTodoLabel}>{item.label}</span>
      <div className={s.ntRowActions}>
        <button
          type="button"
          className={s.ntRowBtn}
          onClick={() => {
            setDraft(item.label);
            setEditing(true);
          }}
          aria-label="Edit to-do"
        >
          Edit
        </button>
        <button
          type="button"
          className={s.ntRowBtn}
          onClick={() =>
            run(
              () => softDeleteTodoItem({ itemId: item.id }),
              () => showToast("To-do removed."),
            )
          }
          disabled={pending}
          aria-label="Delete to-do"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
