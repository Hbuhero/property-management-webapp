import { Wrench, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.07, duration: 0.3 } });

const MaintenancePortal = () => {
    const tickets = [
        { title: 'Plumbing Issue', status: 'In Progress', date: '2 days ago', id: 'TKT-9021', type: 'Urgent' },
        { title: 'AC Filter Cleaning', status: 'Resolved', date: '1 month ago', id: 'TKT-8842', type: 'Routine' },
    ];

    return (
        <motion.div {...fadeUp} className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Maintenance Portal</h1>
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-emerald-500/20">
                    New Request
                </button>
            </div>

            <div className="grid gap-4">
                {tickets.map((ticket, i) => (
                    <motion.div
                        key={ticket.id}
                        {...fadeUp}
                        {...stagger(i)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl shrink-0 ${ticket.status === 'Resolved' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                                <Wrench className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                    <h4 className="font-semibold text-slate-900 dark:text-white">{ticket.title}</h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${ticket.type === 'Urgent'
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                        }`}>
                                        {ticket.type}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400">ID: {ticket.id} · {ticket.date}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                            <div className={`flex items-center gap-1.5 text-sm font-semibold ${ticket.status === 'Resolved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {ticket.status === 'Resolved' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                {ticket.status}
                            </div>
                            <button className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default MaintenancePortal;
