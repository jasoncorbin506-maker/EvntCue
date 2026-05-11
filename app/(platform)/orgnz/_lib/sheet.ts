"use client";

export type SheetName = "budget" | "vendors" | "plnr" | "venu" | null;

const SHEET_EVENT = "orgnz-sheet";
const PADRINO_EVENT = "orgnz-padrino";

export function openSheet(name: SheetName) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<SheetName>(SHEET_EVENT, { detail: name }));
}

export function onSheetChange(handler: (name: SheetName) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => handler((event as CustomEvent<SheetName>).detail);
  window.addEventListener(SHEET_EVENT, listener);
  return () => window.removeEventListener(SHEET_EVENT, listener);
}

export function openPadrino(open: boolean) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<boolean>(PADRINO_EVENT, { detail: open }));
}

export function onPadrinoChange(handler: (open: boolean) => void) {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => handler((event as CustomEvent<boolean>).detail);
  window.addEventListener(PADRINO_EVENT, listener);
  return () => window.removeEventListener(PADRINO_EVENT, listener);
}
