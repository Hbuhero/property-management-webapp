import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, ImagePlus, LayoutGrid, Trash2, Upload } from 'lucide-react';
import { uploadListingImage } from '@/api/fileUploadApi';
import { OverlayEditor } from '@/components/visual-map/OverlayEditor';
import { resolveFloorPlanImageUrl } from '@/components/visual-map/resolveFloorPlanUrl';
import {
    useFloorMap,
    useSaveOverlayOwner,
    useToggleUnitStatusOwner,
    useUploadFloorPlanOwner,
} from '@/hooks/useFloorMap';
import { resolveFloorThumbnailUrl, resolvePropertyImageUrl } from '@/lib/propertyMediaUrl';
import { showError, showSuccess } from '@/lib/toast';
import type { UnitOverlayPutBody } from '@/lib/contracts/preVisualMapContracts';
import { usePatchOwnerFloor, useOwnerFloors } from '@/queries/propertyStructure.queries';
import { useOwnerProperties } from '@/queries/property.queries';
import type { PropertySummary } from '@/schemas/property.schema';

const MAX_FLOOR_GALLERY = 12;

function propertyCardThumb(p: PropertySummary): string {
    const fromPaths =
        p.galleryImagePaths?.length && p.galleryImagePaths[0]
            ? resolvePropertyImageUrl(p.galleryImagePaths[0])
            : null;
    const primary = p.primaryGalleryImagePath
        ? resolvePropertyImageUrl(p.primaryGalleryImagePath)
        : null;
    return (
        (fromPaths ?? primary) ??
        `https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=400&seed=${p.id}`
    );
}

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
    propertyId: number | null;
    floorId: string;
};

