'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, User, ShoppingBag, MapPin, LogOut, Settings, Package, CreditCard, TrendingUp } from 'lucide-react'

interface Profile {
  fullName: string
  email: string
  phone: string
  avatar?: string
  role: string
  isVerified: boolean
}

interface Order {
  _id: string
  totalAmount: number
  orderStatus: string
  paymentStatus: string
  createdAt: string
  items: { title: string; quantity: number }[]
}

interface Address {
  _id: string
  label?: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  country: string
  postalCode: string
  isDefault?: boolean
}

const initialAddress = {
  label: 'Home',
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
  isDefault: false,
}

const AccountPage = () => {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(initialAddress)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [profileRes, ordersRes, addressesRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/user/orders'),
        fetch('/api/user/addresses'),
      ])

      const [profileJson, ordersJson, addressesJson] = await Promise.all([
        profileRes.json(),
        ordersRes.json(),
        addressesRes.json(),
      ])

      if (!profileJson.success) throw new Error(profileJson.error || 'Failed to load profile')
      if (!ordersJson.success) throw new Error(ordersJson.error || 'Failed to load orders')
      if (!addressesJson.success) throw new Error(addressesJson.error || 'Failed to load addresses')

      setProfile(profileJson.data)
      setOrders(ordersJson.data)
      setAddresses(addressesJson.data)
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) {
      router.push('/auth/sign-in?callbackUrl=/account')
      return
    }

    loadDashboardData()
  }, [session?.user, status, router])

  const totalSpent = useMemo(
    () => orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    [orders],
  )

  const addAddress = async () => {
    try {
      const response = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Failed to add address')
      setAddresses(result.data)
      setForm(initialAddress)
      // Reload dashboard data to show updated information
      await loadDashboardData()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to add address')
    }
  }

  const deleteAddress = async (addressId: string) => {
    try {
      const response = await fetch(`/api/user/addresses/${addressId}`, { method: 'DELETE' })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Failed to delete address')
      setAddresses(result.data)
      // Reload dashboard data to show updated information
      await loadDashboardData()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete address')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className='min-h-screen w-full bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center'>
        <div className='text-center space-y-4'>
          <div className='inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl'>
            <Loader2 className='h-8 w-8 animate-spin text-primary-foreground' />
          </div>
          <div className='space-y-2'>
            <h2 className='text-lg font-semibold text-foreground'>Loading your dashboard...</h2>
            <p className='text-sm text-muted-foreground'>Please wait while we prepare your account</p>
          </div>
        </div>
      </div>
    )
  }

  if (!session?.user) return null

  return (
    <div className='min-h-screen w-full bg-gradient-to-br from-primary/5 via-background to-secondary/5'>
      {/* Enhanced Header */}
      <div className='bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10'>
        <div className='mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='inline-flex items-center justify-center w-10 h-10 bg-primary rounded-lg'>
                <User className='h-5 w-5 text-primary-foreground' />
              </div>
              <div>
                <h1 className='text-2xl font-bold text-foreground'>My Account</h1>
                <p className='text-sm text-muted-foreground'>Welcome back, {profile?.fullName || 'User'}</p>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })} 
                className='inline-flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 rounded-lg transition-all duration-200'
              >
                <LogOut className='h-4 w-4' />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8'>

        {error && (
          <div className='bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm flex items-center gap-2'>
            <Settings className='h-4 w-4' />
            {error}
          </div>
        )}

        {/* Enhanced Stats Cards */}
        <section className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-200'>
            <div className='flex items-center justify-between mb-4'>
              <div className='inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg'>
                <ShoppingBag className='h-6 w-6 text-primary' />
              </div>
              <TrendingUp className='h-4 w-4 text-green-500' />
            </div>
            <p className='text-sm text-muted-foreground mb-1'>Total orders</p>
            <p className='text-3xl font-bold text-foreground'>{orders.length}</p>
          </div>
          
          <div className='bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-200'>
            <div className='flex items-center justify-between mb-4'>
              <div className='inline-flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-lg'>
                <CreditCard className='h-6 w-6 text-green-500' />
              </div>
              <TrendingUp className='h-4 w-4 text-green-500' />
            </div>
            <p className='text-sm text-muted-foreground mb-1'>Total spent</p>
            <p className='text-3xl font-bold text-foreground'>₹{totalSpent.toFixed(2)}</p>
          </div>
          
          <div className='bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-200'>
            <div className='flex items-center justify-between mb-4'>
              <div className='inline-flex items-center justify-center w-12 h-12 bg-blue-500/10 rounded-lg'>
                <MapPin className='h-6 w-6 text-blue-500' />
              </div>
              <Package className='h-4 w-4 text-blue-500' />
            </div>
            <p className='text-sm text-muted-foreground mb-1'>Saved addresses</p>
            <p className='text-3xl font-bold text-foreground'>{addresses.length}</p>
          </div>
        </section>

        {/* Enhanced Profile Section */}
        <section className='bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 space-y-6'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold text-foreground flex items-center gap-2'>
              <User className='h-5 w-5 text-primary' />
              Profile Information
            </h2>
          </div>
          {profile ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Full Name</p>
                <p className='font-medium text-foreground'>{profile.fullName}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Email Address</p>
                <p className='font-medium text-foreground'>{profile.email}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Phone Number</p>
                <p className='font-medium text-foreground'>{profile.phone}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Account Status</p>
                <div className='flex items-center gap-2'>
                  <div className={`w-2 h-2 rounded-full ${profile.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <p className='font-medium text-foreground'>
                    {profile.isVerified ? 'Verified' : 'Pending Verification'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className='text-center py-8 text-muted-foreground'>
              <User className='h-12 w-12 mx-auto mb-2 opacity-50' />
              <p>No profile information available.</p>
            </div>
          )}
        </section>

        {/* Enhanced Orders Section */}
        <section className='bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 space-y-6'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold text-foreground flex items-center gap-2'>
              <Package className='h-5 w-5 text-primary' />
              Recent Orders
            </h2>
            <button className='text-primary hover:text-primary/80 text-sm font-medium transition-colors'>
              View All Orders
            </button>
          </div>
          {orders.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              <ShoppingBag className='h-12 w-12 mx-auto mb-2 opacity-50' />
              <p>No orders found yet.</p>
              <p className='text-sm'>Start shopping to see your orders here!</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {orders.slice(0, 10).map((order) => (
                <div key={order._id} className='bg-background/50 border border-border/50 rounded-lg p-4 hover:shadow-md transition-all duration-200'>
                  <div className='flex flex-wrap justify-between items-start gap-4'>
                    <div className='space-y-1'>
                      <p className='font-medium text-foreground'>Order #{order._id.slice(-6)}</p>
                      <p className='text-sm text-muted-foreground'>{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className='text-right space-y-1'>
                      <p className='font-semibold text-foreground'>₹{order.totalAmount?.toFixed(2)}</p>
                      <div className='flex items-center gap-2 text-sm'>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.orderStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {order.orderStatus}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Enhanced Addresses Section */}
        <section className='bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6 space-y-6'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold text-foreground flex items-center gap-2'>
              <MapPin className='h-5 w-5 text-primary' />
              Delivery Addresses
            </h2>
            <button className='text-primary hover:text-primary/80 text-sm font-medium transition-colors'>
              Manage Addresses
            </button>
          </div>

          {/* Add Address Form */}
          <div className='bg-background/50 border border-border/50 rounded-lg p-4 space-y-4'>
            <h3 className='font-medium text-foreground'>Add New Address</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <input 
                placeholder='Label (e.g., Home, Work)' 
                value={form.label} 
                onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))} 
                className='border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200' 
              />
              <input 
                placeholder='Full name' 
                value={form.fullName} 
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} 
                className='border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200' 
              />
              <input 
                placeholder='Phone number' 
                value={form.phone} 
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} 
                className='border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200' 
              />
              <input 
                placeholder='Address line 1' 
                value={form.addressLine1} 
                onChange={(event) => setForm((prev) => ({ ...prev, addressLine1: event.target.value }))} 
                className='border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200' 
              />
              <input 
                placeholder='Address line 2 (optional)' 
                value={form.addressLine2} 
                onChange={(event) => setForm((prev) => ({ ...prev, addressLine2: event.target.value }))} 
                className='border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200' 
              />
              <input 
                placeholder='City' 
                value={form.city} 
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} 
                className='border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200' 
              />
              <input 
                placeholder='State' 
                value={form.state} 
                onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))} 
                className='border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200' 
              />
              <input 
                placeholder='Country' 
                value={form.country} 
                onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} 
                className='border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200' 
              />
              <input 
                placeholder='Postal code' 
                value={form.postalCode} 
                onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))} 
                className='border border-border rounded-lg px-3 py-2 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200' 
              />
            </div>
            <button 
              onClick={addAddress} 
              className='px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl'
            >
              Add Address
            </button>
          </div>

          {/* Existing Addresses */}
          <div className='space-y-3'>
            {addresses.map((address) => (
              <div key={address._id} className='bg-background/50 border border-border/50 rounded-lg p-4 hover:shadow-md transition-all duration-200'>
                <div className='flex justify-between gap-4'>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium text-foreground'>{address.label || 'Address'}</p>
                      {address.isDefault && (
                        <span className='px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium'>
                          Default
                        </span>
                      )}
                    </div>
                    <p className='text-sm text-muted-foreground'>{address.fullName} • {address.phone}</p>
                    <p className='text-sm text-muted-foreground'>
                      {address.addressLine1}, {address.addressLine2 ? `${address.addressLine2}, ` : ''}
                      {address.city}, {address.state}, {address.country} - {address.postalCode}
                    </p>
                  </div>
                  <button 
                    onClick={() => deleteAddress(address._id)} 
                    className='text-destructive hover:text-destructive/80 text-sm font-medium transition-colors'
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {addresses.length === 0 && (
              <div className='text-center py-8 text-muted-foreground'>
                <MapPin className='h-12 w-12 mx-auto mb-2 opacity-50' />
                <p>No addresses saved yet.</p>
                <p className='text-sm'>Add your first address above!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default AccountPage
