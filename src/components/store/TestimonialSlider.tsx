'use client'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Autoplay, Pagination } from 'swiper/modules'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'
// @ts-ignore
import 'swiper/css'
// @ts-ignore
import 'swiper/css/navigation'
// @ts-ignore
import 'swiper/css/pagination'

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
  autoplay = true,
  autoplaySpeed = 5000,
  showDots = true,
  showArrows = true
}: TestimonialSliderProps) {
  if (!testimonials || testimonials.length === 0) {
    return null
  }

  const canLoop = testimonials.length > 1

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
        <div className="relative group">
          <Swiper
            modules={[Navigation, Autoplay, Pagination]}
            spaceBetween={16}
            slidesPerView={1}
            loop={canLoop}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 16
              },
              1280: {
                slidesPerView: 3,
                spaceBetween: 16
              }
            }}
            autoplay={autoplay && canLoop ? {
              delay: autoplaySpeed,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            } : false}
            pagination={showDots && canLoop ? {
              clickable: true,
              dynamicBullets: true,
              el: '.testimonial-swiper-pagination'
            } : false}
            navigation={{
              nextEl: '.testimonial-swiper-button-next',
              prevEl: '.testimonial-swiper-button-prev',
            }}
            className="pb-12!"
          >
            {testimonials.map((testimonial) => (
              <SwiperSlide key={testimonial.id} className="flex justify-center h-auto">
                <div className="border border-(--brand-primary) rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-4 h-full flex flex-col w-full max-w-md">
                  {/* Quote Icon */}
                  <div className="mb-4">
                    <Quote className="w-8 h-8 text-(--brand-primary)/20" />
                  </div>

                  {/* Content */}
                  <p className="text-neutral-700 text-sm mb-1 grow italic leading-relaxed">
                    &ldquo;{testimonial.content}&rdquo;
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
                    <div className="w-12 h-12 rounded-full overflow-hidden mr-3 shrink-0">
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
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Navigation Arrows */}
          {showArrows && canLoop && (
            <>
              <button
                className="testimonial-swiper-button-prev absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-5 h-5 text-neutral-900" />
              </button>
              <button
                className="testimonial-swiper-button-next absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-5 h-5 text-neutral-900" />
              </button>
            </>
          )}

          {/* Dots */}
          {showDots && canLoop && (
            <div className="testimonial-swiper-pagination bottom-0! mt-6!"></div>
          )}
        </div>
      </div>
    </div>
  )
}
