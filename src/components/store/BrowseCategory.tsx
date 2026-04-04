'use client'
import Link from 'next/link'
import React from "react";

interface Category {
  name: string
  image: string
  slug: string
  description?: string
}

interface BrowseCategoryProps {
  categories: Category[]
}

export default function BrowseCategory({ categories: propCategories }: BrowseCategoryProps) {
  const baseCategories = propCategories.length > 0 ? propCategories.map(cat => ({
    title: cat.name,
    subtitle: cat.description || 'Discover our collection',
    slug: cat.slug,
    image: cat.image
  })) : [
    {
      title: "Casual",
      subtitle: "Fresh styles just in",
      slug: "casual",
      image: "https://plus.unsplash.com/premium_photo-1691622500807-6d9eeb9ea06a?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      title: "Trending",
      subtitle: "Hottest picks this season",
      slug: "trending",
      image: "https://images.unsplash.com/photo-1651507178496-7a42c1e19442?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fHRyZW5kaW5nJTIwZmFzaGlvbnxlbnwwfHwwfHx8MA%3D%3D"
    },
    {
      title: "Gym",
      subtitle: "Customer favorites",
      slug: "gym",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=entropy&auto=format"
    },
    {
      title: "Traditional",
      subtitle: "Your saved items",
      slug: "traditional",
      image: "https://images.unsplash.com/photo-1649109669757-d69d5c38c1b9?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      title: "Formals",
      subtitle: "Limited time offers",
      slug: "formals",
      image: "https://plus.unsplash.com/premium_photo-1679440413702-555ea9d539dc?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    }
  ];

  const categories = [...baseCategories]
  while (categories.length < 5) {
    categories.push(baseCategories[categories.length % baseCategories.length])
  }

  return (
    <div className="bg-(--brand-background) px-6">
      <section className="max-w-4xl mx-auto">
        <div className="text-center mb-3">
          <h2
            className="text-3xl md:text-4xl font-serif font-bold text-neutral-800 mb-4"
          >
            Browse By Category
          </h2>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
            Discover our curated collections designed for every occasion
          </p>
        </div>

        {/* Custom Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[200px] lg:auto-rows-[150px]">
          {/* Item 1 - Tall left */}
          <div className="col-span-1 md:col-span-1 lg:col-span-1 lg:row-span-2">
            <Link className="px-5 py-5" href={`/categories/${categories[0].slug}`}>
              <div
                className="relative h-full group p-5 cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-neutral-200 hover:border-(--brand-primary)/50"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={categories[0].image}
                    alt={categories[0].title}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-300" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-xl font-serif drop-shadow-lg">
                    {categories[0].title}
                  </h3>
                  <p className="text-white/90 text-sm drop-shadow-md mb-4">
                    {categories[0].subtitle}
                  </p>
                </div>
                <div className="absolute inset-0 bg-(--brand-primary)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              </div>
            </Link>
          </div>

          {/* Item 2 - Wide top right */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2 lg:row-span-1">
            <Link className="px-5 py-5" href={`/categories/${categories[1].slug}`}>
              <div
                className="relative h-full group p-5 cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-neutral-200 hover:border-(--brand-primary)/50"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={categories[1].image}
                    alt={categories[1].title}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-300" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-xl font-serif drop-shadow-lg">
                    {categories[1].title}
                  </h3>
                  <p className="text-white/90 text-sm drop-shadow-md mb-4">
                    {categories[1].subtitle}
                  </p>
                </div>
                <div className="absolute inset-0 bg-(--brand-primary)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              </div>
            </Link>
          </div>

          {/* Item 3 - Small square */}
          <div className="col-span-1 md:col-span-1 lg:col-span-1 lg:row-span-1">
            <Link className="px-5 py-5" href={`/categories/${categories[2].slug}`}>
              <div
                className="relative h-full group p-5 cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-neutral-200 hover:border-(--brand-primary)/50"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={categories[2].image}
                    alt={categories[2].title}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-300" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-xl font-serif drop-shadow-lg">
                    {categories[2].title}
                  </h3>
                  <p className="text-white/90 text-sm drop-shadow-md mb-4">
                    {categories[2].subtitle}
                  </p>
                </div>
                <div className="absolute inset-0 bg-(--brand-primary)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              </div>
            </Link>
          </div>

          {/* Item 4 - Tall right */}
          <div className="col-span-1 md:col-span-1 lg:col-span-1 lg:row-span-2">
            <Link className="px-5 py-5" href={`/categories/${categories[3].slug}`}>
              <div
                className="relative h-full group p-5 cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-neutral-200 hover:border-(--brand-primary)/50"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={categories[3].image}
                    alt={categories[3].title}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-300" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-xl font-serif drop-shadow-lg">
                    {categories[3].title}
                  </h3>
                  <p className="text-white/90 text-sm drop-shadow-md mb-4">
                    {categories[3].subtitle}
                  </p>
                </div>
                <div className="absolute inset-0 bg-(--brand-primary)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              </div>
            </Link>
          </div>

          {/* Item 5 - Wide bottom left */}
          <div className="col-span-1 md:col-span-1 lg:col-span-2 lg:row-span-1">
            <Link className="px-5 py-5" href={`/categories/${categories[4].slug}`}>
              <div
                className="relative h-full group p-5 cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 border border-neutral-200 hover:border-(--brand-primary)/50"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={categories[4].image}
                    alt={categories[4].title}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-300" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-xl font-serif drop-shadow-lg">
                    {categories[4].title}
                  </h3>
                  <p className="text-white/90 text-sm drop-shadow-md mb-4">
                    {categories[4].subtitle}
                  </p>
                </div>
                <div className="absolute inset-0 bg-(--brand-primary)/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
