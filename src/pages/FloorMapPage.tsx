import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { FloorMap } from '@/components/visual-map/FloorMap';
import { resolveFloorPlanImageUrl } from '@/components/visual-map/resolveFloorPlanUrl';
import { UnitInfoPanel } from '@/components/visual-map/UnitInfoPanel';
import Skeleton from '@/components/Skeleton';
import { useFloorMap } from '@/hooks/useFloorMap';
import { useAppSelector } from '@/hooks/useAppStore';
import { showError, showSuccess } from '@/lib/toast';
import { useCreateApplication } from '@/queries/application.queries';

function FloorMapPageSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-[min(420px,55vw)] w-full min-h-[240px]" />
            </div>
            <div className="lg:col-span-1">
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}

function InvalidFloorNotice({ onBack }: { onBack: () => void }) {
    return (
        <div className="min-h-screen bg-slate-50 pb-20 pt-30">
            <div className="mx-auto max-w-3xl px-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-6 flex items-center font-medium text-slate-500 transition-colors hover:text-emerald-600"
                >
                    <ChevronLeft size={20} aria-hidden />
                    Back
                </button>
                <div
                    className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-amber-900"
                    role="alert"
                >
                    <h1 className="text-lg font-semibold">Invalid floor link</h1>
                    <p className="mt-2 text-sm">
                        The floor identifier in the URL is not valid. Use a numeric floor id.
                    </p>
                </div>
            </div>
        </div>
    );
}

type FloorMapPageBodyProps = {
    floorId: string;
};

/**
 * Selection state is isolated here so `key={floorId}` on the parent can reset it when the route param changes.
 */
function FloorMapPageBody({ floorId }: FloorMapPageBodyProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
    const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
    const user = useAppSelector((s) => s.auth.user);
    const createApplication = useCreateApplication();

    const { data, isPending, isError, error, refetch, isFetching } = useFloorMap(floorId);

    const imageSrc = useMemo(
        () => (data ? resolveFloorPlanImageUrl(data.imageUrl) : null),
        [data],
    );

    const selectedUnit = useMemo(
        () => data?.units.find((u) => u.unitId === selectedUnitId) ?? null,
        [data, selectedUnitId],
    );

    const floorLabel = data?.floorLabel ?? 'Floor map';

    const handleBookingRequest = async (coverNote?: string, applicantData?: string) => {
        if (!selectedUnit) {
            return;
        }
        if (!isAuthenticated) {
            navigate('/login', { state: { from: location }, replace: false });
            return;
        }
        if (user?.role !== 'tenant') {
            showError('Only tenant accounts can request a booking.');
            return;
        }
        try {
            await createApplication.mutateAsync({
                floorUnitId: selectedUnit.unitId,
                ...(coverNote ? { coverNote } : {}),
                ...(applicantData ? { applicantData } : {}),
            });
            showSuccess('Booking request sent to the owner.');
            setSelectedUnitId(null);
            void refetch();
        } catch (e) {
            showError(e instanceof Error ? e.message : 'Could not submit booking request');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20 pt-30">
            <div className="mx-auto max-w-7xl px-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center font-medium text-slate-500 transition-colors hover:text-emerald-600"
                >
                    <ChevronLeft size={20} aria-hidden />
                    Back
                </button>

                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">{floorLabel}</h1>
                    <p className="mt-2 text-slate-600">
                        Explore units on the floor plan. Only available units can be selected.
                    </p>
                </header>

                {isPending && <FloorMapPageSkeleton />}

                {isError && (
                    <div
                        className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-red-900"
                        role="alert"
                    >
                        <h2 className="text-lg font-semibold">Could not load floor map</h2>
                        <p className="mt-2 text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
                        <button
                            type="button"
                            className="mt-4 rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white hover:bg-red-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                            onClick={() => void refetch()}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {data && !isPending && (
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            {isFetching && !isPending && (
                                <p className="mb-2 text-xs text-slate-500" aria-live="polite">
                                    Updating…
                                </p>
                            )}
                            <FloorMap
                                data={data}
                                imageSrc={imageSrc}
                                selectedUnitId={selectedUnitId}
                                onSelectUnit={setSelectedUnitId}
                            />
                            {!data.imageUrl && data.units.some((u) => u.status === 'AVAILABLE') && (
                                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <h3 className="text-sm font-semibold text-slate-900">Available units</h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        No floor plan image yet — pick a unit here to see details.
                                    </p>
                                    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Available units list">
                                        {data.units
                                            .filter((u) => u.status === 'AVAILABLE')
                                            .map((u) => (
                                                <li key={u.unitId}>
                                                    <button
                                                        type="button"
                                                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
                                                            selectedUnitId === u.unitId
                                                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                                                                : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-emerald-400'
                                                        }`}
                                                        onClick={() =>
                                                            setSelectedUnitId((cur) =>
                                                                cur === u.unitId ? null : u.unitId,
                                                            )
                                                        }
                                                    >
                                                        Unit {u.unitNumber}
                                                    </button>
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-1">
                            <UnitInfoPanel
                                unit={selectedUnit}
                                floorLabel={data.floorLabel}
                                onEnquire={(coverNote, applicantData) =>
                                    void handleBookingRequest(coverNote, applicantData)
                                }
                                isSubmitting={createApplication.isPending}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function FloorMapPage() {
    const { floorId: idParam } = useParams<{ floorId: string }>();
    const navigate = useNavigate();

    const floorId = idParam != null && /^\d+$/.test(idParam) ? idParam : null;

    if (floorId === null) {
        return <InvalidFloorNotice onBack={() => navigate(-1)} />;
    }

    return <FloorMapPageBody key={floorId} floorId={floorId} />;
}
