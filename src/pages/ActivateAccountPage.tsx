import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Loader2, Building2 } from 'lucide-react';
import { useActivateAccountMutation } from '@/queries/auth.queries';
import { showError } from '@/lib/toast';

export default function ActivateAccountPage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const ran = useRef(false);
    const { mutate, isPending, isError, error, isSuccess } = useActivateAccountMutation();

    useEffect(() => {
        if (!token) return;
        if (ran.current) return;
        ran.current = true;
        mutate(token, {
            onError: (e) =>
                showError(e instanceof Error ? e.message : t('auth.activateError')),
        });
    }, [token, mutate, t]);

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-24 pb-12 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-lg mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center"
                >
                    <p className="text-slate-700 dark:text-slate-300">{t('auth.activateMissingToken')}</p>
                    <Link to="/login" className="inline-block mt-6 text-emerald-600 font-semibold hover:underline">
                        {t('auth.backToLogin')}
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-24 pb-12 px-4">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg mx-auto rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 md:p-10 text-center"
            >
                <div className="flex justify-center mb-4 text-emerald-600">
                    <Building2 className="h-10 w-10" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('auth.activateTitle')}</h1>

                {isPending && (
                    <div className="mt-8 flex flex-col items-center gap-3 text-slate-600 dark:text-slate-400">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        <p className="text-sm">{t('auth.activateWorking')}</p>
                    </div>
                )}

                {isError && !isPending && (
                    <p className="mt-6 text-sm text-red-600 dark:text-red-400">
                        {error instanceof Error ? error.message : t('auth.activateError')}
                    </p>
                )}

                {isSuccess && (
                    <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">{t('auth.activateRedirect')}</p>
                )}

                {isError && !isPending && (
                    <p className="mt-6 text-sm">
                        <Link to="/check-email" className="text-emerald-600 font-semibold hover:underline">
                            {t('auth.resendFromCheckEmail')}
                        </Link>
                    </p>
                )}
            </motion.div>
        </div>
    );
}
