import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ProfileImageField } from '@/components/auth/ProfileImageField';
import { uploadPublicImage } from '@/api/fileUploadApi';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppStore';
import { primaryBackendRole, profilePathForRole } from '@/lib/profilePaths';
import { resolveUserAvatarUrl } from '@/lib/userAvatarUrl';
import { showError, showSuccess } from '@/lib/toast';
import { useProfile, useUpdateProfile } from '@/queries/profile.queries';
import { updateUser } from '@/store/slices/authSlice';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

const inputClass =
    'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-200';

export default function EditProfilePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const authUser = useAppSelector((s) => s.auth.user);
    const { data: profile, isLoading, isError } = useProfile();
    const updateMut = useUpdateProfile();

    const [name, setName] = useState<string | null>(null);
    const [phone, setPhone] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [imagePath, setImagePath] = useState<string | undefined>(undefined);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!profile || initialized) return;
        setName(profile.name);
        setPhone(profile.phoneNumber ?? '');
        setImagePath(profile.image ?? undefined);
        const resolved = resolveUserAvatarUrl(profile.image);
        if (resolved) setPreviewUrl(resolved);
        setInitialized(true);
    }, [profile, initialized]);

    const profilePath = authUser ? profilePathForRole(authUser.role) : '/';

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!authUser || !profile) return;

        const trimmedName = (name ?? profile.name).trim();
        const trimmedPhone = (phone ?? profile.phoneNumber ?? '').trim();

        if (trimmedPhone.length < 10) {
            showError(t('profile.phoneInvalid'));
            return;
        }

        try {
            let nextImage = imagePath;
            if (profileFile) {
                nextImage = await uploadPublicImage(profileFile);
            }

            const updated = await updateMut.mutateAsync({
                id: authUser.id,
                body: {
                    name: trimmedName,
                    email: profile.email,
                    phoneNumber: trimmedPhone,
                    role: primaryBackendRole(profile.roles),
                    image: nextImage,
                },
            });

            dispatch(
                updateUser({
                    name: updated.name,
                    email: updated.email,
                    avatar: updated.image ?? nextImage,
                    backendRoles: updated.roles,
                    accountStatus: updated.status,
                }),
            );

            showSuccess(t('profile.saveSuccess'));
            navigate(profilePath);
        } catch (err) {
            showError(err instanceof Error ? err.message : t('profile.saveError'));
        }
    };

    if (isLoading || !initialized) {
        return (
            <div className="max-w-xl mx-auto space-y-4">
                <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
                <div className="h-80 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
            </div>
        );
    }

    if (isError || !profile) {
        return (
            <div className="max-w-xl mx-auto rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
                {t('profile.loadError')}
            </div>
        );
    }

    return (
        <motion.div className="max-w-xl mx-auto" {...fadeUp}>
            <Link
                to={profilePath}
                className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                {t('profile.backToProfile')}
            </Link>

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('profile.editTitle')}</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('profile.editSubtitle')}</p>
            </div>

            <form
                onSubmit={(e) => void handleSubmit(e)}
                className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
                <ProfileImageField
                    previewUrl={previewUrl}
                    onPreviewChange={setPreviewUrl}
                    onFileChange={(file) => {
                        setProfileFile(file);
                        if (!file) setImagePath(undefined);
                    }}
                />

                <label className={labelClass}>
                    {t('auth.fullName')}
                    <input
                        className={inputClass}
                        value={name ?? ''}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </label>

                <label className={labelClass}>
                    {t('common.email')}
                    <input
                        className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400`}
                        type="email"
                        value={profile.email}
                        readOnly
                        aria-readonly="true"
                    />
                    <span className="mt-1 block text-xs text-slate-400">{t('profile.emailReadOnly')}</span>
                </label>

                <label className={labelClass}>
                    {t('auth.phone')}
                    <input
                        className={inputClass}
                        type="tel"
                        value={phone ?? ''}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        minLength={10}
                        maxLength={15}
                    />
                </label>

                <p className="text-xs text-slate-400">{t('profile.roleReadOnly')}</p>

                <div className="flex flex-wrap gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={updateMut.isPending}
                        className="flex-1 min-w-[10rem] rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {updateMut.isPending ? t('profile.saving') : t('common.save')}
                    </button>
                    <Link
                        to={profilePath}
                        className="inline-flex min-w-[10rem] flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        {t('common.cancel')}
                    </Link>
                </div>
            </form>
        </motion.div>
    );
}
