import { useState } from 'react';
import { Search, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.07, duration: 0.3 } });

const PropertyInventory = () => {
    const [query, setQuery] = useState('');

    const properties = [
        { name: 'Oyster Bay Villa', loc: 'Oyster Bay', rent: '2.5M TZS', status: 'Occupied' },
        { name: 'Masaki Loft', loc: 'Masaki', rent: '1.8M TZS', status: 'Occupied' },
        { name: 'Upanga Studio', loc: 'Upanga', rent: '900k TZS', status: 'Vacant' },
        { name: 'Mbezi Beach House', loc: 'Mbezi', rent: '3.2M TZS', status: 'Maintenance' },
    ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

    const badge: Record<string, string> = {
        Occupied: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
        Vacant: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
        Maintenance: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    };

    return (
        <motion.div {...fadeUp} className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Property Inventory</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search properties..."
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
                                {['Property', 'Location', 'Rent / mo', 'Status', ''].map(h => (
                                    <th key={h} className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {properties.map((item, i) => (
                                <motion.tr key={i} {...fadeUp} {...stagger(i)} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                                                <img src={`https://picsum.photos/seed/${i + 10}/100/100`} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="font-semibold text-slate-900 dark:text-white">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{item.loc}</td>
                                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{item.rent}</td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge[item.status]}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                            <MoreVertical className="h-4 w-4" />
                                        </button>
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

export default PropertyInventory;
