'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface ScreenshotSlide {
  title: string;
  label: string;
  src: string;
  url: string;
}

const SLIDES: ScreenshotSlide[] = [
  {
    title: 'Login Page',
    label: 'Login',
    src: '/screenshots/login-page.png',
    url: 'app.reportpilot.com/login',
  },
  {
    title: 'Dashboard',
    label: 'Dashboard',
    src: '/screenshots/dashboard.png',
    url: 'app.reportpilot.com/dashboard',
  },
  {
    title: 'Clients',
    label: 'Clients',
    src: '/screenshots/clients.png',
    url: 'app.reportpilot.com/clients',
  },
  {
    title: 'Campaign',
    label: 'Campaigns',
    src: '/screenshots/campaign.png',
    url: 'app.reportpilot.com/campaigns',
  },
  {
    title: 'Metrics',
    label: 'Metrics',
    src: '/screenshots/metrics.png',
    url: 'app.reportpilot.com/metrics',
  },
  {
    title: 'Teams',
    label: 'Team',
    src: '/screenshots/teams.png',
    url: 'app.reportpilot.com/team',
  },
];

const AUTOPLAY_INTERVAL_MS = 3500;

export function ScreenshotCarousel() {
  const [[page, direction], setPage] = React.useState<[number, number]>([0, 0]);
  const [isPaused, setIsPaused] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Normalize slide index to 0..SLIDES.length - 1
  const currentIndex = ((page % SLIDES.length) + SLIDES.length) % SLIDES.length;

  const paginate = React.useCallback((newDirection: number) => {
    setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
  }, []);

  const goToSlide = React.useCallback(
    (targetIndex: number) => {
      if (targetIndex === currentIndex) return;
      const diff = targetIndex - currentIndex;
      setPage([targetIndex, diff > 0 ? 1 : -1]);
    },
    [currentIndex]
  );

  // Autoplay timer with pause on hover / focus / drag
  React.useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      paginate(1);
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isPaused, paginate]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      paginate(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      paginate(1);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir > 0 ? '100%' : '-100%',
      opacity: shouldReduceMotion ? 0 : 0.4,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 320, damping: 32 },
        opacity: { duration: 0.25 },
      },
    },
    exit: (dir: number) => ({
      x: shouldReduceMotion ? 0 : dir < 0 ? '100%' : '-100%',
      opacity: shouldReduceMotion ? 0 : 0.4,
      transition: {
        x: { type: 'spring' as const, stiffness: 320, damping: 32 },
        opacity: { duration: 0.25 },
      },
    }),
  };

  const currentSlide = SLIDES[currentIndex];

  return (
    <section
      aria-label="Product Tour Screenshots"
      className="max-w-6xl mx-auto px-6 w-full"
    >
      {/* Minimal pill tabs for direct navigation */}
      <div className="flex items-center justify-center flex-wrap gap-2 mb-6 sm:mb-8">
        {SLIDES.map((slide, i) => {
          const isActive = currentIndex === i;
          return (
            <button
              key={slide.label}
              type="button"
              onClick={() => goToSlide(i)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-lime-400/40 ${
                isActive
                  ? 'bg-zinc-800 text-lime-400 border border-lime-400/30 shadow-xs'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
              aria-label={`View ${slide.title} screenshot`}
              aria-pressed={isActive}
            >
              {slide.label}
            </button>
          );
        })}
      </div>

      {/* Main Carousel Card / Browser Frame */}
      <div
        ref={containerRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="ReportPilot features showcase"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
        className="relative group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl focus:outline-hidden focus:ring-2 focus:ring-lime-400/30 transition-shadow duration-300"
      >
        {/* Browser Chrome Bar */}
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/95">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-zinc-800 inline-block" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-zinc-800 inline-block" />
            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-zinc-800 inline-block" />
            <span className="ml-2 sm:ml-3 text-[11px] sm:text-xs font-mono text-zinc-500 truncate max-w-[190px] sm:max-w-sm">
              {currentSlide.url}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-zinc-400 bg-zinc-950/60 border border-zinc-800 px-2 sm:px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
              {currentSlide.label}
            </span>
          </div>
        </div>

        {/* Viewport & Slide Track */}
        <div className="relative w-full aspect-16/9 overflow-hidden bg-zinc-950">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={page}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragStart={() => setIsPaused(true)}
              onDragEnd={(_e, { offset, velocity }) => {
                setIsPaused(false);
                const swipePower = Math.abs(offset.x) * velocity.x;
                if (swipePower < -8000 || offset.x < -50) {
                  paginate(1);
                } else if (swipePower > 8000 || offset.x > 50) {
                  paginate(-1);
                }
              }}
              className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
            >
              <Image
                src={currentSlide.src}
                alt={currentSlide.title}
                fill
                priority={currentIndex === 0}
                loading={currentIndex === 0 ? 'eager' : 'lazy'}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 1152px"
                className="object-contain object-top select-none pointer-events-none"
              />
            </motion.div>
          </AnimatePresence>

          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              paginate(-1);
            }}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 hover:border-lime-400/50 text-zinc-300 hover:text-lime-400 backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-lime-400/50 cursor-pointer shadow-xl"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              paginate(1);
            }}
            aria-label="Next slide"
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 hover:border-lime-400/50 text-zinc-300 hover:text-lime-400 backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-lime-400/50 cursor-pointer shadow-xl"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Slide Dots Indicator */}
      <div
        className="flex items-center justify-center gap-2 mt-6"
        role="tablist"
        aria-label="Slide indicators"
      >
        {SLIDES.map((slide, i) => {
          const isActive = currentIndex === i;
          return (
            <button
              key={slide.title}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Go to slide ${i + 1}: ${slide.title}`}
              onClick={() => goToSlide(i)}
              className={`transition-all duration-300 rounded-full cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-lime-400/50 ${
                isActive
                  ? 'w-7 sm:w-8 h-2 bg-lime-400'
                  : 'w-2 h-2 bg-zinc-700 hover:bg-zinc-500'
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
