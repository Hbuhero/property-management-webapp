import { joinApiUrl } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';

/** Resolve gallery / static paths from the API into browser URLs. */
export function resolvePropertyImageUrl(path: string | null | undefined): string | null {
    if (path == null || path.trim() === '') return null;
    const p = path.trim();
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    // Generic uploads: DB stores "/file/<storedFileName>" → GET /api/v1/file/file/<storedFileName>
    const m = /^\/file\/(.+)$/.exec(p);
    if (m) {
        const filename = encodeURIComponent(m[1]);
        return joinApiUrl(`${API_V1_PREFIX}/file/file/${filename}`);
    }
    return joinApiUrl(p.startsWith('/') ? p : `/${p}`);
}

/** First usable image URL for a floor row (plan image, then gallery). */
export function resolveFloorThumbnailUrl(
    floorPlanImagePath: string | null | undefined,
    galleryImages?: { imagePath: string }[] | null,
): string | null {
    if (floorPlanImagePath) {
        const u = resolvePropertyImageUrl(floorPlanImagePath);
        if (u) return u;
    }
    for (const g of galleryImages ?? []) {
        const u = resolvePropertyImageUrl(g.imagePath);
        if (u) return u;
    }
    return null;
}
