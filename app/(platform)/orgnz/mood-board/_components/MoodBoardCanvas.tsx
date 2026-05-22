"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/react";
import { PinnedImage } from "./PinnedImage";
import { TopBar } from "./TopBar";
import { Drawer } from "./Drawer";
import { uploadImageAction } from "../_actions/upload-image";
import { saveCanvasStateAction } from "../_actions/save-canvas-state";
import type {
  CanvasPinLayout,
  CanvasState,
  LoadedPin,
} from "../_lib/load-board";
import s from "../mood-board.module.css";

export type CanvasLabels = {
  title: string;
  emptyHint: string;
  uploadButton: string;
  renderButton: string;
  renderDisabledTooltip: string;
  bringItIn: string;
  bringItInNote: string;
  palette: string;
  paletteStub: string;
  urlPaste: string;
  urlPasteDisabled: string;
  tidyBoard: string;
  boardName: string;
  privacyBadge: string;
};

type Props = {
  boardId: string;
  initialPins: LoadedPin[];
  initialCanvasState: CanvasState;
  labels: CanvasLabels;
};

const JITTER_DEGREES = 3;

function randomJitter(): number {
  return Math.round((Math.random() * JITTER_DEGREES * 2 - JITTER_DEGREES) * 10) / 10;
}

/**
 * Mood Board Chunk A — corkboard canvas with drag-arrange + image upload.
 *
 * Architecture:
 *   - DragDropProvider wraps the whole shell so both the canvas pins (drag
 *     within the board) and any future drop targets share one manager.
 *   - Each PinnedImage owns its own useDraggable hook and renders at its
 *     `position` (x, y, rotation, z) from local state.
 *   - On drag end, we compute the new position from the delta, optimistically
 *     update local state, and persist via saveCanvasStateAction (debounced
 *     batch — within one drag the server sees a single update).
 *   - Upload flow: Drawer hands a File to handleUpload → uploadImageAction →
 *     we receive {id, signed_url} → push into pins array with a default
 *     position + fresh jitter rotation.
 */
export function MoodBoardCanvas({
  boardId,
  initialPins,
  initialCanvasState,
  labels,
}: Props) {
  const [pins, setPins] = useState<LoadedPin[]>(initialPins);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [, startSave] = useTransition();
  const [, startUpload] = useTransition();

  // Debounce timer so a flurry of drag events coalesces into one server save.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingLayouts = useRef<Record<string, CanvasPinLayout>>({});

  const flushSave = useCallback(() => {
    const payload = pendingLayouts.current;
    pendingLayouts.current = {};
    if (Object.keys(payload).length === 0) return;
    startSave(async () => {
      const result = await saveCanvasStateAction({ boardId, pins: payload });
      if (!result.ok) {
        // Re-queue the failed payload so a future drag triggers another save.
        pendingLayouts.current = { ...payload, ...pendingLayouts.current };
      }
    });
  }, [boardId]);

  const queueSave = useCallback(
    (pinId: string, layout: CanvasPinLayout) => {
      pendingLayouts.current[pinId] = layout;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(flushSave, 350);
    },
    [flushSave],
  );

  // On drag start, bump the dragged pin's z so it sits above siblings during
  // the drag (and after release). Without this, dragging a pin that started
  // life below other pins keeps it visually behind them through the move,
  // which reads as "the drag is broken." Date.now() is monotonically
  // increasing within a session so it's a cheap "always highest" value.
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const pinId = String(event.operation?.source?.id ?? "");
    if (!pinId) return;
    const newZ = Date.now();
    setPins((current) => {
      const idx = current.findIndex((p) => p.id === pinId);
      if (idx < 0) return current;
      const next = current.slice();
      next[idx] = {
        ...current[idx],
        position: { ...current[idx].position, z: newZ },
      };
      return next;
    });
    // Don't queue a save here — drag-end will persist the final (x, y, z)
    // together. If the user releases on the exact start position, drag-end
    // still fires and the z bump gets saved alongside the zero-delta move.
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const dragOperation = event.operation;
      const transform = dragOperation?.transform;
      const pinId = String(dragOperation?.source?.id ?? "");
      if (!pinId || !transform) return;

      setPins((current) => {
        const idx = current.findIndex((p) => p.id === pinId);
        if (idx < 0) return current;
        const prev = current[idx].position;
        const nextLayout: CanvasPinLayout = {
          x: prev.x + transform.x,
          y: prev.y + transform.y,
          rotation: prev.rotation,
          z: prev.z, // already bumped by handleDragStart
        };
        queueSave(pinId, nextLayout);
        const next = current.slice();
        next[idx] = { ...current[idx], position: nextLayout };
        return next;
      });
    },
    [queueSave],
  );

  const handleUpload = useCallback(
    (file: File) => {
      setUploadError(null);
      startUpload(async () => {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("board_id", boardId);
        const result = await uploadImageAction(fd);
        if (!result.ok) {
          setUploadError(result.error);
          return;
        }
        const jitter = randomJitter();
        const newPin: LoadedPin = {
          id: result.pin.id,
          source: result.pin.source,
          image_path: result.pin.image_path,
          signed_url: result.pin.signed_url,
          source_url: null,
          position: { x: 32, y: 32, rotation: jitter, z: Date.now() },
        };
        setPins((current) => [...current, newPin]);
        // Persist the initial jitter rotation so refresh preserves it.
        queueSave(newPin.id, newPin.position);
      });
    },
    [boardId, queueSave],
  );

  void initialCanvasState; // Chunk A reads pins-keyed layouts via load-board; reserved for future scene state.

  return (
    <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={s.shell}>
        <TopBar labels={labels} />
        <div className={s.main}>
          <section className={s.stage}>
            <div className={s.frame}>
              <div className={s.board}>
                {pins.length === 0 && (
                  <div className={s.emptyHint}>
                    <div className={s.emptyHintBig}>{labels.title}</div>
                    <div className={s.emptyHintSmall}>{labels.emptyHint}</div>
                  </div>
                )}
                {pins.map((pin) => (
                  <PinnedImage key={pin.id} pin={pin} />
                ))}
              </div>
            </div>
          </section>
          <Drawer
            labels={labels}
            onUpload={handleUpload}
            uploadError={uploadError}
          />
        </div>
      </div>
    </DragDropProvider>
  );
}
