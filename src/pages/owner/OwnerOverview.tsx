import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, FileText, Users, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.07, duration: 0.3 } });

const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700 ${className}`} />
);

const data = [
    { name: 'Jan', revenue: 4500000 },
    { name: 'Feb', revenue: 5200000 },
    { name: 'Mar', revenue: 4800000 },
    { name: 'Apr', revenue: 6100000 },
    { name: 'May', revenue: 5500000 },
    { name: 'Jun', revenue: 6700000 },
];

const OwnerOverview = () => {
    const [loading] = useState(false);

    const stats = [
        { label: 'Total Revenue', value: '32.8M TZS', change: '+12.5%', icon: Wallet, iconColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'Occupancy Rate', value: '94%', change: '+2.1%', icon: TrendingUp, iconColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Active Leases', value: '18', change: '0%', icon: FileText, iconColor: 'text-violet-600 dark:text-violet-400', iconBg: 'bg-violet-50 dark:bg-violet-900/20' },
        { label: 'Pending Apps', value: '5', change: '+2', icon: Users, iconColor: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-50 dark:bg-amber-900/20' },
    ];

    return (
        <motion.div {...fadeUp} className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
                    <p className="text-sm text-slate-400 mt-0.5">All properties · June 2024</p>
                </div>
                <button className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-emerald-500/20">
                    <Plus className="h-4 w-4" /> Add Property
                </button>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
                    : stats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={i}
                                {...fadeUp}
                                {...stagger(i)}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2.5 rounded-xl ${stat.iconBg} ${stat.iconColor}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stat.change.startsWith('+')
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                        }`}>
                                        {stat.change}
                                    </span>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">{stat.label}</p>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
                            </motion.div>
                        );
                    })}
            </div>

            {/* Chart + property status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div {...fadeUp} {...stagger(4)} className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Revenue Growth (TZS)</h3>
                    <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div {...fadeUp} {...stagger(5)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Property Status</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Occupied', count: 14, color: 'bg-emerald-500' },
                            { label: 'Pending Maintenance', count: 2, color: 'bg-amber-500' },
                            { label: 'Vacant', count: 2, color: 'bg-slate-300 dark:bg-slate-600' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2.5">
                                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.color}`} />
                                    <span className="text-slate-600 dark:text-slate-300">{item.label}</span>
                                </div>
                                <span className="font-semibold text-slate-900 dark:text-white">{item.count}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <Link to="/owner/properties" className="flex items-center justify-center w-full py-2.5 border-2 border-emerald-500 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                            View Inventory
                        </Link>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default OwnerOverview;
