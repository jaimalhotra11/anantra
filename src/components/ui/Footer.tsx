import React from 'react'
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="bg-[#5F613A] w-full text-white">
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
              2024 ANANTRA Fashion. All rights reserved.
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