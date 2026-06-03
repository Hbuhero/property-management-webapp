import type { LeaseContract } from '@/schemas/leaseContract.schema';

export type LeaseTimeFrameValue = NonNullable<LeaseContract['items'][number]['timeFrame']>;

export type ScheduleEntry = {
    key: string;
    label: string;
    date: string;
    amount: number;
    periodIndex: number;
    scheduleKey?: string;
    leaseContractItemId?: number;
    muted?: boolean;
};

export type ScheduleContractContext = {
    contractId?: number;
    contractStartDate: string;
    paymentDayOfMonth?: number | null;
};

export type ScheduleItemInput = {
    id?: number | null;
    key?: string;
    label?: string;
    totalAmount?: number | null;
    amount: number | null | undefined;
    leaseType?: 'RECURRING' | 'ONE_TIME' | null;
    timeFrame?: LeaseTimeFrameValue | null;
    recurringNumber?: number | null;
    startDate?: string | null;
};

type BuildItemOptions = {
    itemIndex?: number;
    keyPrefix?: string;
    useContractStartFallback?: boolean;
    strictRecurringTimeline?: boolean;
    mutedAfterFirst?: boolean;
};

export function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

export function normalizePaymentDay(paymentDayOfMonth?: number | null): number {
    if (paymentDayOfMonth == null) return 1;
    return Math.min(Math.max(paymentDayOfMonth, 1), 28);
}

export function scheduleKey(contractId: number, itemId: number, periodIndex: number): string {
    return `${contractId}:${itemId}:${periodIndex}`;
}

