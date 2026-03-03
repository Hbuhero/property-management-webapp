import { FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

const LeaseManagement = () => (
    <motion.div {...fadeUp} className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lease Management</h1>

        {/* Document preview */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">Digital Lease Agreement</h2>
            <div className="aspect-[3/4] max-h-60 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-3 text-center p-8">
                <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Lease_Masaki_Mussa_2024.pdf</p>
                <p className="text-xs text-slate-400">Digitally signed · January 1st, 2024</p>
                <button className="mt-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors">
                    Download PDF
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Terms */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Terms Summary</h4>
                <ul className="space-y-3">
                    {[
                        { label: 'Security Deposit', value: '3,600,000 TZS' },
                        { label: 'Notice Period', value: '3 Months' },
                        { label: 'Late Payment Fee', value: '5% after 5th' },
                    ].map(item => (
                        <li key={item.label} className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{item.value}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Expiry */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Expiry Countdown</h4>
                <div className="flex items-center justify-around mb-5">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">274</p>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mt-1">Days Left</p>
                    </div>
                    <div className="w-px h-10 bg-slate-100 dark:bg-slate-800" />
                    <div className="text-center">
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">Dec 31</p>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mt-1">Expires</p>
                    </div>
                </div>
                <button className="w-full py-2.5 border-2 border-emerald-500 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                    Request Renewal
                </button>
            </div>
        </div>
    </motion.div>
);

export default LeaseManagement;
