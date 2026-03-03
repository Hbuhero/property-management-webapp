import { CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.07, duration: 0.3 } });

const ApplicationInbox = () => {
    const apps = [
        { name: 'Sarah Juma', property: 'Masaki Loft', date: 'Today', credit: 'Good' },
        { name: 'David Mwakasege', property: 'Oyster Bay Villa', date: 'Yesterday', credit: 'Excellent' },
        { name: 'Fatma Ali', property: 'Upanga Studio', date: '2 days ago', credit: 'Good' },
    ];

    return (
        <motion.div {...fadeUp} className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tenant Applications</h1>
            <div className="grid gap-4">
                {apps.map((app, i) => (
                    <motion.div
                        key={i}
                        {...fadeUp}
                        {...stagger(i)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 text-sm shrink-0">
                                {app.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white">{app.name}</h4>
                                <p className="text-xs text-slate-400">For: <span className="text-emerald-600 dark:text-emerald-400 font-medium">{app.property}</span></p>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-10">
                            <div className="text-center">
                                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">Credit</p>
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{app.credit}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wide">Received</p>
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{app.date}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                                <XCircle className="h-4 w-4" />
                            </button>
                            <button className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                                <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors">
                                View Info
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default ApplicationInbox;
