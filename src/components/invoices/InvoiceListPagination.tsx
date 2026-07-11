import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

type Props = {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    disabled?: boolean;
};

/** Simple 1-based page controls for invoice history. */
export function InvoiceListPagination({ page, totalPages, onPageChange, disabled }: Props) {
    const { t } = useTranslation();
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between gap-3 pt-3">
            <p className="text-xs text-slate-500">
                {t('invoices.pageOf', { page, total: totalPages })}
            </p>
            <div className="flex gap-2">
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={disabled || page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    {t('invoices.prevPage')}
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={disabled || page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    {t('invoices.nextPage')}
                </Button>
            </div>
        </div>
    );
}
