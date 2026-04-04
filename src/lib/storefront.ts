export interface ProductListItem {
  _id: string
  title: string
  slug: string
  description: string
  status: 'draft' | 'published' | 'archived'
  category?: {
    _id: string
    name: string
    slug: string
  }
  variants: {
    _id: string
    attributes: { name: string; value: string }[]
    images: string[]
    price: number
    cuttedPrice?: number
    isActive?: boolean
    trackQuantity: boolean
    stockQuantity?: number
  }[]
}

export interface ProductCardItem {
  id: string
  name: string
  price: number
  salePrice?: number
  discount: number
  rating: number
  slug: string
  mainImage: string
  hoverImage: string
}

export interface GuestCartItem {
  productId: string
  variantId?: string
  quantity: number
  priceAtTime: number
  product: {
    title: string
    slug: string
    image: string
    variantAttributes: { name: string; value: string }[]
  }
}

const GUEST_CART_KEY = 'ananta_guest_cart'

export function toProductCardItem(product: ProductListItem): ProductCardItem {
  const defaultVariant = product.variants?.find((variant) => variant.isActive) || product.variants?.[0]
  const price = defaultVariant?.price || 0
  const salePrice = defaultVariant?.cuttedPrice

  return {
    id: product._id,
    name: product.title,
    price,
    salePrice,
    discount:
      salePrice && price > salePrice
        ? Math.round(((price - salePrice) / price) * 100)
        : 0,
    rating: 4.5,
    slug: product.slug,
    mainImage: defaultVariant?.images?.[0] || '/placeholder-product.jpg',
    hoverImage:
      defaultVariant?.images?.[1] || defaultVariant?.images?.[0] || '/placeholder-product.jpg',
  }
}

export function readGuestCart(): GuestCartItem[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeGuestCart(items: GuestCartItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
}

export function addGuestCartItem(item: GuestCartItem) {
  const currentItems = readGuestCart()
  const index = currentItems.findIndex(
    (currentItem) =>
      currentItem.productId === item.productId &&
      (currentItem.variantId || '') === (item.variantId || ''),
  )

  if (index >= 0) {
    currentItems[index].quantity += item.quantity
  } else {
    currentItems.push(item)
  }

  writeGuestCart(currentItems)
  return currentItems
}

export function updateGuestCartItem(
  productId: string,
  variantId: string | undefined,
  quantity: number,
) {
  const currentItems = readGuestCart().map((item) => {
    if (item.productId === productId && (item.variantId || '') === (variantId || '')) {
      return { ...item, quantity }
    }
    return item
  })

  writeGuestCart(currentItems)
  return currentItems
}

export function removeGuestCartItem(productId: string, variantId?: string) {
  const filteredItems = readGuestCart().filter(
    (item) =>
      !(item.productId === productId && (item.variantId || '') === (variantId || '')),
  )

  writeGuestCart(filteredItems)
  return filteredItems
}
