import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { InvoiceStatusFilterValue } from '@/schemas/invoice.schema';

const OPTIONS: InvoiceStatusFilterValue[] = ['ALL', 'PENDING', 'PAID', 'CANCELLED'];

type Props = {
    value: InvoiceStatusFilterValue;
    onChange: (value: InvoiceStatusFilterValue) => void;
};

export function InvoiceStatusFilter({ value, onChange }: Props) {
    const { t } = useTranslation();

    const label = (status: InvoiceStatusFilterValue) => {
        switch (status) {
            case 'ALL':
                return t('invoices.filterAll');
            case 'PENDING':
                return t('invoices.filterPending');
            case 'PAID':
                return t('invoices.filterPaid');
            case 'CANCELLED':
                return t('invoices.filterCancelled');
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="w-fit">
                    {label(value)}
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{t('invoices.statusFilter')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {OPTIONS.map((option) => (
                    <DropdownMenuItem key={option} onClick={() => onChange(option)}>
                        {label(option)}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
