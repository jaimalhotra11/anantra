'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Building2, 
  Mail, 
  Phone, 
  Calendar,
  Loader2,
  Download
} from 'lucide-react'

interface WholesaleEnquiry {
  _id: string
  businessName: string
  contactPerson: string
  email: string
  phone: string
  businessType: string
  businessAddress: {
    street: string
    city: string
    state: string
    country: string
    postalCode: string
  }
  taxId?: string
  website?: string
  productCategories: string[]
  estimatedOrderVolume: string
  orderFrequency: string
  message: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'contacted'
  adminNotes?: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  contacted: 'bg-purple-100 text-purple-800',
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
}

export default function WholesaleEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<WholesaleEnquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedEnquiry, setSelectedEnquiry] = useState<WholesaleEnquiry | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    status: '',
    adminNotes: '',
    priority: '',
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })

  const fetchEnquiries = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(businessTypeFilter !== 'all' && { businessType: businessTypeFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
        ...(searchTerm && { search: searchTerm }),
      })

      const response = await fetch(`/api/admin/wholesale-enquiries?${params}`)
      const result = await response.json()

      if (result.success) {
        setEnquiries(result.data.enquiries)
        setPagination(result.data.pagination)
      } else {
        toast.error('Failed to fetch enquiries')
      }
    } catch (error) {
      toast.error('Error fetching enquiries')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEnquiries()
  }, [pagination.page, statusFilter, businessTypeFilter, priorityFilter, searchTerm])

  const handleEditEnquiry = async () => {
    if (!selectedEnquiry) return

    try {
      const response = await fetch(`/api/admin/wholesale-enquiries/${selectedEnquiry._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Enquiry updated successfully')
        setIsEditDialogOpen(false)
        setSelectedEnquiry(null)
        fetchEnquiries()
      } else {
        toast.error(result.message || 'Failed to update enquiry')
      }
    } catch (error) {
      toast.error('Error updating enquiry')
    }
  }

  const handleDeleteEnquiry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return

    try {
      const response = await fetch(`/api/admin/wholesale-enquiries/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Enquiry deleted successfully')
        fetchEnquiries()
      } else {
        toast.error(result.message || 'Failed to delete enquiry')
      }
    } catch (error) {
      toast.error('Error deleting enquiry')
    }
  }

  const openEditDialog = (enquiry: WholesaleEnquiry) => {
    setSelectedEnquiry(enquiry)
    setEditForm({
      status: enquiry.status,
      adminNotes: enquiry.adminNotes || '',
      priority: enquiry.priority,
    })
    setIsEditDialogOpen(true)
  }

  const openViewDialog = (enquiry: WholesaleEnquiry) => {
    setSelectedEnquiry(enquiry)
    setIsViewDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wholesale Enquiries</h1>
          <p className="text-muted-foreground">
            Manage and respond to wholesale partnership enquiries
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search enquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Business Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="boutique">Boutique</SelectItem>
                <SelectItem value="online_store">Online Store</SelectItem>
                <SelectItem value="distributor">Distributor</SelectItem>
                <SelectItem value="manufacturer">Manufacturer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enquiries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Enquiries ({pagination.total})</CardTitle>
          <CardDescription>
            Showing {enquiries.length} of {pagination.total} enquiries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enquiries.map((enquiry) => (
                <TableRow key={enquiry._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{enquiry.businessName}</div>
                      <div className="text-sm text-muted-foreground">{enquiry.contactPerson}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        {enquiry.email}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {enquiry.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {enquiry.businessType.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[enquiry.status]}>
                      {enquiry.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={priorityColors[enquiry.priority]}>
                      {enquiry.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {formatDate(enquiry.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(enquiry)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(enquiry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEnquiry(enquiry._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.pages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Wholesale Enquiry Details
            </DialogTitle>
            <DialogDescription>
              Full details of the wholesale enquiry
            </DialogDescription>
          </DialogHeader>
          {selectedEnquiry && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Business Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Business Name:</strong> {selectedEnquiry.businessName}</div>
                    <div><strong>Contact Person:</strong> {selectedEnquiry.contactPerson}</div>
                    <div><strong>Email:</strong> {selectedEnquiry.email}</div>
                    <div><strong>Phone:</strong> {selectedEnquiry.phone}</div>
                    <div><strong>Business Type:</strong> {selectedEnquiry.businessType}</div>
                    {selectedEnquiry.taxId && <div><strong>Tax ID:</strong> {selectedEnquiry.taxId}</div>}
                    {selectedEnquiry.website && <div><strong>Website:</strong> {selectedEnquiry.website}</div>}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Business Address</h4>
                  <div className="space-y-1 text-sm">
                    <div>{selectedEnquiry.businessAddress.street}</div>
                    <div>{selectedEnquiry.businessAddress.city}, {selectedEnquiry.businessAddress.state}</div>
                    <div>{selectedEnquiry.businessAddress.country} - {selectedEnquiry.businessAddress.postalCode}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Product Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEnquiry.productCategories.map((category) => (
                    <Badge key={category} variant="secondary">{category}</Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Order Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Order Volume:</strong> {selectedEnquiry.estimatedOrderVolume}</div>
                    <div><strong>Order Frequency:</strong> {selectedEnquiry.orderFrequency}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Status & Priority</h4>
                  <div className="space-y-2">
                    <Badge className={statusColors[selectedEnquiry.status]}>
                      {selectedEnquiry.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={priorityColors[selectedEnquiry.priority]}>
                      {selectedEnquiry.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Message</h4>
                <p className="text-sm bg-muted p-3 rounded">{selectedEnquiry.message}</p>
              </div>

              {selectedEnquiry.adminNotes && (
                <div>
                  <h4 className="font-semibold mb-2">Admin Notes</h4>
                  <p className="text-sm bg-muted p-3 rounded">{selectedEnquiry.adminNotes}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Created: {new Date(selectedEnquiry.createdAt).toLocaleString()} | 
                Updated: {new Date(selectedEnquiry.updatedAt).toLocaleString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Enquiry</DialogTitle>
            <DialogDescription>
              Update the status and notes for this enquiry
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={editForm.priority}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <Textarea
                id="adminNotes"
                value={editForm.adminNotes}
                onChange={(e) => setEditForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                placeholder="Add notes about this enquiry..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditEnquiry}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
