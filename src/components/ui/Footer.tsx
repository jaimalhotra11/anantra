"use client"
import React, { useState } from 'react'
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, ChevronRight, Send } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const Footer = () => {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      // Handle newsletter subscription logic here
      console.log('Newsletter subscription:', email)
      setIsSubscribed(true)
      setEmail('')
      setTimeout(() => setIsSubscribed(false), 3000)
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
              <a href="#" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Wholesale Enquiry
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  New Arrivals
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Women's Fashion
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Men's Fashion
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Accessories
                </a>
              </li>
              <li>
                <a href="#" className="text-white hover:text-white transition-colors flex items-center">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Sale
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-white" />
                <span className="text-white text-sm">
                  123 Fashion Street, Style City, SC 12345
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-white" />
                <span className="text-white text-sm">
                  +1 (555) 123-4567
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-white" />
                <span className="text-white text-sm">
                  support@anantra-fashion.com
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
              <a href="#" className="text-white/60 hover:text-white text-sm transition-colors">
                Privacy Policy
              </a>
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