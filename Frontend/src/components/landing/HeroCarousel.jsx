import Carousel from '../Carousel';
import HeroSlide from './HeroSlide';
import IntroVisual from './IntroVisual';
import RoleIconList from './RoleIconList';
import WhyChecklist from './WhyChecklist';
import './HeroCarousel.css';

const SLIDES = [
  {
    headingLevel: 'h1',
    headline: 'Onboarding, finally coordinated.',
    body: 'COOP connects trainees, HR, and training coordinators in one place, replacing the paper trail with real-time status.',
    cta: { label: 'Get Started', to: '/signin' },
    visual: <IntroVisual />,
  },
  {
    headingLevel: 'h2',
    headline: 'What is COOP?',
    body: "COOP is Saudi Energy's onboarding platform. It replaces the paper trail that used to carry a new hire from offer letter to first day, giving trainees, HR, and training coordinators one live view of where every onboarding stands.",
    visual: <RoleIconList />,
  },
  {
    headingLevel: 'h2',
    headline: 'Why COOP?',
    subhead: 'Every step COOP replaces was a manual, paper-based one.',
    visual: <WhyChecklist />,
  },
];

function HeroCarousel() {
  return (
    <section className="hero-carousel">
      <Carousel
        ariaLabel="COOP highlights"
        autoplay
        interval={7000}
        slides={SLIDES.map((slide) => (
          <HeroSlide key={slide.headline} {...slide} />
        ))}
      />
    </section>
  );
}

export default HeroCarousel;
