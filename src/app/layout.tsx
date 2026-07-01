import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono, Lexend_Deca } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SidebarProvider } from "@/components/ui/sidebar";
import SessionProvider from "@/components/providers/SessionProvider";
import { CartProvider } from "@/contexts/CartContext";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { abeezee, aclonica } from "@/lib/fonts";

const lexendDeca = Lexend_Deca({
  variable: "--font-lexend-deca",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.anantara.in'

export const metadata: Metadata = {
  title: {
    default: "Anantara Fashion - Premium Indian Ethnic Wear",
    template: "%s | Anantara Fashion",
  },
  description:
    "Discover premium Indian ethnic wear at Anantara Fashion. Shop A-line Kurtis, Co-ord Sets, Short Kurtis, Long Kurtis, Bottoms and more. Free delivery on orders above ₹2000.",
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Anantara Fashion - Premium Indian Ethnic Wear",
    description:
      "Discover premium Indian ethnic wear at Anantara Fashion. Shop A-line Kurtis, Co-ord Sets, Short Kurtis, Long Kurtis, Bottoms and more.",
    url: BASE_URL,
    siteName: "Anantara Fashion",
    locale: "en_IN",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  const session = await auth()
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-KPXXHSVS95"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-KPXXHSVS95');
            `
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${BASE_URL}/#organization`,
                  "name": "Anantara Fashion",
                  "url": BASE_URL,
                  "logo": {
                    "@type": "ImageObject",
                    "url": `${BASE_URL}/logo.png`,
                  },
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "telephone": "+91-8527313188",
                    "email": "anantara.india1@gmail.com",
                    "contactType": "customer service",
                    "areaServed": "IN",
                  },
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "A-13, Old Double Storey, Block A, Lajpat Nagar 4, Lajpat Nagar",
                    "addressLocality": "New Delhi",
                    "postalCode": "110024",
                    "addressCountry": "IN",
                  },
                  "sameAs": [
                    "https://www.facebook.com/anantaradiaries",
                    "https://www.instagram.com/anantara_diaries",
                    "https://in.pinterest.com/anantaraindia1/",
                    "https://www.youtube.com/@anantara_diaries",
                  ],
                },
                {
                  "@type": "WebSite",
                  "@id": `${BASE_URL}/#website`,
                  "url": BASE_URL,
                  "name": "Anantara Fashion",
                  "publisher": { "@id": `${BASE_URL}/#organization` },
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                      "@type": "EntryPoint",
                      "urlTemplate": `${BASE_URL}/products?q={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${abeezee.variable} ${aclonica.variable} ${lexendDeca.variable} ${cormorantGaramond.variable} ${geistSans.variable} ${geistMono.variable} antialiased flex`}
      >
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem  
            disableTransitionOnChange
          >
            <SidebarProvider defaultOpen={defaultOpen}>
              <CartProvider>
                {children}
              </CartProvider>
            </SidebarProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
