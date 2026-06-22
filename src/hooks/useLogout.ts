import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/hooks/useAppStore';
import { logout } from '@/store/slices/authSlice';
import { showSuccess } from '@/lib/toast';

export function useLogout() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();

    return useCallback(() => {
        dispatch(logout());
        showSuccess(t('auth.logoutSuccess'));
        navigate('/login');
    }, [dispatch, navigate, t]);
}
