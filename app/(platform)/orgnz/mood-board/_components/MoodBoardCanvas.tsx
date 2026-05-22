"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/react";
import { PinnedImage } from "./PinnedImage";
import { SwatchPin } from "./SwatchPin";
import { TypographyPin } from "./TypographyPin";
import { TopBar } from "./TopBar";
import { Drawer } from "./Drawer";
import { UndoToast } from "./UndoToast";
import { RecentlyRemovedDrawer } from "./RecentlyRemovedDrawer";
import { uploadImageAction } from "../_actions/upload-image";
import { saveCanvasStateAction } from "../_actions/save-canvas-state";
import { dropChipPinAction } from "../_actions/drop-chip-pin";
import { deletePinAction } from "../_actions/delete-pin";
import { restorePinAction } from "../_actions/restore-pin";
import type { RecentlyDeletedPin } from "../_actions/list-recently-deleted-pins";
import type {
  CanvasPinLayout,
  CanvasState,
  FabricSelection,
  LoadedPin,
} from "../_lib/load-board";
import type {
  ChipPalette,
  PaletteChip,
  MaterialChip,
  MoodChip,
  FloralsChip,
  TypographyChip,
  AnyChip,
} from "@/data/moodboard/types";
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
  // Chunk B additions
  moodHeading: string;
  materialHeading: string;
  floralsHeading: string;
  typographyHeading: string;
  // Lock 22 additions (edit mode + forgiveness)
  editDone: string;
  straightenAll: string;
  recentlyRemoved: string;
  recentlyRemovedTitle: string;
  recentlyRemovedEmpty: string;
  recentlyRemovedWindow: string;
  recentlyRemovedLoading: string;
  pinDelete: string;
  pinRestore: string;
  pinRemovedToast: string;
  undo: string;
  close: string;
};

type Props = {
  boardId: string;
  initialPins: LoadedPin[];
  initialCanvasState: CanvasState;
  palette: ChipPalette;
  /** Personalization for typography pins. */
  specimen: { display: string; body: string };
  labels: CanvasLabels;
};

const JITTER_DEGREES = 3;
const randomJitter = (): number =>
  Math.round((Math.random() * JITTER_DEGREES * 2 - JITTER_DEGREES) * 10) / 10;

const FABRIC_BACKGROUNDS: Record<string, (color: string) => string> = {
  linen: (c) =>
    `repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 4px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 5px), ${c}`,
  silk: (c) =>
    `linear-gradient(135deg, ${c} 0%, rgba(255,255,255,0.12) 50%, ${c} 100%)`,
  velvet: (c) =>
    `radial-gradient(circle at 50% 30%, rgba(255,255,255,0.06), transparent 60%), ${c}`,
  satin: (c) =>
    `linear-gradient(180deg, rgba(255,255,255,0.10), transparent 40%, transparent 60%, rgba(0,0,0,0.10)), ${c}`,
  cotton: (c) => c,
  organza: (c) => `linear-gradient(135deg, rgba(255,255,255,0.20), transparent 60%), ${c}`,
  tulle: (c) => `radial-gradient(circle, rgba(255,255,255,0.10), transparent 50%), ${c}`,
  lace: (c) =>
    `repeating-radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 0 2px, transparent 2px 8px), ${c}`,
};

function fabricBackground(fabric: FabricSelection | null | undefined): string | null {
  if (!fabric) return null;
  const builder = FABRIC_BACKGROUNDS[fabric.fabricType] ?? ((c: string) => c);
  return builder(fabric.primaryColor);
}

