import { joinApiUrl } from '@/lib/apiClient';

/** Turn API `imageUrl` (often `/images/...`) into a browser-loadable absolute URL. */
export function resolveFloorPlanImageUrl(imageUrl: string | null): string | null {
    if (imageUrl == null || imageUrl === '') return null;
    return joinApiUrl(imageUrl);
}
