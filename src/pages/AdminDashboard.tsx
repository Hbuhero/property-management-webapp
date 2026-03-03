import { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  ShieldAlert, Users, Activity, Settings,
  Database, Search, Trash2,
  ShieldCheck, AlertTriangle, Terminal
} from 'lucide-react';
import { motion } from 'framer-motion';

// ── Shared animation variants ─────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' as const },
};
const stagger = (i: number) => ({ transition: { delay: i * 0.07, duration: 0.3 } });

// ── Skeleton helpers ──────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 ${className}`} />
);

const AdminDashboard = () => {
  const location = useLocation();

  const navItems = [
    { name: 'System Health', path: '/admin', icon: Activity },
    { name: 'User Central', path: '/admin/users', icon: Users },
    { name: 'Security Logs', path: '/admin/security', icon: ShieldAlert },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col shrink-0">
        <div className="p-6 flex-1">
          {/* Admin badge */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">System Admin</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tracking-wide">SUPERUSER</p>
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

      {/* Main */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <Routes>
          <Route index element={<SystemHealth />} />
          <Route path="users" element={<UserCentral />} />
          <Route path="security" element={<SecurityLogs />} />
        </Routes>
      </main>
    </div>
  );
};

// ── System Health ─────────────────────────────────────────────────────────────
const SystemHealth = () => {
  const [loading] = useState(false);

  const stats = [
    { label: 'API Response', value: '42ms', status: 'Optimal', icon: Activity, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'DB Load', value: '12%', status: 'Low', icon: Database, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Reported Bugs', value: '2', status: 'Minor', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  const logs = [
    { time: '[2024-03-20 14:22:01]', level: 'INFO', msg: 'User ID #9021 authenticated via M-Pesa API', color: 'text-emerald-500' },
    { time: '[2024-03-20 14:15:44]', level: 'INFO', msg: 'New property "Masaki Loft" published by Kassim Majaliwa', color: 'text-emerald-500' },
    { time: '[2024-03-20 13:50:12]', level: 'WARN', msg: 'Failed login attempt from IP 192.168.1.45 (User: admin_test)', color: 'text-amber-500' },
    { time: '[2024-03-20 13:31:05]', level: 'ERROR', msg: 'Payment gateway timeout – retry #2 succeeded', color: 'text-red-500' },
  ];

  return (
    <motion.div {...fadeUp} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Health</h1>
        <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          ALL SYSTEMS OPERATIONAL
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))
          : stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                {...fadeUp}
                {...stagger(i)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:shadow-md dark:hover:shadow-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                    {stat.status}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
              </motion.div>
            );
          })}
      </div>

      {/* Audit log */}
      <motion.div {...fadeUp} {...stagger(3)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="h-4 w-4 text-slate-400" /> Audit Logs
          </h3>
          <button className="text-xs text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium">
            View Full Logs
          </button>
        </div>
        <div className="p-6 font-mono text-xs space-y-3">
          {logs.map((log, i) => (
            <motion.div key={i} {...fadeUp} {...stagger(i)} className="flex flex-wrap gap-3">
              <span className="text-slate-400 dark:text-slate-500">{log.time}</span>
              <span className={`font-bold ${log.color}`}>{log.level}</span>
              <span className="text-slate-600 dark:text-slate-300">{log.msg}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── User Central ──────────────────────────────────────────────────────────────
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

// ── Security Logs ─────────────────────────────────────────────────────────────
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

export default AdminDashboard;
