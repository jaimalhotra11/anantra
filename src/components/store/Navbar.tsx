'use client'

import React, { useState } from 'react'
import { Search, ShoppingCart, User, Menu, X, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCart } from '@/contexts/CartContext'

const Navbar = () => {
  const router = useRouter()
  const { data: session } = useSession()
  const { itemCount } = useCart()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    router.push(`/products${params.toString() ? `?${params.toString()}` : ''}`)
  }

  return (
    <nav className="bg-[var(--brand-background)] w-full">
      {/* Desktop Navbar */}
      <div className="hidden lg:block">
        <div className=" mx-auto px-4 sm:px-6 lg:px-20">
          <div className="max-w-7xl flex items-center justify-between h-16">
            {/* Logo */}
            <a href={"/"} className="flex items-center">
              <Image
                src="/logo.png"
                alt="Anantra Fashion"
                width={130}
                height={50}
                className="h-12 w-auto"
              />
            </a>



            {/* Search Bar */}
            <div className="flex items-center space-x-5">
              {/* Navigation Links */}
              <div className="flex items-center space-x-8">
                {/* Shop Dropdown */}
                <div className="relative">
                  <button
                    onMouseEnter={() => setIsShopDropdownOpen(true)}
                    onMouseLeave={() => setIsShopDropdownOpen(false)}
                    className="flex items-center space-x-1 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors"
                  >
                    <span className="font-medium font-sans">Shop</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {isShopDropdownOpen && (
                    <div
                      onMouseEnter={() => setIsShopDropdownOpen(true)}
                      onMouseLeave={() => setIsShopDropdownOpen(false)}
                      className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-50"
                    >
                      <Link href="/categories/a-line-kurtis" className="block px-4 py-2 text-sm text-[var(--brand-primary)] hover:text-white hover:bg-[var(--brand-primary)] hover:bg-opacity-10 font-sans">A Line of Kurtis</Link>
                      <Link href="/categories/co-ord-sets" className="block px-4 py-2 text-sm text-[var(--brand-primary)] hover:text-white hover:bg-[var(--brand-primary)] hover:bg-opacity-10 font-sans">Co-ord Sets</Link>
                      <Link href="/categories/short-kurtis" className="block px-4 py-2 text-sm text-[var(--brand-primary)] hover:text-white hover:bg-[var(--brand-primary)] hover:bg-opacity-10 font-sans">Short Kurtis</Link>
                      <Link href="/categories/long-kurtis" className="block px-4 py-2 text-sm text-[var(--brand-primary)] hover:text-white hover:bg-[var(--brand-primary)] hover:bg-opacity-10 font-sans">Long Kurtis</Link>
                      <Link href="/categories/bottoms" className="block px-4 py-2 text-sm text-[var(--brand-primary)] hover:text-white hover:bg-[var(--brand-primary)] hover:bg-opacity-10 font-sans">Bottoms</Link>
                    </div>
                  )}
                </div>

                <Link href="/products" className="text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors font-medium font-sans">On Sale</Link>
                <Link href="/products" className="text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors font-medium font-sans">New Arrivals</Link>
                <Link href="/categories" className="text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors font-medium font-sans">Categories</Link>
                <Link href="/wholesale-enquiry" className="text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors font-medium font-sans">Wholesale</Link>
              </div>
              <form className="relative" onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-64 px-4 py-1 pr-10 border border-(--brand-primary) rounded-full focus:outline-none focus:ring-2 focus:ring-(--brand-primary) focus:border-transparent text-(--brand-primary) text-sm font-sans"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-(--brand-primary)" />
              </form>

              {/* Icons */}
              <div className="flex items-center gap-1">
                <Link href="/cart" className="relative p-2 text-(--brand-primary) hover:text-(--brand-primary-hover) transition-colors">
                  <ShoppingCart className="h-6 w-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </Link>
                <Link href={session?.user ? '/account' : '/auth/sign-in'} className="p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors">
                  <User className="h-6 w-6" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navbar */}
      <div className="lg:hidden">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Logo */}
            <div className="flex-1 flex ml-4">
              <Image
                src="/logo.png"
                alt="Anantra Fashion"
                width={100}
                height={35}
                className="h-8 w-auto"
              />
            </div>

            {/* Mobile Icons */}
            <div className="flex items-center space-x-2">
              <button type="button" className="p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors">
                <Search className="h-5 w-5" />
              </button>
              <Link href="/cart" className="relative p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
              <Link href={session?.user ? '/account' : '/auth/sign-in'} className="p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors">
                <User className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="bg-white border-t border-gray-200">
            <div className="px-4 py-2 space-y-1">
              <div className="py-2">
                <button className="flex items-center justify-between w-full text-left text-[--brand-primary] hover:text-[--brand-primary-hover] transition-colors font-serif">
                  <span className="font-medium font-serif">Shop</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                <div className="pl-4 mt-2 space-y-1">
                  <Link href="/categories" className="block py-2 text-sm text-[--brand-primary] hover:text-[--brand-primary-hover] font-sans">Women</Link>
                  <Link href="/categories" className="block py-2 text-sm text-[--brand-primary] hover:text-[--brand-primary-hover] font-sans">Men</Link>
                  <Link href="/categories" className="block py-2 text-sm text-[--brand-primary] hover:text-[--brand-primary-hover] font-sans">Kids</Link>
                  <Link href="/categories" className="block py-2 text-sm text-[--brand-primary] hover:text-[--brand-primary-hover] font-sans">Accessories</Link>
                </div>
              </div>

              <Link href="/products" className="block py-2 text-[--brand-primary] hover:text-[--brand-primary-hover] transition-colors font-medium font-sans">On Sale</Link>
              <Link href="/products" className="block py-2 text-[--brand-primary] hover:text-[--brand-primary-hover] transition-colors font-medium font-sans">New Arrivals</Link>
              <Link href="/categories" className="block py-2 text-[--brand-primary] hover:text-[--brand-primary-hover] transition-colors font-medium font-sans">Categories</Link>
              <Link href="/wholesale-enquiry" className="block py-2 text-[--brand-primary] hover:text-[--brand-primary-hover] transition-colors font-medium font-sans">Wholesale</Link>

              {/* Mobile Search */}
              <div className="py-2">
                <form className="relative" onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full px-4 py-2 pr-10 border border-[--brand-primary] rounded-full focus:outline-none focus:ring-2 focus:ring-[--brand-primary] focus:border-transparent font-sans"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--brand-primary)]" />
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
