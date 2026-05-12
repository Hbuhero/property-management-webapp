import { joinApiUrl } from '@/lib/apiClient';

/** Resolve gallery / static paths from the API into browser URLs. */
export function resolvePropertyImageUrl(path: string | null | undefined): string | null {
    if (path == null || path.trim() === '') return null;
    const p = path.trim();
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    return joinApiUrl(p.startsWith('/') ? p : `/${p}`);
}
