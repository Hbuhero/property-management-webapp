import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'admin' | 'tenant' | 'landlord' | 'owner';

export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    avatar?: string;
    /** Raw roles from API (for future RBAC / guards). */
    backendRoles?: string[];
    /** Backend {@code UserStatus} name from login/profile, e.g. ACTIVE. */
    accountStatus?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (
            state,
            action: PayloadAction<{ user: User; token: string; refreshToken?: string | null }>,
        ) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken ?? null;
            state.isAuthenticated = true;
        },
        setRole: (state, action: PayloadAction<UserRole>) => {
            if (state.user) {
                state.user.role = action.payload;
            }
        },
        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
        },
    },
});

export const { setCredentials, setRole, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
