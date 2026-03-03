import { useMutation } from '@tanstack/react-query';
import { useAppDispatch } from '@/hooks/useAppStore';
import { setCredentials } from '@/store/slices/authSlice';
import type { User } from '@/store/slices/authSlice';

interface LoginPayload {
    email: string;
    password: string;
}

interface LoginResponse {
    user: User;
    token: string;
}

// Placeholder — replace with a real HTTP call when the backend is ready
async function loginRequest(payload: LoginPayload): Promise<LoginResponse> {
    // TODO: replace with e.g. axios.post('/api/auth/login', payload)
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));

    // Demo credentials check (remove once real API is wired)
    const DEMO_USERS: Record<string, { name: string; role: User['role'] }> = {
        'admin@demo.com': { name: 'Admin User', role: 'admin' },
        'tenant@demo.com': { name: 'Tenant User', role: 'tenant' },
        'owner@demo.com': { name: 'Owner User', role: 'owner' },
        'landlord@demo.com': { name: 'Landlord User', role: 'landlord' },
    };

    const demo = DEMO_USERS[payload.email.toLowerCase()];
    if (!demo || payload.password !== 'password') {
        throw new Error('Invalid credentials');
    }

    return {
        user: { id: crypto.randomUUID(), email: payload.email, name: demo.name, role: demo.role },
        token: `demo-token-${Date.now()}`,
    };
}

/** Mutation hook that logs in and dispatches credentials to Redux */
export function useLoginMutation() {
    const dispatch = useAppDispatch();

    return useMutation({
        mutationFn: loginRequest,
        onSuccess: (data) => {
            dispatch(setCredentials(data));
        },
    });
}
