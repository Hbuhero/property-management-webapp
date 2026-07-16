import { Link } from 'react-router-dom';
import { ShieldAlert, FileBarChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useAdminReportSummary } from '@/queries/adminReport.queries';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.07, duration: 0.3 } });

function defaultRange() {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 14);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

const SecurityLogs = () => {
    const range = useMemo(() => defaultRange(), []);
    const [from] = useState(range.from);
    const [to] = useState(range.to);
    const { data, isLoading, isError } = useAdminReportSummary({ from, to, activityLimit: 30 });

    const severityFor = (category: string): 'High' | 'Medium' | 'Low' => {
        if (category === 'Payment' || category === 'User') return 'Medium';
        if (category === 'Application') return 'High';
        return 'Low';
    };

    const badgeColor: Record<string, string> = {
        High: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        Medium: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
        Low: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    };
    const iconColor: Record<string, string> = {
        High: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
        Medium: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
        Low: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    };

    return (
        <motion.div {...fadeUp} className="max-w-3xl mx-auto space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Security &amp; Audit</h1>
                <Link
                    to="/admin/reports"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                    <FileBarChart className="h-4 w-4" aria-hidden />
                    Full reports
                </Link>
            </div>

            {isError ? (
                <p className="text-sm text-red-600 dark:text-red-400">Could not load activity feed.</p>
            ) : null}

            <div className="grid gap-4">
                {isLoading
                    ? Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
                      ))
                    : data?.recentActivity.map((log, i) => {
                          const severity = severityFor(log.category);
                          return (
                              <motion.div
                                  key={`${log.occurredAt}-${i}`}
                                  {...fadeUp}
                                  {...stagger(i)}
                                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md dark:hover:shadow-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
                              >
                                  <div className="flex items-start gap-4">
                                      <div className={`p-3 rounded-xl shrink-0 ${iconColor[severity]}`}>
                                          <ShieldAlert className="h-5 w-5" />
                                      </div>
                                      <div>
                                          <h4 className="font-semibold text-slate-900 dark:text-white">
                                              {log.summary}
                                          </h4>
                                          <p className="text-xs text-slate-400 mt-0.5">
                                              {log.category} · {log.actor} · {log.detail}
                                          </p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3 sm:shrink-0">
                                      <span
                                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${badgeColor[severity]}`}
                                      >
                                          {severity}
                                      </span>
                                      <Link
                                          to="/admin/users"
                                          className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 px-3 py-1.5 rounded-lg transition-colors"
                                      >
                                          Review accounts
                                      </Link>
                                  </div>
                              </motion.div>
                          );
                      })}
                {!isLoading && data?.recentActivity.length === 0 ? (
                    <p className="text-sm text-slate-500">No recent activity in the last 14 days.</p>
                ) : null}
            </div>
        </motion.div>
    );
};

export default SecurityLogs;
