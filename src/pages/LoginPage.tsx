import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Lock, Building2 } from 'lucide-react';
import { useLoginMutation } from '@/queries/auth.queries';
import { showSuccess, showError } from '@/lib/toast';
import { homePathForRole } from '@/lib/authRole';
import { loginSchema } from '@/schemas/auth.schema';
import type { UserRole } from '@/store/slices/authSlice';
import FileUpload from '@/components/file-upload';

export default function LoginPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const loginMutation = useLoginMutation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Zod validation
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            setErrors({
                email: fieldErrors.email?.[0],
                password: fieldErrors.password?.[0],
            });
            return;
        }
        setErrors({});

        try {
            const data = await loginMutation.mutateAsync({ email, password });
            showSuccess(t('auth.loginSuccess'));
            const role: UserRole = data.user.role;
            navigate(homePathForRole(role));
        } catch {
            showError(t('auth.loginError'));
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-24 pb-12">
            {/* Card */}
            <div className="flex-1 flex items-center justify-center px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900"
                >
                    {/* Left branding panel */}
                    <div className="hidden md:flex flex-col items-center justify-center bg-emerald-600 p-10 relative">
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 0%, transparent 60%)' }} />
                        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
                            <div className="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Building2 className="h-12 w-12 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">PMS</h2>
                                <p className="text-white/80 mt-2 text-sm">Property Management Platform</p>
                            </div>
                            {/* Demo credentials hint */}
                            <div className="text-left w-full bg-white/10 rounded-xl p-4 text-xs text-white/80 space-y-1">
                                <p className="font-semibold text-white mb-2">Backend sign-in</p>
                                <p>Use an active account from your PMS database. API base URL defaults to http://localhost:8080 unless you set VITE_API_BASE_URL.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right form panel */}
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-emerald-600">{t('auth.loginTitle')}</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{t('auth.loginSubtitle')}</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5" noValidate>
                            {/* Email */}
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {t('common.email')}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t('auth.emailPlaceholder')}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                    />
                                </div>
                                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between">
                                    <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {t('common.password')}
                                    </label>
                                    <button type="button" className="text-xs text-emerald-600 hover:underline">
                                        {t('auth.forgotPassword')}
                                    </button>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t('auth.passwordPlaceholder')}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                                    />
                                </div>
                                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={loginMutation.isPending}
                                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold transition-colors"
                            >
                                {loginMutation.isPending ? t('common.loading') : t('common.login')}
                            </button>
                        </form>

                        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                            {t('auth.noAccount')}{' '}
                            <Link to="/register" className="text-emerald-600 font-semibold hover:underline">
                                {t('auth.createAccount')}
                            </Link>
                        </p>
                    </div>
                </motion.div>

                <FileUpload />
            </div>
        </div>
    );
}
