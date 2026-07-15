import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatInvoiceDate, formatInvoiceMoney } from '@/components/invoices/invoiceFormat';
import { showError, showSuccess } from '@/lib/toast';
import { useBillablePeriods, useCreateManualInvoice } from '@/queries/invoice.queries';
import type { BillablePeriod, PaymentMethod } from '@/schemas/invoice.schema';

type Props = {
    leaseContractId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: () => void;
};

export function RequestInvoiceDialog({
    leaseContractId,
    open,
    onOpenChange,
    onCreated,
}: Props) {
    const periodsQuery = useBillablePeriods(open ? leaseContractId : undefined);
    const createMut = useCreateManualInvoice();
    const [periodKey, setPeriodKey] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MOBILE');

    const periods = useMemo(() => periodsQuery.data ?? [], [periodsQuery.data]);
    const periodByKey = useMemo(() => {
        const map = new Map<string, BillablePeriod>();
        for (const period of periods) {
            map.set(period.scheduleKey, period);
        }
        return map;
    }, [periods]);

    const selectedPeriodKey = periodKey || periods[0]?.scheduleKey || '';
    const selectedPeriod = selectedPeriodKey ? periodByKey.get(selectedPeriodKey) : undefined;

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setPeriodKey('');
            setPaymentMethod('MOBILE');
        }
        onOpenChange(next);
    };

    const handleSubmit = async () => {
        if (!selectedPeriod) {
            showError('Select a billing period.');
            return;
        }
        try {
            await createMut.mutateAsync({
                leaseContractId,
                leaseContractItemId: selectedPeriod.leaseContractItemId,
                periodIndex: selectedPeriod.periodIndex,
                paymentMethod,
            });
            showSuccess('Invoice requested.');
            handleOpenChange(false);
            onCreated?.();
        } catch (error) {
            showError(error instanceof Error ? error.message : 'Could not create invoice.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Request invoice</DialogTitle>
                    <DialogDescription>
                        Choose an unpaid billing period and how you want to pay.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Billing period</Label>
                        {periodsQuery.isLoading ? (
                            <p className="text-sm text-slate-500">Loading billable periods…</p>
                        ) : periods.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                No billable periods are available right now.
                            </p>
                        ) : (
                            <Select value={selectedPeriodKey} onValueChange={setPeriodKey}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    {periods.map((period) => (
                                        <SelectItem key={period.scheduleKey} value={period.scheduleKey}>
                                            {period.label} · {formatInvoiceDate(period.dueDate)} ·{' '}
                                            {formatInvoiceMoney(period.amount)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Payment method</Label>
                        <Select
                            value={paymentMethod}
                            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MOBILE">Online (control number)</SelectItem>
                                <SelectItem value="CASH">Cash (owner confirmation)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={() => void handleSubmit()}
                        disabled={createMut.isPending || !selectedPeriod}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        {createMut.isPending ? 'Creating…' : 'Request invoice'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
