'use client'
import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'

interface Testimonial {
  id: string
  name: string
  role: string
  content: string
  rating: number
  avatar: string
}

interface TestimonialSliderProps {
  testimonials: Testimonial[]
  title?: string
  description?: string
  slidesToShow?: number
  autoplay?: boolean
  autoplaySpeed?: number
  showDots?: boolean
  showArrows?: boolean
}

export default function TestimonialSlider({
  testimonials,
  title = "What Our Customers Say",
  description = "Real experiences from our valued customers",
  slidesToShow = 3,
  autoplay = true,
  autoplaySpeed = 5000,
  showDots = true,
  showArrows = true
}: TestimonialSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [slidesPerView, setSlidesPerView] = useState(3)
  const [containerWidth, setContainerWidth] = useState(0)
  const sliderRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  // Responsive slides per view and container width
  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window !== 'undefined' && trackRef.current) {
        const width = trackRef.current.offsetWidth
        setContainerWidth(width)
        
        if (window.innerWidth < 640) setSlidesPerView(1) // sm
        else if (window.innerWidth < 768) setSlidesPerView(2) // md
        else if (window.innerWidth < 1024) setSlidesPerView(2) // lg
        else setSlidesPerView(3) // xl and up
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Reset current index when slides per view changes
  useEffect(() => {
    setCurrentIndex(0)
  }, [slidesPerView])

  const totalSlides = testimonials.length
  const maxIndex = Math.max(0, totalSlides - slidesPerView)

  // Calculate item width based on slides per view
  const getItemWidth = () => {
    if (slidesPerView === 1) return containerWidth
    if (slidesPerView === 2) return containerWidth * 0.5
    return containerWidth * 0.333 // 3 slides
  }

  const itemWidth = getItemWidth()
  const gap = 16 // 1rem gap
  const slideOffset = currentIndex * (itemWidth + gap)

  useEffect(() => {
    if (autoplay && !isPaused && totalSlides > slidesPerView) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          if (prevIndex >= maxIndex) {
            return 0
          }
          return prevIndex + 1
        })
      }, autoplaySpeed)
      return () => clearInterval(interval)
    }
  }, [autoplay, isPaused, maxIndex, autoplaySpeed, slidesPerView, totalSlides])

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex <= 0) {
        return maxIndex
      }
      return prevIndex - 1
    })
  }

  const handleNext = () => {
    setCurrentIndex((prevIndex) => {
      if (prevIndex >= maxIndex) {
        return 0
      }
      return prevIndex + 1
    })
  }

  const handleDotClick = (index: number) => {
    setCurrentIndex(index)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      handlePrev()
    } else if (e.key === 'ArrowRight') {
      handleNext()
    }
  }

  return (
    <div className="bg-(--brand-background) py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-neutral-800 mb-2">
            {title}
          </h2>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        {/* Slider Container */}
        <div 
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label="Testimonials carousel"
        >
          {/* Slider Track */}
          <div className="overflow-hidden rounded-lg">
            <div 
              ref={trackRef}
              className="flex transition-transform duration-500 ease-in-out gap-4"
              style={{
                transform: `translateX(-${slideOffset}px)`
              }}
            >
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="w-full sm:w-1/2 lg:w-1/2 xl:w-1/3 shrink-0 px-3 flex justify-center sm:justify-start"
                >
                  <div className="border border-(--brand-primary) rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-4 h-full flex flex-col w-full max-w-md">
                    {/* Quote Icon */}
                    <div className="mb-4">
                      <Quote className="w-8 h-8 text-(--brand-primary)/20" />
                    </div>

                    {/* Content */}
                    <p className="text-neutral-700 text-sm mb-1 grow italic leading-relaxed">
                      "{testimonial.content}"
                    </p>

                    {/* Rating */}
                    <div className="flex mb-4">
                      {[...Array(5)].map((_, index) => (
                        <Star
                          key={index}
                          className={`w-4 h-4 ${
                            index < testimonial.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Author */}
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full overflow-hidden mr-3 flex-shrink-0">
                        <img
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-800 text-sm">
                          {testimonial.name}
                        </h4>
                        <p className="text-neutral-600 text-xs">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          {showArrows && totalSlides > slidesPerView && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-(--brand-primary) hover:text-white group"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-(--brand-primary) hover:text-white group"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Dots */}
          {showDots && totalSlides > slidesPerView && (
            <div className="flex justify-center mt-6 space-x-2">
              {[...Array(maxIndex + 1)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? 'bg-(--brand-primary) w-8'
                      : 'bg-neutral-300 hover:bg-neutral-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
