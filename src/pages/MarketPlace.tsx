import { useState } from 'react';
import { Search, MapPin, Filter, Bed, Bath, Maximize, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800 ${className}`} />
);

const properties = [
  {
    id: 1, title: 'Luxury Villa in Oyster Bay', location: 'Dar es Salaam, TZ',
    price: '2,500,000', beds: 4, baths: 3, size: '350 sqm', status: 'Available',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 2, title: 'Modern Apartment in Masaki', location: 'Dar es Salaam, TZ',
    price: '1,800,000', beds: 2, baths: 2, size: '120 sqm', status: 'Booked',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 3, title: 'Commercial Space, City Center', location: 'Dar es Salaam, TZ',
    price: '4,000,000', beds: 0, baths: 2, size: '500 sqm', status: 'Available',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 4, title: 'Cozy Bungalow in Mikocheni', location: 'Dar es Salaam, TZ',
    price: '950,000', beds: 3, baths: 2, size: '180 sqm', status: 'Available',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 5, title: 'Sea-View Penthouse Zanzibar', location: 'Zanzibar, TZ',
    price: '5,200,000', beds: 3, baths: 3, size: '280 sqm', status: 'Available',
    image: 'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 6, title: 'Studio Apartment Upanga', location: 'Dar es Salaam, TZ',
    price: '680,000', beds: 1, baths: 1, size: '55 sqm', status: 'Available',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 7, title: 'Garden House Mbezi Beach', location: 'Dar es Salaam, TZ',
    price: '3,200,000', beds: 5, baths: 4, size: '420 sqm', status: 'Booked',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 8, title: 'Loft Office, Kariakoo', location: 'Dar es Salaam, TZ',
    price: '2,100,000', beds: 0, baths: 2, size: '220 sqm', status: 'Available',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=800',
  },
];

const Marketplace = () => {
  const [query, setQuery] = useState('');
  const [loading] = useState(false);

  const filtered = properties.filter(p =>
    p.title.toLowerCase().includes(query.toLowerCase()) ||
    p.location.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative h-[540px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000"
            className="w-full h-full object-cover brightness-50"
            alt="Hero background"
          />
          {/* gradient overlay for smooth transition */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/40" />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight"
          >
            Find Your Perfect Home in{' '}
            <span className="text-emerald-400">Tanzania</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-200 mb-8 max-w-xl mx-auto"
          >
            Trusted property management connecting landlords and tenants nationwide.
          </motion.p>

          {/* Search bar */}
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
                onChange={e => setQuery(e.target.value)}
                placeholder="Location, neighborhood..."
                className="w-full py-3 focus:outline-none text-slate-700 dark:text-slate-200 bg-transparent text-sm placeholder-slate-400"
              />
            </div>
            <div className="flex-1 flex items-center px-4 gap-2 border-r border-slate-100 dark:border-slate-700">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <select className="w-full py-3 focus:outline-none text-slate-700 dark:text-slate-200 bg-transparent text-sm">
                <option>Dar es Salaam</option>
                <option>Arusha</option>
                <option>Zanzibar</option>
                <option>Dodoma</option>
              </select>
            </div>
            <div className="flex-1 flex items-center px-4 gap-2">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select className="w-full py-3 focus:outline-none text-slate-700 dark:text-slate-200 bg-transparent text-sm">
                <option>All Types</option>
                <option>Apartment</option>
                <option>Villa</option>
                <option>Commercial</option>
              </select>
            </div>
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors text-sm shrink-0">
              Search
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Listings ────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Featured Properties</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              {filtered.length} {filtered.length === 1 ? 'property' : 'properties'} found
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((property, idx) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.3 }}
                className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg dark:hover:shadow-slate-900 transition-all duration-200"
              >
                <Link to={`/property/${property.id}`}>
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${property.status === 'Available'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 text-white'
                      }`}>
                      {property.status}
                    </span>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-1">
                      {property.title}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mb-3">
                      <MapPin className="h-3 w-3" /> {property.location}
                    </p>
                    <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-xs pt-3 border-t border-slate-100 dark:border-slate-800 mb-3">
                      {property.beds > 0 && (
                        <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{property.beds}</span>
                      )}
                      <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.baths}</span>
                      <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{property.size}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base">{property.price}</span>
                        <span className="text-slate-400 text-xs ml-1">TZS/mo</span>
                      </div>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
                        View →
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Marketplace;
