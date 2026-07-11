import type { ComponentProps } from 'react';
import { Loader2, FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = Omit<ComponentProps<typeof Button>, 'onClick' | 'children'> & {
    /** Kick off the PDF download (usually a mutation.mutateAsync). */
    onDownload: () => void | Promise<void>;
    isLoading?: boolean;
    label?: string;
    loadingLabel?: string;
    /** Hide the download icon (useful in dense table rows). */
    hideIcon?: boolean;
};

/**
 * Shared PDF export control used on tenant and landlord surfaces.
 */
export function DownloadReportButton({
    onDownload,
    isLoading = false,
    label,
    loadingLabel,
    hideIcon = false,
    className,
    disabled,
    variant = 'outline',
    size = 'sm',
    type = 'button',
    ...rest
}: Props) {
    const { t } = useTranslation();
    const resolvedLabel = label ?? t('reports.downloadPdf');
    const resolvedLoading = loadingLabel ?? t('reports.downloading');

    return (
        <Button
            type={type}
            variant={variant}
            size={size}
            disabled={disabled || isLoading}
            className={cn(className)}
            onClick={() => {
                void onDownload();
            }}
            {...rest}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : hideIcon ? null : (
                <FileDown className="h-4 w-4" />
            )}
            {isLoading ? resolvedLoading : resolvedLabel}
        </Button>
    );
}
