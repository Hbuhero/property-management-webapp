import { useState } from 'react';
import { Search, Settings, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.07, duration: 0.3 } });

const UserCentral = () => {
    const [query, setQuery] = useState('');

    const users = [
        { name: 'Kassim Majaliwa', email: 'kassim@gmail.com', role: 'Owner', status: 'Active', last: '2 mins ago' },
        { name: 'Amani Mussa', email: 'amani@gmail.com', role: 'Tenant', status: 'Active', last: '1 hour ago' },
        { name: 'John Mussa', email: 'john@gmail.com', role: 'Manager', status: 'Suspended', last: '3 days ago' },
    ].filter(u => u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()));

    return (
        <motion.div {...fadeUp} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 w-56 transition"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                {['User', 'Role', 'Status', 'Last Seen', 'Actions'].map(h => (
                                    <th key={h} className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {users.map((user, i) => (
                                <motion.tr
                                    key={i}
                                    {...fadeUp}
                                    {...stagger(i)}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                                                {user.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">{user.name}</p>
                                                <p className="text-xs text-slate-400">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{user.role}</td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.status === 'Active'
                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-slate-400">{user.last}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                <Settings className="h-4 w-4" />
                                            </button>
                                            <button className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default UserCentral;
