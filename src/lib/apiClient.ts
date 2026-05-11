import { API_V1_PREFIX } from '@/lib/contracts/preVisualMapContracts';
import { credentialsFromLoginResponse } from '@/lib/loginCredentialsFromResponse';
import { store } from '@/store';
import { logout, setCredentials } from '@/store/slices/authSlice';

const DEFAULT_DEV_BASE = 'http://localhost:8080';

/**
 * API origin without trailing slash. Set `VITE_API_BASE_URL` in `.env` / environment.
 */
export function getApiBaseUrl(): string {
    const raw = import.meta.env.VITE_API_BASE_URL;
    const base =
        typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : DEFAULT_DEV_BASE;
    return base.replace(/\/$/, '');
}

function joinUrl(path: string): string {
    const base = getApiBaseUrl();
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
}

export type ApiJsonOptions = RequestInit & {
    /** Skip attaching Bearer token (e.g. login). */
    skipAuth?: boolean;
};

/** Single in-flight refresh so parallel 401s share one token rotation. */
let refreshSessionPromise: Promise<boolean> | null = null;

function isRefreshTokenPath(path: string): boolean {
    return path.includes('/auth/refresh-token');
}

function tryRefreshSessionOnce(): Promise<boolean> {
    if (refreshSessionPromise) {
        return refreshSessionPromise;
    }

    refreshSessionPromise = (async (): Promise<boolean> => {
        const { refreshToken } = store.getState().auth;
        if (!refreshToken) {
            return false;
        }

        const url = joinUrl(`${API_V1_PREFIX}/auth/refresh-token`);
        let response: Response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });
        } catch {
            return false;
        }

        if (!response.ok) {
            return false;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            return false;
        }

        let raw: unknown;
        try {
            raw = await response.json();
        } catch {
            return false;
        }

        const creds = credentialsFromLoginResponse(raw);
        if (!creds) {
            return false;
        }

        store.dispatch(
            setCredentials({
                user: creds.user,
                token: creds.token,
                refreshToken: creds.refreshToken,
            }),
        );
        return true;
    })().finally(() => {
        refreshSessionPromise = null;
    });

    return refreshSessionPromise;
}

/**
 * JSON `fetch` wrapper: attaches Bearer token from the store.
 * On **401** for authenticated calls: tries `POST /auth/refresh-token` once, retries the request, then `logout` if refresh fails.
 * Public calls (`skipAuth: true`) never trigger refresh or logout on 401.
 */
export async function apiJson<T>(path: string, options: ApiJsonOptions = {}): Promise<T> {
    return doApiJson<T>(path, options, false);
}

async function doApiJson<T>(path: string, options: ApiJsonOptions, isRetry: boolean): Promise<T> {
    const { skipAuth, headers: initHeaders, ...rest } = options;
    const headers = new Headers(initHeaders);

    const token = store.getState().auth.token;
    if (token && !skipAuth) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    if (
        rest.body != null &&
        typeof rest.body === 'string' &&
        !headers.has('Content-Type')
    ) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(joinUrl(path), {
        ...rest,
        headers,
    });

    if (response.status === 401) {
        if (
            !skipAuth &&
            !isRetry &&
            !isRefreshTokenPath(path) &&
            store.getState().auth.refreshToken
        ) {
            const refreshed = await tryRefreshSessionOnce();
            if (refreshed) {
                return doApiJson<T>(path, options, true);
            }
        }
        if (!skipAuth) {
            store.dispatch(logout());
        }
    }

    if (!response.ok) {
        let detail = response.statusText;
        try {
            const errBody: unknown = await response.json();
            if (
                errBody &&
                typeof errBody === 'object' &&
                'message' in errBody &&
                typeof (errBody as { message: unknown }).message === 'string'
            ) {
                detail = (errBody as { message: string }).message;
            }
        } catch {
            try {
                detail = await response.text();
            } catch {
                /* keep statusText */
            }
        }
        throw new Error(detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}
