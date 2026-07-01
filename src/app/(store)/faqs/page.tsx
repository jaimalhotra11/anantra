import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQs | Anantara Fashion',
  description: 'Frequently asked questions about orders, shipping, returns, exchanges, payments, and more at Anantara Fashion.',
}

const faqs = [
  {
    q: 'How do I place an order?',
    a: 'Shopping at Anantara Fashion is simple. Browse your favorite styles, select the desired size, add the item to your cart, and proceed to checkout. Complete your payment, and your order will be confirmed instantly.',
  },
  {
    q: 'Do I need an account to place an order?',
    a: 'No, you can place an order as a guest. However, creating an account allows you to track orders, save addresses, and enjoy a faster checkout experience.',
  },
  {
    q: 'How can I track my order?',
    a: 'Once your order is shipped, you will receive a confirmation email or message containing your tracking details. You can use these details to monitor your shipment status.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Orders are usually processed within 1–2 business days. Delivery timelines may vary depending on your location, but most orders are delivered within 3–7 business days.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept secure payments through UPI, Credit Cards, Debit Cards, Net Banking, Wallets, and Cash on Delivery (where available).',
  },
  {
    q: 'Do you offer Cash on Delivery (COD)?',
    a: 'Yes, Cash on Delivery is available for selected locations across India.',
  },
  {
    q: 'Can I cancel my order?',
    a: 'Yes. Orders can be cancelled before they are dispatched. Once an order has been shipped, cancellation requests cannot be accepted.',
  },
  {
    q: 'What is your return policy?',
    a: 'We offer a 7-day return policy from the date of delivery. Products must be unused, unwashed, and returned with original tags and packaging intact.',
  },
  {
    q: 'Can I exchange a product?',
    a: 'Yes. We offer exchanges for size issues, damaged items, or incorrect products received. Exchange requests must be raised within 7 days of delivery and are subject to stock availability.',
  },
  {
    q: 'How long does it take to receive a refund?',
    a: 'Once the returned product is received and passes quality inspection, refunds are processed within 5–7 business days to the original payment method.',
  },
  {
    q: 'What should I do if I receive a damaged or wrong item?',
    a: 'Please contact our customer support team within 48 hours of delivery and share photographs of the product along with your order details. We will arrange a replacement or refund after verification.',
  },
  {
    q: 'How do I know which size will fit me?',
    a: 'Every product page includes a detailed size guide to help you select the right fit. If you need additional assistance, our support team will be happy to help.',
  },
  {
    q: 'Are the colors exactly the same as shown in the pictures?',
    a: 'We strive to display product colors as accurately as possible. However, slight variations may occur due to screen settings, lighting conditions, and photography.',
  },
  {
    q: 'What fabrics are used in Anantara Fashion products?',
    a: 'At Anantara Fashion, we carefully select premium-quality fabrics including rayon, cotton blends, viscose, muslin, and other breathable materials to ensure superior comfort, durability, and elegance.',
  },
  {
    q: 'Are sold-out products restocked?',
    a: 'Popular styles may be restocked depending on demand and availability. We recommend following our latest collections and updates for new arrivals and restocks.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'Currently, Anantara Fashion primarily serves customers within India. International shipping availability may be introduced in the future.',
  },
  {
    q: 'Is my payment information secure?',
    a: 'Yes. All transactions are processed through trusted and secure payment gateways using industry-standard encryption to protect your personal and financial information.',
  },
  {
    q: 'How can I contact customer support?',
    a: 'You can reach our support team through the contact details provided on our website. We are committed to assisting you with any queries related to orders, returns, exchanges, or products.',
  },
  {
    q: 'Are sale items eligible for return or exchange?',
    a: 'Products purchased during special promotions, clearance sales, or marked as "Final Sale" may not be eligible for return or exchange. Please refer to the product page for specific details.',
  },
  {
    q: 'Why choose Anantara Fashion?',
    a: 'Anantara Fashion is dedicated to creating premium women\'s clothing that combines contemporary elegance with exceptional comfort. Our focus on quality fabrics, thoughtful designs, and customer satisfaction ensures that every outfit is crafted to make you feel confident and beautiful.',
  },
]

export default function FaqsPage() {
  return (
    <div className="min-h-screen w-full mx-auto py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600">Everything you need to know about shopping with us</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                {index + 1}. {faq.q}
              </h3>
              <p className="text-gray-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
