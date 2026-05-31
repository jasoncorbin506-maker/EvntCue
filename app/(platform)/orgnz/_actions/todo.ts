"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * PL #91 — discrete to-do items attached to a milestone (seed or custom) or to
 * nothing (un-anchored). Authorization is RLS via user_owns_event(event_id).
 *
 * Anchor: milestoneId (custom) OR systemMilestoneKey (seed) OR neither.
 * Soft-delete + undo per Lock 22 (deleted_at + restore). toggleTodoItem flips
 * completed_at NULL <-> now().
 */

export type TodoResult = { ok: true; id: string } | { ok: false; error: string };
export type MutResult = { ok: true } | { ok: false; error: string };

export async function addTodoItem(input: {
  eventId: string;
  milestoneId?: string | null;
  systemMilestoneKey?: string | null;
  label: string;
  sortOrder?: number | null;
}): Promise<TodoResult> {
  if (!input.eventId) return { ok: false, error: "Missing eventId" };
  const label = input.label?.trim();
  if (!label) return { ok: false, error: "To-do can't be empty" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("event_todo_items")
    .insert({
      event_id: input.eventId,
      milestone_id: input.milestoneId ?? null,
      system_milestone_key: input.systemMilestoneKey ?? null,
      label,
      sort_order: input.sortOrder ?? 0,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Insert failed" };

  revalidatePath("/orgnz");
  return { ok: true, id: data.id as string };
}

export async function toggleTodoItem(input: { itemId: string }): Promise<MutResult> {
  if (!input.itemId) return { ok: false, error: "Missing itemId" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  // Read current completed_at, then flip. RLS scopes the read to the owner.
  const { data: row, error: readErr } = await supabase
    .from("event_todo_items")
    .select("completed_at")
    .eq("id", input.itemId)
    .is("deleted_at", null)
    .single();
  if (readErr || !row) return { ok: false, error: readErr?.message ?? "Item not found" };

  const next = row.completed_at ? null : new Date().toISOString();

  const { error } = await supabase
    .from("event_todo_items")
    .update({ completed_at: next, updated_at: new Date().toISOString() })
    .eq("id", input.itemId)
    .is("deleted_at", null);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/orgnz");
  return { ok: true };
}

export async function updateTodoItem(input: {
  itemId: string;
  label?: string;
  sortOrder?: number;
}): Promise<MutResult> {
  if (!input.itemId) return { ok: false, error: "Missing itemId" };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.label != null) {
    const label = input.label.trim();
    if (!label) return { ok: false, error: "To-do can't be empty" };
    patch.label = label;
  }
  if (input.sortOrder != null) patch.sort_order = input.sortOrder;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("event_todo_items")
    .update(patch)
    .eq("id", input.itemId)
    .is("deleted_at", null);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/orgnz");
  return { ok: true };
}

export async function softDeleteTodoItem(input: { itemId: string }): Promise<MutResult> {
  if (!input.itemId) return { ok: false, error: "Missing itemId" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("event_todo_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", input.itemId)
    .is("deleted_at", null);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/orgnz");
  return { ok: true };
}

export async function restoreTodoItem(input: { itemId: string }): Promise<MutResult> {
  if (!input.itemId) return { ok: false, error: "Missing itemId" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("event_todo_items")
    .update({ deleted_at: null })
    .eq("id", input.itemId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/orgnz");
  return { ok: true };
}
