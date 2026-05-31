"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * PL #91 — free-form notes attached to a milestone (seed or custom) or to
 * nothing (un-anchored). Authorization is RLS via user_owns_event(event_id);
 * these actions use the authed client so the policy enforces tenant isolation.
 *
 * Anchor: pass milestoneId (custom milestone row) OR systemMilestoneKey (seed
 * milestone key from data/event-milestones.ts) OR neither (un-anchored).
 *
 * Soft-delete + undo per Lock 22: softDeleteEventNote stamps deleted_at;
 * restoreEventNote clears it for the undo toast. Reads filter deleted_at IS NULL.
 */

export type NoteResult = { ok: true; id: string } | { ok: false; error: string };
export type MutResult = { ok: true } | { ok: false; error: string };

export async function addEventNote(input: {
  eventId: string;
  milestoneId?: string | null;
  systemMilestoneKey?: string | null;
  body: string;
}): Promise<NoteResult> {
  if (!input.eventId) return { ok: false, error: "Missing eventId" };
  const body = input.body?.trim();
  if (!body) return { ok: false, error: "Note can't be empty" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("event_notes")
    .insert({
      event_id: input.eventId,
      milestone_id: input.milestoneId ?? null,
      system_milestone_key: input.systemMilestoneKey ?? null,
      body,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Insert failed" };

  revalidatePath("/orgnz");
  return { ok: true, id: data.id as string };
}

export async function updateEventNote(input: {
  noteId: string;
  body: string;
}): Promise<MutResult> {
  if (!input.noteId) return { ok: false, error: "Missing noteId" };
  const body = input.body?.trim();
  if (!body) return { ok: false, error: "Note can't be empty" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("event_notes")
    .update({ body, updated_at: new Date().toISOString() })
    .eq("id", input.noteId)
    .is("deleted_at", null);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/orgnz");
  return { ok: true };
}

export async function softDeleteEventNote(input: { noteId: string }): Promise<MutResult> {
  if (!input.noteId) return { ok: false, error: "Missing noteId" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("event_notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", input.noteId)
    .is("deleted_at", null);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/orgnz");
  return { ok: true };
}

export async function restoreEventNote(input: { noteId: string }): Promise<MutResult> {
  if (!input.noteId) return { ok: false, error: "Missing noteId" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("event_notes")
    .update({ deleted_at: null })
    .eq("id", input.noteId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/orgnz");
  return { ok: true };
}
