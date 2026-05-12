import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Building2, Database, Gauge, ShieldAlert, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchAdminUserStats } from '@/api/adminUsersApi';
import { fetchAdminPropertiesPage } from '@/api/adminPropertiesApi';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.07, duration: 0.3 } });

const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 ${className}`} />
);

type DashLoadState =
    | { status: 'loading' }
    | {
          status: 'ready';
          apiMs: number;
          totalUsers: number;
          activeUsers: number;
          totalProperties: number;
      }
    | { status: 'error'; message: string };

const SystemHealth = () => {
    const [dash, setDash] = useState<DashLoadState>({ status: 'loading' });

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const t0 = performance.now();
                const stats = await fetchAdminUserStats();
                const apiMs = Math.round(performance.now() - t0);

                const propMeta = await fetchAdminPropertiesPage({ page: 0, size: 1 });
                const totalProperties = Number(propMeta.page.totalSize ?? 0);

                if (!cancelled) {
                    setDash({
                        status: 'ready',
                        apiMs,
                        totalUsers: stats.totalUsers,
                        activeUsers: stats.activeUsers,
                        totalProperties,
                    });
                }
            } catch (e) {
                if (!cancelled) {
                    setDash({
                        status: 'error',
                        message: e instanceof Error ? e.message : 'Failed to load dashboard metrics',
                    });
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const loading = dash.status === 'loading';
    const error = dash.status === 'error';

    const stats =
        dash.status === 'ready'
            ? [
                  {
                      label: 'Admin API round-trip',
                      value: `${dash.apiMs} ms`,
                      status: dash.apiMs < 800 ? 'Good' : 'Slow',
                      icon: Gauge,
                      color: 'text-emerald-600 dark:text-emerald-400',
                      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                  },
                  {
                      label: 'Registered users',
                      value: String(dash.totalUsers),
                      status: `${dash.activeUsers} active`,
                      icon: Users,
                      color: 'text-blue-600 dark:text-blue-400',
                      bg: 'bg-blue-50 dark:bg-blue-900/20',
                  },
                  {
                      label: 'Properties (non-deleted)',
                      value: String(dash.totalProperties),
                      status: 'Database',
                      icon: Database,
                      color: 'text-amber-600 dark:text-amber-400',
                      bg: 'bg-amber-50 dark:bg-amber-900/20',
                  },
              ]
            : [];

    return (
        <motion.div {...fadeUp} className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Health</h1>
                <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE METRICS
                </div>
            </div>

            {error ? (
                <div
                    className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
                    role="alert"
                >
                    <p className="font-medium">Could not load metrics</p>
                    <p className="mt-1 text-sm">{dash.message}</p>
                </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {loading
                    ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
                    : stats.map((stat, i) => {
                          const Icon = stat.icon;
                          return (
                              <motion.div
                                  key={stat.label}
                                  {...fadeUp}
                                  {...stagger(i)}
                                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:shadow-md dark:hover:shadow-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group"
                              >
                                  <div className="flex justify-between items-start mb-4">
                                      <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                                          <Icon className="h-5 w-5" />
                                      </div>
                                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide max-w-[8rem] text-right leading-tight">
                                          {stat.status}
                                      </span>
                                  </div>
                                  <p className="text-slate-500 dark:text-slate-400 text-sm">{stat.label}</p>
                                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                                      {stat.value}
                                  </h3>
                              </motion.div>
                          );
                      })}
            </div>

            <motion.div
                {...fadeUp}
                {...stagger(3)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center gap-4 flex-wrap">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity className="h-4 w-4 text-slate-400" />
                        Operations
                    </h3>
                </div>
                <div className="p-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Link
                        to="/admin/users"
                        className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors"
                    >
                        <Users className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden />
                        User management
                    </Link>
                    <Link
                        to="/admin/properties"
                        className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors"
                    >
                        <Building2 className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden />
                        All properties
                    </Link>
                    <Link
                        to="/admin/security"
                        className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors"
                    >
                        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" aria-hidden />
                        Security &amp; audit UI
                    </Link>
                    <Link
                        to="/marketplace"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors"
                    >
                        <Building2 className="h-5 w-5 text-blue-600 shrink-0" aria-hidden />
                        Public marketplace (new tab)
                    </Link>
                </div>
                <p className="px-6 pb-6 text-xs text-slate-400 dark:text-slate-500">
                    Centralized security event streaming is not wired yet — the Security page remains a layout
                    preview until backend audit APIs land.
                </p>
            </motion.div>
        </motion.div>
    );
};

export default SystemHealth;