export function MoodBoardCanvas({
  boardId,
  initialPins,
  initialCanvasState,
  palette,
  specimen,
  labels,
}: Props) {
  const [pins, setPins] = useState<LoadedPin[]>(initialPins);
  const [fabric, setFabric] = useState<FabricSelection | null>(
    initialCanvasState.fabric ?? null,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [recentlyRemovedOpen, setRecentlyRemovedOpen] = useState(false);
  const [pendingUndo, setPendingUndo] = useState<{
    pin: LoadedPin;
    timestamp: number;
  } | null>(null);
  const [, startSave] = useTransition();
  const [, startUpload] = useTransition();
  const [, startChipDrop] = useTransition();
  const [, startDelete] = useTransition();
  const [, startRestore] = useTransition();

  // Chip key → chip object lookup for rendering pin overlays.
  const chipsByKey = useMemo(() => {
    const map = new Map<string, AnyChip>();
    for (const c of palette.palette) map.set(c.key, c);
    for (const c of palette.material) map.set(c.key, c);
    for (const c of palette.mood) map.set(c.key, c);
    for (const c of palette.florals) map.set(c.key, c);
    for (const c of palette.typography) map.set(c.key, c);
    return map;
  }, [palette]);

  // Debounced save batch.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingLayouts = useRef<Record<string, CanvasPinLayout>>({});
  const flushSave = useCallback(() => {
    const payload = pendingLayouts.current;
    pendingLayouts.current = {};
    if (Object.keys(payload).length === 0) return;
    startSave(async () => {
      const result = await saveCanvasStateAction({ boardId, pins: payload });
      if (!result.ok) {
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
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const op = event.operation;
      const transform = op?.transform;
      const pinId = String(op?.source?.id ?? "");
      if (!pinId || !transform) return;
      setPins((current) => {
        const idx = current.findIndex((p) => p.id === pinId);
        if (idx < 0) return current;
        const prev = current[idx].position;
        const nextLayout: CanvasPinLayout = {
          x: prev.x + transform.x,
          y: prev.y + transform.y,
          rotation: prev.rotation,
          z: prev.z,
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
    (file: File, slotTag: string | null) => {
      setUploadError(null);
      startUpload(async () => {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("board_id", boardId);
        if (slotTag) fd.set("slot_tag", slotTag);
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
          tags: slotTag ? [slotTag] : [],
          position: { x: 32, y: 32, rotation: jitter, z: Date.now() },
        };
        setPins((current) => [...current, newPin]);
        queueSave(newPin.id, newPin.position);
      });
    },
    [boardId, queueSave],
  );

  const handlePaletteChipClick = useCallback(
    (chip: PaletteChip) => {
      const newFabric: FabricSelection = {
        chipKey: chip.key,
        primaryColor: chip.primaryColor,
        fabricType: chip.fabricType,
      };
      setFabric(newFabric);
      startSave(async () => {
        await saveCanvasStateAction({ boardId, fabric: newFabric });
      });
    },
    [boardId],
  );

  const handleChipClick = useCallback(
    (chip: MaterialChip | MoodChip | FloralsChip | TypographyChip) => {
      startChipDrop(async () => {
        const result = await dropChipPinAction({
          boardId,
          chipKey: chip.key,
        });
        if (!result.ok) {
          setUploadError(result.error);
          return;
        }
        const jitter = randomJitter();
        const newPin: LoadedPin = {
          id: result.pin.id,
          source: result.pin.source,
          image_path: `chip://${result.pin.chipKey}`,
          signed_url: null,
          source_url: null,
          tags: [`chip:${result.pin.chipKey}`],
          position: { x: 48, y: 48, rotation: jitter, z: Date.now() },
        };
        setPins((current) => [...current, newPin]);
        queueSave(newPin.id, newPin.position);
      });
    },
    [boardId, queueSave],
  );

  const handleDeletePin = useCallback(
    (pinId: string) => {
      const snapshot = pins.find((p) => p.id === pinId);
      if (!snapshot) return;
      // Optimistic remove. If the server call fails we re-add.
      setPins((current) => current.filter((p) => p.id !== pinId));
      setPendingUndo({ pin: snapshot, timestamp: Date.now() });
      startDelete(async () => {
        const result = await deletePinAction({ pinId, boardId });
        if (!result.ok) {
          setPins((current) =>
            current.some((p) => p.id === pinId) ? current : [...current, snapshot],
          );
          setPendingUndo((cur) => (cur?.pin.id === pinId ? null : cur));
        }
      });
    },
    [pins, boardId],
  );

  const handleUndoLastDelete = useCallback(() => {
    if (!pendingUndo) return;
    const snapshot = pendingUndo.pin;
    setPendingUndo(null);
    setPins((current) =>
      current.some((p) => p.id === snapshot.id) ? current : [...current, snapshot],
    );
    startRestore(async () => {
      const result = await restorePinAction({
        pinId: snapshot.id,
        boardId,
      });
      if (!result.ok) {
        setPins((current) => current.filter((p) => p.id !== snapshot.id));
      }
    });
  }, [pendingUndo, boardId]);

  const handleRestoreFromDrawer = useCallback(
    async (deleted: RecentlyDeletedPin) => {
      const result = await restorePinAction({
        pinId: deleted.id,
        boardId,
      });
      if (!result.ok) return;
      // Reconstruct a LoadedPin shape and add it back to the canvas.
      const restoredPin: LoadedPin = {
        id: deleted.id,
        source: deleted.source,
        image_path: deleted.image_path,
        signed_url: deleted.signed_url,
        source_url: null,
        tags: deleted.tags,
        position: { x: 64, y: 64, rotation: randomJitter(), z: Date.now() },
      };
      setPins((current) =>
        current.some((p) => p.id === restoredPin.id) ? current : [...current, restoredPin],
      );
      queueSave(restoredPin.id, restoredPin.position);
    },
    [boardId, queueSave],
  );

  const handleStraightenAll = useCallback(() => {
    setPins((current) => {
      const next = current.map((pin) => {
        const newRotation =
          Math.round((Math.random() * 4 - 2) * 10) / 10; // ±2° tighter than initial jitter
        queueSave(pin.id, { ...pin.position, rotation: newRotation });
        return {
          ...pin,
          position: { ...pin.position, rotation: newRotation },
        };
      });
      return next;
    });
  }, [queueSave]);

  const resolveChipPreview = useCallback(
    (chipKey: string): { kind: "swatch"; hex: string; label: string } | { kind: "typography"; label: string } | null => {
      const chip = chipsByKey.get(chipKey);
      if (!chip) return null;
      if (chip.group === "typography") return { kind: "typography", label: chip.labelEn };
      if ("swatchHex" in chip) {
        return { kind: "swatch", hex: (chip as { swatchHex: string }).swatchHex, label: chip.labelEn };
      }
      return null;
    },
    [chipsByKey],
  );

  // Compute canvas background. Fabric overrides corkboard when set.
  const fabricBg = fabricBackground(fabric);
  const boardStyle = fabricBg
    ? { background: fabricBg }
    : undefined;

  return (
    <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={s.shell} data-edit-mode={editMode ? "true" : undefined}>
        <TopBar
          labels={labels}
          editMode={editMode}
          onToggleEdit={() => setEditMode((v) => !v)}
        />
        <div className={s.main}>
          <section className={s.stage}>
            {editMode && (
              <div className={s.editStrip}>
                <button
                  type="button"
                  className={s.editStripBtn}
                  onClick={handleStraightenAll}
                >
                  {labels.straightenAll}
                </button>
                <button
                  type="button"
                  className={s.editStripBtn}
                  onClick={() => setRecentlyRemovedOpen(true)}
                >
                  {labels.recentlyRemoved}
                </button>
              </div>
            )}
            <div className={s.frame}>
              <div
                className={`${s.board} ${fabric ? s.boardFabric : ""}`}
                style={boardStyle}
              >
                {pins.length === 0 && (
                  <div className={s.emptyHint}>
                    <div className={s.emptyHintBig}>{labels.title}</div>
                    <div className={s.emptyHintSmall}>{labels.emptyHint}</div>
                  </div>
                )}
                {pins.map((pin) => {
                  const chipKey = chipKeyFromPin(pin);
                  if (chipKey) {
                    const chip = chipsByKey.get(chipKey);
                    if (chip && chip.group === "typography") {
                      return (
                        <TypographyPin
                          key={pin.id}
                          pin={{
                            pinId: pin.id,
                            chip: chip as TypographyChip,
                            specimen,
                            position: pin.position,
                          }}
                          editMode={editMode}
                          onDelete={handleDeletePin}
                          deleteLabel={labels.pinDelete}
                        />
                      );
                    }
                    if (chip && "swatchHex" in chip) {
                      return (
                        <SwatchPin
                          key={pin.id}
                          pin={{
                            pinId: pin.id,
                            chipKey,
                            labelEn: chip.labelEn,
                            swatchHex: (chip as { swatchHex: string }).swatchHex,
                            position: pin.position,
                          }}
                          editMode={editMode}
                          onDelete={handleDeletePin}
                          deleteLabel={labels.pinDelete}
                        />
                      );
                    }
                  }
                  return (
                    <PinnedImage
                      key={pin.id}
                      pin={pin}
                      editMode={editMode}
                      onDelete={handleDeletePin}
                      deleteLabel={labels.pinDelete}
                    />
                  );
                })}
              </div>
            </div>
          </section>
          <Drawer
            labels={labels}
            palette={palette}
            activeFabricKey={fabric?.chipKey ?? null}
            onUpload={handleUpload}
            onPaletteChipClick={handlePaletteChipClick}
            onChipClick={handleChipClick}
            uploadError={uploadError}
          />
        </div>
        {pendingUndo && (
          <UndoToast
            message={labels.pinRemovedToast}
            undoLabel={labels.undo}
            onUndo={handleUndoLastDelete}
            onDismiss={() => setPendingUndo(null)}
          />
        )}
        {recentlyRemovedOpen && (
          <RecentlyRemovedDrawer
            boardId={boardId}
            labels={{
              title: labels.recentlyRemovedTitle,
              empty: labels.recentlyRemovedEmpty,
              restore: labels.pinRestore,
              close: labels.close,
              loading: labels.recentlyRemovedLoading,
              windowNote: labels.recentlyRemovedWindow,
            }}
            resolveChipPreview={resolveChipPreview}
            onRestore={handleRestoreFromDrawer}
            onClose={() => setRecentlyRemovedOpen(false)}
          />
        )}
      </div>
    </DragDropProvider>
  );
}

/**
 * Resolve a chip key from a pin row. Two sources:
 *   1. source = 'chip' (post-migration-039): chip key encoded in image_path as `chip://<key>`.
 *   2. source = 'url' fallback (pre-migration-039): chip key in tags as `chip:<key>`.
 */
function chipKeyFromPin(pin: LoadedPin): string | null {
  if (pin.image_path?.startsWith("chip://")) {
    return pin.image_path.slice("chip://".length);
  }
  const tagged = pin.tags?.find((t) => t.startsWith("chip:"));
  if (tagged) return tagged.slice("chip:".length);
  return null;
}
