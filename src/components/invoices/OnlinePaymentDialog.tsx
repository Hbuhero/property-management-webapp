import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Check, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatInvoiceDate, formatInvoiceMoney } from '@/components/invoices/invoiceFormat';
import { showError, showInfo, showSuccess } from '@/lib/toast';
import { useInitiatePayment, usePaymentStatus } from '@/queries/invoice.queries';
import type { Invoice } from '@/schemas/invoice.schema';

type Props = {
    invoice: Invoice | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPaid?: (invoice: Invoice) => void;
};

export function OnlinePaymentDialog({ invoice, open, onOpenChange, onPaid }: Props) {
    const { mutateAsync: initiatePayment, isPending: isInitiating } = useInitiatePayment();
    const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
    const [copied, setCopied] = useState(false);
    const celebratedRef = useRef(false);
    const initiatedForIdRef = useRef<number | null>(null);

    const paymentReference = activeInvoice?.paymentReference ?? null;
    const isPaid = activeInvoice?.status === 'PAID';

    const statusQuery = usePaymentStatus(activeInvoice?.id, {
        enabled: open && !!paymentReference && !isPaid,
        refetchInterval: open && !!paymentReference && !isPaid ? 5000 : false,
    });

    useEffect(() => {
        if (!open || !invoice) {
            initiatedForIdRef.current = null;
            return;
        }
        celebratedRef.current = false;
        setCopied(false);
        setActiveInvoice(invoice);
        // Intentionally seed once per open/invoice id — avoid wiping control number on parent refetches.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- invoice snapshot on open
    }, [open, invoice?.id]);

    useEffect(() => {
        if (!open || !invoice) return;
        if (invoice.paymentReference) return;
        if (initiatedForIdRef.current === invoice.id) return;

        initiatedForIdRef.current = invoice.id;
        void initiatePayment(invoice.id)
            .then((initiated) => {
                setActiveInvoice(initiated);
            })
            .catch((error) => {
                initiatedForIdRef.current = null;
                showError(
                    error instanceof Error
                        ? error.message
                        : 'Could not generate payment control number.',
                );
                onOpenChange(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per open without reference
    }, [open, invoice?.id, invoice?.paymentReference, initiatePayment, onOpenChange]);

    useEffect(() => {
        const status = statusQuery.data;
        if (!open || !status) return;

        setActiveInvoice(status.invoice);

        const paid = status.gatewayPaid || status.invoice.status === 'PAID';
        if (!paid || celebratedRef.current) return;

        celebratedRef.current = true;
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#059669', '#34d399'],
        });
        showSuccess('Payment confirmed.');
        onPaid?.(status.invoice);
        onOpenChange(false);
    }, [statusQuery.data, open, onPaid, onOpenChange]);

    const handleCopy = async () => {
        if (!paymentReference) return;
        try {
            await navigator.clipboard.writeText(paymentReference);
            setCopied(true);
            showInfo('Control number copied.');
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            showError('Could not copy control number.');
        }
    };

    const initiating = isInitiating || (open && !!invoice && !paymentReference);
    const paidAmount = statusQuery.data?.paidAmount ?? activeInvoice?.gatewayPaidAmount ?? 0;

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!isInitiating) onOpenChange(next);
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Online payment</DialogTitle>
                    <DialogDescription>
                        {activeInvoice
                            ? `${formatInvoiceMoney(activeInvoice.amount, activeInvoice.currency)} due ${formatInvoiceDate(activeInvoice.dueDate)}`
                            : 'Pay with your bank or mobile money using a control number.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {initiating ? (
                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 dark:border-slate-700 dark:bg-slate-900/40">
                            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Generating your payment control number…
                            </p>
                        </div>
                    ) : paymentReference ? (
                        <>
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                                    Control number
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <p className="flex-1 font-mono text-lg font-semibold tracking-wide text-slate-900 dark:text-white">
                                        {paymentReference}
                                    </p>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="outline"
                                        onClick={() => void handleCopy()}
                                        aria-label="Copy control number"
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-600 dark:text-slate-300">
                                <li>Copy the control number above.</li>
                                <li>
                                    Pay the exact amount at your bank or mobile money using that
                                    number.
                                </li>
                                <li>
                                    Keep this window open — we check payment status automatically.
                                </li>
                            </ol>

                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                {statusQuery.isFetching ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                                )}
                                <span>
                                    Checking payment…{' '}
                                    {paidAmount > 0
                                        ? `Received ${formatInvoiceMoney(paidAmount, activeInvoice?.currency ?? 'TZS')}`
                                        : 'No payment yet'}
                                </span>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-slate-500">No control number available.</p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => onOpenChange(false)}
                        disabled={isInitiating}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
