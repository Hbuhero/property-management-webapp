import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    CircleCheck,
    FileText,
    Home,
    ReceiptText,
    ShieldCheck,
    XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { showError, showSuccess } from '@/lib/toast';
import { useApplication } from '@/queries/application.queries';
import {
    useAcceptLeaseContract,
    useLeaseContracts,
    useRejectLeaseContract,
} from '@/queries/leaseContract.queries';
import type { ApplicationStatus } from '@/schemas/application.schema';
import type { LeaseContract } from '@/schemas/leaseContract.schema';

type ApplicantDataView = {
    stay?: string;
    requirements: Array<{ question: string; answer: string }>;
    legacyLines: string[];
};

type ScheduleEntry = {
    key: string;
    label: string;
    date: string;
    amount: number | undefined;
};

type LeaseItem = LeaseContract['items'][number];

type LeaseItemScheduleGroup = {
    key: string;
    item: LeaseItem;
    entries: ScheduleEntry[];
    total: number | undefined;
    summary: string;
};

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

function formatMoney(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) return '-';
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'TZS',
        maximumFractionDigits: 0,
    }).format(n);
}

function formatDate(value: string | null | undefined): string {
    if (!value) return '-';
    const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
    if (Number.isNaN(d.getTime())) return value.slice(0, 10);
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(d);
}

