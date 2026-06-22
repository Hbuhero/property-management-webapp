import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PageBackLinkProps = {
    to: string;
    label: string;
    variant?: 'button' | 'text';
    className?: string;
};

export function PageBackLink({ to, label, variant = 'button', className }: PageBackLinkProps) {
    if (variant === 'text') {
        return (
            <Link
                to={to}
                className={cn(
                    'inline-flex w-fit items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400',
                    className,
                )}
            >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                {label}
            </Link>
        );
    }

    return (
        <Button asChild variant="ghost" className={cn('w-fit', className)}>
            <Link to={to}>
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {label}
            </Link>
        </Button>
    );
}
