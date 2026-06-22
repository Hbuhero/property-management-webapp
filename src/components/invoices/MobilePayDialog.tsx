import { useState } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatInvoiceDate, formatInvoiceMoney } from '@/components/invoices/invoiceFormat';
import { showError } from '@/lib/toast';
import { usePayMobileInvoice } from '@/queries/invoice.queries';
import type { Invoice } from '@/schemas/invoice.schema';

type Props = {
    invoice: Invoice | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPaid?: (invoice: Invoice) => void;
};

export function MobilePayDialog({ invoice, open, onOpenChange, onPaid }: Props) {
    const payMut = usePayMobileInvoice();
    const [phone, setPhone] = useState('');
    const [provider, setProvider] = useState<'mpesa' | 'tigo'>('mpesa');

    const handlePay = async () => {
        if (!invoice) return;
        try {
            const paid = await payMut.mutateAsync(invoice.id);
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#059669', '#34d399'],
            });
            onOpenChange(false);
            setPhone('');
            onPaid?.(paid);
        } catch (error) {
            showError(error instanceof Error ? error.message : 'Payment failed.');
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!payMut.isPending) onOpenChange(next);
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Pay with mobile money</DialogTitle>
                    <DialogDescription>
                        {invoice
                            ? `${formatInvoiceMoney(invoice.amount, invoice.currency)} due ${formatInvoiceDate(invoice.dueDate)}`
                            : 'Complete your mobile payment.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div>
                        <Label className="mb-3 block">Provider</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'mpesa' as const, label: 'M-Pesa', color: 'bg-red-600', letter: 'M' },
                                { id: 'tigo' as const, label: 'Tigo Pesa', color: 'bg-blue-600', letter: 'T' },
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => setProvider(method.id)}
                                    className={`flex flex-col items-center rounded-xl border-2 p-4 transition-all ${
                                        provider === method.id
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                            : 'border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    <div
                                        className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold italic text-white ${method.color}`}
                                    >
                                        {method.letter}
                                    </div>
                                    <span className="text-sm font-semibold">{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="mobile-pay-phone">Phone number</Label>
                        <Input
                            id="mobile-pay-phone"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="07XX XXX XXX"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={payMut.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={() => void handlePay()}
                        disabled={payMut.isPending || !invoice}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        {payMut.isPending ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                                Processing…
                            </span>
                        ) : (
                            'Pay now'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
