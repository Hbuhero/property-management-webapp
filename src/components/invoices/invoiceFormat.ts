export function formatInvoiceMoney(
    amount: number | null | undefined,
    currency = 'TZS',
): string {
    if (amount == null || Number.isNaN(amount)) return '-';
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatInvoiceDate(value: string | null | undefined): string {
    if (!value) return '-';
    const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
    if (Number.isNaN(d.getTime())) return value.slice(0, 10);
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(d);
}
