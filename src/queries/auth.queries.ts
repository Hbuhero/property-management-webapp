import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/useAppStore';
import { homePathForRole } from '@/lib/authRole';
import { apiJson } from '@/lib/apiClient';
import {
    API_V1_PREFIX,
    SignupResponseSchema,
} from '@/lib/contracts/preVisualMapContracts';
import { credentialsFromLoginResponse } from '@/lib/loginCredentialsFromResponse';
import { setCredentials } from '@/store/slices/authSlice';

interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
    /** Backend {@code Role} enum name (USER, TENANT, LAND_LORD). */
    role: string;
    image?: string;
}

async function loginRequest(payload: LoginPayload) {
    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/auth/login`, {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email: payload.email, password: payload.password }),
    });

    const creds = credentialsFromLoginResponse(raw);
    if (!creds) {
        throw new Error('Unexpected login response from server');
    }
    return creds;
}

async function registerRequest(payload: RegisterPayload) {
    const body: Record<string, string> = {
        name: payload.name,
        email: payload.email,
        phoneNumber: payload.phoneNumber.trim(),
        password: payload.password,
        role: payload.role,
    };
    if (payload.image?.trim()) {
        body.image = payload.image.trim();
    }

    const raw = await apiJson<unknown>(`${API_V1_PREFIX}/auth/register`, {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify(body),
    });

    const parsed = SignupResponseSchema.safeParse(raw);
    if (!parsed.success) {
        throw new Error('Unexpected signup response from server');
    }
    return parsed.data;
}

async function resendVerificationRequest(email: string) {
    return apiJson<{ message: string }>(`${API_V1_PREFIX}/auth/resend-verification-email`, {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email: email.trim() }),
    });
}

async function activateAccountRequest(token: string) {
    return apiJson<unknown>(`${API_V1_PREFIX}/auth/activate-account?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        skipAuth: true,
    });
}

/** Mutation hook that logs in and dispatches credentials to Redux */
export function useLoginMutation() {
    const dispatch = useAppDispatch();

    return useMutation({
        mutationFn: loginRequest,
        onSuccess: (data) => {
            dispatch(
                setCredentials({
                    user: data.user,
                    token: data.token,
                    refreshToken: data.refreshToken,
                }),
            );
        },
    });
}

/** Self-service signup; on success navigate to check-email (caller can override via mutate options). */
export function useRegisterMutation() {
    const navigate = useNavigate();

    return useMutation({
        mutationFn: registerRequest,
        onSuccess: (_data, variables) => {
            navigate(`/check-email?email=${encodeURIComponent(variables.email)}`);
        },
    });
}

export function useResendVerificationMutation() {
    return useMutation({
        mutationFn: resendVerificationRequest,
    });
}

/** Completes email verification, stores session, redirects to role home. */
export function useActivateAccountMutation() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: activateAccountRequest,
        onSuccess: (raw) => {
            const creds = credentialsFromLoginResponse(raw);
            if (!creds) {
                throw new Error('Unexpected activation response from server');
            }
            dispatch(
                setCredentials({
                    user: creds.user,
                    token: creds.token,
                    refreshToken: creds.refreshToken,
                }),
            );
            navigate(homePathForRole(creds.user.role));
        },
    });
}
