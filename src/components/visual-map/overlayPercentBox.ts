import type { UnitOverlayPutBody } from '@/lib/contracts/preVisualMapContracts';

function clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

/** Minimum width/height in % so tiny drags are ignored. */
export const OVERLAY_DRAG_MIN_PCT = 1.25;

/**
 * Converts a drag from client coordinates into overlay percentages relative to the
 * rendered image rectangle (matches CSS % positioning on the map).
 */
export function clientRectToPercentBox(
    imgRect: DOMRect,
    startClient: { clientX: number; clientY: number },
    endClient: { clientX: number; clientY: number },
    minPct = OVERLAY_DRAG_MIN_PCT,
): UnitOverlayPutBody | null {
    const x0 = ((startClient.clientX - imgRect.left) / imgRect.width) * 100;
    const y0 = ((startClient.clientY - imgRect.top) / imgRect.height) * 100;
    const x1 = ((endClient.clientX - imgRect.left) / imgRect.width) * 100;
    const y1 = ((endClient.clientY - imgRect.top) / imgRect.height) * 100;

    const left = clamp(Math.min(x0, x1), 0, 100);
    const top = clamp(Math.min(y0, y1), 0, 100);
    const right = clamp(Math.max(x0, x1), 0, 100);
    const bottom = clamp(Math.max(y0, y1), 0, 100);

    const w = right - left;
    const h = bottom - top;

    if (w <= 0 || h <= 0) return null;
    if (w < minPct || h < minPct) return null;

    return {
        xPct: round2(left),
        yPct: round2(top),
        wPct: round2(w),
        hPct: round2(h),
    };
}
