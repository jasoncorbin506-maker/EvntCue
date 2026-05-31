"use client";

/**
 * PL #91 — open/close channel for the shared PrintPacket overlay. Mirrors the
 * sheet.ts event pattern so any surface (the Notes & To-Do sheet, a future
 * Timeline/Run-of-Show print button) can pop the same packet.
 */

const PRINT_EVENT = "orgnz-print";

export function openPrint(open: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<boolean>(PRINT_EVENT, { detail: open }));
}

export function onPrintChange(handler: (open: boolean) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => handler((event as CustomEvent<boolean>).detail);
  window.addEventListener(PRINT_EVENT, listener);
  return () => window.removeEventListener(PRINT_EVENT, listener);
}
