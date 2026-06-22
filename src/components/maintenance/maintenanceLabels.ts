import type {
    MaintenanceCategory,
    MaintenancePriority,
    MaintenanceStatus,
} from '@/schemas/maintenance.schema';

export function formatMaintenanceStatus(status: MaintenanceStatus): string {
    return status.replace(/_/g, ' ');
}

export function formatMaintenanceCategory(category: MaintenanceCategory): string {
    return category.charAt(0) + category.slice(1).toLowerCase();
}

export function formatMaintenancePriority(priority: MaintenancePriority): string {
    return priority.charAt(0) + priority.slice(1).toLowerCase();
}

export const MAINTENANCE_CATEGORIES: MaintenanceCategory[] = [
    'PLUMBING',
    'ELECTRICAL',
    'STRUCTURAL',
    'APPLIANCE',
    'PEST',
    'CLEANING',
    'SECURITY',
    'OTHER',
];

export const MAINTENANCE_PRIORITIES: MaintenancePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export const MAINTENANCE_STATUSES: MaintenanceStatus[] = [
    'SUBMITTED',
    'UNDER_REVIEW',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED',
];
