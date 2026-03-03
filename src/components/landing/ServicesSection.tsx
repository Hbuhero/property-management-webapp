import { CreditCard, Users, Zap, Wrench, FileText, Scale } from 'lucide-react';
import { motion } from 'framer-motion';

const services = [
    {
        icon: <CreditCard className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
        title: 'Rent Collection & Arrears Tracking',
        description: 'Secure and timely rent collection with system-driven automation, reminders, and proactive follow-ups to minimize arrears and late payments.',
    },
    {
        icon: <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
        title: 'Tenant Management',
        description: 'Professional handling of tenant relations including communications, lease agreements, renewals, extensions, and dispute resolution.',
    },
    {
        icon: <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
        title: 'Utilities & Service Management',
        description: 'Monitoring electricity, water, and generator fuel consumption while supervising cleaning, security, and maintenance teams.',
    },
    {
        icon: <Wrench className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
        title: 'Maintenance Coordination',
        description: 'Proactive approach to property maintenance with vetted service providers, documented repairs, and comprehensive reporting.',
    },
    {
        icon: <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
        title: 'Financial Reporting',
        description: 'Comprehensive monthly financial statements detailing income, expenses, arrears, and utility charges for full visibility.',
    },
    {
        icon: <Scale className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
        title: 'Legal & Compliance',
        description: 'Ensuring all activities comply with Tanzanian laws and commercial property regulations with proper documentation.',
    }
];

const ServicesSection = () => {
    return (
        <section id="services" className="py-24 bg-slate-50 dark:bg-slate-800/50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.h4
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase text-sm mb-4"
                    >
                        What We Offer
                    </motion.h4>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6"
                    >
                        Our Services
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-600 dark:text-slate-300"
                    >
                        A comprehensive range of property management services designed to maximize your returns.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                            whileHover={{ y: -5 }}
                            className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm hover:shadow-xl dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all duration-300 group"
                        >
                            <div className="w-14 h-14 bg-emerald-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                {service.icon}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                                {service.title}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                                {service.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
};

export default ServicesSection;
