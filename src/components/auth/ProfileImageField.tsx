import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ImagePlus, X } from 'lucide-react';
import { validateProfileImageFile } from '@/lib/profileImageFile';

type ProfileImageFieldProps = {
    previewUrl: string | null;
    onPreviewChange: (url: string | null) => void;
    onFileChange: (file: File | null) => void;
    error?: string;
};

export function ProfileImageField({
    previewUrl,
    onPreviewChange,
    onFileChange,
    error,
}: ProfileImageFieldProps) {
    const { t } = useTranslation();
    const inputRef = useRef<HTMLInputElement>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (previewUrl?.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFile = (file: File | null) => {
        setLocalError(null);
        if (!file) {
            onFileChange(null);
            onPreviewChange(null);
            return;
        }
        const validationError = validateProfileImageFile(file);
        if (validationError) {
            setLocalError(validationError);
            onFileChange(null);
            onPreviewChange(null);
            if (inputRef.current) inputRef.current.value = '';
            return;
        }
        if (previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        onFileChange(file);
        onPreviewChange(URL.createObjectURL(file));
    };

    const clearImage = () => {
        handleFile(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const displayError = error ?? localError ?? undefined;

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {t('auth.profilePhoto')}{' '}
                <span className="text-slate-400 font-normal">({t('common.optional')})</span>
            </label>
            <div className="flex flex-wrap items-center gap-4">
                {previewUrl ? (
                    <div className="relative">
                        <img
                            src={previewUrl}
                            alt=""
                            className="h-20 w-20 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                        />
                        <button
                            type="button"
                            onClick={clearImage}
                            className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-700"
                            aria-label={t('auth.removeProfilePhoto')}
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="h-20 w-20 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400">
                        <ImagePlus className="h-8 w-8" aria-hidden />
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,.jpg,.jpeg,.png,.gif,.webp,.svg"
                        className="sr-only"
                        id="profile-photo"
                        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    />
                    <label
                        htmlFor="profile-photo"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ImagePlus className="h-4 w-4" aria-hidden />
                        {previewUrl ? t('auth.changeProfilePhoto') : t('auth.chooseProfilePhoto')}
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('auth.profilePhotoHint')}</p>
                </div>
            </div>
            {displayError ? <p className="text-xs text-red-500">{displayError}</p> : null}
        </div>
    );
}
