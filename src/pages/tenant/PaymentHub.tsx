import { useState } from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

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

export default PaymentHub;
