import { resolvePropertyImageUrl } from '@/lib/propertyMediaUrl';

/** Resolve stored user image (URL, /file/ path, or data URL) for use in img src. */
export function resolveUserAvatarUrl(image: string | null | undefined): string | null {
    if (image == null || image.trim() === '') return null;
    const trimmed = image.trim();
    if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    return resolvePropertyImageUrl(trimmed);
}
