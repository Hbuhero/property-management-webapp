import { z } from 'zod';
import { LeaseContractStatusSchema } from '@/schemas/leaseContract.schema';

export const InvoiceStatusSchema = z.enum(['PENDING', 'PAID', 'CANCELLED']);
export const InvoiceSourceSchema = z.enum(['AUTO', 'MANUAL']);
export const PaymentMethodSchema = z.enum(['MOBILE', 'CASH']);

export const InvoiceContractSummarySchema = z.object({
    id: z.number(),
    status: LeaseContractStatusSchema,
    tenantId: z.number().nullable().optional(),
    tenantName: z.string().nullable().optional(),
    propertyId: z.number().nullable().optional(),
    propertyTitle: z.string().nullable().optional(),
    floorUnitId: z.number().nullable().optional(),
    unitLabel: z.string().nullable().optional(),
});

export const InvoiceItemSummarySchema = z.object({
    id: z.number(),
    label: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
});

export const InvoiceSchema = z.object({
    id: z.number(),
    status: InvoiceStatusSchema,
    source: InvoiceSourceSchema,
    paymentMethod: PaymentMethodSchema,
    scheduleKey: z.string(),
    periodIndex: z.number(),
    dueDate: z.string(),
    amount: z.number(),
    currency: z.string(),
    paidAt: z.string().nullable().optional(),
    markedPaidBy: z.number().nullable().optional(),
    createdBy: z.number().nullable().optional(),
    contract: InvoiceContractSummarySchema.nullable().optional(),
    item: InvoiceItemSummarySchema.nullable().optional(),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
});

export const BillablePeriodSchema = z.object({
    leaseContractItemId: z.number(),
    periodIndex: z.number(),
    scheduleKey: z.string(),
    dueDate: z.string(),
    amount: z.number(),
    label: z.string(),
});

export const CreateManualInvoiceSchema = z.object({
    leaseContractId: z.number(),
    leaseContractItemId: z.number(),
    periodIndex: z.number().int().min(0),
    paymentMethod: PaymentMethodSchema,
});

export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;
export type InvoiceSource = z.infer<typeof InvoiceSourceSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type BillablePeriod = z.infer<typeof BillablePeriodSchema>;
export type CreateManualInvoiceInput = z.infer<typeof CreateManualInvoiceSchema>;

export type InvoiceListFilters = {
    status?: InvoiceStatus;
    leaseContractId?: number;
};
