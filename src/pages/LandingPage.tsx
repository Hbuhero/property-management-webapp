import HeroSection from '../components/landing/HeroSection';
import OverviewSection from '../components/landing/OverviewSection';
import ServicesSection from '../components/landing/ServicesSection';
import ContactSection from '../components/landing/ContactSection';
import SiteFooter from '../components/landing/SiteFooter';

const LandingPage = () => {
  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen transition-colors duration-300">
      <HeroSection />
      <OverviewSection />
      <ServicesSection />
      <ContactSection />
      <SiteFooter />
    </div>
  );
};

export default LandingPage;
