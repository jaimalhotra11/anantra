'use client'

import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface User {
  _id: string
  fullName: string
  email: string
  phone: string
  role: 'admin' | 'user'
  isVerified: boolean
  createdAt: string
}

const UserDetailsPage = () => {
  const params = useParams()
  const userId = params.username as string

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadUser = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`)
      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Failed to fetch user')
      setUser(result.data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to fetch user')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    loadUser()
  }, [userId, loadUser])

  const saveUser = async () => {
    if (!user) return
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
        }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error || 'Failed to update user')
      setUser(result.data)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading user details...</p>
  if (!user) return <p className='text-red-600'>{error || 'User not found'}</p>

  return (
    <div className='space-y-5 max-w-2xl'>
      <h1 className='text-3xl font-bold'>User Details</h1>
      {error && <p className='text-red-600 text-sm'>{error}</p>}

      <div className='border rounded-lg p-4 space-y-4'>
        <div>
          <label className='text-sm font-medium'>Name</label>
          <input
            value={user.fullName}
            onChange={(event) => setUser({ ...user, fullName: event.target.value })}
            className='w-full border rounded-md px-3 py-2 mt-1'
          />
        </div>

        <div>
          <label className='text-sm font-medium'>Email</label>
          <input value={user.email} disabled className='w-full border rounded-md px-3 py-2 mt-1 bg-muted' />
        </div>

        <div>
          <label className='text-sm font-medium'>Phone</label>
          <input
            value={user.phone}
            onChange={(event) => setUser({ ...user, phone: event.target.value })}
            className='w-full border rounded-md px-3 py-2 mt-1'
          />
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <div>
            <label className='text-sm font-medium'>Role</label>
            <select
              value={user.role}
              onChange={(event) => setUser({ ...user, role: event.target.value as User['role'] })}
              className='w-full border rounded-md px-3 py-2 mt-1'
            >
              <option value='user'>User</option>
              <option value='admin'>Admin</option>
            </select>
          </div>
          <div>
            <label className='text-sm font-medium'>Verified</label>
            <select
              value={user.isVerified ? 'true' : 'false'}
              onChange={(event) => setUser({ ...user, isVerified: event.target.value === 'true' })}
              className='w-full border rounded-md px-3 py-2 mt-1'
            >
              <option value='true'>Verified</option>
              <option value='false'>Unverified</option>
            </select>
          </div>
        </div>

        <button
          onClick={saveUser}
          disabled={saving}
          className='px-4 py-2 bg-primary text-white rounded-md disabled:opacity-60'
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

export default UserDetailsPage
