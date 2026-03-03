import { useState } from 'react';
import { CreditCard, Bell, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.07, duration: 0.3 } });

const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700 ${className}`} />
);

const TenantOverview = () => {
    const [loading] = useState(false);

    return (
        <motion.div {...fadeUp} className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Habari, Amani!</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Here's your tenancy at a glance</p>
                </div>
                <button className="relative p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors">
                    <Bell className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
                </button>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36" />)
                ) : (
                    <>
                        {/* Rent card — accent */}
                        <motion.div {...fadeUp} {...stagger(0)} className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                            <p className="text-emerald-100 text-sm mb-1">Current Rent</p>
                            <h2 className="text-3xl font-bold mb-4">1,800,000 TZS</h2>
                            <div className="flex items-center gap-1.5 text-xs bg-white/20 px-3 py-1.5 rounded-full w-fit">
                                <Clock className="h-3.5 w-3.5" /> Due in 5 days
                            </div>
                        </motion.div>

                        {/* Lease card */}
                        <motion.div {...fadeUp} {...stagger(1)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Active Lease</p>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Masaki Modern</h2>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mb-2">
                                <div className="bg-emerald-500 h-full rounded-full w-3/4 transition-all" />
                            </div>
                            <p className="text-xs text-slate-400">9 months / 12 months</p>
                        </motion.div>

                        {/* Tickets card */}
                        <motion.div {...fadeUp} {...stagger(2)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">Open Tickets</p>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1 Pending</h2>
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-sm font-medium">
                                <AlertCircle className="h-4 w-4" /> Plumbing Issue
                            </div>
                        </motion.div>
                    </>
                )}
            </div>

            {/* Recent payments + maintenance timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payments */}
                <motion.div {...fadeUp} {...stagger(3)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-5">Recent Payments</h3>
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <CreditCard className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-900 dark:text-white">Rent – March 2024</p>
                                        <p className="text-xs text-slate-400">Paid via M-Pesa</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">1,800,000 TZS</p>
                                    <p className="text-xs text-slate-400">Mar 01</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Maintenance timeline */}
                <motion.div {...fadeUp} {...stagger(4)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-5">Maintenance Status</h3>
                    <div className="space-y-6 pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                        {[
                            { title: 'Kitchen Leak Resolved', date: 'March 15, 2024', note: 'Work completed by fundi. No further issues.', color: 'bg-emerald-500', dot: 'bg-emerald-500' },
                            { title: 'AC Servicing', date: 'Scheduled Mar 28', note: null, color: 'bg-amber-500', dot: 'bg-amber-500' },
                        ].map((item, i) => (
                            <div key={i} className="relative">
                                <div className={`absolute -left-[1.35rem] w-3 h-3 rounded-full ${item.dot} border-2 border-white dark:border-slate-900`} />
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{item.date}</p>
                                {item.note && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg">{item.note}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default TenantOverview;
