import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, LayoutGrid, Layers, MapPin, Building2, Plus, Trash2, ImagePlus, Star } from 'lucide-react';
import {
    fetchDistrictsByRegion,
    fetchPropertyTypesLookup,
    fetchRegionsLookup,
} from '@/api/referenceDataApi';
import { uploadListingImage } from '@/api/fileUploadApi';
import { FloorUnitTypeSchema, MapUnitStatusSchema } from '@/lib/contracts/preVisualMapContracts';
import { resolveFloorThumbnailUrl } from '@/lib/propertyMediaUrl';
import { SUGGESTED_BUILDING_AMENITIES } from '@/lib/buildingAmenitySuggestions';
import { showError, showSuccess } from '@/lib/toast';
import { useCreateProperty } from '@/queries/property.queries';
import {
    propertyStructureKeys,
    useBulkCreateOwnerUnits,
    useCreateOwnerFloor,
    useOwnerFloors,
} from '@/queries/propertyStructure.queries';
import type { PropertyCreateInput, PropertyDetail } from '@/schemas/property.schema';
import type { BulkFloorUnitsInput } from '@/schemas/propertyStructure.schema';

const UNIT_TYPE_OPTIONS = FloorUnitTypeSchema.options;
const STATUS_OPTIONS = MapUnitStatusSchema.options;

type UnitFormRow = {
    clientId: string;
    unitNumber: string;
    bedrooms: string;
    sizeM2: string;
    monthlyRent: string;
    unitType: string;
    status: string;
    amenities: string[];
    amenityInput: string;
};

function newClientId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyUnitRow(): UnitFormRow {
    return {
        clientId: newClientId(),
        unitNumber: '',
        bedrooms: '',
        sizeM2: '',
        monthlyRent: '',
        unitType: '',
        status: 'AVAILABLE',
        amenities: [],
        amenityInput: '',
    };
}

function rowsToBulkUnits(rows: UnitFormRow[]): BulkFloorUnitsInput['units'] {
    const out: BulkFloorUnitsInput['units'] = [];
    for (const r of rows) {
        const unitNumber = r.unitNumber.trim();
        if (!unitNumber) continue;
        const row: BulkFloorUnitsInput['units'][number] = { unitNumber };
        const b = Number.parseInt(r.bedrooms, 10);
        if (r.bedrooms.trim() !== '' && !Number.isNaN(b)) row.bedrooms = b;
        const sz = Number.parseFloat(r.sizeM2);
        if (r.sizeM2.trim() !== '' && !Number.isNaN(sz)) row.sizeM2 = sz;
        const rent = Number.parseFloat(r.monthlyRent);
        if (r.monthlyRent.trim() !== '' && !Number.isNaN(rent)) row.monthlyRent = rent;
        const ut = r.unitType.trim();
        if (ut) {
            const parsed = FloorUnitTypeSchema.safeParse(ut);
            if (parsed.success) row.unitType = parsed.data;
            else row.unitType = ut;
        }
        const st = r.status.trim();
        if (st) {
            const parsed = MapUnitStatusSchema.safeParse(st);
            if (parsed.success) row.status = parsed.data;
        }
        if (r.amenities.length > 0) row.amenities = [...r.amenities];
        out.push(row);
    }
    return out;
}

