import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { UnitMapUnitDto } from '@/lib/contracts/preVisualMapContracts';

export type UnitInfoPanelProps = {
    unit: UnitMapUnitDto | null;
    floorLabel: string;
    onEnquire?: (coverNote?: string, applicantData?: string) => void;
    isSubmitting?: boolean;
};

function formatFloorUnitType(unitType: string | null | undefined): string | null {
    if (!unitType?.trim()) return null;
    return unitType
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}

function formatMoney(n: number | null | undefined): string {
    if (n == null || Number.isNaN(n)) return '—';
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'TZS',
        maximumFractionDigits: 0,
    }).format(n);
}

const BOOKING_INTERVALS = [
    { label: '1 month', value: '1' },
    { label: '3 months', value: '3' },
    { label: '6 months', value: '6' },
    { label: '12 months', value: '12' },
] as const;

type BookingIntervalValue = (typeof BOOKING_INTERVALS)[number]['value'];
type StayMode = 'preset' | 'custom';

function dateInputValue(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

function tomorrowInputValue(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return dateInputValue(date);
}

function checkoutFromInterval(checkInDate: string, months: number): string {
    const [year, month, day] = checkInDate.split('-').map(Number);
    const date = new Date(year, month - 1 + months, day);
    date.setDate(date.getDate() - 1);
    return dateInputValue(date);
}

function dateFromInputValue(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function DatePickerField({
    label,
    value,
    min,
    onChange,
}: {
    label: string;
    value: string;
    min?: string;
    onChange: (value: string) => void;
}) {
    const selected = value ? dateFromInputValue(value) : undefined;
    const minDate = min ? dateFromInputValue(min) : undefined;

    return (
        <Label className="block space-y-2">
            <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className={cn(
                            'w-full justify-start border-slate-200 bg-white text-left font-normal text-slate-900 hover:bg-slate-50',
                            !selected && 'text-slate-500',
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                        {selected ? format(selected, 'LLL dd, y') : 'Select date'}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={selected}
                        defaultMonth={selected ?? minDate}
                        disabled={minDate ? { before: minDate } : undefined}
                        onSelect={(date) => {
                            if (date) onChange(dateInputValue(date));
                        }}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </Label>
    );
}

/**
 * Side panel for the selected unit (public map — read-only + CTA).
 */
export function UnitInfoPanel({ unit, floorLabel, onEnquire, isSubmitting = false }: UnitInfoPanelProps) {
    const defaultCheckInDate = useMemo(() => tomorrowInputValue(), []);
    const defaultCheckOutDate = useMemo(() => checkoutFromInterval(defaultCheckInDate, 12), [defaultCheckInDate]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [checkInDate, setCheckInDate] = useState(defaultCheckInDate);
    const [checkOutDate, setCheckOutDate] = useState(defaultCheckOutDate);
    const [interval, setInterval] = useState<BookingIntervalValue>('12');
    const [stayMode, setStayMode] = useState<StayMode>('preset');
    const [coverNote, setCoverNote] = useState('');
    const [answers, setAnswers] = useState<Record<string, string>>({});

    useEffect(() => {
        const nextCheckInDate = tomorrowInputValue();
        const nextCheckOutDate = checkoutFromInterval(nextCheckInDate, 12);
        setDialogOpen(false);
        setCheckInDate(nextCheckInDate);
        setCheckOutDate(nextCheckOutDate);
        setInterval('12');
        setStayMode('preset');
        setCoverNote('');
        setAnswers({});
    }, [unit?.unitId]);

    useEffect(() => {
        if (stayMode !== 'preset' || !checkInDate) return;
        setCheckOutDate(checkoutFromInterval(checkInDate, Number(interval)));
    }, [checkInDate, interval, stayMode]);

    const requirements = useMemo(
        () => unit?.bookingRequirements?.filter((r) => r.trim().length > 0) ?? [],
        [unit?.bookingRequirements],
    );

    const requiredAnswersComplete = requirements.every((requirement, index) =>
        (answers[`${index}:${requirement}`] ?? '').trim(),
    );

    const canSubmit =
        Boolean(checkInDate) &&
        Boolean(checkOutDate) &&
        checkOutDate >= checkInDate &&
        requiredAnswersComplete;

    const switchToPreset = () => {
        setStayMode('preset');
        setCheckOutDate(checkoutFromInterval(checkInDate, Number(interval)));
    };

    const switchToCustom = () => {
        setStayMode('custom');
    };

    const buildApplicantData = () => {
        return JSON.stringify({
            bookingWindow: {
                checkInDate,
                checkOutDate,
                interval: stayMode === 'custom' ? 'CUSTOM' : `${interval}_MONTHS`,
            },
            bookingRequirements: requirements.map((question, index) => ({
                question,
                answer: (answers[`${index}:${question}`] ?? '').trim(),
            })),
        });
    };

    if (!unit) {
        return (
            <aside
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                aria-label="Unit details"
            >
                <p className="text-slate-500 text-sm leading-relaxed">
                    Select an <strong className="text-slate-700">available</strong> unit on the map
                    to see details. Occupied units are shown for orientation only.
                </p>
                <p className="mt-4 text-xs text-slate-400">{floorLabel}</p>
            </aside>
        );
    }

    const available = unit.status === 'AVAILABLE';
    const booked = unit.status === 'BOOKED';
    const typeLabel = formatFloorUnitType(unit.unitType ?? undefined);

    return (
        <aside
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            aria-label={`Unit ${unit.unitNumber} details`}
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h2 className="text-xl font-semibold text-slate-900">Unit {unit.unitNumber}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                        {floorLabel}
                    </p>
                </div>
                <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        available
                            ? 'bg-emerald-100 text-emerald-800'
                            : booked
                              ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                    }`}
                >
                    {available ? 'Available' : booked ? 'Booked' : 'Occupied'}
                </span>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
                {typeLabel && (
                    <div className="col-span-2">
                        <dt className="text-slate-500">Unit type</dt>
                        <dd className="font-medium text-slate-900">{typeLabel}</dd>
                    </div>
                )}
                <div>
                    <dt className="text-slate-500">Bedrooms</dt>
                    <dd className="font-medium text-slate-900">{unit.bedrooms ?? '—'}</dd>
                </div>
                <div>
                    <dt className="text-slate-500">Size</dt>
                    <dd className="font-medium text-slate-900">
                        {unit.sizeM2 != null ? `${unit.sizeM2} m²` : '—'}
                    </dd>
                </div>
                <div className="col-span-2">
                    <dt className="text-slate-500">Monthly rent</dt>
                    <dd className="font-medium text-slate-900">{formatMoney(unit.monthlyRent)}</dd>
                </div>
            </dl>

            {available && onEnquire && (
                <div className="mt-6">
                    <button
                        type="button"
                        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isSubmitting}
                        onClick={() => setDialogOpen(true)}
                    >
                        Request booking
                    </button>
                    <Dialog open={dialogOpen} onOpenChange={(open) => !isSubmitting && setDialogOpen(open)}>
                        <DialogContent className="max-h-[92vh] overflow-y-auto border-slate-200 bg-white text-slate-900 sm:max-w-xl">
                            <form
                                className="space-y-5"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    if (!canSubmit) return;
                                    onEnquire(coverNote.trim() || undefined, buildApplicantData());
                                }}
                            >
                                <DialogHeader>
                                    <DialogTitle>Request Unit {unit.unitNumber}</DialogTitle>
                                    <DialogDescription className="text-slate-500">
                                        Choose your expected stay dates and send the owner any details they need.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    {stayMode === 'preset' ? (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <DatePickerField
                                                label="Check-in date"
                                                value={checkInDate}
                                                min={defaultCheckInDate}
                                                onChange={setCheckInDate}
                                            />
                                            <Label className="space-y-2">
                                                <span className="text-xs font-semibold uppercase text-slate-500">
                                                    Staying for
                                                </span>
                                                <Select
                                                    value={interval}
                                                    onValueChange={(value) => {
                                                        if (value === 'custom') {
                                                            switchToCustom();
                                                            return;
                                                        }
                                                        setInterval(value as BookingIntervalValue);
                                                    }}
                                                >
                                                    <SelectTrigger className="border-slate-200 bg-white text-slate-900 focus:ring-emerald-500">
                                                        <SelectValue placeholder="Select duration" />
                                                    </SelectTrigger>
                                                    <SelectContent className="border-slate-200 bg-white text-slate-900">
                                                        {BOOKING_INTERVALS.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                        <SelectItem value="custom">Custom dates</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </Label>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <DatePickerField
                                                    label="Check-in date"
                                                    value={checkInDate}
                                                    min={defaultCheckInDate}
                                                    onChange={setCheckInDate}
                                                />
                                                <DatePickerField
                                                    label="Checkout date"
                                                    value={checkOutDate}
                                                    min={checkInDate || defaultCheckInDate}
                                                    onChange={setCheckOutDate}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={switchToPreset}
                                                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                                            >
                                                Use common stay interval
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {requirements.length > 0 ? (
                                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        {requirements.map((requirement, index) => {
                                            const key = `${index}:${requirement}`;
                                            return (
                                                <Label key={key} className="block space-y-2">
                                                    <span className="text-xs font-semibold uppercase text-slate-500">
                                                        {requirement}
                                                    </span>
                                                    <Input
                                                        value={answers[key] ?? ''}
                                                        onChange={(event) =>
                                                            setAnswers((cur) => ({
                                                                ...cur,
                                                                [key]: event.target.value,
                                                            }))
                                                        }
                                                        maxLength={500}
                                                        className="border-slate-200 bg-white text-slate-900 focus-visible:ring-emerald-500"
                                                    />
                                                </Label>
                                            );
                                        })}
                                    </div>
                                ) : null}

                                <Label className="block space-y-2">
                                    <span className="text-xs font-semibold uppercase text-slate-500">
                                        Additional notes
                                    </span>
                                    <Textarea
                                        value={coverNote}
                                        onChange={(event) => setCoverNote(event.target.value)}
                                        maxLength={1000}
                                        rows={4}
                                        placeholder="Move-in preferences, questions, or anything the owner should know"
                                        className="resize-none border-slate-200 bg-slate-50 text-slate-900 focus-visible:ring-emerald-500"
                                    />
                                </Label>

                                {checkOutDate && checkInDate && checkOutDate < checkInDate ? (
                                    <p className="text-sm font-medium text-red-600">
                                        Checkout date must be after check-in date.
                                    </p>
                                ) : null}

                                <DialogFooter>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || !canSubmit}
                                        className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Send request'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {!available && (
                <p className="mt-6 text-sm text-slate-500">
                    This unit is {booked ? 'already booked' : 'not available'}.
                </p>
            )}
        </aside>
    );
}
