import { useState } from 'react';
import { Activity, Database, AlertTriangle, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.07, duration: 0.3 } });

const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 ${className}`} />
);

const SystemHealth = () => {
    const [loading] = useState(false);

    const stats = [
        { label: 'API Response', value: '42ms', status: 'Optimal', icon: Activity, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'DB Load', value: '12%', status: 'Low', icon: Database, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Reported Bugs', value: '2', status: 'Minor', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    ];

    const logs = [
        { time: '[2024-03-20 14:22:01]', level: 'INFO', msg: 'User ID #9021 authenticated via M-Pesa API', color: 'text-emerald-500' },
        { time: '[2024-03-20 14:15:44]', level: 'INFO', msg: 'New property "Masaki Loft" published by Kassim Majaliwa', color: 'text-emerald-500' },
        { time: '[2024-03-20 13:50:12]', level: 'WARN', msg: 'Failed login attempt from IP 192.168.1.45 (User: admin_test)', color: 'text-amber-500' },
        { time: '[2024-03-20 13:31:05]', level: 'ERROR', msg: 'Payment gateway timeout – retry #2 succeeded', color: 'text-red-500' },
    ];

    return (
        <motion.div {...fadeUp} className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Health</h1>
                <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ALL SYSTEMS OPERATIONAL
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {loading
                    ? Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-2xl" />
                    ))
                    : stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={i}
                                {...fadeUp}
                                {...stagger(i)}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:shadow-md dark:hover:shadow-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                                        {stat.status}
                                    </span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
                            </motion.div>
                        );
                    })}
            </div>

            {/* Audit log */}
            <motion.div {...fadeUp} {...stagger(3)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-slate-400" /> Audit Logs
                    </h3>
                    <button className="text-xs text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">
                        View Full Logs
                    </button>
                </div>
                <div className="p-6 font-mono text-xs space-y-3">
                    {logs.map((log, i) => (
                        <motion.div key={i} {...fadeUp} {...stagger(i)} className="flex flex-wrap gap-3">
                            <span className="text-slate-400 dark:text-slate-500">{log.time}</span>
                            <span className={`font-bold ${log.color}`}>{log.level}</span>
                            <span className="text-slate-600 dark:text-slate-300">{log.msg}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SystemHealth;
