import Footer from '@/components/landing_components/Footer';
import { Contact } from 'lucide-react';
import AboutSectionOne from './About/AboutSectionOne';
import AboutSectionTwo from './About/AboutSectionTwo';
import Blog from './Blog';
import ScrollUp from './Common/ScrollUp';
import Features from './Features';
import Hero from './Hero';

import Pricing from './Pricing';
import Testimonials from './Testimonials';

import ScrollToTop from '@/components/landing_components/ScrollToTop';
import Header from './Header';

export default function Landing() {
  return (
    <>
      {/* <Navbar /> */}
      <Header />
      <>
        <ScrollUp />
        <Hero />
        <Features />
        {/* <Video /> */}
        {/* <Brands /> */}
        <AboutSectionOne />
        <AboutSectionTwo />
        <Testimonials />
        <Pricing />
        <Blog />
        <Contact />
      </>
      <Footer />
      <ScrollToTop />
    </>
  );
}
