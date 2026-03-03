import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, CheckCircle2, ChevronLeft, ChevronRight, Share2, Heart, ShieldCheck, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PropertyDetail = () => {
  const navigate = useNavigate();
  const [activeImage, setActiveImage] = useState(0);

  const property = {
    id: 1,
    title: 'Luxury Villa in Oyster Bay',
    location: 'Plot 45, Oyster Bay, Dar es Salaam',
    price: '2,500,000 TZS',
    beds: 4,
    baths: 3,
    size: '350 sqm',
    description: 'This stunning contemporary villa offers the pinnacle of luxury living in the heart of Oyster Bay. Featuring an open-plan design, high-end finishes, and a private pool, it is perfect for families seeking comfort and security.',
    features: ['Swimming Pool', '24/7 Security', 'Backup Generator', 'Modern Kitchen', 'Spacious Garden', 'AC in all rooms'],
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200',
    ],
    status: 'Available'
  };

  return (
    <div className="pt-24 pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumbs / Back */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-slate-500 hover:text-emerald-600 mb-6 transition-colors font-medium"
        >
          <ChevronLeft size={20} /> Back to Search
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
              <div className="h-[500px] w-full">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImage}
                    src={property.images[activeImage]}
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
                  onClick={() => setActiveImage(prev => (prev === 0 ? property.images.length - 1 : prev - 1))}
                  className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-white"
                >
                  <ChevronLeft />
                </button>
                <button 
                  onClick={() => setActiveImage(prev => (prev === property.images.length - 1 ? 0 : prev + 1))}
                  className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-white"
                >
                  <ChevronRight />
                </button>
              </div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
                {property.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      activeImage === idx ? 'bg-white w-8' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">{property.title}</h1>
                  <p className="text-slate-500 flex items-center">
                    <MapPin size={18} className="mr-2 text-emerald-600" /> {property.location}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button className="p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                    <Share2 size={20} />
                  </button>
                  <button className="p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Heart size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center">
                  <Bed className="text-emerald-600 mb-2" />
                  <span className="text-sm text-slate-500">Bedrooms</span>
                  <span className="font-bold">{property.beds}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center">
                  <Bath className="text-emerald-600 mb-2" />
                  <span className="text-sm text-slate-500">Bathrooms</span>
                  <span className="font-bold">{property.baths}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center">
                  <Maximize className="text-emerald-600 mb-2" />
                  <span className="text-sm text-slate-500">Area</span>
                  <span className="font-bold">{property.size}</span>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">Description</h3>
                <p className="text-slate-600 leading-relaxed">
                  {property.description}
                </p>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Key Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.features.map(feature => (
                    <div key={feature} className="flex items-center text-slate-600">
                      <CheckCircle2 size={18} className="text-emerald-600 mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 sticky top-28">
              <div className="mb-6">
                <span className="text-slate-500 text-sm">Monthly Rent</span>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-3xl font-bold text-emerald-600">{property.price}</h2>
                </div>
              </div>

              <div className="space-y-4">
                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center">
                  Place Offer
                </button>
                <button className="w-full bg-white border-2 border-slate-900 text-slate-900 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center">
                  Schedule Tour
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                    <img src="https://i.pravatar.cc/150?u=manager" alt="Agent" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">John Mussa</h4>
                    <p className="text-sm text-slate-500">Property Manager</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-emerald-50 text-emerald-600 py-3 rounded-xl font-semibold flex items-center justify-center hover:bg-emerald-100 transition-colors">
                    <Phone size={18} className="mr-2" /> Call
                  </button>
                  <button className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center hover:bg-emerald-700 transition-colors">
                    Message
                  </button>
                </div>
              </div>

              <div className="mt-6 flex items-center text-xs text-slate-400 justify-center">
                <ShieldCheck size={14} className="mr-1" />
                Verified by MakaziHub
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
