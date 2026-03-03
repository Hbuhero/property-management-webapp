import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  BarChart3, Building, Users, Wallet, Plus,
  TrendingUp, ArrowDown, Search, MoreVertical,
  FileText, CheckCircle2, XCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.07, duration: 0.3 } });

const Skeleton = ({ className = '' }) => (
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

// ── Shell ─────────────────────────────────────────────────────────────────────
const OwnerDashboard = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Overview', path: '/owner', icon: BarChart3 },
    { name: 'Properties', path: '/owner/properties', icon: Building },
    { name: 'Applications', path: '/owner/applications', icon: FileText },
    { name: 'Finances', path: '/owner/finances', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
        <div className="p-6 flex-1">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              KM
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Kassim Majaliwa</p>
              <p className="text-xs text-slate-400">Owner</p>
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
          <Route index element={<OwnerOverview />} />
          <Route path="properties" element={<PropertyInventory />} />
          <Route path="applications" element={<ApplicationInbox />} />
          <Route path="finances" element={<FinancialReports />} />
        </Routes>
      </main>
    </div>
  );
};

// ── Overview ──────────────────────────────────────────────────────────────────
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

// ── Property Inventory ────────────────────────────────────────────────────────
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

// ── Application Inbox ─────────────────────────────────────────────────────────
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

// ── Financial Reports ─────────────────────────────────────────────────────────
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

export default OwnerDashboard;
