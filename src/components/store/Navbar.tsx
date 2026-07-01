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
  const [isMobileShopOpen, setIsMobileShopOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    setIsMobileShopOpen(false)
  }

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
                <div
                  className="relative"
                  onMouseEnter={() => setIsShopDropdownOpen(true)}
                  onMouseLeave={() => setIsShopDropdownOpen(false)}
                >
                  <button
                    className="flex items-center space-x-1 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors"
                  >
                    <span className="font-medium font-sans">Shop</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {isShopDropdownOpen && (
                    <div className="absolute top-full left-0 w-48 bg-white rounded-md shadow-lg py-2 z-50">
                      <Link href="/categories/a-line-kurtis" className="block px-4 py-2 text-sm text-[var(--brand-primary)] hover:text-white hover:bg-[var(--brand-primary)] hover:bg-opacity-10 font-sans">A Line of Kurtis</Link>
                      <Link href="/categories/co-ord-sets" className="block px-4 py-2 text-sm text-[var(--brand-primary)] hover:text-white hover:bg-[var(--brand-primary)] hover:bg-opacity-10 font-sans">Co-ord Sets</Link>
                      <Link href="/categories/short-kurtis" className="block px-4 py-2 text-sm text-[var(--brand-primary)] hover:text-white hover:bg-[var(--brand-primary)] hover:bg-opacity-10 font-sans">Short Kurtis</Link>
                      <Link href="/categories/long-kurtis" className="block px-4 py-2 text-sm text-[var(--brand-primary)] hover:text-white hover:bg-[var(--brand-primary)] hover:bg-opacity-10 font-sans">Long Kurtis</Link>
                      <Link href="/categories/bottoms" className="block px-4 py-2 text-sm text-[var(--brand-primary)] hover:text-white hover:bg-[var(--brand-primary)] hover:bg-opacity-10 font-sans">Bottoms</Link>
                    </div>
                  )}
                </div>

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

        {/* Mobile Menu Backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={closeMobileMenu}
          />
        )}

        {/* Mobile Menu Drawer */}
        <div
          className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <Image src="/logo.png" alt="Anantra Fashion" width={100} height={35} className="h-8 w-auto" />
            <button
              onClick={closeMobileMenu}
              className="p-2 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Search */}
          <div className="px-4 py-3 border-b border-gray-100">
            <form className="relative" onSubmit={(e) => { handleSearch(e); closeMobileMenu() }}>
              <input
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full px-4 py-2 pr-10 border border-[--brand-primary] rounded-full focus:outline-none focus:ring-2 focus:ring-[--brand-primary] focus:border-transparent font-sans text-sm"
              />
              <button type="submit">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--brand-primary)]" />
              </button>
            </form>
          </div>

          {/* Nav Links */}
          <nav className="px-4 py-2 space-y-1 overflow-y-auto">
            {/* Shop Dropdown */}
            <div>
              <button
                onClick={() => setIsMobileShopOpen(!isMobileShopOpen)}
                className="flex items-center justify-between w-full py-3 text-left text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors font-medium font-sans"
              >
                <span>Shop</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMobileShopOpen ? 'rotate-180' : ''}`} />
              </button>
              {isMobileShopOpen && (
                <div className="pl-4 mb-2 space-y-1 border-l-2 border-[var(--brand-primary)]/20">
                  <Link href="/categories/a-line-kurtis" onClick={closeMobileMenu} className="block py-2 text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] font-sans">A Line of Kurtis</Link>
                  <Link href="/categories/co-ord-sets" onClick={closeMobileMenu} className="block py-2 text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] font-sans">Co-ord Sets</Link>
                  <Link href="/categories/short-kurtis" onClick={closeMobileMenu} className="block py-2 text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] font-sans">Short Kurtis</Link>
                  <Link href="/categories/long-kurtis" onClick={closeMobileMenu} className="block py-2 text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] font-sans">Long Kurtis</Link>
                  <Link href="/categories/bottoms" onClick={closeMobileMenu} className="block py-2 text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] font-sans">Bottoms</Link>
                </div>
              )}
            </div>

            <Link href="/products" onClick={closeMobileMenu} className="block py-3 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors font-medium font-sans border-t border-gray-100">New Arrivals</Link>
            <Link href="/categories" onClick={closeMobileMenu} className="block py-3 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors font-medium font-sans border-t border-gray-100">Categories</Link>
            <Link href="/wholesale-enquiry" onClick={closeMobileMenu} className="block py-3 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors font-medium font-sans border-t border-gray-100">Wholesale</Link>
          </nav>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
