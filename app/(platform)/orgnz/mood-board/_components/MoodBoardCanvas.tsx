"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/react";
import { PinnedImage } from "./PinnedImage";
import { SwatchPin } from "./SwatchPin";
import { TypographyPin } from "./TypographyPin";
import { TopBar } from "./TopBar";
import { Drawer } from "./Drawer";
import { uploadImageAction } from "../_actions/upload-image";
import { saveCanvasStateAction } from "../_actions/save-canvas-state";
import { dropChipPinAction } from "../_actions/drop-chip-pin";
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
  const [, startSave] = useTransition();
  const [, startUpload] = useTransition();
  const [, startChipDrop] = useTransition();

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

  // Compute canvas background. Fabric overrides corkboard when set.
  const fabricBg = fabricBackground(fabric);
  const boardStyle = fabricBg
    ? { background: fabricBg }
    : undefined;

  return (
    <DragDropProvider onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className={s.shell}>
        <TopBar labels={labels} />
        <div className={s.main}>
          <section className={s.stage}>
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
                  // Chip-source pins (or 'url'-fallback pins with a chip: tag)
                  // render as Swatch or Typography pins rather than images.
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
                        />
                      );
                    }
                    // Unknown chip key — fall through to image render below.
                  }
                  return <PinnedImage key={pin.id} pin={pin} />;
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
