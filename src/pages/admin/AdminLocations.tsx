import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormSelect } from '@/components/ui/form-select';
import { showError, showSuccess } from '@/lib/toast';
import {
    useAdminDistricts,
    useAdminRegions,
    useAdminWards,
    useCreateDistrict,
    useCreateRegion,
    useCreateWard,
    useDeleteDistrict,
    useDeleteRegion,
    useDeleteWard,
    useUpdateDistrict,
    useUpdateRegion,
    useUpdateWard,
} from '@/queries/adminReferenceData.queries';
import type { DistrictRow, RegionRow, WardRow } from '@/schemas/referenceDataAdmin.schema';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

type Tab = 'regions' | 'districts' | 'wards';

export default function AdminLocations() {
    const [tab, setTab] = useState<Tab>('regions');

    const regionsQuery = useAdminRegions();
    const districtsQuery = useAdminDistricts();
    const wardsQuery = useAdminWards();

    const regions = regionsQuery.data?.records ?? [];
    const districts = districtsQuery.data?.records ?? [];
    const wards = wardsQuery.data?.records ?? [];

    const regionOptions = useMemo(
        () => regions.map((r) => ({ value: String(r.id), label: r.name })),
        [regions],
    );

    const tabs: { id: Tab; label: string }[] = [
        { id: 'regions', label: 'Regions' },
        { id: 'districts', label: 'Districts' },
        { id: 'wards', label: 'Wards' },
    ];

    return (
        <motion.div {...fadeUp} className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Locations</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Manage regions, districts, and wards used for property addresses.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {tabs.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setTab(item.id)}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                            tab === item.id
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                                : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {tab === 'regions' ? (
                <RegionsPanel regions={regions} isLoading={regionsQuery.isLoading} isError={regionsQuery.isError} />
            ) : null}
            {tab === 'districts' ? (
                <DistrictsPanel
                    districts={districts}
                    regionOptions={regionOptions}
                    isLoading={districtsQuery.isLoading}
                    isError={districtsQuery.isError}
                />
            ) : null}
            {tab === 'wards' ? (
                <WardsPanel
                    wards={wards}
                    districts={districts}
                    regionOptions={regionOptions}
                    isLoading={wardsQuery.isLoading}
                    isError={wardsQuery.isError}
                />
            ) : null}
        </motion.div>
    );
}

