import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CreditCard, Wrench, FileText, Bell,
  ChevronRight, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.07, duration: 0.3 } });

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700 ${className}`} />
);

// ── Shell ─────────────────────────────────────────────────────────────────────
const TenantDashboard = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Overview', path: '/tenant', icon: LayoutDashboard },
    { name: 'Lease', path: '/tenant/lease', icon: FileText },
    { name: 'Payments', path: '/tenant/payments', icon: CreditCard },
    { name: 'Maintenance', path: '/tenant/maintenance', icon: Wrench },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
        <div className="p-6 flex-1">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm shrink-0">
              AM
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Amani Mussa</p>
              <p className="text-xs text-slate-400">Tenant</p>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <Routes>
          <Route index element={<TenantOverview />} />
          <Route path="payments" element={<PaymentHub />} />
          <Route path="maintenance" element={<MaintenancePortal />} />
          <Route path="lease" element={<LeaseManagement />} />
        </Routes>
      </main>
    </div>
  );
};

// ── Overview ──────────────────────────────────────────────────────────────────
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

// ── Payment Hub ───────────────────────────────────────────────────────────────
const PaymentHub = () => {
  const [isPaying, setIsPaying] = useState(false);
  const [selected, setSelected] = useState<'mpesa' | 'tigo'>('mpesa');

  const handlePay = () => {
    setIsPaying(true);
    setTimeout(() => {
      setIsPaying(false);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#10b981', '#059669', '#34d399'] });
    }, 2000);
  };

  return (
    <motion.div {...fadeUp} className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Hub</h1>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        {/* Balance */}
        <div className="bg-emerald-600 p-6">
          <p className="text-emerald-100 text-sm mb-1">Balance Due</p>
          <h3 className="text-4xl font-bold text-white">1,800,000 TZS</h3>
          <p className="text-emerald-100 text-sm mt-2 flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> Due by April 1st, 2024
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'mpesa', label: 'M-Pesa', color: 'bg-red-600', letter: 'M' },
                { id: 'tigo', label: 'Tigo Pesa', color: 'bg-blue-600', letter: 'T' },
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setSelected(method.id as 'mpesa' | 'tigo')}
                  className={`flex flex-col items-center p-5 rounded-xl border-2 transition-all ${selected === method.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}
                >
                  <div className={`w-11 h-11 rounded-full ${method.color} text-white font-bold text-lg italic flex items-center justify-center mb-2`}>
                    {method.letter}
                  </div>
                  <span className="font-semibold text-sm text-slate-800 dark:text-white">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
            <input
              type="text"
              placeholder="07XX XXX XXX"
              className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          <button
            onClick={handlePay}
            disabled={isPaying}
            className="w-full py-3.5 rounded-xl font-bold text-white transition-all active:scale-[.98] disabled:opacity-60 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
          >
            {isPaying ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                Processing...
              </>
            ) : 'Pay Now'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Maintenance ───────────────────────────────────────────────────────────────
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

// ── Lease Management ──────────────────────────────────────────────────────────
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

export default TenantDashboard;
