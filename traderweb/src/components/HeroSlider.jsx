import { useEffect, useState } from 'react';
import AppLink from './AppLink';
import { resolveAssetUrl } from '../lib/format';

export default function HeroSlider({ router, slides }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!slides.length) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [slides]);

  if (!slides.length) {
    return null;
  }

  const activeSlide = slides[activeIndex];

  return (
    <section className="overflow-hidden rounded-[1.4rem] border border-black/8 bg-white shadow-sm">
      <div className="relative min-h-[23rem] bg-[#f8fafc]">
        <img
          alt={activeSlide.title}
          className="absolute inset-0 h-full w-full object-cover"
          src={resolveAssetUrl(activeSlide.image, activeSlide.title)}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.82),rgba(15,23,42,0.38),rgba(15,23,42,0.08))]" />

        <div className="relative z-10 flex h-full min-h-[23rem] flex-col justify-center px-8 py-8 text-white md:px-10">
          <div className="max-w-xl">
            {activeSlide.eyebrow ? (
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/75">
                {activeSlide.eyebrow}
              </div>
            ) : null}
            <h1 className="max-w-lg text-3xl font-semibold leading-tight md:text-5xl">
              {activeSlide.title}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-base">
              {activeSlide.description}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <AppLink
                className="rounded-sm bg-[#ff3a3d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#ef2f33]"
                router={router}
                to={activeSlide.primaryCta.href}
              >
                {activeSlide.primaryCta.label}
              </AppLink>
              {activeSlide.secondaryCta ? (
                <AppLink
                  className="rounded-sm border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/16"
                  router={router}
                  to={activeSlide.secondaryCta.href}
                >
                  {activeSlide.secondaryCta.label}
                </AppLink>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-black/6 px-5 py-4">
        <div className="flex items-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              className={`h-2.5 rounded-full transition ${
                index === activeIndex
                  ? 'w-8 bg-[#ff3a3d]'
                  : 'w-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
              type="button"
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-black/10 text-slate-600 transition hover:border-[#ff3a3d] hover:text-[#ff3a3d]"
            type="button"
            onClick={() =>
              setActiveIndex((current) =>
                current === 0 ? slides.length - 1 : current - 1,
              )
            }
          >
            ‹
          </button>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-black/10 text-slate-600 transition hover:border-[#ff3a3d] hover:text-[#ff3a3d]"
            type="button"
            onClick={() =>
              setActiveIndex((current) => (current + 1) % slides.length)
            }
          >
            ›
          </button>
        </div>
      </div>
    </section>
  );
}
