import { useCallback, useEffect, useRef, useState } from 'react';
import './Carousel.css';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReduced(query.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  return reduced;
}

function Carousel({ slides, autoplay = false, interval = 6000, ariaLabel = 'Carousel' }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const count = slides.length;

  const goTo = useCallback((index) => setActiveIndex(((index % count) + count) % count), [count]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (!autoplay || paused || reducedMotion || count <= 1) return undefined;
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, interval);
    return () => clearInterval(id);
  }, [autoplay, paused, reducedMotion, count, interval]);

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
    }
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    const SWIPE_THRESHOLD = 40;
    if (deltaX > SWIPE_THRESHOLD) goPrev();
    else if (deltaX < -SWIPE_THRESHOLD) goNext();
    touchStartX.current = null;
  };

  return (
    <div
      className="carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="carousel__track"
        style={{
          transform: `translateX(-${activeIndex * 100}%)`,
          transitionDuration: reducedMotion ? '0ms' : '560ms',
        }}
      >
        {slides.map((slide, index) => (
          <div className="carousel__slide" key={index} aria-hidden={index !== activeIndex} inert={index !== activeIndex}>
            {slide}
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="carousel__dots" role="tablist" aria-label="Slide navigation">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Go to slide ${index + 1}`}
              className={`carousel__dot${index === activeIndex ? ' carousel__dot--active' : ''}`}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Carousel;
