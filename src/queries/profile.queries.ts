import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfile } from '@/api/profileApi';
import type { ProfileUpdateBody } from '@/schemas/profile.schema';

export const profileKeys = {
    all: ['profile'] as const,
    current: () => [...profileKeys.all, 'current'] as const,
};

export function useProfile() {
    return useQuery({
        queryKey: profileKeys.current(),
        queryFn: fetchProfile,
        staleTime: 30_000,
    });
}

export function useUpdateProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: number | string; body: ProfileUpdateBody }) =>
            updateProfile(id, body),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: profileKeys.all });
        },
    });
}
