import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CurrentVendor } from "@/lib/vndr/current-vendor";
import { getVendorTrustScore, type TrustScore } from "@/lib/vndr/trust-score";

/**
 * V-2b Hero Metrics — 4 tiles per brief §2. Reads all 4 in parallel.
 *
 *   1. Bookings (current month) — count of bookings whose linked event falls
 *      in the current calendar month + status IN ('confirmed', 'completed').
 *   2. Conversion rate — last 90d: COUNT(booked|inked|penciled) / COUNT(*).
 *      Lock 4 booking-funnel terminal states (per migration 028 spec
 *      alignment) — anything past 'quoted' counts toward conversion.
 *   3. Response time — last 30d: AVG(responded_at - created_at) in hours
 *      for inquiries that have a responded_at set.
 *   4. Trust score — from lib/vndr/trust-score.ts (weighted formula).
 */

export type HeroMetrics = {
  bookingsThisMonth: number;
  conversionRatePct: number;
  avgResponseHours: number | null;
  trustScore: TrustScore;
};

async function bookingsThisMonth(vendorTenantId: string): Promise<number> {
  const supabase = await createClient();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const { data } = await supabase
    .from("bookings")
    .select("id, events!bookings_event_id_fkey!inner(start_date)")
    .eq("vndr_tenant_id", vendorTenantId)
    .in("status", ["confirmed", "completed"])
    .gte("events.start_date", start)
    .lte("events.start_date", end);
  return (data ?? []).length;
}

async function conversionRate(vendorTenantId: string): Promise<number> {
  const supabase = await createClient();
  const cutoffMs = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const cutoffIso = new Date(cutoffMs).toISOString();
  const { data } = await supabase
    .from("inquiries")
    .select("status")
    .eq("recipient_tenant_id", vendorTenantId)
    .gte("created_at", cutoffIso);
  const rows = data ?? [];
  if (rows.length === 0) return 0;
  const won = rows.filter((r) => {
    const s = (r as Record<string, unknown>).status as string;
    return s === "penciled" || s === "inked" || s === "booked";
  }).length;
  return Math.round((won / rows.length) * 100);
}

async function avgResponseHours(vendorTenantId: string): Promise<number | null> {
  const supabase = await createClient();
  const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const cutoffIso = new Date(cutoffMs).toISOString();
  const { data } = await supabase
    .from("inquiries")
    .select("created_at, responded_at")
    .eq("recipient_tenant_id", vendorTenantId)
    .gte("created_at", cutoffIso)
    .not("responded_at", "is", null);
  const rows = data ?? [];
  if (rows.length === 0) return null;
  let totalMs = 0;
  for (const r of rows) {
    const row = r as Record<string, unknown>;
    const created = new Date(row.created_at as string).getTime();
    const responded = new Date(row.responded_at as string).getTime();
    totalMs += Math.max(0, responded - created);
  }
  const avgMs = totalMs / rows.length;
  return Math.round((avgMs / (1000 * 60 * 60)) * 10) / 10;
}

export async function getVndrHeroMetrics(
  vendor: CurrentVendor,
): Promise<HeroMetrics> {
  const [bookings, conversion, response, trust] = await Promise.all([
    bookingsThisMonth(vendor.tenantId),
    conversionRate(vendor.tenantId),
    avgResponseHours(vendor.tenantId),
    getVendorTrustScore(vendor),
  ]);
  return {
    bookingsThisMonth: bookings,
    conversionRatePct: conversion,
    avgResponseHours: response,
    trustScore: trust,
  };
}
