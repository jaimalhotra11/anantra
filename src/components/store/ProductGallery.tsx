'use client'

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  altPrefix?: string;
  aspectRatio?: "square" | "landscape" | "portrait";
}

export default function ProductGallery({
  images,
  altPrefix = "Product image",
  aspectRatio = "square",
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [flyoutPos, setFlyoutPos] = useState({ x: 0, y: 0 });

  const mainRef = useRef<HTMLDivElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const ZOOM_FACTOR = 2.5;

  const aspectClass = {
    square: "aspect-square",
    landscape: "aspect-video",
    portrait: "aspect-[3/4]",
  }[aspectRatio];

  // ── Navigate
  const prev = useCallback(() => {
    setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  // ── Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  // ── Scroll active thumb into view
  useEffect(() => {
    const container = thumbsRef.current;
    if (!container) return;
    const thumb = container.children[activeIndex] as HTMLElement;
    if (thumb) {
      thumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeIndex]);

  // ── Zoom logic
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = mainRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lensSize = 80; // px
    const clampedX = Math.max(lensSize / 2, Math.min(x, rect.width - lensSize / 2));
    const clampedY = Math.max(lensSize / 2, Math.min(y, rect.height - lensSize / 2));

    setLensPos({ x: clampedX, y: clampedY });

    // flyout background offset
    const bgX = ((clampedX / rect.width) * 100);
    const bgY = ((clampedY / rect.height) * 100);
    setFlyoutPos({ x: bgX, y: bgY });
  };

  // ── Touch swipe
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > 40) prev();
    else if (delta < -40) next();
    touchStartX.current = null;
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto select-none font-sans">
      {/* ── Main image ─────────────────────────────────────────────────────── */}
      <div
        className={`relative h-[600px] w-full ${aspectClass} rounded-2xl overflow-hidden group`}
        ref={mainRef}
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image */}
        <Image
          key={images[activeIndex]}
          src={images[activeIndex]}
          alt={`${altPrefix} ${activeIndex + 1}`}
          fill
          className="object-contain transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, 672px"
          priority={activeIndex === 0}
        />

        {/* Zoom lens */}
        {zoom && (
          <div
            className="absolute pointer-events-none border-2 border-white/70 rounded-full shadow-lg"
            style={{
              width: 80,
              height: 80,
              left: lensPos.x - 40,
              top: lensPos.y - 40,
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(1px)",
              zIndex: 20,
            }}
          />
        )}

        {/* Zoom flyout (right side on desktop, hidden on mobile) */}
        {zoom && (
          <div
            className="hidden lg:block absolute top-0 right-0 w-full h-full rounded-2xl border border-zinc-200 overflow-hidden shadow-2xl z-30 pointer-events-none"
            style={{
              width: '400px',
              height: '400px',
              backgroundImage: `url(${images[activeIndex]})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${ZOOM_FACTOR * 100}%`,
              backgroundPosition: `${flyoutPos.x}% ${flyoutPos.y}%`,
            }}
          />
        )}

        {/* Prev / Next arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronRight />
            </button>
          </>
        )}

        {/* Dot indicator (mobile) */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                aria-label={`Go to image ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === activeIndex ? "bg-zinc-800 scale-125" : "bg-zinc-400"
                }`}
              />
            ))}
          </div>
        )}

        {/* Zoom hint */}
        <span className="absolute bottom-3 right-3 text-[10px] text-zinc-400 hidden md:block pointer-events-none">
          Hover to zoom
        </span>
      </div>

      {/* ── Thumbnails ─────────────────────────────────────────────────────── */}
      {images.length > 1 && (
        <div
          ref={thumbsRef}
          className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Select image ${i + 1}`}
              className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-800 ${
                i === activeIndex
                  ? "border-zinc-800 shadow-md scale-[1.04]"
                  : "border-zinc-200 hover:border-zinc-400 opacity-70 hover:opacity-100"
              }`}
              style={{ scrollSnapAlign: "start" }}
            >
              <Image
                src={src}
                alt={`Thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}