function formatUnitTypeLabel(value: string): string {
    return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const MAX_LISTING_GALLERY = 12;

type LocalGalleryItem = {
    clientId: string;
    file?: File;
    previewUrl: string;
    serverPath?: string;
    uploading?: boolean;
    error?: string;
};

function buildCreateGalleryPayload(
    items: LocalGalleryItem[],
    thumbId: string | null,
): NonNullable<PropertyCreateInput['galleryImages']> | undefined {
    const ready = items.filter((i) => i.serverPath);
    if (!ready.length) return undefined;
    const thumb = thumbId ?? ready[0].clientId;
    const ordered = [
        ...ready.filter((i) => i.clientId === thumb),
        ...ready.filter((i) => i.clientId !== thumb),
    ];
    return ordered.map((item, idx) => ({ imagePath: item.serverPath!, sortOrder: idx }));
}

const STEPS = ['Listing', 'Floors & units', 'Floor plans'] as const;

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
    return (
        <ol className="mb-8 flex flex-wrap gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {STEPS.map((label, i) => {
                const n = (i + 1) as 1 | 2 | 3;
                const active = step === n;
                const done = step > n;
                return (
                    <li
                        key={label}
                        className={`flex items-center gap-1 rounded-full px-3 py-1 ${
                            active
                                ? 'bg-emerald-600 text-white'
                                : done
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                                  : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                    >
                        <span>{n}</span>
                        {label}
                    </li>
                );
            })}
        </ol>
    );
}

const inputClass =
    'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

const labelClass = 'flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200';

/**
 * Landlord flow: create listing → define floors/units → jump into visual map per floor.
 */
export default function PropertyOnboardingWizard() {
    const location = useLocation();
    const base = location.pathname.startsWith('/landlord') ? '/landlord' : '/owner';
    const qc = useQueryClient();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [created, setCreated] = useState<PropertyDetail | null>(null);

    const regionsQuery = useQuery({
        queryKey: ['reference', 'regions'],
        queryFn: fetchRegionsLookup,
        staleTime: 30 * 60_000,
    });

    const typesQuery = useQuery({
        queryKey: ['reference', 'property-types'],
        queryFn: fetchPropertyTypesLookup,
        staleTime: 30 * 60_000,
    });

    const [regionId, setRegionId] = useState<number | ''>('');
    const [districtId, setDistrictId] = useState<number | ''>('');

    const districtsQuery = useQuery({
        queryKey: ['reference', 'districts', regionId],
        queryFn: () => fetchDistrictsByRegion(regionId as number),
        enabled: typeof regionId === 'number',
    });

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [addressLine, setAddressLine] = useState('');
    const [locationText, setLocationText] = useState('');
    const [propertyTypeId, setPropertyTypeId] = useState<number | ''>('');
    const [galleryItems, setGalleryItems] = useState<LocalGalleryItem[]>([]);
    const [thumbnailClientId, setThumbnailClientId] = useState<string | null>(null);
    const [buildingAmenities, setBuildingAmenities] = useState<string[]>([]);
    const [buildingAmenityInput, setBuildingAmenityInput] = useState('');

    const createProp = useCreateProperty();

    const propertyId = created?.id ?? null;
    const floorsQuery = useOwnerFloors(propertyId);

    const createFloorMut = useCreateOwnerFloor();
    const bulkUnitsMut = useBulkCreateOwnerUnits();

    const uploadGalleryBatch = async (batch: LocalGalleryItem[]) => {
        for (const item of batch) {
            try {
                const path = await uploadListingImage(item.file!);
                setGalleryItems((prev) =>
                    prev.map((row) =>
                        row.clientId === item.clientId
                            ? { ...row, serverPath: path, uploading: false, error: undefined }
                            : row,
                    ),
                );
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Upload failed';
                setGalleryItems((prev) =>
                    prev.map((row) =>
                        row.clientId === item.clientId ? { ...row, uploading: false, error: msg } : row,
                    ),
                );
                showError(msg);
            }
        }
    };

    const handleGalleryFiles = (fileList: FileList | null) => {
        if (!fileList?.length) return;
        const files = Array.from(fileList).filter((file) => {
            const ok =
                /^image\/(jpeg|jpg|png|svg\+xml)$/i.test(file.type) ||
                /\.(jpe?g|png|svg)$/i.test(file.name);
            if (!ok) showError(`${file.name}: use JPG, PNG, or SVG`);
            return ok;
        });
        if (!files.length) return;

        setGalleryItems((prev) => {
            const room = MAX_LISTING_GALLERY - prev.length;
            if (room <= 0) {
                showError(`Maximum ${MAX_LISTING_GALLERY} images`);
                return prev;
            }
            const slice = files.slice(0, room);
            if (files.length > room) {
                showError(`Only ${room} more image(s) added (limit ${MAX_LISTING_GALLERY})`);
            }
            const additions: LocalGalleryItem[] = slice.map((file) => ({
                clientId: newClientId(),
                file,
                previewUrl: URL.createObjectURL(file),
                uploading: true,
            }));
            if (additions.length) {
                setThumbnailClientId((tid) => tid ?? additions[0].clientId);
                void uploadGalleryBatch(additions);
            }
            return [...prev, ...additions];
        });
    };

    const removeGalleryItem = (clientId: string) => {
        setGalleryItems((prev) => {
            const victim = prev.find((i) => i.clientId === clientId);
            if (victim?.previewUrl.startsWith('blob:')) URL.revokeObjectURL(victim.previewUrl);
            const next = prev.filter((i) => i.clientId !== clientId);
            setThumbnailClientId((thumb) => {
                if (thumb !== clientId) return thumb;
                return next[0]?.clientId ?? null;
            });
            return next;
        });
    };

    const [newFloorLabel, setNewFloorLabel] = useState('');
    const [newFloorSort, setNewFloorSort] = useState('');
    const [unitRowsByFloor, setUnitRowsByFloor] = useState<Record<number, UnitFormRow[]>>({});

    const handleListingSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim() || !locationText.trim() || !addressLine.trim()) {
            showError('Please fill title, description, location, and address.');
            return;
        }
        if (typeof regionId !== 'number' || typeof districtId !== 'number') {
            showError('Choose region and district.');
            return;
        }
        if (typeof propertyTypeId !== 'number') {
            showError('Choose a property type.');
            return;
        }
        if (galleryItems.some((i) => i.uploading)) {
            showError('Wait for photo uploads to finish.');
            return;
        }
        if (galleryItems.some((i) => i.error && !i.serverPath)) {
            showError('Remove failed uploads before continuing.');
            return;
        }
        if (galleryItems.some((i) => i.file && !i.serverPath && !i.error)) {
            showError('Photos are still processing — try again in a moment.');
            return;
        }
        const galleryImages = buildCreateGalleryPayload(galleryItems, thumbnailClientId);
        const body: PropertyCreateInput = {
            title: title.trim(),
            description: description.trim(),
            location: locationText.trim(),
            address: addressLine.trim(),
            region: regionId,
            district: districtId,
            propertyType: propertyTypeId,
            ...(buildingAmenities.length > 0 ? { amenities: buildingAmenities } : {}),
            ...(galleryImages ? { galleryImages } : {}),
        };
        try {
            const detail = await createProp.mutateAsync(body);
            setCreated(detail);
            void qc.invalidateQueries({ queryKey: propertyStructureKeys.floors(detail.id) });
            showSuccess('Property listing saved');
            setStep(2);
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Could not create listing');
        }
    };

    const handleAddFloor = async () => {
        if (!created) return;
        const label = newFloorLabel.trim();
        if (!label) {
            showError('Floor label is required');
            return;
        }
        const parsedSort = newFloorSort.trim() === '' ? undefined : Number(newFloorSort);
        const sortOrder =
            parsedSort !== undefined && !Number.isNaN(parsedSort) ? parsedSort : undefined;
        try {
            await createFloorMut.mutateAsync({
                propertyId: created.id,
                body: { label, sortOrder },
            });
            setNewFloorLabel('');
            setNewFloorSort('');
            showSuccess('Floor added');
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Could not add floor');
        }
    };

    const handleSaveFloorUnits = async (floorId: number) => {
        if (!created) return;
        const rows = resolvedUnitRowsByFloor[floorId] ?? [emptyUnitRow()];
        const units = rowsToBulkUnits(rows);
        if (units.length === 0) {
            showError('Add at least one unit number before saving.');
            return;
        }
        try {
            await bulkUnitsMut.mutateAsync({
                propertyId: created.id,
                floorId,
                body: { units },
            });
            setUnitRowsByFloor((d) => ({ ...d, [floorId]: [emptyUnitRow()] }));
            showSuccess('Units saved');
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Could not save units');
        }
    };

    const floors = floorsQuery.data ?? [];
    const resolvedUnitRowsByFloor: Record<number, UnitFormRow[]> = { ...unitRowsByFloor };
    for (const f of floors) {
        if (resolvedUnitRowsByFloor[f.id] === undefined) {
            resolvedUnitRowsByFloor[f.id] = [emptyUnitRow()];
        }
    }

    const listingBusy =
        regionsQuery.isPending ||
        typesQuery.isPending ||
        (typeof regionId === 'number' && districtsQuery.isPending) ||
        galleryItems.some((i) => i.uploading);

    const headerTitle = (
        <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Building2 className="h-5 w-5" aria-hidden />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    New property listing
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Create the listing, add floors and units, then open the visual map for each storey.
                </p>
            </div>
        </div>
    );

    return (
        <div className="mx-auto max-w-3xl space-y-8 pb-12">
            {headerTitle}
            <StepIndicator step={step} />

            {step === 1 && (
                <form
                    onSubmit={(e) => void handleListingSubmit(e)}
                    className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                        <MapPin className="h-5 w-5 text-emerald-600" aria-hidden />
                        Listing details
                    </h2>

                    <label className={labelClass}>
                        Title
                        <input
                            className={inputClass}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="e.g. Mikocheni apartments"
                        />
                    </label>

                    <label className={labelClass}>
                        Description
                        <textarea
                            className={`${inputClass} min-h-[100px] resize-y`}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            placeholder="Describe the building and what tenants should know"
                        />
                    </label>

                    <label className={labelClass}>
                        Location (short)
                        <input
                            className={inputClass}
                            value={locationText}
                            onChange={(e) => setLocationText(e.target.value)}
                            required
                            placeholder="Neighbourhood / area label"
                        />
                    </label>

                    <label className={labelClass}>
                        Street address
                        <input
                            className={inputClass}
                            value={addressLine}
                            onChange={(e) => setAddressLine(e.target.value)}
                            required
                            placeholder="Plot, street, city"
                        />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className={labelClass}>
                            Region
                            <select
                                className={inputClass}
                                value={regionId === '' ? '' : String(regionId)}
                                disabled={regionsQuery.isPending}
                                onChange={(e) => {
                                    const v = e.target.value === '' ? '' : Number(e.target.value);
                                    setRegionId(v);
                                    setDistrictId('');
                                }}
                            >
                                <option value="">Select region</option>
                                {(regionsQuery.data ?? []).map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className={labelClass}>
                            District
                            <select
                                className={inputClass}
                                value={districtId === '' ? '' : String(districtId)}
                                disabled={typeof regionId !== 'number' || districtsQuery.isPending}
                                onChange={(e) => {
                                    const v = e.target.value === '' ? '' : Number(e.target.value);
                                    setDistrictId(v);
                                }}
                            >
                                <option value="">Select district</option>
                                {(districtsQuery.data ?? []).map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <label className={labelClass}>
                        Property type
                        <select
                            className={inputClass}
                            value={propertyTypeId === '' ? '' : String(propertyTypeId)}
                            disabled={typesQuery.isPending}
                            onChange={(e) => {
                                const v = e.target.value === '' ? '' : Number(e.target.value);
                                setPropertyTypeId(v);
                            }}
                        >
                            <option value="">Select type</option>
                            {(typesQuery.data ?? []).map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className={labelClass}>
                        <span>Building amenities</span>
                        <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                            Shared facilities for the whole building (e.g. gym). Tenants see these on the public
                            listing.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {SUGGESTED_BUILDING_AMENITIES.map((label) => (
                                <button
                                    key={label}
                                    type="button"
                                    disabled={buildingAmenities.includes(label)}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-emerald-500/50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
                                    onClick={() =>
                                        setBuildingAmenities((prev) =>
                                            prev.includes(label) ? prev : [...prev, label],
                                        )
                                    }
                                >
                                    + {label}
                                </button>
                            ))}
                        </div>
                        {buildingAmenities.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {buildingAmenities.map((a) => (
                                    <span
                                        key={a}
                                        className="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-200"
                                    >
                                        {a}
                                        <button
                                            type="button"
                                            className="text-emerald-700/80 hover:text-emerald-900 dark:text-emerald-300"
                                            aria-label={`Remove ${a}`}
                                            onClick={() =>
                                                setBuildingAmenities((prev) => prev.filter((x) => x !== a))
                                            }
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        ) : null}
                        <div className="mt-3 flex gap-2">
                            <input
                                className={`${inputClass} flex-1`}
                                value={buildingAmenityInput}
                                placeholder="Add custom (Enter)"
                                onChange={(e) => setBuildingAmenityInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key !== 'Enter') return;
                                    e.preventDefault();
                                    const label = buildingAmenityInput.trim();
                                    if (!label) return;
                                    setBuildingAmenities((prev) =>
                                        prev.includes(label) ? prev : [...prev, label],
                                    );
                                    setBuildingAmenityInput('');
                                }}
                            />
                        </div>
                    </div>

                    <div className={labelClass}>
                        <span>Photos</span>
                        <p className="text-xs font-normal text-slate-500 dark:text-slate-400">
                            Upload one or more images (JPG, PNG, SVG). Choose which appears as the listing thumbnail
                            in Marketplace and inventory.
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
                                <ImagePlus className="h-4 w-4 text-emerald-600" aria-hidden />
                                Add images
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/svg+xml,.jpg,.jpeg,.png,.svg"
                                    multiple
                                    className="sr-only"
                                    onChange={(e) => {
                                        handleGalleryFiles(e.target.files);
                                        e.target.value = '';
                                    }}
                                />
                            </label>
                            <span className="text-[11px] text-slate-400">
                                {galleryItems.length}/{MAX_LISTING_GALLERY}
                            </span>
                        </div>
                        {galleryItems.length > 0 && (
                            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {galleryItems.map((item) => (
                                    <li
                                        key={item.clientId}
                                        className={`relative overflow-hidden rounded-xl border bg-slate-50 dark:bg-slate-950 ${
                                            thumbnailClientId === item.clientId
                                                ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                                                : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <div className="relative aspect-4/3">
                                            <img
                                                src={item.previewUrl}
                                                alt=""
                                                className="h-full w-full object-cover"
                                            />
                                            {item.uploading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white">
                                                    Uploading…
                                                </div>
                                            )}
                                            {item.error && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/80 p-2 text-center text-[10px] font-medium text-red-100">
                                                    {item.error}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1 border-t border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                                            <button
                                                type="button"
                                                disabled={!item.serverPath}
                                                title={
                                                    item.serverPath
                                                        ? 'Use as thumbnail'
                                                        : 'Wait for upload'
                                                }
                                                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600/10 px-2 py-1.5 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-40 dark:text-emerald-300"
                                                onClick={() => setThumbnailClientId(item.clientId)}
                                            >
                                                <Star className="h-3 w-3 shrink-0" aria-hidden />
                                                Thumbnail
                                            </button>
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
                                                aria-label="Remove image"
                                                onClick={() => removeGalleryItem(item.clientId)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={listingBusy || createProp.isPending}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                        Save & continue
                        <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                </form>
            )}

            {step === 2 && created && (
                <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                            <Layers className="h-5 w-5 text-emerald-600" aria-hidden />
                            Floors & units for “{created.title}”
                        </h2>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-sm font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            Back to listing
                        </button>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Property id{' '}
                        <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{created.id}</code>
                        . Add each storey, then fill in units below (number, rent, size, type, and amenities).
                        Use &quot;Add unit&quot; for multiple units on the same floor.
                    </p>

                    <div className="rounded-xl border border-dashed border-slate-200 p-4 dark:border-slate-700">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">New floor</p>
                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                            <label className={`${labelClass} flex-1`}>
                                Label
                                <input
                                    className={inputClass}
                                    value={newFloorLabel}
                                    onChange={(e) => setNewFloorLabel(e.target.value)}
                                    placeholder="e.g. Ground floor"
                                />
                            </label>
                            <label className={`${labelClass} w-full sm:w-28`}>
                                Sort order
                                <input
                                    className={inputClass}
                                    type="number"
                                    value={newFloorSort}
                                    onChange={(e) => setNewFloorSort(e.target.value)}
                                    placeholder="0"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={() => void handleAddFloor()}
                                disabled={createFloorMut.isPending}
                                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                                Add floor
                            </button>
                        </div>
                    </div>

                    {floorsQuery.isPending ? (
                        <p className="text-sm text-slate-500">Loading floors…</p>
                    ) : floors.length === 0 ? (
                        <p className="text-sm text-slate-500">
                            No floors yet. Add at least one floor before uploading floor plans.
                        </p>
                    ) : (
                        <ul className="space-y-6">
                            {floors.map((floor) => (
                                <li
                                    key={floor.id}
                                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white">
                                                {floor.label}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Floor id {floor.id} · {floor.unitCount} units · sort{' '}
                                                {floor.sortOrder ?? '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Units on this floor
                                        </p>
                                        {(resolvedUnitRowsByFloor[floor.id] ?? [emptyUnitRow()]).map((row) => (
                                            <div
                                                key={row.clientId}
                                                className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/40"
                                            >
                                                <div className="mb-3 flex items-center justify-between gap-2">
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                        Unit
                                                    </span>
                                                    {(resolvedUnitRowsByFloor[floor.id] ?? [emptyUnitRow()]).length >
                                                        1 && (
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                                            onClick={() =>
                                                                setUnitRowsByFloor((prev) => ({
                                                                    ...prev,
                                                                    [floor.id]: (
                                                                        prev[floor.id] ?? [emptyUnitRow()]
                                                                    ).filter((r) => r.clientId !== row.clientId),
                                                                }))
                                                            }
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <label className={labelClass}>
                                                        Unit number
                                                        <input
                                                            className={inputClass}
                                                            value={row.unitNumber}
                                                            placeholder="e.g. 101"
                                                            onChange={(e) =>
                                                                setUnitRowsByFloor((prev) => ({
                                                                    ...prev,
                                                                    [floor.id]: (
                                                                        prev[floor.id] ?? [emptyUnitRow()]
                                                                    ).map((r) =>
                                                                        r.clientId === row.clientId
                                                                            ? {
                                                                                  ...r,
                                                                                  unitNumber: e.target.value,
                                                                              }
                                                                            : r,
                                                                    ),
                                                                }))
                                                            }
                                                        />
                                                    </label>
                                                    <label className={labelClass}>
                                                        Bedrooms
                                                        <input
                                                            className={inputClass}
                                                            type="number"
                                                            min={0}
                                                            value={row.bedrooms}
                                                            placeholder="Optional"
                                                            onChange={(e) =>
                                                                setUnitRowsByFloor((prev) => ({
                                                                    ...prev,
                                                                    [floor.id]: (
                                                                        prev[floor.id] ?? [emptyUnitRow()]
                                                                    ).map((r) =>
                                                                        r.clientId === row.clientId
                                                                            ? {
                                                                                  ...r,
                                                                                  bedrooms: e.target.value,
                                                                              }
                                                                            : r,
                                                                    ),
                                                                }))
                                                            }
                                                        />
                                                    </label>
                                                    <label className={labelClass}>
                                                        Size (m²)
                                                        <input
                                                            className={inputClass}
                                                            type="number"
                                                            min={0}
                                                            step="0.01"
                                                            value={row.sizeM2}
                                                            placeholder="Optional"
                                                            onChange={(e) =>
                                                                setUnitRowsByFloor((prev) => ({
                                                                    ...prev,
                                                                    [floor.id]: (
                                                                        prev[floor.id] ?? [emptyUnitRow()]
                                                                    ).map((r) =>
                                                                        r.clientId === row.clientId
                                                                            ? {
                                                                                  ...r,
                                                                                  sizeM2: e.target.value,
                                                                              }
                                                                            : r,
                                                                    ),
                                                                }))
                                                            }
                                                        />
                                                    </label>
                                                    <label className={labelClass}>
                                                        Monthly rent
                                                        <input
                                                            className={inputClass}
                                                            type="number"
                                                            min={0}
                                                            step="1000"
                                                            value={row.monthlyRent}
                                                            placeholder="Optional"
                                                            onChange={(e) =>
                                                                setUnitRowsByFloor((prev) => ({
                                                                    ...prev,
                                                                    [floor.id]: (
                                                                        prev[floor.id] ?? [emptyUnitRow()]
                                                                    ).map((r) =>
                                                                        r.clientId === row.clientId
                                                                            ? {
                                                                                  ...r,
                                                                                  monthlyRent: e.target.value,
                                                                              }
                                                                            : r,
                                                                    ),
                                                                }))
                                                            }
                                                        />
                                                    </label>
                                                    <label className={labelClass}>
                                                        Unit type
                                                        <select
                                                            className={inputClass}
                                                            value={row.unitType}
                                                            onChange={(e) =>
                                                                setUnitRowsByFloor((prev) => ({
                                                                    ...prev,
                                                                    [floor.id]: (
                                                                        prev[floor.id] ?? [emptyUnitRow()]
                                                                    ).map((r) =>
                                                                        r.clientId === row.clientId
                                                                            ? {
                                                                                  ...r,
                                                                                  unitType: e.target.value,
                                                                              }
                                                                            : r,
                                                                    ),
                                                                }))
                                                            }
                                                        >
                                                            <option value="">Not specified</option>
                                                            {UNIT_TYPE_OPTIONS.map((opt) => (
                                                                <option key={opt} value={opt}>
                                                                    {formatUnitTypeLabel(opt)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    <label className={labelClass}>
                                                        Status
                                                        <select
                                                            className={inputClass}
                                                            value={row.status}
                                                            onChange={(e) =>
                                                                setUnitRowsByFloor((prev) => ({
                                                                    ...prev,
                                                                    [floor.id]: (
                                                                        prev[floor.id] ?? [emptyUnitRow()]
                                                                    ).map((r) =>
                                                                        r.clientId === row.clientId
                                                                            ? {
                                                                                  ...r,
                                                                                  status: e.target.value,
                                                                              }
                                                                            : r,
                                                                    ),
                                                                }))
                                                            }
                                                        >
                                                            {STATUS_OPTIONS.map((opt) => (
                                                                <option key={opt} value={opt}>
                                                                    {formatUnitTypeLabel(opt)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                </div>
                                                <div className={`${labelClass} mt-3`}>
                                                    Amenities
                                                    <div className="flex flex-wrap gap-2">
                                                        {row.amenities.map((a) => (
                                                            <span
                                                                key={a}
                                                                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                                                            >
                                                                {a}
                                                                <button
                                                                    type="button"
                                                                    className="rounded-full p-0.5 hover:bg-emerald-200/80 dark:hover:bg-emerald-800"
                                                                    aria-label={`Remove ${a}`}
                                                                    onClick={() =>
                                                                        setUnitRowsByFloor((prev) => ({
                                                                            ...prev,
                                                                            [floor.id]: (
                                                                                prev[floor.id] ??
                                                                                [emptyUnitRow()]
                                                                            ).map((r2) =>
                                                                                r2.clientId === row.clientId
                                                                                    ? {
                                                                                          ...r2,
                                                                                          amenities:
                                                                                              r2.amenities.filter(
                                                                                                  (x) =>
                                                                                                      x !== a,
                                                                                              ),
                                                                                      }
                                                                                    : r2,
                                                                            ),
                                                                        }))
                                                                    }
                                                                >
                                                                    ×
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <input
                                                            className={`${inputClass} min-w-[140px] flex-1`}
                                                            value={row.amenityInput}
                                                            placeholder="e.g. Balcony, Parking"
                                                            onChange={(e) =>
                                                                setUnitRowsByFloor((prev) => ({
                                                                    ...prev,
                                                                    [floor.id]: (
                                                                        prev[floor.id] ?? [emptyUnitRow()]
                                                                    ).map((r2) =>
                                                                        r2.clientId === row.clientId
                                                                            ? {
                                                                                  ...r2,
                                                                                  amenityInput: e.target.value,
                                                                              }
                                                                            : r2,
                                                                    ),
                                                                }))
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (e.key !== 'Enter') return;
                                                                e.preventDefault();
                                                                const label = row.amenityInput.trim();
                                                                if (!label) return;
                                                                setUnitRowsByFloor((prev) => ({
                                                                    ...prev,
                                                                    [floor.id]: (
                                                                        prev[floor.id] ?? [emptyUnitRow()]
                                                                    ).map((r2) => {
                                                                        if (r2.clientId !== row.clientId)
                                                                            return r2;
                                                                        if (r2.amenities.includes(label))
                                                                            return {
                                                                                ...r2,
                                                                                amenityInput: '',
                                                                            };
                                                                        return {
                                                                            ...r2,
                                                                            amenities: [...r2.amenities, label],
                                                                            amenityInput: '',
                                                                        };
                                                                    }),
                                                                }));
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                                            onClick={() => {
                                                                const label = row.amenityInput.trim();
                                                                if (!label) return;
                                                                setUnitRowsByFloor((prev) => ({
                                                                    ...prev,
                                                                    [floor.id]: (
                                                                        prev[floor.id] ?? [emptyUnitRow()]
                                                                    ).map((r2) => {
                                                                        if (r2.clientId !== row.clientId)
                                                                            return r2;
                                                                        if (r2.amenities.includes(label))
                                                                            return {
                                                                                ...r2,
                                                                                amenityInput: '',
                                                                            };
                                                                        return {
                                                                            ...r2,
                                                                            amenities: [...r2.amenities, label],
                                                                            amenityInput: '',
                                                                        };
                                                                    }),
                                                                }));
                                                            }}
                                                        >
                                                            <Plus className="h-3.5 w-3.5" aria-hidden />
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                                            onClick={() =>
                                                setUnitRowsByFloor((prev) => ({
                                                    ...prev,
                                                    [floor.id]: [
                                                        ...(prev[floor.id] ?? [emptyUnitRow()]),
                                                        emptyUnitRow(),
                                                    ],
                                                }))
                                            }
                                        >
                                            <Plus className="h-4 w-4" aria-hidden />
                                            Add unit
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => void handleSaveFloorUnits(floor.id)}
                                        disabled={bulkUnitsMut.isPending}
                                        className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                        Save units on this floor
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <button
                        type="button"
                        onClick={() => setStep(3)}
                        disabled={floors.length === 0}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                        Continue to floor plans
                        <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                </div>
            )}

            {step === 3 && created && (
                <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                            <LayoutGrid className="h-5 w-5 text-emerald-600" aria-hidden />
                            Visual floor maps
                        </h2>
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            className="text-sm font-medium text-slate-500 underline hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            Back to structure
                        </button>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Open each floor in the overlay editor (authenticated). Public preview opens in a new tab.
                    </p>

                    {floors.length === 0 ? (
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            Add floors and units in step 2 first.
                        </p>
                    ) : (
                        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {floors.map((floor) => {
                                const thumb = resolveFloorThumbnailUrl(
                                    floor.floorPlanImagePath,
                                    floor.galleryImages,
                                );
                                return (
                                    <li
                                        key={floor.id}
                                        className="flex flex-wrap items-center gap-4 py-4 first:pt-0"
                                    >
                                        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                                            {thumb ? (
                                                <img
                                                    src={thumb}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-slate-500 dark:text-slate-400">
                                                    Add plan in editor
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {floor.label}
                                            </p>
                                            <p className="text-xs text-slate-500">Floor id {floor.id}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Link
                                                to={`${base}/visual-map?propertyId=${created.id}&floorId=${floor.id}`}
                                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                            >
                                                Edit overlays
                                            </Link>
                                            <Link
                                                to={`/floors/${floor.id}/map`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                            >
                                                Public map
                                            </Link>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <Link
                        to={`${base}/properties`}
                        className="inline-flex text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    >
                        Done — go to property inventory
                    </Link>
                </div>
            )}
        </div>
    );
}
