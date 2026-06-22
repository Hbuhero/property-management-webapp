const IMAGE_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
]);

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|svg)$/i;

export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export function isAcceptedProfileImage(file: File): boolean {
    if (IMAGE_MIME_TYPES.has(file.type)) return true;
    return IMAGE_EXTENSIONS.test(file.name);
}

export function validateProfileImageFile(file: File): string | null {
    if (!isAcceptedProfileImage(file)) {
        return 'Please choose a JPEG, PNG, GIF, WebP, or SVG image.';
    }
    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
        return 'Image must be 5 MB or smaller.';
    }
    return null;
}