function formatMonthYear(value: string | null | undefined): string {
    if (!value) return '-';
    const d = new Date(`${value.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(d.getTime())) return value.slice(0, 7);
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        year: 'numeric',
    }).format(d);
}

function statusPillClass(status: ApplicationStatus | LeaseContract['status'] | 'NONE'): string {
    switch (status) {
        case 'PENDING':
        case 'DRAFT':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
        case 'APPROVED':
        case 'ACCEPTED':
        case 'CONTRACT_ACCEPTED':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
        case 'SENT':
        case 'CONTRACT_SENT':
            return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300';
        case 'REJECTED':
        case 'CONTRACT_REJECTED':
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        case 'WITHDRAWN':
        case 'TERMINATED':
        case 'NONE':
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        default:
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
}

function parseApplicantData(raw: string | null | undefined): ApplicantDataView {
    if (!raw?.trim()) return { requirements: [], legacyLines: [] };
    try {
        const parsed = JSON.parse(raw) as {
            bookingWindow?: {
                checkInDate?: string;
                checkOutDate?: string;
            };
            bookingRequirements?: Array<{ question?: string; answer?: string }>;
        };
        const stay =
            parsed.bookingWindow?.checkInDate && parsed.bookingWindow?.checkOutDate
                ? `${formatDate(parsed.bookingWindow.checkInDate)} to ${formatDate(parsed.bookingWindow.checkOutDate)}`
                : undefined;
        const requirements = Array.isArray(parsed.bookingRequirements)
            ? parsed.bookingRequirements
                  .map((item) => ({
                      question: item.question?.trim() ?? '',
                      answer: item.answer?.trim() ?? '',
                  }))
                  .filter((item) => item.question || item.answer)
            : [];
        return { stay, requirements, legacyLines: [] };
    } catch {
        return {
            requirements: [],
            legacyLines: raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
        };
    }
}

function initials(value: string | null | undefined): string {
    const source = value?.trim() || 'Lease';
    return source
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function addTimelineOffset(
    startIso: string,
    timeFrame: LeaseItem['timeFrame'],
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

function leaseDurationLabel(startDate: string, endDate: string): string {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
        return '-';
    }
    const exclusiveEnd = new Date(end);
    exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
    const months =
        (exclusiveEnd.getFullYear() - start.getFullYear()) * 12 +
        (exclusiveEnd.getMonth() - start.getMonth());
    if (months >= 1 && exclusiveEnd.getDate() === start.getDate()) {
        return `${months} month${months === 1 ? '' : 's'}`;
    }
    const days = Math.max(1, Math.round((exclusiveEnd.getTime() - start.getTime()) / 86_400_000));
    return `${days} day${days === 1 ? '' : 's'}`;
}

function timeFrameLabel(timeFrame: LeaseItem['timeFrame']): string {
    switch (timeFrame) {
        case 'DAY':
            return 'Daily';
        case 'MONTH':
            return 'Monthly';
        case 'YEAR':
            return 'Yearly';
        case 'NONE':
        case null:
        case undefined:
            return 'One-time';
    }
}

function itemTotal(item: LeaseItem): number | undefined {
    if (item.totalAmount != null) return item.totalAmount;
    if (item.amount == null) return undefined;
    if (item.leaseType !== 'RECURRING') return item.amount;
    return item.amount * (item.recurringNumber ?? 1);
}


function contractTotalValue(contract: LeaseContract): number | undefined {
    const totals = contract.items.map(itemTotal).filter((value): value is number => value != null);
    if (totals.length === 0) return undefined;
    return totals.reduce((sum, value) => sum + value, 0);
}

function leaseItemScheduleEntries(item: LeaseItem, contract: LeaseContract, itemIndex: number): ScheduleEntry[] {
    const startDate = item.startDate ?? contract.startDate;
    if (!startDate || item.amount == null || item.amount <= 0) return [];
    if (item.leaseType !== 'RECURRING') {
        return [
            {
                key: `${item.id ?? item.label}-${itemIndex}-once`,
                label: item.label || 'One-time charge',
                date: startDate,
                amount: item.amount,
            },
        ];
    }
    const count = item.recurringNumber ?? 1;
    if (count < 1 || !Number.isInteger(count)) return [];
    if (!item.timeFrame || item.timeFrame === 'NONE') {
        return [
            {
                key: `${item.id ?? item.label}-${itemIndex}-recurring`,
                label: item.label || 'Recurring charge',
                date: startDate,
                amount: item.amount,
            },
        ];
    }
    return Array.from({ length: count }, (_, idx) => ({
        key: `${item.id ?? item.label}-${itemIndex}-${idx}`,
        label: count === 1 ? item.label || 'Recurring charge' : `${item.label || 'Recurring charge'} ${idx + 1}`,
        date: addTimelineOffset(startDate, item.timeFrame, idx) ?? startDate,
        amount: item.amount,
    }));
}

function itemScheduleSummary(item: LeaseItem, entries: ScheduleEntry[]): string {
    const firstEntry = entries[0];
    if (!firstEntry) return 'Payment dates will appear after the owner completes this item.';
    if (item.leaseType !== 'RECURRING') return `One payment due ${formatDate(firstEntry.date)}.`;
    const count = item.recurringNumber ?? entries.length;
    if (!item.timeFrame || item.timeFrame === 'NONE') {
        return `${count} scheduled payment${count === 1 ? '' : 's'} beginning ${formatDate(firstEntry.date)}.`;
    }
    return `${count} ${timeFrameLabel(item.timeFrame).toLowerCase()} payment${count === 1 ? '' : 's'} beginning ${formatDate(firstEntry.date)}.`;
}

function leaseItemScheduleGroups(contract: LeaseContract): LeaseItemScheduleGroup[] {
    return contract.items.map((item, index) => {
        const entries = leaseItemScheduleEntries(item, contract, index).sort((a, b) => a.date.localeCompare(b.date));
        return {
            key: `${item.id ?? item.label}-${index}`,
            item,
            entries,
            total: itemTotal(item),
            startDate: item.startDate,
            // endDate: itemEndDate(item),
            summary: itemScheduleSummary(item, entries),
        };
    })
    .sort((a, b) => {
            const aDate = a.startDate || '9999-12-31';
            const bDate = b.startDate || '9999-12-31';
            const byDate = aDate.localeCompare(bDate);
            if (byDate !== 0) return byDate;
            return (a.item.label || '').localeCompare(b.item.label || '');
    });
}

function ContractSchedule({ contract }: { contract: LeaseContract | undefined }) {
    const [showFullSchedule, setShowFullSchedule] = useState(false);

    if (!contract) {
        return (
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                No contract schedule is available yet.
            </div>
        );
    }

    const scheduleGroups = leaseItemScheduleGroups(contract);
    const scheduleRange = `${formatMonthYear(contract.startDate)} - ${formatMonthYear(contract.endDate)}`;

    return (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                        Lease agreement
                    </p>
                    <h2 className="mt-1 text-xl font-medium leading-tight text-slate-950 dark:text-white">
                        Unit {contract.unit?.unitNumber ?? '-'} - {contract.property.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Tenant: {contract.tenant.name ?? contract.tenant.email ?? 'Tenant'}
                    </p>
                </div>
                <div className="ml-3 inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    <CircleCheck className="h-3 w-3" />
                    {contract.status.replace(/_/g, ' ')}
                </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                <div className="flex flex-col gap-1 px-4 py-4">
                    <span className="text-xs text-slate-500">Monthly rent</span>
                    <span className="text-lg font-medium text-slate-950 dark:text-white">
                        {formatMoney(contract.unit?.monthlyRent)}
                    </span>
                </div>
                <div className="flex flex-col gap-1 px-4 py-4">
                    <span className="text-xs text-slate-500">Duration</span>
                    <span className="text-lg font-medium text-slate-950 dark:text-white">
                        {leaseDurationLabel(contract.startDate, contract.endDate)}
                    </span>
                </div>
                <div className="flex flex-col gap-1 px-4 py-4">
                    <span className="text-xs text-slate-500">Total value</span>
                    <span className="text-lg font-medium text-slate-950 dark:text-white">
                        {formatMoney(contractTotalValue(contract))}
                    </span>
                </div>
            </div>

            <div className="px-5 py-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <span className="text-sm font-medium text-slate-950 dark:text-white">
                            Payment schedule
                        </span>
                        <p className="text-xs text-slate-500">Grouped by lease item start date</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">{scheduleRange}</span>
                </div>

                <div className="flex flex-col">
                    <div className="flex items-start gap-4">
                        <div className="flex w-5 min-w-5 flex-col items-center">
                            <div className="h-1.5 w-px bg-transparent" />
                            <div className="h-3 w-3 shrink-0 rounded-full border-2 border-blue-600 bg-blue-600" />
                            <div className="h-9 w-px bg-blue-600" />
                        </div>
                        <div className="flex flex-1 items-center justify-between pb-1 pt-0.5">
                            <div>
                                <p className="text-sm font-medium text-slate-950 dark:text-white">Lease start</p>
                                <p className="text-xs text-slate-500">{formatDate(contract.startDate)}</p>
                            </div>
                            <span className="rounded-sm bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                Start
                            </span>
                        </div>
                    </div>

                    {scheduleGroups.map((group) => {
                        const visibleEntries = showFullSchedule ? group.entries : group.entries.slice(0, 1);
                        const hiddenEntries = Math.max(0, group.entries.length - visibleEntries.length);

                        return (
                            <div key={group.key} className="flex items-start gap-4">
                                <div className="flex w-5 min-w-5 flex-col items-center">
                                    <div className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
                                    <div className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-slate-500 bg-white dark:bg-slate-950" />
                                    <div className="min-h-16 flex-1 w-px bg-[repeating-linear-gradient(to_bottom,rgb(226_232_240)_0px,rgb(226_232_240)_4px,transparent_4px,transparent_8px)] dark:bg-[repeating-linear-gradient(to_bottom,rgb(30_41_59)_0px,rgb(30_41_59)_4px,transparent_4px,transparent_8px)]" />
                                </div>

                                <div className="min-w-0 flex-1 pb-4">
                                    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                                                    {group.item.label || 'Untitled lease item'}
                                                </p>
                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                    {group.summary}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-sm font-semibold text-slate-950 dark:text-white">
                                                    {formatMoney(group.total)}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {timeFrameLabel(group.item.timeFrame)}
                                                </p>
                                            </div>
                                        </div>

                                        {visibleEntries.length > 0 ? (
                                            <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                                                {visibleEntries.map((entry, entryIdx) => (
                                                    <div
                                                        key={entry.key}
                                                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2"
                                                    >
                                                        <div className="flex min-w-0 items-center gap-2">
                                                            <span
                                                                className={`h-2 w-2 shrink-0 rounded-full ${
                                                                    entryIdx === 0
                                                                        ? 'bg-blue-600'
                                                                        : 'bg-slate-300 dark:bg-slate-700'
                                                                }`}
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                                                                    {entry.label}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {formatDate(entry.date)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-950 dark:text-white">
                                                            {formatMoney(entry.amount)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="mt-3 flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs text-slate-500 dark:bg-slate-950">
                                                <CalendarClock className="h-3.5 w-3.5" />
                                                No payment dates were included for this item.
                                            </div>
                                        )}

                                        {hiddenEntries > 0 ? (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="mt-2 h-8 px-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-300"
                                                onClick={() => setShowFullSchedule(true)}
                                            >
                                                {hiddenEntries} more payment{hiddenEntries === 1 ? '' : 's'}
                                                <ChevronDown className="h-3 w-3" />
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div className="flex items-start gap-4">
                        <div className="flex w-5 min-w-5 flex-col items-center">
                            <div className="h-3 w-px bg-slate-200 dark:bg-slate-800" />
                            <div className="h-3 w-3 shrink-0 rounded-full border-2 border-blue-600 bg-blue-600" />
                            <div className="h-1.5 w-px bg-transparent" />
                        </div>
                        <div className="flex flex-1 items-center justify-between pb-1 pt-0.5">
                            <div>
                                <p className="text-sm font-medium text-slate-950 dark:text-white">Lease end</p>
                                <p className="text-xs text-slate-500">{formatDate(contract.endDate)}</p>
                            </div>
                            <span className="rounded-sm bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800">
                                End
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center gap-2 text-slate-500">
                    <CalendarClock className="h-4 w-4" />
                    <span className="text-xs">{nextPaymentText(scheduleEntries)}</span>
                </div>
                {hasExpandableSchedule ? (
                    <button
                        type="button"
                        onClick={() => setShowFullSchedule((current) => !current)}
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300"
                    >
                        {showFullSchedule ? 'Condense' : 'Full schedule'}
                        {showFullSchedule ? (
                            <ChevronUp className="h-3 w-3" />
                        ) : (
                            <ArrowRight className="h-3 w-3" />
                        )}
                    </button>
                ) : null}
            </div> */}
        </div>
    );
}

function ContractDecisionPanel({
    contract,
    focused,
    termsAccepted,
    authenticityConfirmed,
    onTermsChange,
    onAuthenticityChange,
    onAccept,
    onReject,
    busy,
}: {
    contract: LeaseContract | undefined;
    focused: boolean;
    termsAccepted: boolean;
    authenticityConfirmed: boolean;
    onTermsChange: (checked: boolean) => void;
    onAuthenticityChange: (checked: boolean) => void;
    onAccept: () => void;
    onReject: () => void;
    busy: boolean;
}) {
    if (!contract) {
        return (
            <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <h2 className="font-semibold text-slate-950 dark:text-white">Manage contract</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                    No contract has been sent for this application yet.
                </p>
            </div>
        );
    }

    const canDecide = contract.status === 'SENT';

    return (
        <div
            id="contract-management"
            className={`rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition dark:border-slate-800 dark:bg-slate-950 ${
                focused ? 'ring-2 ring-emerald-500/40' : ''
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="font-semibold text-slate-950 dark:text-white">Manage contract</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {formatDate(contract.startDate)} to {formatDate(contract.endDate)}
                    </p>
                </div>
                <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${statusPillClass(contract.status)}`}>
                    {contract.status.replace(/_/g, ' ')}
                </span>
            </div>

            <div className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase text-slate-500">Payment day</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                        Day {contract.paymentDayOfMonth ?? 1}
                    </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs font-semibold uppercase text-slate-500">Terms version</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                        {contract.systemTermsVersion ?? 'v1'}
                    </p>
                </div>
            </div>

            {canDecide ? (
                <div className="mt-5 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="tenant-terms-accepted"
                            checked={termsAccepted}
                            onCheckedChange={(checked) => onTermsChange(Boolean(checked))}
                            className="mt-0.5 border-emerald-300 data-[state=checked]:bg-emerald-600"
                        />
                        <Label
                            htmlFor="tenant-terms-accepted"
                            className="cursor-pointer text-sm font-normal leading-5 text-slate-700 dark:text-slate-200"
                        >
                            I accept the system terms of agreement shown for this lease.
                        </Label>
                    </div>
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="tenant-authenticity-confirmed"
                            checked={authenticityConfirmed}
                            onCheckedChange={(checked) => onAuthenticityChange(Boolean(checked))}
                            className="mt-0.5 border-emerald-300 data-[state=checked]:bg-emerald-600"
                        />
                        <Label
                            htmlFor="tenant-authenticity-confirmed"
                            className="cursor-pointer text-sm font-normal leading-5 text-slate-700 dark:text-slate-200"
                        >
                            I confirm I have verified the property authenticity and details.
                        </Label>
                    </div>
                    <div className="grid gap-2 pt-2">
                        <Button
                            type="button"
                            disabled={!termsAccepted || !authenticityConfirmed || busy}
                            onClick={onAccept}
                            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Accept contract
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={busy}
                            onClick={onReject}
                            className="w-full border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                        >
                            <XCircle className="h-4 w-4" />
                            Reject
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    {contract.tenantDecision ? (
                        <>
                            Decision: {contract.tenantDecision}
                            {contract.tenantDecisionAt ? ` on ${formatDate(contract.tenantDecisionAt)}` : ''}
                        </>
                    ) : (
                        'No tenant decision is required right now.'
                    )}
                    {contract.tenantRejectionReason ? (
                        <p className="mt-3 rounded-xl bg-red-50 p-3 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                            {contract.tenantRejectionReason}
                        </p>
                    ) : null}
                </div>
            )}
        </div>
    );
}

const TenantApplicationDetail = () => {
    const { applicationId } = useParams();
    const [searchParams] = useSearchParams();
    const appId = applicationId ? Number(applicationId) : undefined;
    const appQuery = useApplication(Number.isFinite(appId) ? appId : undefined);
    const contractsQuery = useLeaseContracts();
    const acceptMut = useAcceptLeaseContract();
    const rejectMut = useRejectLeaseContract();
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [authenticityConfirmed, setAuthenticityConfirmed] = useState(false);
    const navigate = useNavigate();

    const app = appQuery.data;
    const contract = useMemo(() => {
        if (!app) return undefined;
        return (contractsQuery.data ?? []).find((item) => {
            if (app.contractId != null && item.id === app.contractId) return true;
            return item.applicationId === app.id;
        });
    }, [app, contractsQuery.data]);
    const applicantData = parseApplicantData(app?.applicantData);
    const contractFocused = searchParams.get('contract') === '1';
    const isBusy = acceptMut.isPending || rejectMut.isPending;

    const handleAccept = async () => {
        if (!contract) return;
        try {
            await acceptMut.mutateAsync({
                id: contract.id,
                body: {
                    acceptedSystemTerms: true,
                    confirmedPropertyAuthenticity: true,
                },
            });
            showSuccess('Lease contract accepted.');
        } catch (e) {
            showError(e instanceof Error ? e.message : 'Could not accept contract');
        }
    };

    const handleReject = async () => {
        if (!contract) return;
        const reason = window.prompt('Why are you rejecting this contract?');
        if (!reason?.trim()) return;
        try {
            await rejectMut.mutateAsync({ id: contract.id, body: { reason: reason.trim() } });
            showSuccess('Lease contract rejected.');
        } catch (e) {
            showError(e instanceof Error ? e.message : 'Could not reject contract');
        }
    };

    if (appQuery.isPending) {
        return (
            <div className="mx-auto max-w-7xl space-y-4">
                <div className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
                <div className="h-96 animate-pulse rounded-[28px] bg-slate-100 dark:bg-slate-900" />
            </div>
        );
    }

    if (appQuery.isError || !app) {
        return (
            <motion.div {...fadeUp} className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
                {appQuery.error instanceof Error ? appQuery.error.message : 'Could not load application'}
            </motion.div>
        );
    }

    return (
        <motion.div {...fadeUp} className="mx-auto max-w-7xl space-y-6 pb-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="ghost" className="w-fit" onClick={() => navigate('/tenant/lease')}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to lease desk
                </Button>
                <div className="flex flex-wrap gap-2">
                    <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold uppercase ${statusPillClass(app.status)}`}>
                        {app.status.replace(/_/g, ' ')}
                    </span>
                    {contract ? (
                        <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold uppercase ${statusPillClass(contract.status)}`}>
                            Contract {contract.status.replace(/_/g, ' ')}
                        </span>
                    ) : null}
                </div>
            </div>

            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="grid lg:grid-cols-[1fr_360px]">
                    <div className="bg-[linear-gradient(135deg,#f8fafc_0%,#eef7f1_55%,#f8fafc_100%)] p-6 sm:p-8 dark:bg-[linear-gradient(135deg,#020617_0%,#082f2b_58%,#0f172a_100%)]">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                                {initials(app.property.title)}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                    Application #{app.id}
                                </p>
                                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                                    {app.property.title}
                                </h1>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                    {app.property.location ?? app.property.address ?? 'Property location pending'}
                                </p>
                            </div>
                        </div>

                        {app.coverNote ? (
                            <div className="mt-6 max-w-3xl rounded-2xl border border-white/70 bg-white/80 p-4 text-sm leading-6 text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
                                {app.coverNote}
                            </div>
                        ) : null}
                    </div>

                    <aside className="border-t border-slate-200 bg-slate-950 p-6 text-white lg:border-l lg:border-t-0 dark:border-slate-800">
                        <p className="text-xs font-semibold uppercase text-slate-400">Requested unit</p>
                        <h2 className="mt-2 text-xl font-bold">
                            Unit {app.unit.unitNumber}
                        </h2>
                        <p className="mt-1 text-sm text-slate-300">
                            {app.unit.floorLabel ? `${app.unit.floorLabel} · ` : ''}
                            {app.unit.unitType ?? 'Unit type pending'}
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                <p className="text-xs text-slate-400">Rent</p>
                                <p className="mt-1 font-semibold">{formatMoney(app.unit.monthlyRent)}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                <p className="text-xs text-slate-400">Submitted</p>
                                <p className="mt-1 font-semibold">{formatDate(app.createdAt)}</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                <section className="space-y-6">
                    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Application details</h2>
                        <div className="mt-5 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                                <Home className="h-4 w-4 text-emerald-600" />
                                <p className="mt-3 text-xs font-semibold uppercase text-slate-500">Unit</p>
                                <p className="mt-1 text-sm text-slate-900 dark:text-white">Unit {app.unit.unitNumber}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                                <CalendarDays className="h-4 w-4 text-emerald-600" />
                                <p className="mt-3 text-xs font-semibold uppercase text-slate-500">Expected stay</p>
                                <p className="mt-1 text-sm text-slate-900 dark:text-white">
                                    {applicantData.stay ?? '-'}
                                </p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                                <ReceiptText className="h-4 w-4 text-emerald-600" />
                                <p className="mt-3 text-xs font-semibold uppercase text-slate-500">Monthly rent</p>
                                <p className="mt-1 text-sm text-slate-900 dark:text-white">
                                    {formatMoney(app.unit.monthlyRent)}
                                </p>
                            </div>
                        </div>

                        {applicantData.requirements.length > 0 || applicantData.legacyLines.length > 0 ? (
                            <div className="mt-5 space-y-3">
                                {applicantData.requirements.map((item, idx) => (
                                    <div
                                        key={`${item.question}-${idx}`}
                                        className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                                    >
                                        <p className="text-xs font-semibold uppercase text-slate-500">
                                            {item.question || `Answer ${idx + 1}`}
                                        </p>
                                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                                            {item.answer || '-'}
                                        </p>
                                    </div>
                                ))}
                                {applicantData.legacyLines.map((line, idx) => (
                                    <div
                                        key={`${line}-${idx}`}
                                        className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300"
                                    >
                                        {line}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-5 text-sm text-slate-500">No extra applicant answers were provided.</p>
                        )}
                    </div>

                    <ContractSchedule contract={contract} />

                    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Contract terms</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {contract ? `Version ${contract.systemTermsVersion ?? 'v1'}` : 'Waiting for owner contract'}
                                </p>
                            </div>
                            <FileText className="h-5 w-5 text-emerald-600" />
                        </div>
                        {contract?.terms ? (
                            <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                                {contract.terms}
                            </p>
                        ) : (
                            <p className="mt-5 text-sm text-slate-500">No contract terms are available yet.</p>
                        )}
                    </div>
                </section>

                <aside className={`space-y-4 ${contractFocused ? 'order-first lg:order-none' : ''}`}>
                    <ContractDecisionPanel
                        contract={contract}
                        focused={contractFocused}
                        termsAccepted={termsAccepted}
                        authenticityConfirmed={authenticityConfirmed}
                        onTermsChange={setTermsAccepted}
                        onAuthenticityChange={setAuthenticityConfirmed}
                        onAccept={() => void handleAccept()}
                        onReject={() => void handleReject()}
                        busy={isBusy}
                    />

                    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <h2 className="flex items-center gap-2 font-semibold text-slate-950 dark:text-white">
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                            Review history
                        </h2>
                        <div className="mt-4 space-y-3 text-sm">
                            <p className="flex justify-between gap-4 text-slate-500">
                                <span>Submitted</span>
                                <span className="text-slate-900 dark:text-white">{formatDate(app.createdAt)}</span>
                            </p>
                            <p className="flex justify-between gap-4 text-slate-500">
                                <span>Reviewed</span>
                                <span className="text-slate-900 dark:text-white">{formatDate(app.reviewedAt)}</span>
                            </p>
                            <p className="flex justify-between gap-4 text-slate-500">
                                <span>Reviewer</span>
                                <span className="text-slate-900 dark:text-white">
                                    {app.reviewedBy?.name ?? '-'}
                                </span>
                            </p>
                        </div>
                        {app.rejectionReason ? (
                            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                                {app.rejectionReason}
                            </p>
                        ) : null}
                    </div>
                </aside>
            </div>
        </motion.div>
    );
};

export default TenantApplicationDetail;
