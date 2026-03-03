import { ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

const data = [
    { name: 'Jan', revenue: 4500000 },
    { name: 'Feb', revenue: 5200000 },
    { name: 'Mar', revenue: 4800000 },
    { name: 'Apr', revenue: 6100000 },
    { name: 'May', revenue: 5500000 },
    { name: 'Jun', revenue: 6700000 },
];

const FinancialReports = () => (
    <motion.div {...fadeUp} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Reports</h1>
            <button className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                <ArrowDown className="h-4 w-4" /> Export Statement
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-5">Revenue vs Expenses</h3>
                <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgb(0 0 0 / 0.1)' }} />
                            <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Outstanding balances */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-5">Outstanding Balances</h3>
                <div className="space-y-3">
                    {[
                        { tenant: 'Amani Mussa', amount: '1,800,000 TZS', days: '5 days late' },
                        { tenant: 'Joyce Massawe', amount: '450,000 TZS', days: '2 days late' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                            <div>
                                <p className="font-semibold text-sm text-slate-900 dark:text-white">{item.tenant}</p>
                                <p className="text-xs text-red-600 dark:text-red-400 font-medium">{item.days}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-sm text-slate-900 dark:text-white">{item.amount}</p>
                                <button className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline mt-0.5">
                                    SEND REMINDER
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </motion.div>
);

export default FinancialReports;
