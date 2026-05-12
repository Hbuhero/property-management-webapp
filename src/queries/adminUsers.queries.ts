import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    deleteAdminUser,
    disableAdminUser,
    enableAdminUser,
    fetchAdminUserById,
    fetchAdminUsersPage,
    fetchAdminUserStats,
    suspendAdminUser,
    updateAdminUser,
} from '@/api/adminUsersApi';
import type { AdminUserListParams, AdminUserUpdateBody } from '@/schemas/adminUser.schema';

export const adminUserKeys = {
    all: ['admin-users'] as const,
    list: (params?: AdminUserListParams) => [...adminUserKeys.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...adminUserKeys.all, 'detail', id] as const,
    stats: () => [...adminUserKeys.all, 'stats'] as const,
};

export function useAdminUsers(params?: AdminUserListParams) {
    return useQuery({
        queryKey: adminUserKeys.list(params),
        queryFn: () => fetchAdminUsersPage(params),
    });
}

export function useAdminUserStats() {
    return useQuery({
        queryKey: adminUserKeys.stats(),
        queryFn: fetchAdminUserStats,
        staleTime: 30_000,
    });
}

export function useAdminUser(id: string | undefined) {
    const sid = id ?? '';
    return useQuery({
        queryKey: adminUserKeys.detail(sid),
        queryFn: () => fetchAdminUserById(sid),
        enabled: sid.length > 0,
    });
}

export function useUpdateAdminUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: number | string; body: AdminUserUpdateBody }) =>
            updateAdminUser(id, body),
        onSuccess: (_data, vars) => {
            void qc.invalidateQueries({ queryKey: adminUserKeys.all });
            void qc.invalidateQueries({ queryKey: adminUserKeys.detail(String(vars.id)) });
        },
    });
}

export function useEnableAdminUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => enableAdminUser(id),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: adminUserKeys.all });
        },
    });
}

export function useDisableAdminUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => disableAdminUser(id),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: adminUserKeys.all });
        },
    });
}

export function useSuspendAdminUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => suspendAdminUser(id),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: adminUserKeys.all });
        },
    });
}

export function useDeleteAdminUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => deleteAdminUser(id),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: adminUserKeys.all });
        },
    });
}
