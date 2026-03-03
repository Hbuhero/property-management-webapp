import HeroSection from '../components/landing/HeroSection';
import OverviewSection from '../components/landing/OverviewSection';
import ServicesSection from '../components/landing/ServicesSection';
import ContactSection from '../components/landing/ContactSection';

const LandingPage = () => {
  return (
    <div className="pt-24 pb-0 bg-white dark:bg-slate-900 min-h-screen transition-colors duration-300">
      <HeroSection />
      <OverviewSection />
      <ServicesSection />
      <ContactSection />
    </div>
  );
};

export default LandingPage;
