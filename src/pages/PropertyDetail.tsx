import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    MapPin,
    Building2,
    Home,
    Maximize,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Share2,
    Heart,
    ShieldCheck,
    Phone,
    LayoutGrid,
    ExternalLink,
    Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolvePropertyImageUrl, resolveFloorThumbnailUrl } from '@/lib/propertyMediaUrl';
import { useProperty } from '@/queries/property.queries';

const PLACEHOLDER_GALLERY = [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=1200',
];

function PropertyListingGallery({ images }: { images: string[] }) {
    const [activeImage, setActiveImage] = useState(0);

    return (
        <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
            <div className="h-[500px] w-full bg-slate-200 dark:bg-slate-800">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={activeImage}
                        src={images[activeImage]}
                        alt=""
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full object-cover"
                    />
                </AnimatePresence>
            </div>

            <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    type="button"
                    onClick={() =>
                        setActiveImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                    }
                    className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900"
                >
                    <ChevronLeft />
                </button>
                <button
                    type="button"
                    onClick={() =>
                        setActiveImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))
                    }
                    className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900"
                >
                    <ChevronRight />
                </button>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImage(idx)}
                        className={`h-2.5 rounded-full transition-all ${
                            activeImage === idx ? 'bg-white w-8' : 'bg-white/50 w-2.5'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}

const PropertyDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const detailQuery = useProperty(id);

    const images = useMemo(() => {
        const rows = detailQuery.data?.galleryImages ?? [];
        const urls = rows
            .map((g) => resolvePropertyImageUrl(g.imagePath))
            .filter((u): u is string => u != null && u.length > 0);
        return urls.length > 0 ? urls : PLACEHOLDER_GALLERY;
    }, [detailQuery.data?.galleryImages]);

    const unitStats = useMemo(() => {
        const list = detailQuery.data?.floors ?? [];
        let t = 0;
        let a = 0;
        for (const f of list) {
            t += f.unitCount;
            a += f.availableUnitCount;
        }
        return { totalUnits: t, availableUnits: a };
    }, [detailQuery.data?.floors]);

    const property = detailQuery.data;

    if (detailQuery.isPending) {
        return (
            <div className="pt-30 pb-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 py-16">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Loading property…</p>
                </div>
            </div>
        );
    }

    if (detailQuery.isError || !property) {
        return (
            <div className="pt-30 pb-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 py-16 space-y-4">
                    <p className="text-slate-900 dark:text-white font-medium">
                        This listing is not available or could not be loaded.
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {detailQuery.error instanceof Error ? detailQuery.error.message : null}
                    </p>
                    <Link
                        to="/marketplace"
                        className="inline-flex text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    >
                        Browse marketplace
                    </Link>
                </div>
            </div>
        );
    }

    const locationLine = [property.address, property.location, property.wardName, property.regionName]
        .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        .join(' · ');

    const floors = property.floors ?? [];
    const features = property.amenities;
    const listingGalleryKey = `${id}-${(property.galleryImages ?? []).map((g) => g.id).join('-') || 'none'}-${images.length}`;
    const { totalUnits, availableUnits } = unitStats;

    return (
        <div className="pt-30 pb-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
            <div className="max-w-7xl mx-auto px-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex items-center text-slate-500 hover:text-emerald-600 mb-6 transition-colors font-medium dark:text-slate-400"
                >
                    <ChevronLeft size={20} /> Back
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <PropertyListingGallery key={listingGalleryKey} images={images} />

                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between items-start mb-6 gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                                        {property.title}
                                    </h1>
                                    <p className="text-slate-500 dark:text-slate-400 flex items-start">
                                        <MapPin size={18} className="mr-2 text-emerald-600 shrink-0 mt-0.5" />
                                        {locationLine || property.location}
                                    </p>
                                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                                        {property.status.replace(/_/g, ' ')} ·{' '}
                                        {property.propertyTypeName ?? 'Property'}
                                    </p>
                                </div>
                                <div className="flex space-x-2 shrink-0">
                                    <button
                                        type="button"
                                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                    >
                                        <Share2 size={20} />
                                    </button>
                                    <button
                                        type="button"
                                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 transition-colors"
                                    >
                                        <Heart size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
                                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                    <Building2 className="text-emerald-600 mb-2 h-6 w-6" aria-hidden />
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        Available apartments
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white text-xl tabular-nums">
                                        {availableUnits}
                                    </span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                    <Home className="text-emerald-600 mb-2 h-6 w-6" aria-hidden />
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        Total apartments
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white text-xl tabular-nums">
                                        {totalUnits}
                                    </span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                    <Maximize className="text-emerald-600 mb-2 h-6 w-6" aria-hidden />
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        Layout
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                                        Per unit (map)
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                                    Description
                                </h3>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {property.description?.trim() ||
                                        'No description provided for this listing yet.'}
                                </p>
                            </div>

                            {features.length > 0 ? (
                                <div className="mt-8">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                                        <Sparkles className="h-5 w-5 text-emerald-600" aria-hidden />
                                        Building amenities
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {features.map((feature) => (
                                            <div
                                                key={feature}
                                                className="flex items-center text-slate-600 dark:text-slate-300 text-sm"
                                            >
                                                <CheckCircle2
                                                    size={18}
                                                    className="text-emerald-600 mr-2 shrink-0"
                                                />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {floors.length > 0 ? (
                                <div className="mt-8 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-6">
                                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-900 dark:text-white">
                                        <LayoutGrid className="h-5 w-5 text-emerald-600" aria-hidden />
                                        Explore units by floor
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                        Open the interactive map for each storey to see units and availability.
                                    </p>
                                    <ul className="grid gap-4 sm:grid-cols-2">
                                        {floors.map((f) => {
                                            const thumb = resolveFloorThumbnailUrl(
                                                f.floorPlanImagePath,
                                                f.galleryImages,
                                            );
                                            const gCount = f.galleryImages?.length ?? 0;
                                            return (
                                                <li key={f.id}>
                                                    <Link
                                                        to={`/floors/${f.id}/map`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-emerald-500/40 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-emerald-500/30"
                                                    >
                                                        <div className="relative h-28 w-32 shrink-0 bg-slate-200 dark:bg-slate-700">
                                                            {thumb ? (
                                                                <img
                                                                    src={thumb}
                                                                    alt=""
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full items-center justify-center px-2 text-center text-xs text-slate-500 dark:text-slate-400">
                                                                    Floor plan
                                                                </div>
                                                            )}
                                                            {gCount > 0 ? (
                                                                <span className="absolute bottom-1 right-1 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                                                    {gCount} photo{gCount === 1 ? '' : 's'}
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4">
                                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                                {f.label}
                                                            </span>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                {f.unitCount} apartment{f.unitCount === 1 ? '' : 's'} ·{' '}
                                                                <span className="text-emerald-600 dark:text-emerald-400">
                                                                    {f.availableUnitCount} available
                                                                </span>
                                                                {' · '}
                                                                {f.occupiedUnitCount} occupied
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                                Open map
                                                                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                                                            </span>
                                                        </div>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 sticky top-28">
                            <div className="mb-6">
                                <span className="text-slate-500 dark:text-slate-400 text-sm">Rent</span>
                                <div className="flex items-baseline space-x-2 mt-1">
                                    <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                        By unit
                                    </h2>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                    Monthly rent varies by apartment. Use the floor maps to browse units on each
                                    storey.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {floors[0] ? (
                                    <Link
                                        to={`/floors/${floors[0].id}/map`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <LayoutGrid className="h-5 w-5" aria-hidden />
                                        Open floor map
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full bg-slate-200 dark:bg-slate-700 text-slate-500 py-4 rounded-2xl font-bold cursor-not-allowed"
                                    >
                                        Floor map coming soon
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="w-full bg-white dark:bg-slate-950 border-2 border-slate-900 dark:border-slate-200 text-slate-900 dark:text-white py-4 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center"
                                >
                                    Schedule tour
                                </button>
                            </div>

                            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center space-x-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold">
                                        {(property.ownerFullName ?? 'Owner').slice(0, 1)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">
                                            {property.ownerFullName ?? 'Property owner'}
                                        </h4>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        type="button"
                                        className="flex-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 py-3 rounded-xl font-semibold flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                                    >
                                        <Phone size={18} className="mr-2" /> Call
                                    </button>
                                    <button
                                        type="button"
                                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center hover:bg-emerald-700 transition-colors"
                                    >
                                        Message
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center text-xs text-slate-400 justify-center">
                                <ShieldCheck size={14} className="mr-1" />
                                Verified by PMS
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetail;