function VisualMapFloorEditor({ propertyId, floorId }: VisualMapFloorEditorProps) {
    const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

    const { data, isPending, isError, error, refetch } = useFloorMap(floorId);
    const saveOverlay = useSaveOverlayOwner(floorId);
    const toggleStatus = useToggleUnitStatusOwner(floorId);
    const uploadPlan = useUploadFloorPlanOwner(floorId);
    const floorsStructure = useOwnerFloors(propertyId ?? undefined);
    const patchFloor = usePatchOwnerFloor();

    const floorRow = useMemo(
        () =>
            propertyId != null
                ? (floorsStructure.data ?? []).find((f) => String(f.id) === floorId)
                : undefined,
        [floorsStructure.data, floorId, propertyId],
    );

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

    const persistGalleryPaths = async (paths: string[]) => {
        if (propertyId == null) return;
        const galleryImages = paths.map((imagePath, sortOrder) => ({ imagePath, sortOrder }));
        try {
            await patchFloor.mutateAsync({
                propertyId,
                floorId: Number(floorId),
                body: { galleryImages },
            });
            showSuccess('Floor photos saved');
        } catch (e) {
            showError(e instanceof Error ? e.message : 'Could not save floor photos');
        }
    };

    const handleAddFloorGalleryFiles = async (fileList: FileList | null) => {
        if (!fileList?.length || propertyId == null) return;
        const existing = floorRow?.galleryImages?.map((g) => g.imagePath) ?? [];
        if (existing.length >= MAX_FLOOR_GALLERY) {
            showError(`Maximum ${MAX_FLOOR_GALLERY} photos per floor`);
            return;
        }
        const files = Array.from(fileList).filter((file) => {
            const ok =
                /^image\/(jpeg|jpg|png|svg\+xml)$/i.test(file.type) ||
                /\.(jpe?g|png|svg)$/i.test(file.name);
            if (!ok) showError(`${file.name}: use JPG, PNG, or SVG`);
            return ok;
        });
        if (!files.length) return;
        const room = MAX_FLOOR_GALLERY - existing.length;
        const slice = files.slice(0, room);
        if (files.length > room) {
            showError(`Only ${room} more image(s) added (limit ${MAX_FLOOR_GALLERY})`);
        }
        try {
            const uploaded: string[] = [];
            for (const file of slice) {
                uploaded.push(await uploadListingImage(file));
            }
            await persistGalleryPaths([...existing, ...uploaded]);
        } catch (e) {
            showError(e instanceof Error ? e.message : 'Upload failed');
        }
    };

    const removeFloorGalleryAt = (index: number) => {
        const paths = floorRow?.galleryImages?.map((g) => g.imagePath) ?? [];
        const next = paths.filter((_, i) => i !== index);
        void persistGalleryPaths(next);
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

            {propertyId != null ? (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">Floor photos</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Optional extras for this storey (e.g. lobby, corridor). Shown on the public listing beside the
                        floor plan thumbnail. Up to {MAX_FLOOR_GALLERY} images.
                    </p>
                    <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                        <ImagePlus className="h-4 w-4" aria-hidden />
                        Add photos
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/svg+xml,.jpg,.jpeg,.png,.svg"
                            multiple
                            className="sr-only"
                            disabled={patchFloor.isPending}
                            onChange={(e) => {
                                void handleAddFloorGalleryFiles(e.target.files);
                                e.target.value = '';
                            }}
                        />
                    </label>
                    {(floorRow?.galleryImages?.length ?? 0) > 0 ? (
                        <ul className="mt-4 flex flex-wrap gap-3">
                            {(floorRow?.galleryImages ?? []).map((g, idx) => {
                                const src = resolvePropertyImageUrl(g.imagePath);
                                return (
                                    <li
                                        key={g.id}
                                        className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                                    >
                                        {src ? (
                                            <img src={src} alt="" className="h-full w-full object-cover" />
                                        ) : null}
                                        <button
                                            type="button"
                                            disabled={patchFloor.isPending}
                                            onClick={() => removeFloorGalleryAt(idx)}
                                            className="absolute right-1 top-1 rounded-md bg-black/55 p-1 text-white hover:bg-black/75 disabled:opacity-50"
                                            aria-label="Remove photo"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No extra floor photos yet.</p>
                    )}
                </section>
            ) : null}

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
    const location = useLocation();
    const base = location.pathname.startsWith('/landlord') ? '/landlord' : '/owner';
    const [searchParams, setSearchParams] = useSearchParams();
    const propertyIdParamRaw = searchParams.get('propertyId');
    const propertyIdNum = parsePositiveIntParam(propertyIdParamRaw);
    const propertyIdInvalid =
        propertyIdParamRaw != null && propertyIdParamRaw !== '' && propertyIdNum == null;

    const floorIdRaw = searchParams.get('floorId');
    const validFloorFromUrl = floorIdRaw && /^\d+$/.test(floorIdRaw) ? floorIdRaw : null;

    const propertiesQuery = useOwnerProperties({ page: 0, size: 100 });
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

    const selectProperty = (id: number) => {
        setLoadedFloorId(null);
        setFloorInput('');
        patchQuery({ propertyId: String(id), floorId: undefined });
    };

    const backToProperties = () => {
        setLoadedFloorId(null);
        setFloorInput('');
        patchQuery({ propertyId: undefined, floorId: undefined });
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

    const propertyRecords = propertiesQuery.data?.records ?? [];
    const selectedProperty = useMemo(
        () => propertyRecords.find((p) => p.id === propertyIdNum) ?? null,
        [propertyRecords, propertyIdNum],
    );

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
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    {propertyIdNum == null ? 'Choose a property' : 'Choose a floor'}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {propertyIdNum == null
                        ? 'Pick a listing, then select a floor from thumbnail cards — no ids required.'
                        : 'Tap a floor to upload its plan, draw unit overlays, and set availability.'}
                </p>

                {propertyIdInvalid ? (
                    <p className="mt-4 text-sm text-amber-800 dark:text-amber-200" role="alert">
                        The link contains an invalid property id. Remove{' '}
                        <code className="mx-0.5 rounded bg-slate-100 px-1 dark:bg-slate-800">propertyId</code> from the
                        URL or fix the value.
                    </p>
                ) : null}

                {propertyIdNum == null ? (
                    <div className="mt-5">
                        {propertiesQuery.isPending ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">Loading your listings…</p>
                        ) : null}
                        {propertiesQuery.isError ? (
                            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                                {propertiesQuery.error instanceof Error
                                    ? propertiesQuery.error.message
                                    : 'Could not load properties'}
                            </p>
                        ) : null}
                        {!propertiesQuery.isPending && propertyRecords.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {propertyRecords.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => selectProperty(p.id)}
                                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:border-emerald-500/40 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-500/30"
                                    >
                                        <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                            <img
                                                src={propertyCardThumb(p)}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="p-3">
                                            <p className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-white">
                                                {p.title}
                                            </p>
                                            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                                                {p.location}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : null}
                        {!propertiesQuery.isPending && propertyRecords.length === 0 ? (
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                No listings yet.{' '}
                                <Link
                                    to={`${base}/properties`}
                                    className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                                >
                                    Go to Properties
                                </Link>{' '}
                                to create one.
                            </p>
                        ) : null}
                    </div>
                ) : (
                    <div className="mt-5 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={backToProperties}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                                All listings
                            </button>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                {selectedProperty?.title ?? `Property #${propertyIdNum}`}
                            </span>
                        </div>
                        {floorsQuery.isPending ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">Loading floors…</p>
                        ) : null}
                        {floorsQuery.isError ? (
                            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                                {floorsQuery.error instanceof Error
                                    ? floorsQuery.error.message
                                    : 'Could not load floors'}
                            </p>
                        ) : null}
                        {!floorsQuery.isPending && floors.length === 0 ? (
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                This listing has no floors yet. Add them from{' '}
                                <Link
                                    to={`${base}/properties/onboarding`}
                                    className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                                >
                                    New property listing
                                </Link>{' '}
                                or your property inventory.
                            </p>
                        ) : null}
                        {floors.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                {floors.map((f) => {
                                    const thumb = resolveFloorThumbnailUrl(
                                        f.floorPlanImagePath,
                                        f.galleryImages,
                                    );
                                    const active = pickerValue === String(f.id);
                                    return (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => handleFloorPickerChange(String(f.id))}
                                            className={`rounded-xl border p-2 text-left transition ${
                                                active
                                                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/30 dark:bg-emerald-950/30'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600'
                                            }`}
                                        >
                                            <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                                                {thumb ? (
                                                    <img
                                                        src={thumb}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center px-2 text-center text-[11px] text-slate-500 dark:text-slate-400">
                                                        No plan yet — tap to add
                                                    </div>
                                                )}
                                            </div>
                                            <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-900 dark:text-white">
                                                {f.label}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>
                )}

                <details className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/40 open:pb-4">
                    <summary className="cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400">
                        Advanced: load by numeric floor id
                    </summary>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                        <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                            Floor id
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={floorInput}
                                onChange={(e) => setFloorInput(e.target.value)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950 dark:text-white"
                                placeholder="e.g. 12"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={loadFloor}
                            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                        >
                            Load floor
                        </button>
                    </div>
                </details>
            </section>

            {loadedFloorId ? (
                <VisualMapFloorEditor key={loadedFloorId} propertyId={propertyIdNum} floorId={loadedFloorId} />
            ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {propertyIdNum == null
                        ? 'Choose a property above to see its floors.'
                        : 'Choose a floor card above to open the editor.'}
                </p>
            )}
        </div>
    );
}
