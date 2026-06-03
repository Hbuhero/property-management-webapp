import { useMemo, useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { uploadListingImage } from '@/api/fileUploadApi';
import {
    MAINTENANCE_CATEGORIES,
    MAINTENANCE_PRIORITIES,
    formatMaintenanceCategory,
    formatMaintenancePriority,
} from '@/components/maintenance/maintenanceLabels';
import { Button } from '@/components/ui/button';
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
import { resolvePropertyImageUrl } from '@/lib/propertyMediaUrl';
import { showError, showSuccess } from '@/lib/toast';
import { useLeaseContracts } from '@/queries/leaseContract.queries';
import { useCreateMaintenance } from '@/queries/maintenance.queries';
import type { LeaseContract } from '@/schemas/leaseContract.schema';
import type { MaintenanceCategory, MaintenancePriority } from '@/schemas/maintenance.schema';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: () => void;
};

function leaseOptionLabel(contract: LeaseContract): string {
    const propertyTitle = contract.property?.title ?? 'Property';
    const unitNumber = contract.unit?.unitNumber ?? 'Unit';
    const floorLabel = contract.unit?.floorLabel;
    const floorPart = floorLabel ? ` · ${floorLabel}` : '';
    return `${propertyTitle} · ${unitNumber}${floorPart}`;
}

export function CreateMaintenanceDialog({ open, onOpenChange, onCreated }: Props) {
    const contractsQuery = useLeaseContracts();
    const createMut = useCreateMaintenance();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [leaseKey, setLeaseKey] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<MaintenanceCategory>('PLUMBING');
    const [priority, setPriority] = useState<MaintenancePriority>('MEDIUM');
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);

    const activeLeases = useMemo(
        () =>
            (contractsQuery.data ?? []).filter(
                (contract) => contract.status === 'ACCEPTED' && contract.unit?.id != null,
            ),
        [contractsQuery.data],
    );

    const leaseByKey = useMemo(() => {
        const map = new Map<string, LeaseContract>();
        for (const contract of activeLeases) {
            map.set(String(contract.id), contract);
        }
        return map;
    }, [activeLeases]);

    const selectedLeaseKey = leaseKey || (activeLeases[0] ? String(activeLeases[0].id) : '');
    const selectedLease = selectedLeaseKey ? leaseByKey.get(selectedLeaseKey) : undefined;

    const resetForm = () => {
        setLeaseKey('');
        setTitle('');
        setDescription('');
        setCategory('PLUMBING');
        setPriority('MEDIUM');
        setImageUrls([]);
        setUploading(false);
    };

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            resetForm();
        }
        onOpenChange(next);
    };

    const handlePickPhotos = async (files: FileList | null) => {
        if (!files?.length) return;
        if (imageUrls.length >= 5) {
            showError('You can attach up to 5 photos.');
            return;
        }

        setUploading(true);
        try {
            const uploaded: string[] = [];
            for (const file of Array.from(files)) {
                if (imageUrls.length + uploaded.length >= 5) break;
                uploaded.push(await uploadListingImage(file));
            }
            setImageUrls((prev) => [...prev, ...uploaded].slice(0, 5));
        } catch (error) {
            showError(error instanceof Error ? error.message : 'Photo upload failed.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleSubmit = async () => {
        const unitId = selectedLease?.unit?.id;
        if (!unitId) {
            showError('Select a leased unit.');
            return;
        }
        if (title.trim().length < 5) {
            showError('Title must be at least 5 characters.');
            return;
        }
        if (description.trim().length < 10) {
            showError('Description must be at least 10 characters.');
            return;
        }

        try {
            await createMut.mutateAsync({
                floorUnitId: unitId,
                leaseContractId: selectedLease?.id,
                title: title.trim(),
                description: description.trim(),
                category,
                priority,
                imageUrls,
            });
            showSuccess('Maintenance request submitted.');
            handleOpenChange(false);
            onCreated?.();
        } catch (error) {
            showError(error instanceof Error ? error.message : 'Could not submit request.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New maintenance request</DialogTitle>
                    <DialogDescription>
                        Report an issue for a unit you currently lease.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Leased unit</Label>
                        {contractsQuery.isLoading ? (
                            <p className="text-sm text-slate-500">Loading your leases…</p>
                        ) : activeLeases.length === 0 ? (
                            <p className="text-sm text-slate-500">
                                You need an accepted lease before submitting maintenance requests.
                            </p>
                        ) : (
                            <Select value={selectedLeaseKey} onValueChange={setLeaseKey}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeLeases.map((contract) => (
                                        <SelectItem key={contract.id} value={String(contract.id)}>
                                            {leaseOptionLabel(contract)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="maint-title">Title</Label>
                        <Input
                            id="maint-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Brief summary of the issue"
                            maxLength={120}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="maint-description">Description</Label>
                        <Textarea
                            id="maint-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the problem in detail"
                            rows={4}
                            maxLength={2000}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                                value={category}
                                onValueChange={(value) => setCategory(value as MaintenanceCategory)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MAINTENANCE_CATEGORIES.map((item) => (
                                        <SelectItem key={item} value={item}>
                                            {formatMaintenanceCategory(item)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select
                                value={priority}
                                onValueChange={(value) => setPriority(value as MaintenancePriority)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {MAINTENANCE_PRIORITIES.map((item) => (
                                        <SelectItem key={item} value={item}>
                                            {formatMaintenancePriority(item)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Photos (optional, max 5)</Label>
                        <div className="flex flex-wrap gap-2">
                            {imageUrls.map((url) => {
                                const src = resolvePropertyImageUrl(url);
                                if (!src) return null;
                                return (
                                <div key={url} className="relative h-16 w-16 rounded-lg overflow-hidden border">
                                    <img
                                        src={src}
                                        alt=""
                                        className="h-full w-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white"
                                        onClick={() => setImageUrls((prev) => prev.filter((item) => item !== url))}
                                        aria-label="Remove photo"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                                );
                            })}
                            {imageUrls.length < 5 && (
                                <button
                                    type="button"
                                    disabled={uploading}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-700"
                                >
                                    {uploading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <ImagePlus className="h-5 w-5" />
                                    )}
                                </button>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => void handlePickPhotos(e.target.files)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => void handleSubmit()}
                        disabled={
                            createMut.isPending ||
                            uploading ||
                            activeLeases.length === 0 ||
                            !selectedLease
                        }
                    >
                        {createMut.isPending ? 'Submitting…' : 'Submit request'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
