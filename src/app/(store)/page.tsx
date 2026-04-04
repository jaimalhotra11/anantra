import AnnouncementBar from '@/components/store/AnnouncementBar'
import Navbar from '@/components/store/Navbar'
import FeaturedProductCardSlider from '@/components/store/FeaturedProductSlider'
import BrowseCategory from '@/components/store/BrowseCategory'
import TestimonialSlider from '@/components/store/TestimonialSlider'
import FeaturedBanner from '@/components/store/FeaturedBanner'
import Footer from '@/components/ui/Footer'

interface Product {
  id: string
  name: string
  price: number
  salePrice?: number
  discount: number
  rating: number
  slug: string
  mainImage: string
  hoverImage: string
  category: string
  categorySlug: string
  services: string[]
}

interface Testimonial {
  id: string
  name: string
  role: string
  content: string
  rating: number
  avatar: string
}

interface Category {
  name: string
  image: string
  slug: string
  description?: string
}

interface HomepageData {
  heroBanners: any[]
  newArrivals: Product[]
  topSelling: Product[]
  categories: Category[]
  testimonials: {
    title: string
    description: string
    reviews: Testimonial[]
  }
}

async function getHomepageData(): Promise<HomepageData | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/homepage`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      console.error('Failed to fetch homepage data:', response.status)
      return null
    }
    
    const result = await response.json()
    return result.success ? result.data : null
  } catch (error) {
    console.error('Error fetching homepage data:', error)
    return null
  }
}

const Homepage = async () => {
  const data = await getHomepageData()

  if (!data) {
    return (
      <div className='w-full min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-red-600 mb-2'>Unable to Load Homepage</h2>
          <p className='text-gray-600'>Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  return (
    <div className='w-full'>
      <FeaturedBanner banners={data.heroBanners} />
      <div className='px-4 py-4'>
        <FeaturedProductCardSlider
          products={data.newArrivals}
          title='New Arrivals'
          description='Discover our latest collection'
          collectionSlug='new-arrivals'
          autoplay={true}
          autoplaySpeed={4000}
          showDots={true}
          showArrows={true}
        />
      </div>
      <div className='px-4 py-3'>
        <hr className='border-(--brand-primary) h-1' />
      </div>
      <div className='px-4 py-4'>
        <FeaturedProductCardSlider
          products={data.topSelling}
          title='Top Selling'
          description='Discover our best selling products'
          collectionSlug='top-selling'
          autoplay={true}
          autoplaySpeed={4000}
          showDots={true}
          showArrows={true}
        />
      </div>
      <BrowseCategory categories={data.categories} />
      <TestimonialSlider
        testimonials={data.testimonials.reviews}
        title={data.testimonials.title}
        description={data.testimonials.description}
        slidesToShow={3}
        autoplay={true}
        autoplaySpeed={5000}
        showDots={true}
        showArrows={true}
      />
    </div>
  )
}

export default Homepage