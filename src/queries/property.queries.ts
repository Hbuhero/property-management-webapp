import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Property, PropertyFilter } from '@/schemas/property.schema';

// ── Query keys ────────────────────────────────────────────────────────────────
export const propertyKeys = {
    all: ['properties'] as const,
    list: (filters?: PropertyFilter) => [...propertyKeys.all, 'list', filters] as const,
    detail: (id: string) => [...propertyKeys.all, 'detail', id] as const,
};

// ── Placeholder fetch functions (replace with real API calls) ─────────────────
async function fetchProperties(_filters?: PropertyFilter): Promise<Property[]> {
    // TODO: replace with actual API call e.g. axios.get('/api/properties', { params: filters })
    return [];
}

async function fetchProperty(id: string): Promise<Property | null> {
    // TODO: replace with actual API call e.g. axios.get(`/api/properties/${id}`)
    console.log('fetchProperty', id);
    return null;
}

async function createProperty(data: Omit<Property, 'id' | 'createdAt'>): Promise<Property> {
    // TODO: replace with actual API call e.g. axios.post('/api/properties', data)
    return { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
}

async function updateProperty(data: Partial<Property> & { id: string }): Promise<Property> {
    // TODO: replace with actual API call e.g. axios.put(`/api/properties/${data.id}`, data)
    return data as Property;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Fetch all properties, optionally filtered */
export function useProperties(filters?: PropertyFilter) {
    return useQuery({
        queryKey: propertyKeys.list(filters),
        queryFn: () => fetchProperties(filters),
    });
}

/** Fetch a single property by id */
export function useProperty(id: string) {
    return useQuery({
        queryKey: propertyKeys.detail(id),
        queryFn: () => fetchProperty(id),
        enabled: Boolean(id),
    });
}

/** Create a new property */
export function useCreateProperty() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createProperty,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: propertyKeys.all });
        },
    });
}

/** Update an existing property */
export function useUpdateProperty() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: updateProperty,
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: propertyKeys.detail(variables.id) });
            qc.invalidateQueries({ queryKey: propertyKeys.all });
        },
    });
}
