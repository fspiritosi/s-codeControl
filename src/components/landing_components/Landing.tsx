import Footer from '@/components/landing_components/Footer';
import AboutSectionOne from './About/AboutSectionOne';
import AboutSectionTwo from './About/AboutSectionTwo';
import ScrollUp from './Common/ScrollUp';
import Features from './Features';
import Hero from './Hero';

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
        {/* <Testimonials />
        <Pricing />
        <Blog />
        <Contact /> */}
      </>
      <Footer />
      <ScrollToTop />
    </>
  );
}
