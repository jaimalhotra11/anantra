import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Return & Exchange Policy | Anantara Fashion',
  description: 'Learn about Anantara Fashion\'s 7-day return and exchange policy, eligibility, process, and refund timelines.',
}

export default function ReturnExchangePolicyPage() {
  return (
    <div className="min-h-screen w-full mx-auto py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Return & Exchange Policy</h1>
        </div>

        <p className="text-gray-600 leading-relaxed">
          At Anantara Fashion, customer satisfaction is our priority. We strive to deliver
          premium-quality products and ensure a hassle-free shopping experience. If you are not
          completely satisfied with your purchase, we offer a 7-day return and exchange policy subject
          to the terms and conditions mentioned below.
        </p>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Return & Exchange Window</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Customers can request a return or exchange within 7 days from the date of delivery.</li>
            <li>Requests made after 7 days of receiving the order will not be accepted.</li>
            <li>Products purchased during special sales, clearance events, or marked as non-returnable are not eligible for return or exchange.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Eligibility for Returns & Exchanges</h2>
          <p className="text-gray-600 mb-3">To qualify for a return or exchange, the item must:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Be unused, unwashed, and unworn.</li>
            <li>Have all original tags, labels, and packaging intact.</li>
            <li>Be in the same condition as received.</li>
            <li>Be free from perfume, stains, makeup marks, or any alterations.</li>
            <li>Be accompanied by proof of purchase or order confirmation.</li>
          </ul>
          <p className="text-gray-600 mt-3">Products failing to meet these conditions may not be accepted.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Exchange Policy</h2>
          <p className="text-gray-600 mb-3">We offer exchanges for:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Size-related issues.</li>
            <li>Defective or damaged products.</li>
            <li>Incorrect items received.</li>
          </ul>
          <p className="text-gray-600 mt-3">
            Exchanges are subject to stock availability. In case the requested size or product is
            unavailable, customers may opt for store credit or an alternative product of equal value.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Return Process</h2>
          <p className="text-gray-600 mb-3">To initiate a return or exchange:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Contact our customer support team within 7 days of delivery.</li>
            <li>Share your order number along with images of the product, if applicable.</li>
            <li>Once approved, our team will arrange a reverse pickup where service is available.</li>
            <li>In locations where reverse pickup is unavailable, customers may be required to self-ship the product to our warehouse.</li>
          </ul>
          <p className="text-gray-600 mt-3">Products sent without prior approval will not be accepted.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Refund Policy</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Refunds will be processed only after the returned item has been received and passed a quality inspection.</li>
            <li>Approved refunds will be credited to the original payment method within 5–7 business days.</li>
            <li>Shipping charges, COD charges, and convenience fees are non-refundable.</li>
            <li>Depending on your bank or payment provider, it may take additional time for the amount to reflect in your account.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Damaged, Defective, or Wrong Products</h2>
          <p className="text-gray-600 mb-3">If you receive:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>A damaged product,</li>
            <li>A defective item, or</li>
            <li>An incorrect order,</li>
          </ul>
          <p className="text-gray-600 mt-3">
            please contact us within 48 hours of delivery with clear images and your order details. Upon
            verification, we will arrange a replacement or issue a refund, as applicable.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Non-Returnable Items</h2>
          <p className="text-gray-600 mb-3">The following items are not eligible for return or exchange:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Customized or made-to-order products.</li>
            <li>Products purchased during clearance or final sale.</li>
            <li>Items returned without original tags or packaging.</li>
            <li>Products that have been washed, used, altered, or damaged after delivery.</li>
            <li>Gift cards and promotional items.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Cancellation Policy</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Orders can be cancelled only before they are dispatched.</li>
            <li>Once an order has been shipped, it cannot be cancelled.</li>
            <li>Refunds for prepaid cancelled orders will be processed within 5–7 business days.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            For any questions regarding returns, exchanges, or refunds, please contact our customer
            support team through the details provided on www.anantarafashion.com.
          </p>
        </section>

        <div className="text-center text-gray-900 font-medium pt-4">
          <p>Anantara Fashion</p>
          <p className="text-gray-600 font-normal">Premium Women&apos;s Fashion Crafted with Elegance and Comfort</p>
          <p className="text-gray-600 font-normal mt-2">
            Thank you for shopping with Anantara Fashion. We appreciate your trust and are committed to
            providing you with a seamless and delightful shopping experience.
          </p>
        </div>
      </div>
    </div>
  )
}
