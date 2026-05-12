import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink, LayoutGrid, Upload } from 'lucide-react';
import { OverlayEditor } from '@/components/visual-map/OverlayEditor';
import { resolveFloorPlanImageUrl } from '@/components/visual-map/resolveFloorPlanUrl';
import {
    useFloorMap,
    useSaveOverlayOwner,
    useToggleUnitStatusOwner,
    useUploadFloorPlanOwner,
} from '@/hooks/useFloorMap';
import { showError, showSuccess } from '@/lib/toast';
import type { UnitOverlayPutBody } from '@/lib/contracts/preVisualMapContracts';
import { useOwnerFloors } from '@/queries/propertyStructure.queries';

function readImageDimensions(file: File): Promise<{ w: number; h: number }> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ w: img.naturalWidth, h: img.naturalHeight });
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Could not decode image'));
        };
        img.src = url;
    });
}

type VisualMapFloorEditorProps = {
    floorId: string;
};

function VisualMapFloorEditor({ floorId }: VisualMapFloorEditorProps) {
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

    const { data, isPending, isError, error, refetch } = useFloorMap(floorId);
    const saveOverlay = useSaveOverlayOwner(floorId);
    const toggleStatus = useToggleUnitStatusOwner(floorId);
    const uploadPlan = useUploadFloorPlanOwner(floorId);

    const imageSrc = useMemo(
        () => (data ? resolveFloorPlanImageUrl(data.imageUrl) : null),
        [data],
    );

    const handleSaveOverlay = async (unitId: number, box: UnitOverlayPutBody) => {
        try {
            await saveOverlay.mutateAsync({ unitId, overlay: box });
            showSuccess('Overlay saved');
        } catch (e) {
            showError(e instanceof Error ? e.message : 'Could not save overlay');
        }
    };

    const handleUpload = async (file: File) => {
        try {
            const { w, h } = await readImageDimensions(file);
            const fd = new FormData();
            fd.append('file', file);
            fd.append('imageWidth', String(w));
            fd.append('imageHeight', String(h));
            await uploadPlan.mutateAsync(fd);
            showSuccess('Floor plan uploaded');
        } catch (e) {
            showError(e instanceof Error ? e.message : 'Upload failed');
        }
    };

    const handleToggleStatus = async (unitId: number, next: 'AVAILABLE' | 'OCCUPIED') => {
        try {
            await toggleStatus.mutateAsync({ unitId, body: { status: next } });
            showSuccess('Status updated');
        } catch (e) {
            showError(e instanceof Error ? e.message : 'Could not update status');
        }
    };

    if (isPending) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading floor data…</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div
                className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
                role="alert"
            >
                <p className="font-medium">Could not load floor</p>
                <p className="mt-1 text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
                <button
                    type="button"
                    className="mt-4 rounded-lg bg-red-800 px-3 py-1.5 text-sm text-white hover:bg-red-900"
                    onClick={() => void refetch()}
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{data.floorLabel}</h2>
                <Link
                    to={`/floors/${floorId}/map`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                    Open public map
                    <ExternalLink className="h-4 w-4" aria-hidden />
                </Link>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Floor plan image</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Upload the plan for this floor of your property (PNG, JPEG, or WebP). This is how tenants
                    see units on the public map. Replacing the image removes the previous file.
                </p>
                <label className="mt-4 flex cursor-pointer flex-col items-start gap-2">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50">
                        <Upload className="h-4 w-4" aria-hidden />
                        {uploadPlan.isPending ? 'Uploading…' : 'Choose image & upload'}
                    </span>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={uploadPlan.isPending}
                        onChange={(ev) => {
                            const f = ev.target.files?.[0];
                            ev.target.value = '';
                            if (f) void handleUpload(f);
                        }}
                    />
                </label>
            </section>

            {imageSrc ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">Overlay editor</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Pick a unit, then drag a rectangle on the plan. Release to save.
                    </p>
                    <div className="mt-4">
                        <OverlayEditor
                            imageSrc={imageSrc}
                            units={data.units}
                            selectedUnitId={selectedUnitId}
                            onSelectUnit={setSelectedUnitId}
                            onSaveOverlay={handleSaveOverlay}
                            isSaving={saveOverlay.isPending}
                        />
                    </div>
                </section>
            ) : (
                <section
                    className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950/50"
                    role="status"
                >
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        Upload a floor plan image to enable the overlay editor.
                    </p>
                </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Units & status</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Map status drives public selection (occupied units are not clickable on the public map).
                </p>
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                <th className="py-2 pr-4 font-medium">Unit</th>
                                <th className="py-2 pr-4 font-medium">Status</th>
                                <th className="py-2 pr-4 font-medium">Overlay %</th>
                                <th className="py-2 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.units.map((u) => (
                                <tr
                                    key={u.unitId}
                                    className="border-b border-slate-100 dark:border-slate-800"
                                >
                                    <td className="py-3 pr-4 font-medium text-slate-900 dark:text-white">
                                        {u.unitNumber}
                                    </td>
                                    <td className="py-3 pr-4">
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                u.status === 'AVAILABLE'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                                                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                                            }`}
                                        >
                                            {u.status}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                                        {u.wPct > 0 && u.hPct > 0
                                            ? `${u.xPct}, ${u.yPct} → ${u.wPct}×${u.hPct}`
                                            : '—'}
                                    </td>
                                    <td className="py-3">
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                                onClick={() => setSelectedUnitId(u.unitId)}
                                                disabled={!imageSrc}
                                            >
                                                Edit overlay
                                            </button>
                                            <button
                                                type="button"
                                                className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                                disabled={toggleStatus.isPending}
                                                onClick={() =>
                                                    void handleToggleStatus(
                                                        u.unitId,
                                                        u.status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE',
                                                    )
                                                }
                                            >
                                                Mark {u.status === 'AVAILABLE' ? 'occupied' : 'available'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function parsePositiveIntParam(raw: string | null): number | null {
    if (!raw || !/^\d+$/.test(raw)) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
}

export default function VisualMapOwner() {
    const [searchParams, setSearchParams] = useSearchParams();
    const propertyIdParamRaw = searchParams.get('propertyId');
    const propertyIdNum = parsePositiveIntParam(propertyIdParamRaw);
    const propertyIdInvalid =
        propertyIdParamRaw != null && propertyIdParamRaw !== '' && propertyIdNum == null;

    const floorIdRaw = searchParams.get('floorId');
    const validFloorFromUrl = floorIdRaw && /^\d+$/.test(floorIdRaw) ? floorIdRaw : null;

    const floorsQuery = useOwnerFloors(propertyIdNum);

    const [floorInput, setFloorInput] = useState(() => validFloorFromUrl ?? '');
    const [loadedFloorId, setLoadedFloorId] = useState<string | null>(() => validFloorFromUrl);

    useEffect(() => {
        if (validFloorFromUrl) {
            setFloorInput(validFloorFromUrl);
            setLoadedFloorId(validFloorFromUrl);
        }
    }, [validFloorFromUrl]);

    const patchQuery = (updates: Record<string, string | undefined>) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            for (const [k, v] of Object.entries(updates)) {
                if (v === undefined || v === '') next.delete(k);
                else next.set(k, v);
            }
            return next;
        });
    };

    const commitFloorId = (trimmed: string) => {
        setLoadedFloorId(trimmed);
        setFloorInput(trimmed);
        if (propertyIdNum != null) {
            patchQuery({ propertyId: String(propertyIdNum), floorId: trimmed });
        } else {
            patchQuery({ floorId: trimmed, propertyId: undefined });
        }
    };

    const loadFloor = () => {
        const trimmed = floorInput.trim();
        if (!/^\d+$/.test(trimmed)) {
            showError('Enter a numeric floor id');
            return;
        }
        commitFloorId(trimmed);
    };

    const handleFloorPickerChange = (value: string) => {
        if (!value) {
            setLoadedFloorId(null);
            setFloorInput('');
            if (propertyIdNum != null) {
                patchQuery({ propertyId: String(propertyIdNum), floorId: undefined });
            } else {
                patchQuery({ floorId: undefined });
            }
            return;
        }
        commitFloorId(value);
    };

    const floors = floorsQuery.data ?? [];
    const pickerValue =
        loadedFloorId && floors.some((f) => String(f.id) === loadedFloorId) ? loadedFloorId : '';

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <LayoutGrid className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Floor plans & units</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Register how your building appears on the map: upload each floor plan, draw unit areas,
                            and set availability. This is part of listing your property and apartments.
                        </p>
                    </div>
                </div>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Which floor?</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Pick a floor from your listing when you open this page from onboarding, or enter a floor id (same id
                    used in{' '}
                    <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">/floors/…/map</code>). You can only
                    edit floors you own.
                </p>

                {propertyIdInvalid ? (
                    <p className="mt-4 text-sm text-amber-800 dark:text-amber-200" role="alert">
                        The link contains an invalid property id. Remove <code className="mx-0.5 rounded bg-slate-100 px-1 dark:bg-slate-800">propertyId</code> from the URL or fix the value.
                    </p>
                ) : null}

                {propertyIdNum != null ? (
                    <div className="mt-4 space-y-2">
                        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                            Floor for property #{propertyIdNum}
                            {floorsQuery.isPending ? (
                                <span className="text-xs font-normal text-slate-500">Loading floors…</span>
                            ) : null}
                            {floorsQuery.isError ? (
                                <span className="text-xs font-normal text-red-600 dark:text-red-400">
                                    {floorsQuery.error instanceof Error
                                        ? floorsQuery.error.message
                                        : 'Could not load floors'}
                                </span>
                            ) : null}
                            <select
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                value={pickerValue}
                                onChange={(e) => handleFloorPickerChange(e.target.value)}
                                disabled={floorsQuery.isPending || floors.length === 0}
                            >
                                <option value="">
                                    {floors.length === 0 && !floorsQuery.isPending
                                        ? 'No floors yet — add floors in onboarding'
                                        : 'Choose a floor…'}
                                </option>
                                {floors.map((f) => (
                                    <option key={f.id} value={String(f.id)}>
                                        {f.label}
                                        {f.sortOrder != null ? ` (order ${f.sortOrder})` : ''}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                ) : null}

                <div className={`flex flex-col gap-3 sm:flex-row sm:items-end ${propertyIdNum != null ? 'mt-6 border-t border-slate-100 pt-6 dark:border-slate-800' : 'mt-4'}`}>
                    <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                        {propertyIdNum != null ? 'Or enter floor id' : 'Floor id'}
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={floorInput}
                            onChange={(e) => setFloorInput(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                            placeholder="e.g. 12"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={loadFloor}
                        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                    >
                        Load floor
                    </button>
                </div>
            </section>

            {loadedFloorId ? (
                <VisualMapFloorEditor key={loadedFloorId} floorId={loadedFloorId} />
            ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Choose a floor from the list or enter an id and click{' '}
                    <strong className="text-slate-700 dark:text-slate-300">Load floor</strong> to manage uploads and
                    overlays.
                </p>
            )}
        </div>
    );
}
