import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { loadOrCreateBoard } from "./_lib/load-board";
import { MoodBoardCanvas } from "./_components/MoodBoardCanvas";

export const metadata = { title: "Mood Board · EvntCue" };

/**
 * Orgnz mood board surface — Chunk A (foundation: corkboard canvas + image
 * upload + drag-position persistence). Chunks B–E add chip palette taxonomy,
 * Apify Pinterest import, Flux 2 Pro render pipeline, and Web Share API.
 *
 * Auth-gated by middleware (proxy.ts). If the loader returns null the user
 * has no orgnz tenant — bounce back through login to seed one.
 */
export default async function MoodBoardPage() {
  const board = await loadOrCreateBoard();
  if (!board) {
    redirect("/login?role=orgnz&intent=mood_board");
  }

  const t = await getTranslations("dashboard.moodBoard");

  return (
    <MoodBoardCanvas
      boardId={board.board_id}
      initialPins={board.pins}
      initialCanvasState={board.canvas_state}
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
      }}
    />
  );
}