function RegionsPanel({
    regions,
    isLoading,
    isError,
}: {
    regions: RegionRow[];
    isLoading: boolean;
    isError: boolean;
}) {
    const createMut = useCreateRegion();
    const updateMut = useUpdateRegion();
    const deleteMut = useDeleteRegion();

    const [name, setName] = useState('');
    const [postCode, setPostCode] = useState('');
    const [editing, setEditing] = useState<RegionRow | null>(null);

    const busy = createMut.isPending || updateMut.isPending || deleteMut.isPending;

    const resetForm = () => {
        setName('');
        setPostCode('');
        setEditing(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        const trimmedCode = postCode.trim();
        if (!trimmedName || !trimmedCode) {
            showError('Name and post code are required.');
            return;
        }
        try {
            if (editing) {
                await updateMut.mutateAsync({ id: editing.id, name: trimmedName, postCode: trimmedCode });
                showSuccess('Region updated.');
            } else {
                await createMut.mutateAsync({ name: trimmedName, postCode: trimmedCode });
                showSuccess('Region added.');
            }
            resetForm();
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Could not save region.');
        }
    };

    return (
        <LocationSection
            title="Regions"
            form={
                <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-sm">
                        <span className="mb-1 block text-slate-500">Name</span>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                            disabled={busy}
                        />
                    </label>
                    <label className="text-sm">
                        <span className="mb-1 block text-slate-500">Post code</span>
                        <input
                            value={postCode}
                            onChange={(e) => setPostCode(e.target.value)}
                            className={inputClass}
                            disabled={busy}
                        />
                    </label>
                    <div className="flex items-end gap-2 sm:col-span-2">
                        <Button type="submit" disabled={busy} className="gap-2">
                            <Plus className="h-4 w-4" aria-hidden />
                            {editing ? 'Save region' : 'Add region'}
                        </Button>
                        {editing ? (
                            <Button type="button" variant="outline" disabled={busy} onClick={resetForm}>
                                Cancel
                            </Button>
                        ) : null}
                    </div>
                </form>
            }
            isLoading={isLoading}
            isError={isError}
            emptyMessage="No regions yet."
            rows={regions.map((row) => ({
                key: row.id,
                cells: [String(row.id), row.name, row.postCode],
                onEdit: () => {
                    setEditing(row);
                    setName(row.name);
                    setPostCode(row.postCode);
                },
                onDelete: async () => {
                    if (!window.confirm(`Delete region "${row.name}"?`)) return;
                    try {
                        await deleteMut.mutateAsync(row.id);
                        showSuccess('Region deleted.');
                        if (editing?.id === row.id) resetForm();
                    } catch (err) {
                        showError(err instanceof Error ? err.message : 'Could not delete region.');
                    }
                },
                busy,
            }))}
            headers={['ID', 'Name', 'Post code']}
        />
    );
}

function DistrictsPanel({
    districts,
    regionOptions,
    isLoading,
    isError,
}: {
    districts: DistrictRow[];
    regionOptions: { value: string; label: string }[];
    isLoading: boolean;
    isError: boolean;
}) {
    const createMut = useCreateDistrict();
    const updateMut = useUpdateDistrict();
    const deleteMut = useDeleteDistrict();

    const [name, setName] = useState('');
    const [regionId, setRegionId] = useState<string | undefined>();
    const [editing, setEditing] = useState<DistrictRow | null>(null);

    const busy = createMut.isPending || updateMut.isPending || deleteMut.isPending;

    const resetForm = () => {
        setName('');
        setRegionId(undefined);
        setEditing(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        const region = regionId ? Number(regionId) : NaN;
        if (!trimmedName || !Number.isFinite(region)) {
            showError('Name and region are required.');
            return;
        }
        try {
            if (editing) {
                await updateMut.mutateAsync({ id: editing.id, name: trimmedName, region });
                showSuccess('District updated.');
            } else {
                await createMut.mutateAsync({ name: trimmedName, region });
                showSuccess('District added.');
            }
            resetForm();
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Could not save district.');
        }
    };

    return (
        <LocationSection
            title="Districts"
            form={
                <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-sm">
                        <span className="mb-1 block text-slate-500">Name</span>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                            disabled={busy}
                        />
                    </label>
                    <label className="text-sm">
                        <span className="mb-1 block text-slate-500">Region</span>
                        <FormSelect
                            value={regionId}
                            onValueChange={setRegionId}
                            options={regionOptions}
                            placeholder="Select region"
                            disabled={busy || regionOptions.length === 0}
                        />
                    </label>
                    <div className="flex items-end gap-2 sm:col-span-2">
                        <Button type="submit" disabled={busy} className="gap-2">
                            <Plus className="h-4 w-4" aria-hidden />
                            {editing ? 'Save district' : 'Add district'}
                        </Button>
                        {editing ? (
                            <Button type="button" variant="outline" disabled={busy} onClick={resetForm}>
                                Cancel
                            </Button>
                        ) : null}
                    </div>
                </form>
            }
            isLoading={isLoading}
            isError={isError}
            emptyMessage="No districts yet."
            rows={districts.map((row) => ({
                key: row.id,
                cells: [String(row.id), row.name, row.regionName ?? '—'],
                onEdit: () => {
                    setEditing(row);
                    setName(row.name);
                    setRegionId(String(row.region));
                },
                onDelete: async () => {
                    if (!window.confirm(`Delete district "${row.name}"?`)) return;
                    try {
                        await deleteMut.mutateAsync(row.id);
                        showSuccess('District deleted.');
                        if (editing?.id === row.id) resetForm();
                    } catch (err) {
                        showError(err instanceof Error ? err.message : 'Could not delete district.');
                    }
                },
                busy,
            }))}
            headers={['ID', 'Name', 'Region']}
        />
    );
}

function WardsPanel({
    wards,
    districts,
    regionOptions,
    isLoading,
    isError,
}: {
    wards: WardRow[];
    districts: DistrictRow[];
    regionOptions: { value: string; label: string }[];
    isLoading: boolean;
    isError: boolean;
}) {
    const createMut = useCreateWard();
    const updateMut = useUpdateWard();
    const deleteMut = useDeleteWard();

    const [name, setName] = useState('');
    const [regionId, setRegionId] = useState<string | undefined>();
    const [districtId, setDistrictId] = useState<string | undefined>();
    const [editing, setEditing] = useState<WardRow | null>(null);

    const districtOptions = useMemo(
        () =>
            districts
                .filter((d) => (regionId ? String(d.region) === regionId : false))
                .map((d) => ({ value: String(d.id), label: d.name })),
        [districts, regionId],
    );

    const busy = createMut.isPending || updateMut.isPending || deleteMut.isPending;

    const resetForm = () => {
        setName('');
        setRegionId(undefined);
        setDistrictId(undefined);
        setEditing(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        const district = districtId ? Number(districtId) : NaN;
        if (!trimmedName || !Number.isFinite(district)) {
            showError('Name and district are required.');
            return;
        }
        try {
            if (editing) {
                await updateMut.mutateAsync({ id: editing.id, name: trimmedName, district });
                showSuccess('Ward updated.');
            } else {
                await createMut.mutateAsync({ name: trimmedName, district });
                showSuccess('Ward added.');
            }
            resetForm();
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Could not save ward.');
        }
    };

    const startEdit = (row: WardRow) => {
        setEditing(row);
        setName(row.name);
        setDistrictId(String(row.district));
        const parentDistrict = districts.find((d) => d.id === row.district);
        setRegionId(parentDistrict ? String(parentDistrict.region) : undefined);
    };

    return (
        <LocationSection
            title="Wards"
            form={
                <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <label className="text-sm">
                        <span className="mb-1 block text-slate-500">Name</span>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClass}
                            disabled={busy}
                        />
                    </label>
                    <label className="text-sm">
                        <span className="mb-1 block text-slate-500">Region</span>
                        <FormSelect
                            value={regionId}
                            onValueChange={(value) => {
                                setRegionId(value);
                                setDistrictId(undefined);
                            }}
                            options={regionOptions}
                            placeholder="Select region"
                            disabled={busy || regionOptions.length === 0}
                        />
                    </label>
                    <label className="text-sm">
                        <span className="mb-1 block text-slate-500">District</span>
                        <FormSelect
                            value={districtId}
                            onValueChange={setDistrictId}
                            options={districtOptions}
                            placeholder={regionId ? 'Select district' : 'Pick region first'}
                            disabled={busy || !regionId || districtOptions.length === 0}
                        />
                    </label>
                    <div className="flex items-end gap-2 sm:col-span-2">
                        <Button type="submit" disabled={busy} className="gap-2">
                            <Plus className="h-4 w-4" aria-hidden />
                            {editing ? 'Save ward' : 'Add ward'}
                        </Button>
                        {editing ? (
                            <Button type="button" variant="outline" disabled={busy} onClick={resetForm}>
                                Cancel
                            </Button>
                        ) : null}
                    </div>
                </form>
            }
            isLoading={isLoading}
            isError={isError}
            emptyMessage="No wards yet."
            rows={wards.map((row) => ({
                key: row.id,
                cells: [String(row.id), row.name, row.districtName ?? '—'],
                onEdit: () => startEdit(row),
                onDelete: async () => {
                    if (!window.confirm(`Delete ward "${row.name}"?`)) return;
                    try {
                        await deleteMut.mutateAsync(row.id);
                        showSuccess('Ward deleted.');
                        if (editing?.id === row.id) resetForm();
                    } catch (err) {
                        showError(err instanceof Error ? err.message : 'Could not delete ward.');
                    }
                },
                busy,
            }))}
            headers={['ID', 'Name', 'District']}
        />
    );
}

function LocationSection({
    title,
    form,
    headers,
    rows,
    isLoading,
    isError,
    emptyMessage,
}: {
    title: string;
    form: ReactNode;
    headers: string[];
    rows: {
        key: number;
        cells: string[];
        onEdit: () => void;
        onDelete: () => Promise<void>;
        busy: boolean;
    }[];
    isLoading: boolean;
    isError: boolean;
    emptyMessage: string;
}) {
    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" aria-hidden />
                    <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
                </div>
                {form}
            </div>

            {isError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                    Could not load {title.toLowerCase()}.
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                            <tr>
                                {headers.map((header) => (
                                    <th
                                        key={header}
                                        className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300"
                                    >
                                        {header}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={headers.length + 1} className="px-4 py-8 text-center text-slate-500">
                                        Loading…
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={headers.length + 1} className="px-4 py-8 text-center text-slate-500">
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <tr
                                        key={row.key}
                                        className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                                    >
                                        {row.cells.map((cell, index) => (
                                            <td
                                                key={`${row.key}-${index}`}
                                                className="px-4 py-3 text-slate-900 dark:text-white"
                                            >
                                                {cell}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={row.busy}
                                                    onClick={row.onEdit}
                                                    className="gap-1"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                                                    Edit
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={row.busy}
                                                    onClick={() => void row.onDelete()}
                                                    className="gap-1 text-red-600 hover:text-red-700 dark:text-red-400"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
