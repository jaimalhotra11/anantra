import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Anantara Fashion',
  description: 'Read how Anantara Fashion collects, uses, and protects your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen w-full mx-auto py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        </div>

        <p className="text-gray-600 leading-relaxed">
          At Anantara Fashion, we value your privacy and are committed to protecting your personal
          information. This Privacy Policy explains how we collect, use, store, and safeguard your
          information when you visit and make purchases through our website, www.anantarafashion.com.
          By using our website, you agree to the terms outlined in this policy.
        </p>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
          <p className="text-gray-600 mb-3">When you interact with our website, we may collect the following information:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Name and contact details (email address, phone number, shipping and billing address).</li>
            <li>Account information when you register with us.</li>
            <li>Order and transaction details.</li>
            <li>Payment information processed securely through third-party payment gateways.</li>
            <li>Device information such as IP address, browser type, and browsing behavior.</li>
            <li>Information you voluntarily provide through customer support requests, reviews, or contact forms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
          <p className="text-gray-600 mb-3">The information collected is used to:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Process and fulfill your orders.</li>
            <li>Provide customer support and respond to inquiries.</li>
            <li>Improve our products, website, and services.</li>
            <li>Send order confirmations, shipping updates, and service-related communications.</li>
            <li>Inform you about new collections, promotions, and offers (with your consent).</li>
            <li>Prevent fraudulent transactions and maintain website security.</li>
            <li>Comply with legal and regulatory requirements.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Payment Security</h2>
          <p className="text-gray-600 leading-relaxed">
            Anantara Fashion does not store your complete debit card, credit card, or banking details.
            Payments are processed through trusted and secure payment service providers using
            industry-standard encryption technologies to protect your financial information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Cookies and Tracking Technologies</h2>
          <p className="text-gray-600 mb-3">Our website may use cookies and similar technologies to:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Enhance your browsing experience.</li>
            <li>Remember your preferences and shopping cart details.</li>
            <li>Analyze website traffic and performance.</li>
            <li>Deliver personalized content and promotional offers.</li>
          </ul>
          <p className="text-gray-600 mt-3">
            You may disable cookies through your browser settings, although some website features may
            not function properly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Sharing of Information</h2>
          <p className="text-gray-600 mb-3">
            We respect your privacy and do not sell, rent, or trade your personal information.
            Information may only be shared with:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Shipping and logistics partners for order delivery.</li>
            <li>Payment gateway providers for transaction processing.</li>
            <li>Technology and service providers assisting in website operations.</li>
            <li>Government authorities or legal bodies when required by applicable laws.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Data Security</h2>
          <p className="text-gray-600 leading-relaxed">
            We implement appropriate technical and organizational measures to protect your information
            against unauthorized access, misuse, loss, or disclosure. While we strive to maintain the
            highest level of security, no method of electronic transmission or storage can guarantee
            absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Third-Party Links</h2>
          <p className="text-gray-600 leading-relaxed">
            Our website may contain links to third-party websites or services. Anantara Fashion is not
            responsible for the privacy practices or content of external websites. We encourage users to
            review the privacy policies of such websites before providing personal information.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Your Rights</h2>
          <p className="text-gray-600 mb-3">You have the right to:</p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Access and review your personal information.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your information, subject to legal obligations.</li>
            <li>Opt out of promotional emails and marketing communications at any time.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Changes to This Privacy Policy</h2>
          <p className="text-gray-600 leading-relaxed">
            We reserve the right to update or modify this Privacy Policy at any time. Any changes will
            be posted on this page with an updated revision date. Continued use of the website after
            such changes constitutes acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            If you have any questions regarding this Privacy Policy or the handling of your personal
            information, please contact us through the details provided on our website.
          </p>
        </section>

        <div className="text-center text-gray-900 font-medium pt-4">
          <p>Anantara Fashion</p>
          <p className="text-gray-600 font-normal">Premium Women&apos;s Fashion Crafted with Elegance and Comfort</p>
          <p className="text-gray-600 font-normal">Website: www.anantarafashion.com</p>
        </div>
      </div>
    </div>
  )
}
