import AboutAs from '@/components/landing_components/About';
import Services from '@/components/landing_components/BestBusines';
import FirstBlock from '@/components/landing_components/first-block';
import Header from '@/components/landing_components/header';

export default function Home() {
  return (
    <div className="flex flex-col justify-center">
      <Header />
      <FirstBlock />
      <div id="about">
        <AboutAs />
      </div>
      <div id="services">
        <Services />
      </div>
    </div>
  );
}
