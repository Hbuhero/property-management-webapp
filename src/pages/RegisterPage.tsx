import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Building2, Eye, EyeOff, Lock, Mail, Phone, User, Users } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useRegisterMutation } from '@/queries/auth.queries';
import { uploadPublicImage } from '@/api/fileUploadApi';
import { ProfileImageField } from '@/components/auth/ProfileImageField';
import { FormSelect } from '@/components/ui/form-select';
import { showError } from '@/lib/toast';
import { homePathForRole } from '@/lib/authRole';
import { registerSchema, type RegisterFormData, type SelfRegistrationRole } from '@/schemas/auth.schema';
import type { RootState } from '@/store';

export default function RegisterPage() {
    const { t } = useTranslation();
    const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
    const registerMutation = useRegisterMutation();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [form, setForm] = useState<RegisterFormData>({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: 'TENANT',
        image: '',
    });
    const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
    const [profileFile, setProfileFile] = useState<File | null>(null);
    const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null);

    const setField = (key: keyof RegisterFormData, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const setRole = (role: SelfRegistrationRole) => {
        setForm((prev) => ({ ...prev, role }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = registerSchema.safeParse(form);
        if (!result.success) {
            const fe = result.error.flatten().fieldErrors;
            setErrors({
                name: fe.name?.[0],
                email: fe.email?.[0],
                phoneNumber: fe.phoneNumber?.[0],
                password: fe.password?.[0],
                confirmPassword: fe.confirmPassword?.[0],
                role: fe.role?.[0],
                image: fe.image?.[0],
            });
            return;
        }
        setErrors({});
        try {
            let imagePath: string | undefined;
            if (profileFile) {
                imagePath = await uploadPublicImage(profileFile);
            }

            await registerMutation.mutateAsync({
                name: result.data.name,
                email: result.data.email,
                phoneNumber: result.data.phoneNumber.trim(),
                password: result.data.password,
                role: result.data.role,
                image: imagePath,
            });
        } catch (err) {
            showError(err instanceof Error ? err.message : t('auth.registerError'));
        }
    };

    if (isAuthenticated && user) {
        return <Navigate to={homePathForRole(user.role)} replace />;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-24 pb-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg mx-auto rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 md:p-10"
            >
                <div className="flex items-center gap-2 mb-6 text-emerald-600">
                    <Building2 className="h-8 w-8" />
                    <span className="text-lg font-bold text-slate-900 dark:text-white">Alcove PMS</span>
                </div>
                <h1 className="text-2xl font-bold text-emerald-600">{t('auth.registerTitle')}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-8">{t('auth.registerSubtitle')}</p>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="name">
                            {t('auth.fullName')}
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                id="name"
                                value={form.name}
                                onChange={(e) => setField('name', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                autoComplete="name"
                            />
                        </div>
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
                            {t('common.email')}
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setField('email', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                autoComplete="email"
                            />
                        </div>
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="phone">
                            {t('auth.phone')}
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                id="phone"
                                type="tel"
                                value={form.phoneNumber}
                                onChange={(e) => setField('phoneNumber', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                autoComplete="tel"
                            />
                        </div>
                        {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="pw">
                            {t('common.password')}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                id="pw"
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={(e) => setField('password', e.target.value)}
                                className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="cpw">
                            {t('auth.confirmPassword')}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                id="cpw"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={form.confirmPassword}
                                onChange={(e) => setField('confirmPassword', e.target.value)}
                                className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((v) => !v)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                                aria-label={
                                    showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')
                                }
                            >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="role">
                            {t('auth.accountType')}
                        </label>
                        <div className="relative">
                            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                            <FormSelect
                                id="role"
                                value={form.role}
                                onValueChange={(value) => setRole(value as SelfRegistrationRole)}
                                triggerClassName="pl-10 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                                options={[
                                    { value: 'TENANT', label: t('auth.roleTenant') },
                                    { value: 'LAND_LORD', label: t('auth.roleLandlord') },
                                    { value: 'USER', label: t('auth.roleUser') },
                                ]}
                            />
                        </div>
                        {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
                    </div>

                    <ProfileImageField
                        previewUrl={profilePreviewUrl}
                        onPreviewChange={setProfilePreviewUrl}
                        onFileChange={setProfileFile}
                        error={errors.image}
                    />

                    <button
                        type="submit"
                        disabled={registerMutation.isPending}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold transition-colors mt-2"
                    >
                        {registerMutation.isPending ? t('common.loading') : t('auth.createAccount')}
                    </button>
                </form>

                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                    {t('auth.haveAccount')}{' '}
                    <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
                        {t('common.login')}
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
