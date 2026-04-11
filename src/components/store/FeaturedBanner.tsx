'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Banner {
  desktopImg?: string
  mobileImg?: string
  link?: string
}

interface FeaturedBannerProps {
  banners?: Banner[]
}

const FeaturedBanner = ({ banners = [] }: FeaturedBannerProps) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const slides = banners.length > 0 ? banners.map((banner, index) => ({
    id: index + 1,
    desktopImage: banner.desktopImg || '/banners/banner1.png',
    mobileImage: banner.mobileImg || '/banners/banner1-mobile.png',
    title: '',
    subtitle: '',
    cta: '',
    link: banner.link || '#'
  })) : [
    {
      id: 1,
      desktopImage: '/banners/banner1.png',
      mobileImage: '/banners/banner1-mobile.png',
      title: 'Premium Collection',
      subtitle: 'Discover our curated selection of luxury fashion',
      cta: 'Shop Now'
    },
    {
      id: 2,
      desktopImage: '/banners/banner2.png',
      mobileImage: '/banners/banner2-mobile.png',
      title: 'Timeless Elegance',
      subtitle: 'Where sophistication meets contemporary design',
      cta: 'Explore'
    },
    {
      id: 3,
      desktopImage: '/banners/banner3.png',
      mobileImage: '/banners/banner3-mobile.png',
      title: 'Exclusive Designs',
      subtitle: 'Limited edition pieces for the discerning customer',
      cta: 'Learn More'
    }
  ]

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, slides.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setIsAutoPlaying(false)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setIsAutoPlaying(false)
  }

  return (
    <div className="relative w-full mx-auto max-w-[400px] md:max-w-[1080px] h-[600px] overflow-hidden bg-brand-primary">
      {/* Slides Container */}
      <div className="relative h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-105'
            }`}
          >
            <div className="relative w-full h-full">
              {/* Background Image */}
              <picture className="absolute inset-0">
                <source media="(min-width: 768px)" srcSet={slide.desktopImage} />
                <img 
                  src={slide.mobileImage} 
                  alt={slide.title}
                  className="w-full h-full object-cover transition-transform duration-8000 ease-out"
                  style={{
                    transform: index === currentSlide ? 'scale(1)' : 'scale(1.1)',
                  }}
                />
              </picture>
              
              {/* Overlay */}
              {/* <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" /> */}
              
              {/* Content */}
              {/* <div className="relative z-10 flex h-full items-center">
                <div className="container mx-auto px-8 md:px-12 lg:px-16">
                  <div className="max-w-2xl transform transition-all duration-700 delay-300">
                    <h1
                      className={`text-4xl md:text-5xl lg:text-6xl font-bold text-[#f2f2f2] mb-4 transition-all duration-700 ${
                        index === currentSlide
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-8 opacity-0'
                      }`}
                      style={{
                        fontFamily: 'var(--font-serif)',
                      }}
                    >
                      {slide.title}
                    </h1>
                    <p
                      className={`text-lg md:text-xl text-[#f2f2f2]/90 mb-8 transition-all duration-700 delay-200 ${
                        index === currentSlide
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-8 opacity-0'
                      }`}
                    >
                      {slide.subtitle}
                    </p>
                    <button
                      className={`inline-flex items-center px-8 py-3 bg-[#f2f2f2] text-black font-medium rounded-full hover:bg-brand-primary hover:text-[#f2f2f2] transition-all duration-300 transform hover:scale-105 ${
                        index === currentSlide
                          ? 'translate-y-0 opacity-100'
                          : 'translate-y-8 opacity-0'
                      }`}
                      style={{ transitionDelay: '400ms' }}
                    >
                      {slide.cta}
                    </button>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-[#f2f2f2]/10 backdrop-blur-sm rounded-full text-[#f2f2f2] hover:bg-[#f2f2f2]/20 transition-all duration-300 group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 transition-transform duration-300 group-hover:-translate-x-1" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-[#f2f2f2]/10 backdrop-blur-sm rounded-full text-[#f2f2f2] hover:bg-[#f2f2f2]/20 transition-all duration-300 group"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 ${
              index === currentSlide
                ? 'w-8 h-2 bg-[#f2f2f2]'
                : 'w-2 h-2 bg-[#f2f2f2]/50 hover:bg-[#f2f2f2]/75'
            } rounded-full`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      {/* <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#f2f2f2]/20 z-20">
        <div
          className="h-full bg-[#f2f2f2] transition-all duration-1000 ease-linear"
          style={{
            width: `${((currentSlide + 1) / slides.length) * 100}%`,
          }}
        />
      </div> */}
    </div>
  )
}

export default FeaturedBanner