import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { UnitMapUnitDto, UnitOverlayPutBody } from '@/lib/contracts/preVisualMapContracts';
import { clientRectToPercentBox, OVERLAY_DRAG_MIN_PCT } from '@/components/visual-map/overlayPercentBox';

export type OverlayEditorProps = {
    imageSrc: string;
    units: UnitMapUnitDto[];
    selectedUnitId: number | null;
    onSelectUnit: (id: number | null) => void;
    onSaveOverlay: (unitId: number, box: UnitOverlayPutBody) => Promise<void>;
    isSaving: boolean;
    disabled?: boolean;
};

type DraftRect = { xPct: number; yPct: number; wPct: number; hPct: number };

type OverlayDrawingStackProps = {
    units: UnitMapUnitDto[];
    selectedUnitId: number;
    imgRef: RefObject<HTMLImageElement | null>;
    onSaveOverlay: (unitId: number, box: UnitOverlayPutBody) => Promise<void>;
    isSaving: boolean;
    canDraw: boolean;
};

/**
 * Overlays + drag surface. Remount when `selectedUnitId` changes (`key` on parent) to reset drag state.
 */
function OverlayDrawingStack({
    units,
    selectedUnitId,
    imgRef,
    onSaveOverlay,
    isSaving,
    canDraw,
}: OverlayDrawingStackProps) {
    const dragStartRef = useRef<{ clientX: number; clientY: number } | null>(null);
    const [draft, setDraft] = useState<DraftRect | null>(null);
    const [localErr, setLocalErr] = useState<string | null>(null);

    const clearDrag = useCallback(() => {
        dragStartRef.current = null;
        setDraft(null);
    }, []);

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!canDraw || e.button !== 0) return;
        setLocalErr(null);
        const img = imgRef.current;
        if (!img) return;
        dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const start = dragStartRef.current;
        const img = imgRef.current;
        if (!start || !img) return;
        const rect = img.getBoundingClientRect();
        const box = clientRectToPercentBox(rect, start, e, 0);
        if (box) setDraft(box);
    };

    const onPointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
        const start = dragStartRef.current;
        const img = imgRef.current;
        if (!start || !img) {
            clearDrag();
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
                /* already released */
            }
            return;
        }

        const rect = img.getBoundingClientRect();
        const box = clientRectToPercentBox(rect, start, e, OVERLAY_DRAG_MIN_PCT);
        dragStartRef.current = null;
        setDraft(null);

        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            /* noop */
        }

        if (!box) {
            const dragPx = Math.hypot(e.clientX - start.clientX, e.clientY - start.clientY);
            if (dragPx > 10) {
                setLocalErr(`Drag a box at least ${OVERLAY_DRAG_MIN_PCT}% wide and tall.`);
            }
            return;
        }

        try {
            await onSaveOverlay(selectedUnitId, box);
        } catch {
            /* parent toast */
        }
    };

    const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
        clearDrag();
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            /* noop */
        }
    };

    return (
        <div className="absolute inset-0">
            {localErr && (
                <p
                    className="absolute left-2 right-2 top-2 z-20 rounded-md bg-amber-50/95 px-2 py-1.5 text-sm text-amber-900 shadow-sm dark:bg-amber-950/90 dark:text-amber-100"
                    role="status"
                >
                    {localErr}
                </p>
            )}

            <div className="pointer-events-none absolute inset-0" aria-hidden>
                {units.map((u) => {
                    const isSel = u.unitId === selectedUnitId;
                    if (u.wPct <= 0 || u.hPct <= 0) return null;
                    return (
                        <div
                            key={u.unitId}
                            className={`absolute rounded-md border-2 border-dashed ${
                                isSel
                                    ? 'border-emerald-500/70 bg-emerald-400/10'
                                    : 'border-slate-400/50 bg-slate-900/10'
                            }`}
                            style={{
                                left: `${u.xPct}%`,
                                top: `${u.yPct}%`,
                                width: `${u.wPct}%`,
                                height: `${u.hPct}%`,
                            }}
                        />
                    );
                })}
            </div>

            {draft && (
                <div
                    className="pointer-events-none absolute rounded-md border-2 border-emerald-500 bg-emerald-400/20"
                    style={{
                        left: `${draft.xPct}%`,
                        top: `${draft.yPct}%`,
                        width: `${draft.wPct}%`,
                        height: `${draft.hPct}%`,
                    }}
                />
            )}

            <div
                role="application"
                aria-label="Overlay drawing surface"
                className={`absolute inset-0 touch-none ${
                    canDraw ? 'cursor-crosshair' : 'cursor-not-allowed bg-slate-950/0'
                }`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
                style={{ pointerEvents: canDraw ? 'auto' : 'none' }}
            />

            {isSaving && (
                <div
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/50 text-sm font-medium text-slate-800 dark:bg-slate-950/50 dark:text-slate-100"
                    aria-live="polite"
                >
                    Saving…
                </div>
            )}
        </div>
    );
}

/**
 * Drag on the floor plan to set the selected unit’s overlay (percent of image).
 */
export function OverlayEditor({
    imageSrc,
    units,
    selectedUnitId,
    onSelectUnit,
    onSaveOverlay,
    isSaving,
    disabled = false,
}: OverlayEditorProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const canDraw = Boolean(selectedUnitId) && !disabled && !isSaving;

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Unit for overlay
                    <select
                        className="ml-2 mt-1 block w-full min-w-[12rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 sm:mt-0 sm:inline-block sm:w-auto"
                        value={selectedUnitId ?? ''}
                        onChange={(ev) => {
                            const v = ev.target.value;
                            onSelectUnit(v === '' ? null : Number(v));
                        }}
                        disabled={disabled || units.length === 0}
                    >
                        <option value="">Select a unit…</option>
                        {units.map((u) => (
                            <option key={u.unitId} value={u.unitId}>
                                Unit {u.unitNumber} ({u.status})
                            </option>
                        ))}
                    </select>
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    {canDraw
                        ? 'Drag on the image to draw a rectangle — it saves when you release.'
                        : 'Pick a unit to edit overlays.'}
                </p>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900">
                <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Floor plan for overlay editing"
                    className="pointer-events-none block h-auto w-full select-none"
                    draggable={false}
                />

                {selectedUnitId != null ? (
                    <OverlayDrawingStack
                        key={selectedUnitId}
                        units={units}
                        selectedUnitId={selectedUnitId}
                        imgRef={imgRef}
                        onSaveOverlay={onSaveOverlay}
                        isSaving={isSaving}
                        canDraw={canDraw}
                    />
                ) : (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/15 text-sm font-medium text-slate-800 dark:text-slate-100">
                        Select a unit to draw overlays
                    </div>
                )}
            </div>
        </div>
    );
}
