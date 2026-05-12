import { getApiBaseUrl } from '@/lib/apiClient';
import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';
import { store } from '@/store';

function parseUploadPathBody(text: string): string {
    const t = text.trim();
    if (t.startsWith('"') && t.endsWith('"')) {
        try {
            return JSON.parse(t) as string;
        } catch {
            return t.slice(1, -1).replace(/\\"/g, '"');
        }
    }
    return t;
}

/** Multipart upload — returns stored web path (e.g. {@code /file/<uuid>.jpg}). */
export async function uploadListingImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);

    const token = store.getState().auth.token;
    const headers: HeadersInit = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const url = `${getApiBaseUrl()}${API_V1_PREFIX}/file/upload/multipart`;
    const res = await fetch(url, {
        method: 'POST',
        headers,
        body: fd,
    });

    const raw = await res.text();
    if (!res.ok) {
        throw new Error(raw || `Upload failed (${res.status})`);
    }
    return parseUploadPathBody(raw);
}
