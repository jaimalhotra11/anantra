"use client"
import React, { useState } from 'react'
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, ChevronRight, Twitter } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const PinterestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
)

const Footer = () => {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const result = await res.json()
      if (result.success) {
        setIsSubscribed(true)
        setEmail('')
        setTimeout(() => setIsSubscribed(false), 3000)
      }
    } catch {
      // silently fail — subscription email issue shouldn't break the page
    }
  }

  return (
    <footer className="bg-[#5F613A] w-full text-white mt-10">
      <div className='-mt-8 w-full max-w-5xl mx-auto px-4 relative z-10'>
        <div className='bg-black rounded-3xl shadow-2xl p-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-8'>
          <div className='text-center md:text-left font-serif shrink-0'>
            <p className='text-white text-2xl font-bold mb-1 uppercase'>Stay Upto Date About</p>
            <p className='text-white text-2xl font-bold uppercase'>Our Latest Offers</p>
          </div>
          
          <form onSubmit={handleSubscribe} className='flex flex-col sm:flex-row gap-3 w-full md:w-auto'>
            <div className='relative w-full flex flex-col items-center justify-center sm:w-auto'>
              <Mail className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' />
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Enter your email address'
                className='w-full pl-10 pr-4 py-3 rounded-full bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all'
                required
              />
            </div>
            <button
              type='submit'
              className='w-full sm:w-auto px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors whitespace-nowrap'
            >
              Subscribe to Newsletter
            </button>
          </form>
          
          {isSubscribed && (
            <div className='absolute -bottom-10 left-1/2 -translate-x-1/2 p-2 bg-green-500/20 border border-green-400/30 rounded-lg text-center'>
              <p className='text-green-100 text-sm'>Thank you for subscribing!</p>
            </div>
          )}
        </div>
      </div>
      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Link href="/" className="w-20 rounded-lg flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="ANANTRA Fashion"
                  width={150}
                  height={50}
                  className="object-contain"
                />
              </Link>
            </div>
            <p className="white text-sm leading-relaxed">
              Your trusted destination for premium fashion and style. Discover the latest trends and timeless classics.
            </p>
            <div className="flex space-x-3">
              <a href="https://www.facebook.com/anantaradiaries" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/anantara_diaries" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://in.pinterest.com/anantaraindia1/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <PinterestIcon className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@anantara_diaries" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="https://x.com/anantara_diary1" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about-us" className="text-white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  About Us
                </Link>
              </li>
              <li>
                <a href="#" className="white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Contact Us
                </a>
              </li>
              <li>
                <Link href="/privacy-policy" className="white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/return-exchange-policy" className="white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Return & Exchange Policy
                </Link>
              </li>
              <li>
                <Link href="/wholesale-enquiry" className="text-white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Wholesale Enquiry
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/categories/a-line-kurtis" className="text-white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  A-Line Kurtis
                </Link>
              </li>
              <li>
                <Link href="/categories/co-ord-sets" className="text-white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Co-ord Sets
                </Link>
              </li>
              <li>
                <Link href="/categories/bottoms" className="text-white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Bottoms
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-white shrink-0 mt-0.5" />
                <span className="text-white text-sm">
                  A-13, Old Double Storey, Block A, Lajpat Nagar 4, Lajpat Nagar, New Delhi-110024
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-white" />
                <span className="text-white text-sm">
                  +91-8527313188
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-white" />
                <span className="text-white text-sm">
                  anantara.india1@gmail.com
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-white/60 text-sm">
              2026 ANANTRA Fashion. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <Link href="/privacy-policy" className="text-white/60 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer