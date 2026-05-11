import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Building2 } from 'lucide-react';
import { useResendVerificationMutation } from '@/queries/auth.queries';
import { showError, showSuccess } from '@/lib/toast';

export default function CheckEmailPage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const emailFromQuery = useMemo(() => searchParams.get('email')?.trim() ?? '', [searchParams]);
    /** When empty, resend uses `emailFromQuery`; once the user types, this overrides. */
    const [manualEmail, setManualEmail] = useState('');
    const resend = useResendVerificationMutation();

    const emailField = manualEmail || emailFromQuery;

    const handleResend = async () => {
        const e = emailField.trim();
        if (!e) {
            showError(t('auth.emailRequired'));
            return;
        }
        try {
            await resend.mutateAsync(e);
            showSuccess(t('auth.resendSuccess'));
        } catch (err) {
            showError(err instanceof Error ? err.message : t('auth.resendError'));
        }
    };

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
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('auth.checkEmailTitle')}</h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-3 leading-relaxed">
                    {t('auth.checkEmailBody')}
                </p>

                {emailFromQuery ? (
                    <p className="mt-4 text-sm font-medium text-emerald-700 dark:text-emerald-400 break-all">
                        {emailFromQuery}
                    </p>
                ) : null}

                <div className="mt-8 text-left space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="re-email">
                        {t('auth.resendLabel')}
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            id="re-email"
                            type="email"
                            value={emailField}
                            onChange={(e) => setManualEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleResend}
                    disabled={resend.isPending}
                    className="w-full mt-4 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-60 transition-colors"
                >
                    {resend.isPending ? t('common.loading') : t('auth.resendVerification')}
                </button>

                <p className="mt-8 text-sm text-slate-500">
                    <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
                        {t('auth.backToLogin')}
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
