import React, { useEffect } from 'react';
import LandingHero from '@/components/landing/LandingHero';
import LandingTestimonials from '@/components/landing/LandingTestimonials';
import LandingFAQ from '@/components/landing/LandingFAQ';
import LandingFooter from '@/components/landing/LandingFooter';

const MarketingLandingPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Neurofeedback para PHDA, Autismo e Ansiedade | NeuroBalance';

    // Meta Pixel Code
    if (!(window as any).fbq) {
      (function(f: any, b: any, e: string, v: string, n: any, t: any, s: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      
      (window as any).fbq('init', '1601913407380382');
      (window as any).fbq('track', 'PageView');
    }

    // Cleanup function
    return () => {
      // No cleanup needed for pixel
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Meta Pixel noscript fallback */}
      <noscript>
        <img 
          height="1" 
          width="1" 
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=1601913407380382&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>

      <div id="inicio">
        <LandingHero />
      </div>

      <div id="testemunhos">
        <LandingTestimonials />
      </div>

      <div id="faq">
        <LandingFAQ />
      </div>

      <LandingFooter />
    </div>
  );
};

export default MarketingLandingPage;
