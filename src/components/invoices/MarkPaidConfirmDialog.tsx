import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatInvoiceDate, formatInvoiceMoney } from '@/components/invoices/invoiceFormat';
import { showError, showSuccess } from '@/lib/toast';
import { useMarkInvoicePaid } from '@/queries/invoice.queries';
import type { Invoice } from '@/schemas/invoice.schema';

type Props = {
    invoice: Invoice | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirmed?: () => void;
};

export function MarkPaidConfirmDialog({ invoice, open, onOpenChange, onConfirmed }: Props) {
    const markPaidMut = useMarkInvoicePaid();

    const handleConfirm = async () => {
        if (!invoice) return;
        try {
            await markPaidMut.mutateAsync(invoice.id);
            showSuccess('Invoice marked as paid.');
            onOpenChange(false);
            onConfirmed?.();
        } catch (error) {
            showError(error instanceof Error ? error.message : 'Could not mark invoice as paid.');
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm cash payment</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                            <p>
                                Mark this invoice as paid after you have received cash from the tenant.
                            </p>
                            {invoice ? (
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {invoice.item?.label ?? 'Invoice'} ·{' '}
                                    {formatInvoiceMoney(invoice.amount, invoice.currency)} · due{' '}
                                    {formatInvoiceDate(invoice.dueDate)}
                                </p>
                            ) : null}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={markPaidMut.isPending}>Cancel</AlertDialogCancel>
                    <Button
                        type="button"
                        onClick={() => void handleConfirm()}
                        disabled={markPaidMut.isPending || !invoice}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        {markPaidMut.isPending ? 'Saving…' : 'Mark as paid'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
