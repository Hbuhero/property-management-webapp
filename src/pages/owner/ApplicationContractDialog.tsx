import { useEffect, useState } from 'react';
import {
    ArrowRight,
    CalendarClock,
    ChevronDown,
    ChevronUp,
    CircleCheck,
    FileText,
    Plus,
    Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { fetchLeasePreset } from '@/api/leasePresetApi';
import {
    addTimelineUnits,
    buildDraftItemScheduleEntries,
    nextDueEntry,
    type ScheduleEntry,
    type ScheduleItemInput,
    todayIso,
} from '@/lib/leaseSchedule';
import { showError, showSuccess } from '@/lib/toast';
import { useApproveApplication } from '@/queries/application.queries';
import {
    useCreateLeaseContract,
    useUpdateLeaseContract,
} from '@/queries/leaseContract.queries';
import type { PropertyApplication } from '@/schemas/application.schema';
import type { CreateLeaseContractInput, LeaseContract } from '@/schemas/leaseContract.schema';
import type { LeasePreset } from '@/schemas/leasePreset.schema';

type LeaseTypeValue = 'RECURRING' | 'ONE_TIME';
type LeaseTimeFrameValue = 'DAY' | 'MONTH' | 'YEAR' | 'NONE';

type LeaseItemDraft = {
    key: string;
    label: string;
    description: string;
    amount: string;
    leaseType: LeaseTypeValue;
    timeFrame: LeaseTimeFrameValue;
    startDate: string;
    recurringNumber: string;
};

type ContractDialogState = {
    app: PropertyApplication;
    contract?: LeaseContract;
    startDate: string;
    endDate: string;
    paymentDayOfMonth: string;
    terms: string;
    items: LeaseItemDraft[];
    confirmed: boolean;
};

type LeaseItemScheduleGroup = {
    item: LeaseItemDraft;
    entries: ScheduleEntry[];
    total: number | undefined;
    startDate: string;
    endDate: string | null;
    summary: string;
};

type Props = {
    application: PropertyApplication | null;
    contract?: LeaseContract;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved?: () => void;
};

const EMPTY_ITEM: LeaseItemDraft = {
    key: 'new',
    label: '',
    description: '',
    amount: '',
    leaseType: 'ONE_TIME',
    timeFrame: 'NONE',
    startDate: '',
    recurringNumber: '',
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
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(d);
}

function formatMonthYear(value: string | null | undefined): string {
    if (!value) return '-';
    const d = new Date(`${value}T00:00:00`);
    if (Number.isNaN(d.getTime())) return value.slice(0, 7);
    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        year: 'numeric',
    }).format(d);
}

function oneYearEndIso(): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

