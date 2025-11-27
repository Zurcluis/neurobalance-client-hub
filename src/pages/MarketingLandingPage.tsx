import React, { useRef, useEffect } from 'react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingHero from '@/components/landing/LandingHero';
import LandingBenefits from '@/components/landing/LandingBenefits';
import LandingTestimonials from '@/components/landing/LandingTestimonials';
import LandingAbout from '@/components/landing/LandingAbout';
import LandingFAQ from '@/components/landing/LandingFAQ';
import LandingContact from '@/components/landing/LandingContact';
import LandingFooter from '@/components/landing/LandingFooter';
import FloatingCTA from '@/components/landing/FloatingCTA';

const MarketingLandingPage: React.FC = () => {
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Neurofeedback para PHDA, Autismo e Ansiedade | NeuroBalance';
  }, []);

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar onContactClick={scrollToContact} />
      
      <div id="inicio">
        <LandingHero onContactClick={scrollToContact} />
      </div>
      
      <div id="beneficios">
        <LandingBenefits />
      </div>
      
      <div id="testemunhos">
        <LandingTestimonials />
      </div>
      
      <div id="sobre">
        <LandingAbout />
      </div>
      
      <div id="faq">
        <LandingFAQ />
      </div>
      
      <div ref={contactRef} id="contacto">
        <LandingContact />
      </div>
      
      <LandingFooter />
      
      <FloatingCTA onContactClick={scrollToContact} />
    </div>
  );
};

export default MarketingLandingPage;
