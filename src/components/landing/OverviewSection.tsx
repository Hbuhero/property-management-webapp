import { motion } from 'framer-motion';

const OverviewSection = () => {
    return (
        <section id="overview" className="py-24 bg-white dark:bg-slate-900 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                    >
                        <h4 className="text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase text-sm mb-4">
                            Company Overview
                        </h4>
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                            BELCOL Partners
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                            BELCOL Partners delivers professional, system-driven property management services focused on maximizing owner returns while eliminating the complexities and stress of property ownership.
                        </p>
                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                            With more than 65 units under management, BELCOL Partners has a proven track record of delivering predictable cash flow, efficient operations, and sustainable growth for property owners. We provide transparent reporting, real-time updates, and strategic guidance to help improve profitability and tenant satisfaction.
                        </p>

                        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <div>
                                <p className="text-4xl font-extrabold text-slate-900 dark:text-white text-emerald-600 dark:text-emerald-400 mb-1">
                                    65+
                                </p>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Units Managed
                                </p>
                            </div>
                            <div>
                                <p className="text-4xl font-extrabold text-slate-900 dark:text-white text-emerald-600 dark:text-emerald-400 mb-1">
                                    95%
                                </p>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                    Rent Collected <br />Within 7 Days
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="relative"
                    >
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5]">
                            <img
                                src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&q=80&w=1200"
                                alt="Cityscape"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                        </div>

                        {/* Overlay card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="absolute -bottom-8 -left-8 md:left-auto md:-right-8 bg-slate-800 text-white p-8 rounded-2xl shadow-xl max-w-xs z-10"
                        >
                            <h3 className="text-2xl font-bold mb-2">Tanzania</h3>
                            <p className="text-slate-300 text-sm">Managing residential and commercial properties across the region.</p>
                        </motion.div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default OverviewSection;
