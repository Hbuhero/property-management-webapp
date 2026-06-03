import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
    MAINTENANCE_STATUSES,
    formatMaintenanceStatus,
} from '@/components/maintenance/maintenanceLabels';
import { MaintenanceStatusBadge } from '@/components/maintenance/MaintenanceStatusBadge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { showError, showSuccess } from '@/lib/toast';
import { useMaintenanceRequest, useUpdateMaintenance } from '@/queries/maintenance.queries';
import type { MaintenanceStatus } from '@/schemas/maintenance.schema';

type Props = {
    requestId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdated?: () => void;
};

export function UpdateMaintenanceDialog({ requestId, open, onOpenChange, onUpdated }: Props) {
    const updateMut = useUpdateMaintenance();
    const detailQuery = useMaintenanceRequest(open ? requestId ?? undefined : undefined);
    const request = detailQuery.data;

    const [status, setStatus] = useState<MaintenanceStatus>('SUBMITTED');
    const [resolutionNotes, setResolutionNotes] = useState('');

    useEffect(() => {
        if (request && open) {
            setStatus(request.status);
            setResolutionNotes(request.resolutionNotes ?? '');
        }
    }, [request, open]);

    const handleSubmit = async () => {
        if (!request) return;

        try {
            await updateMut.mutateAsync({
                id: request.id,
                body: {
                    status,
                    resolutionNotes: resolutionNotes.trim() || undefined,
                },
            });
            showSuccess('Maintenance request updated.');
            onOpenChange(false);
            onUpdated?.();
        } catch (error) {
            showError(error instanceof Error ? error.message : 'Could not update request.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Update maintenance request</DialogTitle>
                    {request ? (
                        <DialogDescription>
                            {request.property.title} · Unit {request.unit.unitNumber}
                        </DialogDescription>
                    ) : null}
                </DialogHeader>

                {detailQuery.isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading request…
                    </div>
                ) : detailQuery.isError || !request ? (
                    <p className="py-4 text-sm text-red-600">
                        {detailQuery.error instanceof Error
                            ? detailQuery.error.message
                            : 'Could not load maintenance request.'}
                    </p>
                ) : (
                    <>
                        <div className="space-y-4 py-2">
                            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-1">
                                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                                    {request.title}
                                </p>
                                <p className="text-xs text-slate-500 line-clamp-3">{request.description}</p>
                                <div className="pt-1">
                                    <MaintenanceStatusBadge status={request.status} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={status}
                                    onValueChange={(value) => setStatus(value as MaintenanceStatus)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MAINTENANCE_STATUSES.map((item) => (
                                            <SelectItem key={item} value={item}>
                                                {formatMaintenanceStatus(item)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maint-resolution-notes">Resolution notes</Label>
                                <Textarea
                                    id="maint-resolution-notes"
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    placeholder="Optional notes for the tenant"
                                    rows={4}
                                    maxLength={2000}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => void handleSubmit()} disabled={updateMut.isPending}>
                                {updateMut.isPending ? 'Saving…' : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
