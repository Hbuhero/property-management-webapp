import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

// ── Nav link definitions ──────────────────────────────────────────────────────
interface NavLink {
  key: string;
  label: string;
  href: string;
  isRoute: boolean;
}

const NAV_LINKS: NavLink[] = [
  { key: 'overview', label: 'Overview', href: '/#overview', isRoute: false },
  { key: 'services', label: 'Services', href: '/#services', isRoute: false },
  { key: 'contact', label: 'Contact', href: '/#contact', isRoute: false },
  { key: 'marketplace', label: 'Marketplace', href: '/marketplace', isRoute: true },
];




// ── Main Navbar ───────────────────────────────────────────────────────────────
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const handleAnchorClick = (href: string) => {
    setIsOpen(false);
    if (href.startsWith('/#')) {
      if (location.pathname !== '/') {
        navigate('/');
        // short delay to let the page render before scrolling
        setTimeout(() => {
          document.getElementById(href.slice(2))?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        document.getElementById(href.slice(2))?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const isActive = (href: string) =>
    href.startsWith('/#')
      ? false
      : location.pathname === href;

  return (
    <div className="fixed top-0 w-full z-50 flex justify-center px-4 sm:px-6 pointer-events-none transition-all duration-500">
      <nav
        className={`pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden ${scrolled
          ? 'w-full max-w-4xl rounded-full py-2.5 px-6 mt-4 bg-white/80 dark:bg-slate-900/80 shadow-lg'
          : 'w-full max-w-7xl rounded-3xl py-4.5 px-8 mt-6 bg-white/60 dark:bg-slate-900/60 shadow-md'
          }`}
      >
        {/* ── 3-column layout: logo  |  nav  |  actions ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 items-center w-full">

          {/* LEFT — Logo */}
          <Link to="/" className="flex items-center gap-2 justify-self-start">
            <div className="bg-emerald-600 p-1.5 rounded-lg shrink-0">
              <Building2 className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white transition-colors duration-200">
              Makazi<span className="text-emerald-600 dark:text-emerald-400">Hub</span>
            </span>
          </Link>

          {/* CENTER — Desktop nav links */}
          <div className="hidden md:flex items-center justify-center gap-1">
            {NAV_LINKS.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.key}
                  to={link.href}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${isActive(link.href)
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                    }`}
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.key}
                  onClick={() => handleAnchorClick(link.href)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${scrolled
                    ? 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                    : 'text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/40 dark:hover:bg-slate-800/40'
                    }`}
                >
                  {link.label}
                </button>
              )
            )}
          </div>

          {/* RIGHT — Actions */}
          <div className="hidden md:flex items-center gap-2 justify-self-end">
            <LanguageSwitcher />
            <ThemeToggle />

            <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2 rounded-full transition-all shadow-sm hover:shadow-emerald-500/25"
            >
              Sign In
            </Link>
          </div>

          {/* MOBILE — Hamburger */}
          <div className="md:hidden flex items-center gap-2 justify-self-end">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile dropdown menu ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full mt-2 w-[calc(100%-2rem)] max-w-md mx-auto pointer-events-auto md:hidden overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-700/50 rounded-3xl shadow-2xl"
          >
            <div className="p-3 space-y-1">
              {NAV_LINKS.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.key}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${isActive(link.href)
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <button
                    key={link.key}
                    onClick={() => handleAnchorClick(link.href)}
                    className="w-full flex items-center px-4 py-3 rounded-2xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {link.label}
                  </button>
                )
              )}

              <div className="pt-2 pb-1 px-1">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 w-full bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white font-semibold px-4 py-3.5 rounded-2xl transition-colors shadow-sm"
                >
                  Sign In / Sign Up
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
