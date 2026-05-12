import { z } from 'zod';

/** Matches backend {@link dev.hud.PropertyManagementSystem.models.property.PropertyStatus}. */
export const PropertyStatusSchema = z.enum([
    'DRAFT',
    'AVAILABLE',
    'RENTED',
    'MAINTENANCE',
    'ARCHIVED',
]);

/** Matches backend {@link dev.hud.PropertyManagementSystem.models.property.PropertyDocumentType}. */
export const PropertyDocumentTypeSchema = z.enum([
    'TITLE_DEED',
    'BUSINESS_LICENSE',
    'TAX_RECEIPT',
    'OTHER',
]);

export const PropertyGalleryImageSchema = z.object({
    id: z.number(),
    imagePath: z.string(),
    sortOrder: z.number().nullable().optional(),
});

/** Floor-level gallery image (owner marketing photos per storey). */
export const FloorGalleryImageSchema = z.object({
    id: z.number(),
    imagePath: z.string(),
    sortOrder: z.number().nullable().optional(),
});

export const PropertyOwnershipDocumentSchema = z.object({
    id: z.number(),
    documentType: z.string(),
    filePath: z.string(),
});

/** Paginated list row — backend {@code PropertyResponse}. */
export const PropertySummarySchema = z.object({
    id: z.number(),
    title: z.string(),
    description: z.string().nullable().optional(),
    location: z.string(),
    address: z.string().nullable().optional(),
    region: z.number().nullable().optional(),
    regionName: z.string().nullable().optional(),
    district: z.number().nullable().optional(),
    districtName: z.string().nullable().optional(),
    ward: z.number().nullable().optional(),
    wardName: z.string().nullable().optional(),
    status: PropertyStatusSchema,
    propertyTypeId: z.number().nullable().optional(),
    propertyTypeName: z.string().nullable().optional(),
    primaryGalleryImagePath: z.string().nullable().optional(),
    galleryImagePaths: z.array(z.string()).optional(),
    uuid: z.string(),
    deleted: z.boolean().nullable().optional(),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
});

export const PropertyFloorSummarySchema = z.object({
    id: z.number(),
    label: z.string(),
    sortOrder: z.number().nullable().optional(),
    floorPlanImagePath: z.string().nullable().optional(),
    galleryImages: z.array(FloorGalleryImageSchema).optional(),
});

export type PropertyFloorSummary = z.infer<typeof PropertyFloorSummarySchema>;

/** Detail — backend {@code PropertyDetailResponse}. */
export const PropertyDetailSchema = z.object({
    id: z.number(),
    title: z.string(),
    description: z.string().nullable().optional(),
    location: z.string(),
    address: z.string().nullable().optional(),
    region: z.number().nullable().optional(),
    regionName: z.string().nullable().optional(),
    district: z.number().nullable().optional(),
    districtName: z.string().nullable().optional(),
    ward: z.number().nullable().optional(),
    wardName: z.string().nullable().optional(),
    status: PropertyStatusSchema,
    propertyTypeId: z.number().nullable().optional(),
    propertyTypeName: z.string().nullable().optional(),
    ownerId: z.number().nullable().optional(),
    ownerFullName: z.string().nullable().optional(),
    uuid: z.string(),
    deleted: z.boolean().nullable().optional(),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
    amenities: z.array(z.string()),
    galleryImages: z.array(PropertyGalleryImageSchema),
    ownershipDocuments: z.array(PropertyOwnershipDocumentSchema),
    floors: z.array(PropertyFloorSummarySchema),
});

export const PaginationMetaSchema = z.object({
    pageNo: z.string(),
    pageSize: z.string(),
    totalSize: z.string(),
    pageCount: z.string(),
});

export const PropertyPageSchema = z.object({
    page: PaginationMetaSchema,
    records: z.array(PropertySummarySchema),
});

export const PropertyGalleryImageInputSchema = z.object({
    imagePath: z.string().min(1),
    sortOrder: z.number().optional(),
});

export const PropertyOwnershipDocumentInputSchema = z.object({
    documentType: PropertyDocumentTypeSchema,
    filePath: z.string().min(1),
});

/** Body for {@code POST /api/v1/properties} — backend {@code PropertyRequest}. */
export const PropertyCreateSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    location: z.string().min(1),
    address: z.string().min(1),
    region: z.number(),
    district: z.number(),
    propertyType: z.number(),
    amenities: z.array(z.string()).optional(),
    galleryImages: z.array(PropertyGalleryImageInputSchema).optional(),
    ownershipDocuments: z.array(PropertyOwnershipDocumentInputSchema).optional(),
});

/** Body for {@code PATCH /api/v1/properties/{id}} — backend {@code PropertyPatchRequest}. */
export const PropertyPatchSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    address: z.string().optional(),
    region: z.number().optional(),
    district: z.number().optional(),
    ward: z.number().optional(),
    propertyType: z.number().optional(),
    status: PropertyStatusSchema.optional(),
    amenities: z.array(z.string()).optional(),
    galleryImages: z.array(PropertyGalleryImageInputSchema).optional(),
    ownershipDocuments: z.array(PropertyOwnershipDocumentInputSchema).optional(),
});

export type PropertyStatus = z.infer<typeof PropertyStatusSchema>;
export type PropertySummary = z.infer<typeof PropertySummarySchema>;
export type PropertyDetail = z.infer<typeof PropertyDetailSchema>;
export type PropertyPage = z.infer<typeof PropertyPageSchema>;
export type PropertyCreateInput = z.infer<typeof PropertyCreateSchema>;
export type PropertyPatchInput = z.infer<typeof PropertyPatchSchema>;

/** Query params for {@code GET /api/v1/properties} — backend {@code PageableParam} fields. */
export type PropertyListParams = {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: string;
};

/** @deprecated Use {@link PropertyListParams} — kept for older imports. */
export type PropertyFilter = PropertyListParams;
