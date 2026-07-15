import { motion } from 'framer-motion';
import { Building2, Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const SiteFooter = () => {
    return (
        <footer className="relative bg-slate-950 text-slate-300 pt-20 pb-10 overflow-hidden border-t border-slate-800">
            {/* Background effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[150px] bg-emerald-500/10 blur-[100px] rounded-full point-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-2 group">
                            <motion.div
                                whileHover={{ rotate: 15 }}
                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-500 ring-1 ring-emerald-500/50 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300"
                            >
                                <Building2 size={20} />
                            </motion.div>
                            <span className="text-xl font-bold text-white tracking-tight">
                                Alcove <span className="text-emerald-500">PMS</span>
                            </span>
                        </Link>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">
                            Digitizing property management in Tanzania. Seamlessly connecting owners, tenants, and property managers in one centralized ecosystem.
                        </p>
                        <div className="flex items-center gap-4">
                            {[
                                { icon: Facebook, href: '#' },
                                { icon: Twitter, href: '#' },
                                { icon: Instagram, href: '#' },
                                { icon: Linkedin, href: '#' },
                            ].map((social, idx) => (
                                <motion.a
                                    key={idx}
                                    href={social.href}
                                    whileHover={{ y: -4, scale: 1.1 }}
                                    className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors shadow-lg"
                                >
                                    <social.icon size={18} />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
                            <span className="w-4 h-1 bg-emerald-500 rounded-full"></span>
                            Quick Links
                        </h4>
                        <ul className="space-y-4">
                            {['Home', 'Marketplace', 'Services', 'Contact Us'].map((item, idx) => (
                                <li key={idx}>
                                    <a
                                        href={`#${item.toLowerCase().replace(' ', '-')}`}
                                        className="text-slate-400 hover:text-emerald-400 transition-colors text-sm font-medium flex items-center gap-2 group relative overflow-hidden"
                                    >
                                        <motion.span
                                            initial={{ x: -10, opacity: 0 }}
                                            whileInView={{ x: 0, opacity: 1 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="w-1.5 h-1.5 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-colors"
                                        />
                                        <span className="relative z-10">{item}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
                            <span className="w-4 h-1 bg-emerald-500 rounded-full"></span>
                            Features
                        </h4>
                        <ul className="space-y-4">
                            {[
                                'Digital Onboarding',
                                'Rent Collection',
                                'Maintenance Tracking',
                                'Financial Reports'
                            ].map((item, idx) => (
                                <li key={idx}>
                                    <a href="#services" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm font-medium group flex flex-col">
                                        <span className="relative inline-block w-fit">
                                            {item}
                                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-semibold mb-6 flex items-center gap-2">
                            <span className="w-4 h-1 bg-emerald-500 rounded-full"></span>
                            Contact Us
                        </h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4 text-sm text-slate-400 font-medium hover:text-emerald-400 transition-colors group">
                                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                                    <MapPin size={16} />
                                </div>
                                <span className="pt-2">Ground Floor, UDSM.<br />Dar Es Salaam, Tanzania</span>
                            </li>
                            <li className="flex items-center gap-4 text-sm text-slate-400 font-medium hover:text-emerald-400 transition-colors group">
                                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                                    <Phone size={16} />
                                </div>
                                <span>+255 678 900 269</span>
                            </li>
                            <li className="flex items-center gap-4 text-sm text-slate-400 font-medium hover:text-emerald-400 transition-colors group">
                                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                                    <Mail size={16} />
                                </div>
                                <span>info@pms.co.tz</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-500 font-medium">
                        &copy; {new Date().getFullYear()} Alcove PMS. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors">Privacy Policy</a>
                        <a href="#" className="text-xs text-slate-500 hover:text-slate-300 font-medium transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default SiteFooter;
