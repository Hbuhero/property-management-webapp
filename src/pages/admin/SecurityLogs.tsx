import { ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.07, duration: 0.3 } });

const SecurityLogs = () => {
    const logs = [
        { event: 'Suspicious Login Attempt', ip: '185.22.14.90', loc: 'Russia', severity: 'High' },
        { event: 'Bulk Data Export', ip: '41.59.201.12', loc: 'Tanzania', severity: 'Medium' },
        { event: 'API Token Revoked', ip: 'System', loc: 'Internal', severity: 'Low' },
    ];

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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Security &amp; Audit</h1>
            <div className="grid gap-4">
                {logs.map((log, i) => (
                    <motion.div
                        key={i}
                        {...fadeUp}
                        {...stagger(i)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md dark:hover:shadow-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl shrink-0 ${iconColor[log.severity]}`}>
                                <ShieldAlert className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white">{log.event}</h4>
                                <p className="text-xs text-slate-400 mt-0.5">IP: {log.ip} · Origin: {log.loc}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 sm:shrink-0">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${badgeColor[log.severity]}`}>
                                {log.severity}
                            </span>
                            <button className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors">
                                Investigate
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default SecurityLogs;
