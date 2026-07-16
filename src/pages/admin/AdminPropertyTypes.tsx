import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showError, showSuccess } from '@/lib/toast';
import {
    useAdminPropertyTypes,
    useCreatePropertyType,
    useDeletePropertyType,
    useUpdatePropertyType,
} from '@/queries/adminReferenceData.queries';
import type { PropertyTypeRow } from '@/schemas/referenceDataAdmin.schema';

const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white';

export default function AdminPropertyTypes() {
    const listQuery = useAdminPropertyTypes();
    const createMut = useCreatePropertyType();
    const updateMut = useUpdatePropertyType();
    const deleteMut = useDeletePropertyType();

    const [name, setName] = useState('');
    const [editing, setEditing] = useState<PropertyTypeRow | null>(null);

    const busy = createMut.isPending || updateMut.isPending || deleteMut.isPending;
    const rows = listQuery.data?.records ?? [];

    const resetForm = () => {
        setName('');
        setEditing(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            showError('Enter a property type name.');
            return;
        }
        try {
            if (editing) {
                await updateMut.mutateAsync({ id: editing.id, name: trimmed });
                showSuccess('Property type updated.');
            } else {
                await createMut.mutateAsync({ name: trimmed });
                showSuccess('Property type added.');
            }
            resetForm();
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Could not save property type.');
        }
    };

    const startEdit = (row: PropertyTypeRow) => {
        setEditing(row);
        setName(row.name);
    };

    const handleDelete = async (row: PropertyTypeRow) => {
        if (!window.confirm(`Delete property type "${row.name}"?`)) return;
        try {
            await deleteMut.mutateAsync(row.id);
            showSuccess('Property type deleted.');
            if (editing?.id === row.id) resetForm();
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Could not delete property type.');
        }
    };

    return (
        <motion.div {...fadeUp} className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Property types</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Manage listing categories used when landlords create properties.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
                <div className="mb-4 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-emerald-600" aria-hidden />
                    <h2 className="font-semibold text-slate-900 dark:text-white">
                        {editing ? 'Edit property type' : 'Add property type'}
                    </h2>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="flex-1 text-sm">
                        <span className="mb-1 block text-slate-500 dark:text-slate-400">Name</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Apartment, Villa, Studio"
                            className={inputClass}
                            disabled={busy}
                        />
                    </label>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={busy} className="gap-2">
                            <Plus className="h-4 w-4" aria-hidden />
                            {editing ? 'Save changes' : 'Add type'}
                        </Button>
                        {editing ? (
                            <Button type="button" variant="outline" disabled={busy} onClick={resetForm}>
                                Cancel
                            </Button>
                        ) : null}
                    </div>
                </div>
            </form>

            {listQuery.isError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                    {listQuery.error instanceof Error ? listQuery.error.message : 'Failed to load property types'}
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">ID</th>
                                <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                                <th className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {listQuery.isLoading ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                                        Loading…
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                                        No property types yet.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                                    >
                                        <td className="px-4 py-3 text-slate-500">{row.id}</td>
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                            {row.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={busy}
                                                    onClick={() => startEdit(row)}
                                                    className="gap-1"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                                                    Edit
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={busy}
                                                    onClick={() => void handleDelete(row)}
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
        </motion.div>
    );
}
