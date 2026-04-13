import WholesaleEnquiryForm from '@/components/wholesale/WholesaleEnquiryForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Wholesale Enquiry | Anantra Fashion',
  description: 'Submit your wholesale enquiry to join our exclusive wholesale program and get access to premium fashion products at competitive prices.',
}

export default function WholesaleEnquiryPage() {
  return (
    <div className="min-h-screen w-full mx-auto py-12">
      <div className="mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Wholesale Partnership Program
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join our exclusive wholesale program and gain access to premium fashion products 
            at competitive prices. We partner with retailers, boutiques, and distributors 
            worldwide.
          </p>
        </div>
        
        <WholesaleEnquiryForm />
        
        <div className="mt-12 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Why Partner With Us?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Competitive Pricing</h3>
                <p className="text-gray-600">
                  Get access to exclusive wholesale pricing and volume discounts
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Premium Quality</h3>
                <p className="text-gray-600">
                  Source from our curated collection of high-quality fashion products
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Dedicated Support</h3>
                <p className="text-gray-600">
                  Work with our team for personalized service and support
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
