import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ImagePlus, Trash2 } from 'lucide-react';
import {
    fetchDistrictsByRegion,
    fetchPropertyTypesLookup,
    fetchRegionsLookup,
} from '@/api/referenceDataApi';
import { uploadListingImage } from '@/api/fileUploadApi';
import { resolvePropertyImageUrl } from '@/lib/propertyMediaUrl';
import { SUGGESTED_BUILDING_AMENITIES } from '@/lib/buildingAmenitySuggestions';
import { showError, showSuccess } from '@/lib/toast';
import { usePatchProperty, useProperty } from '@/queries/property.queries';
import type { PropertyDetail, PropertyPatchInput } from '@/schemas/property.schema';

const MAX_LISTING_GALLERY = 12;

function newGalleryClientId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type EditGalleryExisting = {
    kind: 'existing';
    serverId: number;
    imagePath: string;
    clientId: string;
};

type EditGalleryNew = {
    kind: 'new';
    clientId: string;
    file?: File;
    previewUrl: string;
    serverPath?: string;
    uploading?: boolean;
    error?: string;
};

type EditGalleryRow = EditGalleryExisting | EditGalleryNew;

function buildPatchGalleryFromRows(rows: EditGalleryRow[]): NonNullable<PropertyPatchInput['galleryImages']> {
    const out: NonNullable<PropertyPatchInput['galleryImages']> = [];
    let sortOrder = 0;
    for (const row of rows) {
        if (row.kind === 'existing') {
            out.push({ imagePath: row.imagePath, sortOrder: sortOrder++ });
        } else if (row.serverPath) {
            out.push({ imagePath: row.serverPath, sortOrder: sortOrder++ });
        }
    }
    return out;
}

function buildInitialGalleryRows(d: PropertyDetail): EditGalleryRow[] {
    const imgs = d.galleryImages ?? [];
    const sorted = [...imgs].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    return sorted.map((g) => ({
        kind: 'existing' as const,
        serverId: g.id,
        imagePath: g.imagePath,
        clientId: `ex-${g.id}`,
    }));
}

const inputClass =
    'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

const labelClass = 'flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-200';

