'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface UserItem {
  _id: string
  fullName: string
  email: string
  phone: string
  role: 'admin' | 'user'
  isVerified: boolean
  createdAt: string
}

const UsersPage = () => {
  const [users, setUsers] = useState<UserItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        const query = new URLSearchParams()
        if (search) query.set('search', search)

        const response = await fetch(`/api/admin/users?${query.toString()}`)
        const result = await response.json()

        if (!result.success) throw new Error(result.error || 'Failed to load users')

        setUsers(result.data)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [search])

  return (
    <div className='space-y-5'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Users</h1>
          <p className='text-muted-foreground'>Manage customer accounts and access levels.</p>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='Search users...'
          className='border rounded-md px-3 py-2 w-64'
        />
      </div>

      {loading && <p className='text-muted-foreground'>Loading users...</p>}
      {error && <p className='text-red-600 text-sm'>{error}</p>}

      <div className='overflow-x-auto border rounded-lg bg-card'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50'>
            <tr>
              <th className='text-left p-3'>Name</th>
              <th className='text-left p-3'>Email</th>
              <th className='text-left p-3'>Phone</th>
              <th className='text-left p-3'>Role</th>
              <th className='text-left p-3'>Verified</th>
              <th className='text-left p-3'>Joined</th>
              <th className='text-left p-3'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className='border-t'>
                <td className='p-3 font-medium'>{user.fullName}</td>
                <td className='p-3'>{user.email}</td>
                <td className='p-3'>{user.phone}</td>
                <td className='p-3 capitalize'>{user.role}</td>
                <td className='p-3'>{user.isVerified ? 'Yes' : 'No'}</td>
                <td className='p-3'>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className='p-3'>
                  <Link href={`/admin/users/${user._id}`} className='text-primary underline'>
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td className='p-4 text-muted-foreground' colSpan={7}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UsersPage
