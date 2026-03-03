import { motion } from 'framer-motion';

const HeroSection = () => {
    return (
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000"
                    className="w-full h-full object-cover brightness-50"
                    alt="Hero background"
                />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-6xl font-extrabold text-white mb-6"
                >
                    Your Property Deserves <br className="hidden md:block" />
                    More Than Management
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-xl text-slate-200 mb-10 max-w-2xl mx-auto"
                >
                    A partner committed to growing its value, protecting your investment, and ensuring consistent returns with complete peace of mind.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 max-w-lg mx-auto"
                >
                    <button className="bg-white text-slate-900 px-8 py-3 rounded-full font-semibold hover:bg-slate-100 transition-colors shadow-lg flex items-center justify-center group">
                        Our Services
                        <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                    <button className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors">
                        Contact Us
                    </button>
                </motion.div>
            </div>
        </section>
    );
};

export default HeroSection;