function PropertyEditForm({ id, base, detail }: { id: number; base: string; detail: PropertyDetail }) {
    const navigate = useNavigate();
    const patchMut = usePatchProperty();

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

    const [title, setTitle] = useState(detail.title);
    const [description, setDescription] = useState(detail.description ?? '');
    const [addressLine, setAddressLine] = useState(detail.address ?? '');
    const [locationText, setLocationText] = useState(detail.location);
    const [regionId, setRegionId] = useState<number | ''>(typeof detail.region === 'number' ? detail.region : '');
    const [districtId, setDistrictId] = useState<number | ''>(
        typeof detail.district === 'number' ? detail.district : '',
    );
    const [propertyTypeId, setPropertyTypeId] = useState<number | ''>(
        typeof detail.propertyTypeId === 'number' ? detail.propertyTypeId : '',
    );
    const [buildingAmenities, setBuildingAmenities] = useState<string[]>(() => [...(detail.amenities ?? [])]);
    const [buildingAmenityInput, setBuildingAmenityInput] = useState('');
    const [galleryRows, setGalleryRows] = useState<EditGalleryRow[]>(() => buildInitialGalleryRows(detail));

    const districtsQuery = useQuery({
        queryKey: ['reference', 'districts', regionId],
        queryFn: () => fetchDistrictsByRegion(regionId as number),
        enabled: typeof regionId === 'number',
    });

    const uploadNewGalleryBatch = async (batch: EditGalleryNew[]) => {
        for (const item of batch) {
            try {
                const path = await uploadListingImage(item.file!);
                setGalleryRows((prev) =>
                    prev.map((row) =>
                        row.kind === 'new' && row.clientId === item.clientId
                            ? { ...row, serverPath: path, uploading: false, error: undefined }
                            : row,
                    ),
                );
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Upload failed';
                setGalleryRows((prev) =>
                    prev.map((row) =>
                        row.kind === 'new' && row.clientId === item.clientId
                            ? { ...row, uploading: false, error: msg }
                            : row,
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

        setGalleryRows((prev) => {
            const room = MAX_LISTING_GALLERY - prev.length;
            if (room <= 0) {
                showError(`Maximum ${MAX_LISTING_GALLERY} images`);
                return prev;
            }
            const slice = files.slice(0, room);
            if (files.length > room) {
                showError(`Only ${room} more image(s) added (limit ${MAX_LISTING_GALLERY})`);
            }
            const additions: EditGalleryNew[] = slice.map((file) => ({
                kind: 'new',
                clientId: newGalleryClientId(),
                file,
                previewUrl: URL.createObjectURL(file),
                uploading: true,
            }));
            if (additions.length) {
                void uploadNewGalleryBatch(additions);
            }
            return [...prev, ...additions];
        });
    };

    const removeGalleryRow = (clientId: string) => {
        setGalleryRows((prev) => {
            const victim = prev.find((r) => r.clientId === clientId);
            if (victim?.kind === 'new' && victim.previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(victim.previewUrl);
            }
            return prev.filter((r) => r.clientId !== clientId);
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!Number.isFinite(id)) return;
        if (!title.trim() || !description.trim() || !locationText.trim() || !addressLine.trim()) {
            showError('Fill title, description, location, and address.');
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
        if (galleryRows.some((r) => r.kind === 'new' && r.uploading)) {
            showError('Wait for photo uploads to finish.');
            return;
        }
        if (galleryRows.some((r) => r.kind === 'new' && r.error && !r.serverPath)) {
            showError('Remove failed uploads before saving.');
            return;
        }

        const patch: PropertyPatchInput = {
            title: title.trim(),
            description: description.trim(),
            location: locationText.trim(),
            address: addressLine.trim(),
            region: regionId,
            district: districtId,
            propertyType: propertyTypeId,
            amenities: buildingAmenities,
            galleryImages: buildPatchGalleryFromRows(galleryRows),
        };

        try {
            await patchMut.mutateAsync({ id, patch });
            showSuccess('Listing updated');
            navigate(`${base}/properties`);
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Could not save changes');
        }
    };

    const busy =
        regionsQuery.isPending ||
        typesQuery.isPending ||
        (typeof regionId === 'number' && districtsQuery.isPending);

    return (
        <form
            onSubmit={(e) => void handleSubmit(e)}
            className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
            <label className={labelClass}>
                Title
                <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>

            <label className={labelClass}>
                Description
                <textarea
                    className={`${inputClass} min-h-[100px] resize-y`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
            </label>

            <label className={labelClass}>
                Location (short)
                <input
                    className={inputClass}
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    required
                />
            </label>

            <label className={labelClass}>
                Street address
                <input
                    className={inputClass}
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    required
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
                    Shared facilities shown on the public listing (e.g. gym, pool).
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
                <input
                    className={`${inputClass} mt-3`}
                    value={buildingAmenityInput}
                    placeholder="Add custom amenity (press Enter)"
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

            <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Listing photos</span>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                        <ImagePlus className="h-4 w-4" aria-hidden />
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
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    JPG, PNG, or SVG. Up to {MAX_LISTING_GALLERY} images. Saving replaces the gallery with the list below
                    (order left to right).
                </p>
                {galleryRows.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No photos yet.</p>
                ) : (
                    <ul className="flex flex-wrap gap-3">
                        {galleryRows.map((row) => {
                            const src =
                                row.kind === 'existing'
                                    ? (resolvePropertyImageUrl(row.imagePath) ?? '')
                                    : row.previewUrl;
                            const rowBusy = row.kind === 'new' && row.uploading;
                            const err = row.kind === 'new' ? row.error : undefined;
                            return (
                                <li
                                    key={row.clientId}
                                    className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                                >
                                    {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : null}
                                    {rowBusy ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white">
                                            Uploading…
                                        </div>
                                    ) : null}
                                    {err ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 p-1 text-center text-[10px] font-medium text-white">
                                            Failed
                                        </div>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() => removeGalleryRow(row.clientId)}
                                        className="absolute right-1 top-1 rounded-md bg-black/55 p-1 text-white hover:bg-black/75"
                                        aria-label="Remove image"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            <button
                type="submit"
                disabled={busy || patchMut.isPending}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
            >
                Save changes
            </button>
        </form>
    );
}

/**
 * Edit listing core fields (PATCH {@code /api/v1/properties/{id}}).
 */
export default function PropertyEditPage() {
    const { propertyId } = useParams<{ propertyId: string }>();
    const loc = useLocation();
    const base = loc.pathname.startsWith('/landlord') ? '/landlord' : '/owner';

    const id = propertyId != null && propertyId !== '' ? Number(propertyId) : NaN;
    const detailQuery = useProperty(Number.isFinite(id) ? id : null);

    if (!Number.isFinite(id)) {
        return (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                Invalid property id.
            </div>
        );
    }

    if (detailQuery.isError) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-red-600 dark:text-red-400">
                    {detailQuery.error instanceof Error ? detailQuery.error.message : 'Could not load listing'}
                </p>
                <Link to={`${base}/properties`} className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Back to inventory
                </Link>
            </div>
        );
    }

    const detail = detailQuery.data;

    return (
        <div className="mx-auto max-w-3xl space-y-6 pb-12">
            <div className="flex flex-wrap items-center gap-4">
                <Link
                    to={`${base}/properties`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
                >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                    Inventory
                </Link>
            </div>

            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit listing</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Property id {id}. Changes apply immediately after you save.
                </p>
            </div>

            {detailQuery.isPending || !detail || detail.id !== id ? (
                <p className="text-sm text-slate-500">Loading…</p>
            ) : (
                <PropertyEditForm key={id} id={id} base={base} detail={detail} />
            )}
        </div>
    );
}
