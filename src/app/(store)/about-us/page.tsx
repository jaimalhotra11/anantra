import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | Anantara Fashion',
  description: 'Learn about Anantara Fashion — a modern women\'s fashion brand crafting elegant, comfortable clothing rooted in tradition and contemporary style.',
}

export default function AboutUsPage() {
  return (
    <div className="min-h-screen w-full mx-auto py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-10">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Us</h1>
          <p className="text-xl text-gray-600">Welcome to Anantara Fashion</p>
        </div>

        <p className="text-gray-600 leading-relaxed">
          Anantara Fashion is a modern women&apos;s fashion brand dedicated to creating elegant and
          comfortable clothing that celebrates individuality and timeless style. Established with a
          passion for premium ethnic and fusion wear, the brand brings together contemporary aesthetics
          and traditional craftsmanship to offer outfits that suit every occasion. From everyday
          sophistication to festive elegance, our collections are thoughtfully designed for women who
          appreciate quality, comfort, and refined fashion.
        </p>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Our Story</h2>
          <p className="text-gray-600 leading-relaxed">
            Founded by Mr. Harsh Mittal, Anantara Fashion was born from a vision to redefine women&apos;s
            fashion with designs that are stylish, versatile, and rooted in authenticity. What started
            as a passion for creating beautiful apparel has evolved into a trusted destination for women
            seeking fashionable and high-quality outfits. Every collection reflects our commitment to
            excellence, creativity, and customer satisfaction.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Our Vision</h2>
          <p className="text-gray-600 leading-relaxed">
            At Anantara Fashion, our vision is to become a globally recognized fashion brand that
            empowers women through thoughtfully crafted clothing. We aspire to create designs that blend
            contemporary trends with timeless elegance while building a community that values
            confidence, individuality, and self-expression. Our goal is to make premium fashion
            accessible to women who seek both sophistication and comfort.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            Our mission is to deliver exceptional fashion experiences through superior quality,
            innovative designs, and outstanding customer service. We are committed to creating garments
            that inspire confidence and celebrate femininity. By continuously evolving with changing
            trends and customer preferences, we aim to provide stylish collections that become an
            essential part of every woman&apos;s wardrobe.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Our Commitment to Premium Fabrics</h2>
          <p className="text-gray-600 leading-relaxed">
            Quality begins with the fabric, and at Anantara Fashion, we believe that the feel of a
            garment is just as important as its appearance. We carefully select premium fabrics such as
            cotton blends, rayon, viscose, muslin, and breathable natural textiles to ensure superior
            comfort and durability. Each material is chosen for its softness, elegant drape, and
            long-lasting quality, allowing our customers to enjoy clothing that feels luxurious while
            remaining practical for everyday wear. Attention to detail, precision stitching, and fine
            finishing are at the heart of every piece we create.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Design Philosophy</h2>
          <p className="text-gray-600 leading-relaxed">
            Inspired by India&apos;s rich heritage and modern fashion sensibilities, our collections
            embody the perfect balance between tradition and contemporary style. We focus on flattering
            silhouettes, sophisticated prints, vibrant colors, and versatile designs that seamlessly
            transition from casual gatherings to festive celebrations. Every outfit is thoughtfully
            crafted to make women feel confident, graceful, and effortlessly stylish.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">A Promise for the Future</h2>
          <p className="text-gray-600 leading-relaxed">
            As we continue to grow, Anantara Fashion remains committed to innovation, quality, and
            authenticity. We strive to create collections that resonate with women across generations
            while maintaining the values that define our brand. Under the leadership of Mr. Harsh
            Mittal, we continue our journey with a promise to deliver fashion that reflects elegance,
            confidence, and timeless beauty.
          </p>
        </section>

        <p className="text-center text-lg font-medium text-gray-900 pt-4">
          Anantara Fashion — Crafted with Passion, Designed with Elegance, Worn with Confidence.
        </p>
      </div>
    </div>
  )
}
