import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { loadOrCreateBoard } from "./_lib/load-board";
import { MoodBoardCanvas } from "./_components/MoodBoardCanvas";
import { byCategory } from "@/data/moodboard";

export const metadata = { title: "Mood Board · EvntCue" };

/**
 * Orgnz mood board — Chunk B. Chunk A foundation extended with the chip
 * palette taxonomy, fabric foundation, and per-event-type suggested slots.
 *
 * Chunks C–E add Apify Pinterest import, Flux render pipeline, Web Share API.
 */

const FALLBACK_SPECIMEN = {
  display: '"Maya & Liam"',
  body: "April 17, 2027 · Stonewall Estate",
};

function formatStartDate(iso: string | null): string | null {
  if (!iso) return null;
  // Parse YYYY-MM-DD without timezone shift.
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function MoodBoardPage() {
  const board = await loadOrCreateBoard();
  if (!board) {
    redirect("/login?role=orgnz&intent=mood_board");
  }

  const t = await getTranslations("dashboard.moodBoard");
  const palette = byCategory(board.event_category);

  // Typography specimen — prefer events.name + events.start_date when set;
  // fall back to "Maya & Liam" generic filler per the brief.
  const formattedDate = formatStartDate(board.event_start_date);
  const specimen =
    board.event_name && formattedDate
      ? {
          display: `"${board.event_name}"`,
          body: formattedDate,
        }
      : FALLBACK_SPECIMEN;

  return (
    <MoodBoardCanvas
      boardId={board.board_id}
      initialPins={board.pins}
      initialCanvasState={board.canvas_state}
      palette={palette}
      specimen={specimen}
      labels={{
        title: t("title"),
        emptyHint: t("emptyHint"),
        uploadButton: t("uploadButton"),
        renderButton: t("renderButton"),
        renderDisabledTooltip: t("renderDisabledTooltip"),
        bringItIn: t("bringItIn"),
        bringItInNote: t("bringItInNote"),
        palette: t("palette"),
        paletteStub: t("paletteStub"),
        urlPaste: t("urlPaste"),
        urlPasteDisabled: t("urlPasteDisabled"),
        tidyBoard: t("tidyBoard"),
        boardName: t("boardName"),
        privacyBadge: t("privacyBadge"),
        backToDashboard: t("backToDashboard"),
        moodHeading: t("moodHeading"),
        materialHeading: t("materialHeading"),
        floralsHeading: t("floralsHeading"),
        typographyHeading: t("typographyHeading"),
        editDone: t("editDone"),
        straightenAll: t("straightenAll"),
        recentlyRemoved: t("recentlyRemoved"),
        recentlyRemovedTitle: t("recentlyRemovedTitle"),
        recentlyRemovedEmpty: t("recentlyRemovedEmpty"),
        recentlyRemovedWindow: t("recentlyRemovedWindow"),
        recentlyRemovedLoading: t("recentlyRemovedLoading"),
        pinDelete: t("pinDelete"),
        pinRestore: t("pinRestore"),
        pinRemovedToast: t("pinRemovedToast"),
        undo: t("undo"),
        close: t("close"),
        urlImportButton: t("urlImportButton"),
        urlImportSubtitle: t("urlImportSubtitle"),
        urlImportLoading: t("urlImportLoading"),
        urlImportSuccessSingle: t("urlImportSuccessSingle"),
        // t.raw — these carry {count}/{remaining}/{slot} placeholders that the
        // canvas fills in client-side via .replace(); t() would try to format
        // them server-side without the value and throw FORMATTING_ERROR.
        urlImportSuccessMulti: t.raw("urlImportSuccessMulti"),
        urlImportSuccessCapped: t.raw("urlImportSuccessCapped"),
        urlImportInvalid: t("urlImportInvalid"),
        urlImportBoardTitle: t("urlImportBoardTitle"),
        urlImportBoardBody: t.raw("urlImportBoardBody"),
        urlImportBoardBodyCap: t.raw("urlImportBoardBodyCap"),
        urlImportBoardCancel: t("urlImportBoardCancel"),
        urlImportBoardConfirm: t("urlImportBoardConfirm"),
        // Chunk D — render spread
        renderStarting: t("renderStarting"),
        renderErrorGeneric: t("renderErrorGeneric"),
        spreadTitle: t("spreadTitle"),
        spreadBackToCanvas: t("spreadBackToCanvas"),
        slotLoading: t("slotLoading"),
        slotFailed: t("slotFailed"),
        spreadFooterCaption: t("spreadFooterCaption"),
        // Chunk D Step 3e — per-slot re-roll
        rerollButton: t("rerollButton"),
        rerollPending: t("rerollPending"),
        rerollRemaining: t.raw("rerollRemaining"),
        rerollWindowClosed: t("rerollWindowClosed"),
        rerollCapReached: t("rerollCapReached"),
        // Chunk E — Web Share API
        shareButton: t("shareButton"),
        sharePending: t("sharePending"),
        shareCopied: t("shareCopied"),
        shareTitleTemplate: t.raw("shareTitleTemplate"),
        shareText: t("shareText"),
      }}
    />
  );
}
