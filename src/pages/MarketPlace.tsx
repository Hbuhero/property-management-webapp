import { useMemo, useRef, useState } from 'react';
import {
    Search,
    MapPin,
    Filter,
    Building2,
    SlidersHorizontal,
    ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FormSelect } from '@/components/ui/form-select';
import SiteFooter from '@/components/landing/SiteFooter';
import dodomaImg from '@/assets/ditte-yven-vzvpjB5Arlk-unsplash.jpg';
import darImg from '@/assets/moses-londo-1bubgYf5zeY-unsplash.jpg';
import arushaImg from '@/assets/sergey-pesterev-DWXR-nAbxCk-unsplash.jpg';
import { resolvePropertyImageUrl } from '@/lib/propertyMediaUrl';
import { useProperties } from '@/queries/property.queries';
import type { PropertySummary } from '@/schemas/property.schema';

const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800 ${className}`} />
);

const trendingRegions = [
    {
        name: 'Dar es Salaam',
        properties: '124 Properties',
        image: darImg,
        colSpan: 'md:col-span-2 md:row-span-2',
    },
    {
        name: 'Zanzibar',
        properties: '56 Properties',
        image:
            'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&q=80&w=800',
        colSpan: 'md:col-span-1 md:row-span-1',
    },
    {
        name: 'Arusha',
        properties: '42 Properties',
        image: arushaImg,
        colSpan: 'md:col-span-1 md:row-span-1',
    },
    {
        name: 'Dodoma',
        properties: '28 Properties',
        image: dodomaImg,
        colSpan: 'md:col-span-2 md:row-span-1',
    },
];

function listingImageUrl(p: PropertySummary): string {
    const paths = p.galleryImagePaths?.length
        ? p.galleryImagePaths
        : p.primaryGalleryImagePath != null
          ? [p.primaryGalleryImagePath]
          : [];
    const first = paths.map((path) => resolvePropertyImageUrl(path)).find((u) => u != null && u.length > 0);
    return (
        first ??
        `https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800&seed=${p.id}`
    );
}

function listingGalleryUrls(p: PropertySummary): string[] {
    const paths =
        p.galleryImagePaths?.length ? p.galleryImagePaths : p.primaryGalleryImagePath ? [p.primaryGalleryImagePath] : [];
    return paths
        .map((path) => resolvePropertyImageUrl(path))
        .filter((u): u is string => u != null && u.length > 0);
}

function statusBadgeClass(status: PropertySummary['status']): string {
    switch (status) {
        case 'AVAILABLE':
            return 'bg-emerald-500 text-white';
        case 'RENTED':
            return 'bg-amber-500 text-white';
        case 'MAINTENANCE':
            return 'bg-slate-600 text-white';
        case 'DRAFT':
            return 'bg-slate-400 text-white';
        case 'ARCHIVED':
            return 'bg-slate-500 text-white';
        default:
            return 'bg-emerald-500 text-white';
    }
}

function formatStatus(status: PropertySummary['status']): string {
    return status.replace(/_/g, ' ');
}

const Marketplace = () => {
    const listingsRef = useRef<HTMLElement>(null);
    const [query, setQuery] = useState('');
    const [regionFilter, setRegionFilter] = useState('');

    const listingsQuery = useProperties({ page: 0, size: 48 });

    const filtered = useMemo(() => {
        const records = listingsQuery.data?.records ?? [];
        const q = query.trim().toLowerCase();
        return records.filter((p) => {
            const matchesQuery =
                q.length === 0 ||
                p.title.toLowerCase().includes(q) ||
                p.location.toLowerCase().includes(q) ||
                (p.description?.toLowerCase().includes(q) ?? false) ||
                (p.wardName?.toLowerCase().includes(q) ?? false) ||
                (p.regionName?.toLowerCase().includes(q) ?? false) ||
                (p.propertyTypeName?.toLowerCase().includes(q) ?? false);

            const matchesRegion =
                regionFilter === '' ||
                (p.regionName?.toLowerCase().includes(regionFilter.toLowerCase()) ?? false);

            return matchesQuery && matchesRegion;
        });
    }, [listingsQuery.data?.records, query, regionFilter]);

    const scrollToListings = () => {
        listingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-200">
            {/* ── Hero ────────────────────────────────────────────────────────────── */}
            <section className="relative h-[540px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000"
                        className="w-full h-full object-cover brightness-50"
                        alt=""
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/40" />
                </div>

                <div className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight"
                    >
                        Find Your Perfect Home in <span className="text-emerald-400">Tanzania</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-slate-200 mb-8 max-w-xl mx-auto"
                    >
                        Trusted property management connecting landlords and tenants nationwide.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row gap-2"
                    >
                        <div className="flex-1 flex items-center px-4 gap-2 border-r border-slate-100 dark:border-slate-700">
                            <Search className="h-4 w-4 text-slate-400 shrink-0" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Title, area, type..."
                                className="w-full py-3 focus:outline-none text-slate-700 dark:text-slate-200 bg-transparent text-sm placeholder-slate-400"
                            />
                        </div>
                        <div className="flex-1 flex items-center px-4 gap-2 border-r border-slate-100 dark:border-slate-700">
                            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                            <FormSelect
                                value={regionFilter || '__all__'}
                                onValueChange={(value) => setRegionFilter(value === '__all__' ? '' : value)}
                                triggerClassName="border-0 bg-transparent shadow-none focus:ring-0 h-auto py-3"
                                options={[
                                    { value: '__all__', label: 'All regions' },
                                    { value: 'dar', label: 'Dar es Salaam' },
                                    { value: 'arusha', label: 'Arusha' },
                                    { value: 'zanzibar', label: 'Zanzibar' },
                                    { value: 'dodoma', label: 'Dodoma' },
                                ]}
                            />
                        </div>
                        <div className="flex-1 flex items-center px-4 gap-2">
                            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                            <FormSelect
                                value="all-types"
                                onValueChange={() => undefined}
                                disabled
                                triggerClassName="border-0 bg-transparent shadow-none focus:ring-0 h-auto py-3 text-slate-400 dark:text-slate-500"
                                options={[{ value: 'all-types', label: 'All types' }]}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => scrollToListings()}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors text-sm shrink-0"
                        >
                            Search
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* ── Listings ────────────────────────────────────────────────────────── */}
            <section ref={listingsRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-16 scroll-mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Featured Properties
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                            {listingsQuery.isPending
                                ? 'Loading listings…'
                                : `${filtered.length} ${filtered.length === 1 ? 'property' : 'properties'} shown`}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
                    >
                        <SlidersHorizontal className="h-4 w-4" /> Filters
                    </button>
                </div>

                {listingsQuery.isError ? (
                    <div
                        className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
                        role="alert"
                    >
                        <p className="font-medium">Could not load listings</p>
                        <p className="mt-1 text-sm">
                            {listingsQuery.error instanceof Error
                                ? listingsQuery.error.message
                                : 'Unknown error'}
                        </p>
                        <button
                            type="button"
                            className="mt-4 rounded-lg bg-red-800 px-3 py-1.5 text-sm text-white hover:bg-red-900"
                            onClick={() => void listingsQuery.refetch()}
                        >
                            Retry
                        </button>
                    </div>
                ) : listingsQuery.isPending ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="rounded-2xl overflow-hidden">
                                <Skeleton className="h-48 rounded-2xl rounded-b-none" />
                                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 border-t-0 rounded-b-2xl p-4 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                    <Skeleton className="h-5 w-1/3 mt-3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-12 text-sm">
                        No properties match your filters. Try clearing search or region.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((property, idx) => {
                            const galleryUrls = listingGalleryUrls(property);
                            const heroSrc = galleryUrls[0] ?? listingImageUrl(property);
                            return (
                                <motion.div
                                    key={property.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.04, duration: 0.3 }}
                                    className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg dark:hover:shadow-slate-900 transition-all duration-200"
                                >
                                    <Link to={`/property/${property.id}`}>
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={heroSrc}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                            {galleryUrls.length > 1 && (
                                                <div className="absolute bottom-0 left-0 right-0 flex gap-1 overflow-x-auto p-2 pt-6 bg-gradient-to-t from-black/60 to-transparent">
                                                    {galleryUrls.slice(0, 6).map((url, gi) => (
                                                        <img
                                                            key={`${property.id}-g-${gi}`}
                                                            src={url}
                                                            alt=""
                                                            className="h-11 w-11 shrink-0 rounded-lg border border-white/40 object-cover shadow-sm"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            <span
                                                className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusBadgeClass(property.status)}`}
                                            >
                                                {formatStatus(property.status)}
                                            </span>
                                        </div>

                                        <div className="p-4">
                                        <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-1">
                                            {property.title}
                                        </h3>
                                        <p className="text-xs text-slate-400 flex items-center gap-1 mb-3">
                                            <MapPin className="h-3 w-3 shrink-0" /> {property.location}
                                            {property.regionName ? ` · ${property.regionName}` : ''}
                                        </p>
                                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs pt-3 border-t border-slate-100 dark:border-slate-800 mb-3">
                                            <span className="flex items-center gap-1">
                                                <Building2 className="h-3.5 w-3.5 shrink-0" />
                                                {property.propertyTypeName ?? 'Property'}
                                            </span>
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <span className="text-slate-700 dark:text-slate-200 font-semibold text-sm">
                                                    Rent varies by unit
                                                </span>
                                                <p className="text-slate-400 text-[11px] mt-0.5">
                                                    Open listing for floor maps
                                                </p>
                                            </div>
                                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
                                                View →
                                            </span>
                                        </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-10 flex justify-end">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3 }}
                    >
                        <button
                            type="button"
                            onClick={() => scrollToListings()}
                            className="group flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:shadow-emerald-600/20 transition-all duration-300"
                        >
                            <span>Back to listings</span>
                            <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* ── Trending Regions ──────────────────────────────────────────────────  */}
            <section className="py-24 bg-slate-50 dark:bg-slate-800/50 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col mb-10">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            Trending Regions
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                            Explore the most sought-after locations for property investments
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
                        {trendingRegions.map((region, idx) => (
                            <motion.div
                                key={region.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                whileHover="hover"
                                className={`relative rounded-3xl overflow-hidden cursor-pointer group ${region.colSpan}`}
                            >
                                <motion.img
                                    src={region.image}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    variants={{
                                        hover: { scale: 1.05 },
                                    }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent transition-opacity duration-300 pointer-events-none" />

                                <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                                    <motion.div
                                        variants={{
                                            hover: { y: -5 },
                                        }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
                                            {region.name}
                                        </h3>
                                        <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
                                            <MapPin className="h-4 w-4" />
                                            {region.properties}
                                        </div>
                                    </motion.div>
                                </div>

                                <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                    Explore →
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="mt-10 flex justify-end">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3 }}
                        >
                            <Link
                                to="/marketplace"
                                className="group flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-full font-semibold shadow-sm hover:shadow-md hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300"
                            >
                                <span>Explore All Regions</span>
                                <ArrowRight className="h-4 w-4 text-emerald-500 transform group-hover:translate-x-1 transition-transform duration-300" />
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            <SiteFooter />
        </div>
    );
};

export default Marketplace;