function leaseEndFromStartIso(startIso: string): string {
    const d = new Date(`${startIso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return oneYearEndIso();
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
}

function bookingWindowFromApplicantData(raw: string | null | undefined): {
    checkInDate?: string;
    checkOutDate?: string;
} {
    if (!raw?.trim()) return {};
    try {
        const parsed = JSON.parse(raw) as {
            bookingWindow?: {
                checkInDate?: string;
                checkOutDate?: string;
            };
        };
        return {
            checkInDate: parsed.bookingWindow?.checkInDate,
            checkOutDate: parsed.bookingWindow?.checkOutDate,
        };
    } catch {
        return {};
    }
}

function defaultTerms(app: PropertyApplication): string {
    return `Lease for ${app.property.title}, Unit ${app.unit.unitNumber}.`;
}

function itemKey(): string {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function numberFromField(value: string): number | undefined {
    if (value.trim() === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export function itemEndDate(item: LeaseItemDraft): string | null {
    if (!item.startDate) return null;
    if (item.leaseType !== 'RECURRING') return item.startDate;
    const count = numberFromField(item.recurringNumber) ?? 1;
    return addTimelineUnits(item.startDate, item.timeFrame, count);
}

function draftItemTotal(item: LeaseItemDraft): number | undefined {
    const amount = numberFromField(item.amount);
    if (amount == null) return undefined;
    if (item.leaseType !== 'RECURRING') return amount;
    return amount * (numberFromField(item.recurringNumber) ?? 1);
}

function totalContractValue(items: LeaseItemDraft[]): number | undefined {
    const totals = items.map(draftItemTotal).filter((value): value is number => value != null);
    if (totals.length === 0) return undefined;
    return totals.reduce((sum, value) => sum + value, 0);
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

function draftScheduleInput(item: LeaseItemDraft): ScheduleItemInput {
    return {
        label: item.label,
        amount: numberFromField(item.amount),
        leaseType: item.leaseType,
        timeFrame: item.timeFrame,
        recurringNumber: numberFromField(item.recurringNumber),
        startDate: item.startDate,
    };
}

function paymentScheduleEntries(
    items: LeaseItemDraft[],
    paymentDayOfMonth: number,
    contractId?: number,
): ScheduleEntry[] {
    return items
        .flatMap((item) =>
            buildDraftItemScheduleEntries(draftScheduleInput(item), item.key, {
                paymentDayOfMonth,
                contractId,
            }),
        )
        .sort((a, b) => a.date.localeCompare(b.date));
}

function nextPaymentText(entries: ScheduleEntry[]): string {
    const next = nextDueEntry(entries);
    if (!next) return 'No scheduled payment yet';
    return `Next payment due ${formatDate(next.date)}`;
}

function timeFrameLabel(timeFrame: LeaseTimeFrameValue): string {
    switch (timeFrame) {
        case 'DAY':
            return 'Daily';
        case 'MONTH':
            return 'Monthly';
        case 'YEAR':
            return 'Yearly';
        case 'NONE':
            return 'One-time';
    }
}

function itemScheduleSummary(item: LeaseItemDraft, entries: ScheduleEntry[]): string {
    if (!item.startDate) return 'Choose a start date to preview this schedule.';
    if (numberFromField(item.amount) == null) return 'Add an amount to preview this schedule.';
    if (item.leaseType === 'RECURRING' && item.timeFrame === 'NONE') {
        return 'Choose a billing timeline to preview this schedule.';
    }
    if (item.leaseType === 'RECURRING' && !numberFromField(item.recurringNumber)) {
        return 'Add a recurring count to preview this schedule.';
    }
    if (entries.length === 0) return 'Complete this item to preview its payment schedule.';
    const endDate = itemEndDate(item);
    if (item.leaseType !== 'RECURRING') return `One payment due ${formatDate(item.startDate)}.`;
    return `${timeFrameLabel(item.timeFrame)} billing from ${formatDate(item.startDate)} to ${formatDate(endDate)}.`;
}

function leaseItemScheduleGroups(
    items: LeaseItemDraft[],
    paymentDayOfMonth: number,
    contractId?: number,
): LeaseItemScheduleGroup[] {
    return items
        .map((item) => {
            const entries = buildDraftItemScheduleEntries(draftScheduleInput(item), item.key, {
                paymentDayOfMonth,
                contractId,
            }).sort((a, b) => a.date.localeCompare(b.date));
            return {
                item,
                entries,
                total: draftItemTotal(item),
                startDate: item.startDate,
                endDate: itemEndDate(item),
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

function createDefaultItem(app: PropertyApplication, startDate: string): LeaseItemDraft {
    return {
        ...EMPTY_ITEM,
        key: itemKey(),
        label: 'Monthly rent',
        description: 'Recurring monthly rent for the selected unit',
        amount: app.unit.monthlyRent != null ? String(app.unit.monthlyRent) : '',
        leaseType: 'RECURRING',
        timeFrame: 'MONTH',
        startDate,
        recurringNumber: '1',
    };
}

function itemFromContract(item: LeaseContract['items'][number], idx: number): LeaseItemDraft {
    return {
        key: item.id != null ? `existing-${item.id}` : `existing-${idx}`,
        label: item.label,
        description: item.description ?? '',
        amount: String(item.amount),
        leaseType: item.leaseType ?? 'ONE_TIME',
        timeFrame: item.timeFrame ?? 'NONE',
        startDate: item.startDate ?? '',
        recurringNumber: item.recurringNumber != null ? String(item.recurringNumber) : '',
    };
}

function itemFromPreset(
    item: LeasePreset['items'][number],
    idx: number,
    fallbackStartDate: string,
): LeaseItemDraft {
    return {
        key: item.id != null ? `preset-${item.id}` : `preset-${idx}`,
        label: item.label,
        description: item.description ?? '',
        amount: String(item.amount),
        leaseType: item.leaseType ?? 'ONE_TIME',
        timeFrame: item.timeFrame ?? 'NONE',
        startDate: item.startDate ?? fallbackStartDate,
        recurringNumber: item.recurringNumber != null ? String(item.recurringNumber) : '',
    };
}

function contractBodyFromState(state: ContractDialogState): CreateLeaseContractInput {
    return {
        applicationId: state.app.id,
        tenantId: state.app.tenant.id,
        propertyId: state.app.property.id,
        floorUnitId: state.app.unit.id,
        startDate: state.startDate,
        endDate: state.endDate,
        paymentDayOfMonth: Number(state.paymentDayOfMonth),
        terms: state.terms.trim(),
        items: state.items.map((item, idx) => ({
            label: item.label.trim(),
            description: item.description.trim() || undefined,
            amount: Number(item.amount),
            leaseType: item.leaseType,
            timeFrame: item.timeFrame,
            startDate: item.startDate,
            recurringNumber: numberFromField(item.recurringNumber),
            sortOrder: idx,
        })),
    };
}

function buildInitialState(
    app: PropertyApplication,
    contract: LeaseContract | undefined,
    preset: LeasePreset | null,
): ContractDialogState {
    const bookingWindow = bookingWindowFromApplicantData(app.applicantData);
    const startDate = contract?.startDate ?? bookingWindow.checkInDate ?? todayIso();
    const endDate =
        contract?.endDate ??
        bookingWindow.checkOutDate ??
        (preset?.durationMonths
            ? addTimelineUnits(startDate, 'MONTH', preset.durationMonths) ?? leaseEndFromStartIso(startDate)
            : leaseEndFromStartIso(startDate));

    return {
        app,
        contract,
        startDate,
        endDate,
        paymentDayOfMonth: String(contract?.paymentDayOfMonth ?? preset?.paymentDayOfMonth ?? 1),
        terms: contract?.terms ?? preset?.terms ?? defaultTerms(app),
        items:
            contract?.items && contract.items.length > 0
                ? contract.items.map(itemFromContract)
                : preset?.items?.length
                  ? preset.items.map((item, idx) => itemFromPreset(item, idx, startDate))
                  : [createDefaultItem(app, startDate)],
        confirmed: false,
    };
}

export function ApplicationContractDialog({
    application,
    contract,
    open,
    onOpenChange,
    onSaved,
}: Props) {
    const [state, setState] = useState<ContractDialogState | null>(null);
    const [showFullSchedule, setShowFullSchedule] = useState(false);
    const approveMut = useApproveApplication();
    const createContractMut = useCreateLeaseContract();
    const updateContractMut = useUpdateLeaseContract();
    const isSaving = approveMut.isPending || createContractMut.isPending || updateContractMut.isPending;

    useEffect(() => {
        let cancelled = false;
        async function load() {
            if (!open || !application) {
                setState(null);
                setShowFullSchedule(false);
                return;
            }
            let preset: LeasePreset | null = null;
            if (!contract) {
                try {
                    preset = await fetchLeasePreset(application.property.id, application.unit.id);
                } catch {
                    preset = null;
                }
            }
            if (!cancelled) {
                setState(buildInitialState(application, contract, preset));
                setShowFullSchedule(false);
            }
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, [application, contract, open]);

    const patchState = (patch: Partial<ContractDialogState>) => {
        setState((current) => (current ? { ...current, ...patch } : current));
    };

    const updateLeaseItem = (key: string, patch: Partial<LeaseItemDraft>) => {
        setState((current) => {
            if (!current) return current;
            return {
                ...current,
                confirmed: false,
                items: current.items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
            };
        });
    };

    const updateContractStartDate = (startDate: string) => {
        setState((current) => {
            if (!current) return current;
            return {
                ...current,
                startDate,
                confirmed: false,
                items: current.items.map((item) =>
                    item.startDate === current.startDate ? { ...item, startDate } : item,
                ),
            };
        });
    };

    const addLeaseItem = () => {
        setState((current) => {
            if (!current) return current;
            return {
                ...current,
                confirmed: false,
                items: [...current.items, { ...EMPTY_ITEM, key: itemKey(), startDate: current.startDate }],
            };
        });
    };

    const removeLeaseItem = (key: string) => {
        setState((current) => {
            if (!current || current.items.length === 1) return current;
            return { ...current, confirmed: false, items: current.items.filter((item) => item.key !== key) };
        });
    };

    const validate = (next: ContractDialogState): string | null => {
        if (!next.startDate || !next.endDate) return 'Contract start and end dates are required.';
        if (next.endDate <= next.startDate) return 'Contract end date must be after the start date.';
        const paymentDay = Number(next.paymentDayOfMonth);
        if (!Number.isInteger(paymentDay) || paymentDay < 1 || paymentDay > 28) {
            return 'Payment day must be between 1 and 28.';
        }
        if (next.items.length === 0) return 'Add at least one lease item.';
        for (const [idx, item] of next.items.entries()) {
            if (!item.label.trim()) return `Lease item ${idx + 1} needs a label.`;
            const amount = Number(item.amount);
            if (!Number.isFinite(amount) || amount <= 0) return `Lease item ${idx + 1} needs a valid amount.`;
            if (!item.startDate) return `Lease item ${idx + 1} needs a start date.`;
            if (item.startDate < next.startDate || item.startDate > next.endDate) {
                return `Lease item ${idx + 1} start date must be within the contract period.`;
            }
            const recurringNumber = numberFromField(item.recurringNumber);
            if (
                item.leaseType === 'RECURRING' &&
                (!recurringNumber || recurringNumber < 1 || !Number.isInteger(recurringNumber))
            ) {
                return `Lease item ${idx + 1} needs a recurring count.`;
            }
            if (item.leaseType === 'RECURRING' && item.timeFrame === 'NONE') {
                return `Lease item ${idx + 1} needs a billing timeline.`;
            }
            const calculatedEnd = itemEndDate(item);
            if (calculatedEnd && calculatedEnd > next.endDate) {
                return `Lease item ${idx + 1} ends after the contract end date.`;
            }
        }
        if (!next.confirmed) return 'Confirm the contract summary before saving.';
        return null;
    };

    const handleConfirm = async () => {
        if (!state) return;
        const validationError = validate(state);
        if (validationError) {
            showError(validationError);
            return;
        }
        try {
            const body = contractBodyFromState(state);
            const existingContractId = state.contract?.id;
            if (existingContractId) {
                await updateContractMut.mutateAsync({ id: existingContractId, body });
                showSuccess('Draft contract updated.');
            } else if (state.app.status === 'PENDING') {
                const updated = await approveMut.mutateAsync(state.app.id);
                if (updated.contractId) {
                    await updateContractMut.mutateAsync({ id: updated.contractId, body });
                    showSuccess('Request approved and draft contract prepared.');
                } else {
                    await createContractMut.mutateAsync(body);
                    showSuccess('Request approved and draft contract created.');
                }
            } else {
                await createContractMut.mutateAsync(body);
                showSuccess('Draft contract created.');
            }
            onOpenChange(false);
            onSaved?.();
        } catch (e) {
            showError(e instanceof Error ? e.message : 'Could not save contract');
        }
    };

    const paymentDay = state ? Number(state.paymentDayOfMonth) : 1;
    const scheduleEntries = state
        ? paymentScheduleEntries(state.items, paymentDay, state.contract?.id)
        : [];
    const scheduleGroups = state
        ? leaseItemScheduleGroups(state.items, paymentDay, state.contract?.id)
        : [];
    const hasExpandableSchedule = scheduleGroups.some((group) => group.entries.length > 3);
    const totalValue = state ? totalContractValue(state.items) : undefined;
    const monthlyRent = state?.app.unit.monthlyRent;
    const duration = state ? leaseDurationLabel(state.startDate, state.endDate) : '-';
    const scheduleRange = state ? `${formatMonthYear(state.startDate)} - ${formatMonthYear(state.endDate)}` : '-';
    const summaryStatus = state?.contract?.status ?? (state?.app.status === 'PENDING' ? 'Draft' : state?.app.status ?? 'Draft');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[94vh] max-w-6xl overflow-hidden rounded-[28px] border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                {state ? (
                    <div className="flex max-h-[94vh] flex-col">
                        <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/60">
                            <DialogTitle className="flex items-center gap-2 text-2xl text-slate-950 dark:text-white">
                                <FileText className="h-5 w-5 text-emerald-600" />
                                Contract studio
                            </DialogTitle>
                            <DialogDescription className="max-w-2xl">
                                Prepare dates, terms, and scheduled charges. The summary stays live while you shape the draft.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_380px]">
                            <div className="space-y-6 p-6">
                                <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-semibold uppercase text-slate-500">Tenant</p>
                                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                                            {state.app.tenant.name ?? 'Tenant'}
                                        </p>
                                        <p className="text-xs text-slate-500">{state.app.tenant.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold uppercase text-slate-500">Property</p>
                                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                                            {state.app.property.title}
                                        </p>
                                        <p className="text-xs text-slate-500">Unit {state.app.unit.unitNumber}</p>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="lease-start">Start date</Label>
                                        <Input
                                            id="lease-start"
                                            type="date"
                                            value={state.startDate}
                                            onChange={(event) => updateContractStartDate(event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lease-end">End date</Label>
                                        <Input
                                            id="lease-end"
                                            type="date"
                                            value={state.endDate}
                                            onChange={(event) =>
                                                patchState({ endDate: event.target.value, confirmed: false })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="payment-day">Payment day</Label>
                                        <Input
                                            id="payment-day"
                                            type="number"
                                            min={1}
                                            max={28}
                                            value={state.paymentDayOfMonth}
                                            onChange={(event) =>
                                                patchState({ paymentDayOfMonth: event.target.value, confirmed: false })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lease-terms">Contract terms</Label>
                                    <Textarea
                                        id="lease-terms"
                                        value={state.terms}
                                        onChange={(event) => patchState({ terms: event.target.value, confirmed: false })}
                                        className="min-h-28"
                                        placeholder="Add terms, obligations, house rules, deposits, and any owner notes."
                                    />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                Lease items
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                                Set each payable item, when it starts, and how many billing cycles it runs.
                                            </p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addLeaseItem}>
                                            <Plus className="h-4 w-4" />
                                            Add item
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {state.items.map((item, idx) => (
                                            <div
                                                key={item.key}
                                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                                            >
                                                <div className="mb-4 flex items-center justify-between gap-3">
                                                    <p className="text-xs font-bold uppercase text-slate-500">
                                                        Item {idx + 1}
                                                    </p>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={state.items.length === 1}
                                                        onClick={() => removeLeaseItem(item.key)}
                                                        aria-label="Remove lease item"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`item-label-${item.key}`}>Label</Label>
                                                        <Input
                                                            id={`item-label-${item.key}`}
                                                            value={item.label}
                                                            onChange={(event) =>
                                                                updateLeaseItem(item.key, { label: event.target.value })
                                                            }
                                                            placeholder="Monthly rent"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`item-amount-${item.key}`}>Amount</Label>
                                                        <Input
                                                            id={`item-amount-${item.key}`}
                                                            type="number"
                                                            min={0}
                                                            value={item.amount}
                                                            onChange={(event) =>
                                                                updateLeaseItem(item.key, { amount: event.target.value })
                                                            }
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Charge type</Label>
                                                        <Select
                                                            value={item.leaseType}
                                                            onValueChange={(value) =>
                                                                updateLeaseItem(item.key, {
                                                                    leaseType: value as LeaseTypeValue,
                                                                    timeFrame: value === 'ONE_TIME' ? 'NONE' : item.timeFrame,
                                                                })
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select charge type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="RECURRING">Recurring</SelectItem>
                                                                <SelectItem value="ONE_TIME">One time</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Timeline unit</Label>
                                                        <Select
                                                            value={item.timeFrame}
                                                            onValueChange={(value) =>
                                                                updateLeaseItem(item.key, {
                                                                    timeFrame: value as LeaseTimeFrameValue,
                                                                })
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select timeline" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="NONE">No recurrence</SelectItem>
                                                                <SelectItem value="DAY">Daily</SelectItem>
                                                                <SelectItem value="MONTH">Monthly</SelectItem>
                                                                <SelectItem value="YEAR">Yearly</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`item-start-${item.key}`}>Start date</Label>
                                                        <Input
                                                            id={`item-start-${item.key}`}
                                                            type="date"
                                                            min={state.startDate}
                                                            max={state.endDate}
                                                            value={item.startDate}
                                                            onChange={(event) =>
                                                                updateLeaseItem(item.key, { startDate: event.target.value })
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor={`item-recurring-${item.key}`}>Recurring count</Label>
                                                        <Input
                                                            id={`item-recurring-${item.key}`}
                                                            type="number"
                                                            min={1}
                                                            value={item.recurringNumber}
                                                            onChange={(event) =>
                                                                updateLeaseItem(item.key, {
                                                                    recurringNumber: event.target.value,
                                                                })
                                                            }
                                                            placeholder="1"
                                                        />
                                                    </div>
                                                    <div className="space-y-2 sm:col-span-2">
                                                        <Label htmlFor={`item-description-${item.key}`}>Description</Label>
                                                        <Textarea
                                                            id={`item-description-${item.key}`}
                                                            value={item.description}
                                                            onChange={(event) =>
                                                                updateLeaseItem(item.key, {
                                                                    description: event.target.value,
                                                                })
                                                            }
                                                            placeholder="Explain what this item covers."
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <aside className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0 dark:border-slate-800 dark:bg-slate-900/50">
                                <div className="sticky top-0 space-y-4">
                                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                                        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                                                    Lease agreement
                                                </p>
                                                <h3 className="mt-1 text-xl font-medium leading-tight text-slate-950 dark:text-white">
                                                    Unit {state.app.unit.unitNumber} - {state.app.property.title}
                                                </h3>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Tenant: {state.app.tenant.name ?? state.app.tenant.email ?? 'Tenant'}
                                                </p>
                                            </div>
                                            <div className="ml-3 inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                                <CircleCheck className="h-3 w-3" />
                                                {summaryStatus.replace(/_/g, ' ')}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                                            <div className="flex flex-col gap-1 px-4 py-4">
                                                <span className="text-xs text-slate-500">Monthly rent</span>
                                                <span className="text-lg font-medium text-slate-950 dark:text-white">
                                                    {formatMoney(monthlyRent)}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1 px-4 py-4">
                                                <span className="text-xs text-slate-500">Duration</span>
                                                <span className="text-lg font-medium text-slate-950 dark:text-white">
                                                    {duration}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1 px-4 py-4">
                                                <span className="text-xs text-slate-500">Total value</span>
                                                <span className="text-lg font-medium text-slate-950 dark:text-white">
                                                    {formatMoney(totalValue)}
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
                                                            <p className="text-sm font-medium text-slate-950 dark:text-white">
                                                                Lease start
                                                            </p>
                                                            <p className="text-xs text-slate-500">{formatDate(state.startDate)}</p>
                                                        </div>
                                                        <span className="rounded-sm bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                                            Start
                                                        </span>
                                                    </div>
                                                </div>

                                                {scheduleGroups.map((group) => {
                                                    const visibleEntries = showFullSchedule
                                                        ? group.entries
                                                        : group.entries.slice(0, 1);
                                                    const hiddenEntries = Math.max(0, group.entries.length - visibleEntries.length);

                                                    return (
                                                        <div key={group.item.key} className="flex items-start gap-4">
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
                                                                            Complete this item to preview its payment dates.
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
                                                            <p className="text-sm font-medium text-slate-950 dark:text-white">
                                                                Lease end
                                                            </p>
                                                            <p className="text-xs text-slate-500">{formatDate(state.endDate)}</p>
                                                        </div>
                                                        <span className="rounded-sm bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800">
                                                            End
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/60">
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
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
                                        <Checkbox
                                            id="contract-summary-confirm"
                                            checked={state.confirmed}
                                            onCheckedChange={(checked) => patchState({ confirmed: Boolean(checked) })}
                                            className="mt-0.5 border-emerald-300 data-[state=checked]:bg-emerald-600"
                                        />
                                        <Label
                                            htmlFor="contract-summary-confirm"
                                            className="cursor-pointer text-sm font-normal leading-5 text-slate-700 dark:text-slate-200"
                                        >
                                            I have reviewed the contract dates, terms, and lease item timeline.
                                        </Label>
                                    </div>
                                </div>
                            </aside>
                        </div>

                        <DialogFooter className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => void handleConfirm()}
                                disabled={isSaving}
                                className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                {isSaving ? 'Saving...' : 'Confirm and save'}
                            </Button>
                        </DialogFooter>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
