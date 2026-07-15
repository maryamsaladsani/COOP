import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';
import HeroCarousel from '../components/landing/HeroCarousel';

function LandingPage() {
  return (
    <div className="landing-page">
      <PublicHeader />
      <HeroCarousel />
      <Footer />
    </div>
  );
}

export default LandingPage;
