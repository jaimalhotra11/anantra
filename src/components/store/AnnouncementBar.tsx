'use client'

import React, { useState, useEffect } from 'react'
import { X, ShoppingBag, Truck, Sparkles } from 'lucide-react'

const AnnouncementBar = () => {
  const [isVisible, setIsVisible] = useState(true)
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0)

  const announcements = [
    {
      icon: <Sparkles className="h-4 w-4" />,
      text: "New Spring Collection Now Available - Up to 30% Off!",
      link: "#"
    },
    {
      icon: <Truck className="h-4 w-4" />,
      text: "Free Shipping on Orders Over $50",
      link: "#"
    },
    {
      icon: <ShoppingBag className="h-4 w-4" />,
      text: "Flash Sale: Limited Time Offers",
      link: "#"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAnnouncement((prev) => (prev + 1) % announcements.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  if (!isVisible) return null

  return (
    <div className="bg-[var(--brand-primary)] text-white w-full relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-10">
          {/* Announcement Content */}
          <div className="flex-1 flex items-center justify-center space-x-3">
            <div className="flex items-center space-x-2 animate-pulse">
              {announcements[currentAnnouncement].icon}
              <span className="text-sm font-sans font-medium whitespace-nowrap">
                {announcements[currentAnnouncement].text}
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-background hover:text-(--brand-primary) hover:bg-opacity-20 rounded-full transition-colors duration-200"
            aria-label="Close announcement"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white bg-opacity-30">
        <div 
          className="h-full bg-white transition-all duration-5000 ease-linear"
          style={{ 
            width: `${((currentAnnouncement + 1) / announcements.length) * 100}%` 
          }}
        />
      </div>
    </div>
  )
}

export default AnnouncementBar