import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const ContactSection = () => {
    return (
        <section id="contact" className="py-24 bg-white dark:bg-slate-900 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.h4
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase text-sm mb-4"
                    >
                        Get In Touch
                    </motion.h4>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6"
                    >
                        Contact Us
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-600 dark:text-slate-300"
                    >
                        Ready to experience our services? Let's start planning.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Ask us anything.</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-10 leading-relaxed text-lg">
                            Are you a property owner looking for professional management? Or simply inspired by what we're building? Let's connect.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start">
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-full mr-4 text-emerald-600 dark:text-emerald-400">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Office Location</h4>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">Ground Floor, Info-tech Building, Mwai Kibaki Road, Kawe.<br />Dar Es Salaam, Tanzania</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-full mr-4 text-emerald-600 dark:text-emerald-400">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Phone</h4>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">+255 742 414 569</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-full mr-4 text-emerald-600 dark:text-emerald-400">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Email</h4>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">info@belcol-partners.com</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-full mr-4 text-emerald-600 dark:text-emerald-400">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Business Hours</h4>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">Mon - Fri: 8:00 AM - 5:00 PM</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700"
                    >
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Send us a message</h3>
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name*</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address*</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message*</label>
                                <textarea
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors outline-none resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-slate-900 dark:bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors shadow-lg hover:shadow-emerald-500/20"
                            >
                                Submit
                            </button>
                        </form>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default ContactSection;