export function addTimelineOffset(
    startIso: string,
    timeFrame: LeaseTimeFrameValue | null | undefined,
    offset: number,
): string | null {
    const d = new Date(`${startIso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    switch (timeFrame) {
        case 'DAY':
            d.setDate(d.getDate() + offset);
            break;
        case 'MONTH':
            d.setMonth(d.getMonth() + offset);
            break;
        case 'YEAR':
            d.setFullYear(d.getFullYear() + offset);
            break;
        case 'NONE':
        case null:
        case undefined:
            return startIso;
    }
    return d.toISOString().slice(0, 10);
}

/** End of a recurring span (inclusive), used for draft item previews. */
export function addTimelineUnits(
    startIso: string,
    timeFrame: LeaseTimeFrameValue,
    count: number,
): string | null {
    const d = new Date(`${startIso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    switch (timeFrame) {
        case 'DAY':
            d.setDate(d.getDate() + count);
            break;
        case 'MONTH':
            d.setMonth(d.getMonth() + count);
            break;
        case 'YEAR':
            d.setFullYear(d.getFullYear() + count);
            break;
        case 'NONE':
            return startIso;
    }
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

export function applyPaymentDayOfMonth(
    dueDateIso: string,
    timeFrame: LeaseTimeFrameValue | null | undefined,
    paymentDayOfMonth: number,
): string {
    if (timeFrame !== 'MONTH' && timeFrame !== 'YEAR') {
        return dueDateIso;
    }
    const d = new Date(`${dueDateIso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dueDateIso;
    const clampedDay = normalizePaymentDay(paymentDayOfMonth);
    const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(clampedDay, maxDay));
    return d.toISOString().slice(0, 10);
}

export function buildContractItemScheduleEntries(
    item: ScheduleItemInput,
    contract: LeaseContract,
    itemIndex: number,
): ScheduleEntry[] {
    return buildItemScheduleEntries(
        item,
        {
            contractId: contract.id,
            contractStartDate: contract.startDate,
            paymentDayOfMonth: contract.paymentDayOfMonth,
        },
        itemIndex,
        { useContractStartFallback: true },
    );
}

export function buildScheduleEntries(contract: LeaseContract): ScheduleEntry[] {
    return contract.items
        .flatMap((item, index) =>
            buildContractItemScheduleEntries(
                {
                    id: item.id,
                    label: item.label,
                    amount: item.amount,
                    leaseType: item.leaseType,
                    timeFrame: item.timeFrame,
                    recurringNumber: item.recurringNumber,
                    startDate: item.startDate,
                },
                contract,
                index,
            ),
        )
        .sort((a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key));
}

export function buildDraftItemScheduleEntries(
    item: ScheduleItemInput,
    keyPrefix: string,
    ctx: Pick<ScheduleContractContext, 'contractId' | 'paymentDayOfMonth'>,
): ScheduleEntry[] {
    return buildItemScheduleEntries(
        item,
        { contractStartDate: '', ...ctx },
        0,
        {
            keyPrefix,
            useContractStartFallback: false,
            strictRecurringTimeline: true,
            mutedAfterFirst: true,
        },
    );
}

export function nextDueEntry(
    entries: ScheduleEntry[],
    today: string = todayIso(),
): ScheduleEntry | undefined {
    if (entries.length === 0) return undefined;
    return entries.find((entry) => entry.date >= today) ?? entries[0];
}

export function leaseItemTotal(item: ScheduleItemInput): number | undefined {
    if (item.totalAmount != null) return item.totalAmount;
    if (item.amount == null) return undefined;
    if (item.leaseType !== 'RECURRING') return item.amount;
    return item.amount * (item.recurringNumber ?? 1);
}

export function contractTotalValue(contract: LeaseContract): number | undefined {
    const totals = contract.items
        .map((item) =>
            leaseItemTotal({
                amount: item.amount,
                totalAmount: item.totalAmount,
                leaseType: item.leaseType,
                recurringNumber: item.recurringNumber,
            }),
        )
        .filter((value): value is number => value != null);
    if (totals.length === 0) return undefined;
    return totals.reduce((sum, value) => sum + value, 0);
}

function buildItemScheduleEntries(
    item: ScheduleItemInput,
    ctx: ScheduleContractContext,
    itemIndex: number,
    options: BuildItemOptions = {},
): ScheduleEntry[] {
    const paymentDay = normalizePaymentDay(ctx.paymentDayOfMonth);
    const startDate = options.useContractStartFallback
        ? item.startDate ?? ctx.contractStartDate
        : item.startDate;
    const amount = item.amount;

    if (!startDate || amount == null || amount <= 0) {
        return [];
    }

    const keyStem = options.keyPrefix ?? `${item.id ?? item.label ?? 'item'}-${itemIndex}`;
    const contractId = ctx.contractId;
    const itemId = item.id ?? undefined;
    const baseLabel = item.label?.trim() || 'Charge';

    const toEntry = (
        periodIndex: number,
        date: string,
        label: string,
        muted?: boolean,
    ): ScheduleEntry => {
        const key = `${keyStem}-${periodIndex}`;
        const entry: ScheduleEntry = {
            key,
            label,
            date,
            amount,
            periodIndex,
            muted,
            leaseContractItemId: itemId,
        };
        if (contractId != null && itemId != null) {
            entry.scheduleKey = scheduleKey(contractId, itemId, periodIndex);
        }
        return entry;
    };

    if (item.leaseType !== 'RECURRING') {
        return [toEntry(0, startDate, baseLabel === 'Charge' ? 'One-time charge' : baseLabel)];
    }

    const count = item.recurringNumber ?? 1;
    if (count < 1 || !Number.isInteger(count)) {
        return [];
    }

    const timeFrame = item.timeFrame;
    if (!timeFrame || timeFrame === 'NONE') {
        if (options.strictRecurringTimeline) {
            return [];
        }
        return [toEntry(0, startDate, baseLabel === 'Charge' ? 'Recurring charge' : baseLabel)];
    }

    return Array.from({ length: count }, (_, idx) => {
        const rawDate = addTimelineOffset(startDate, timeFrame, idx) ?? startDate;
        const date = applyPaymentDayOfMonth(rawDate, timeFrame, paymentDay);
        const label =
            count === 1
                ? baseLabel === 'Charge'
                    ? 'Recurring charge'
                    : baseLabel
                : `${baseLabel === 'Charge' ? 'Recurring charge' : baseLabel} ${idx + 1}`;
        return toEntry(idx, date, label, options.mutedAfterFirst ? idx > 0 : undefined);
    });
}
