import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import Hero from '../components/landing/Hero';
import WhatIsCoop from '../components/landing/WhatIsCoop';
import WhyCoop from '../components/landing/WhyCoop';
import DevelopedBy from '../components/landing/DevelopedBy';

function LandingPage() {
  return (
    <div className="landing-page">
      <PublicHeader />
      <Hero />
      <WhatIsCoop />
      <WhyCoop />
      <DevelopedBy />
      <Footer />
    </div>
  );
}

export default LandingPage;
