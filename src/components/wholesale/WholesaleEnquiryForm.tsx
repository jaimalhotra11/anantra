'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Building2, User, Mail, Phone, MapPin, Globe, FileText } from 'lucide-react'

const wholesaleEnquirySchema = z.object({
    businessName: z.string().min(2, 'Business name must be at least 2 characters'),
    contactPerson: z.string().min(2, 'Contact person name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 characters'),
    businessType: z.enum(['retail', 'boutique', 'online_store', 'distributor', 'manufacturer', 'other']),
    businessAddress: z.object({
        street: z.string().min(1, 'Street address is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        country: z.string().min(1, 'Country is required'),
        postalCode: z.string().min(1, 'Postal code is required'),
    }),
    taxId: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    productCategories: z.array(z.string()).min(1, 'At least one product category is required'),
    estimatedOrderVolume: z.enum(['small', 'medium', 'large', 'enterprise']),
    orderFrequency: z.enum(['weekly', 'monthly', 'quarterly', 'seasonal', 'one_time']),
    message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message cannot exceed 1000 characters'),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
})

type WholesaleEnquiryForm = z.infer<typeof wholesaleEnquirySchema>

const businessTypes = [
    { value: 'retail', label: 'Retail Store' },
    { value: 'boutique', label: 'Boutique' },
    { value: 'online_store', label: 'Online Store' },
    { value: 'distributor', label: 'Distributor' },
    { value: 'manufacturer', label: 'Manufacturer' },
    { value: 'other', label: 'Other' },
]

const productCategories = [
    'Clothing',
    'Accessories',
    'Footwear',
    'Handbags',
    'Jewelry',
    'Home Decor',
    'Textiles',
    'Other'
]

const orderVolumes = [
    { value: 'small', label: 'Small (Under $5,000/month)' },
    { value: 'medium', label: 'Medium ($5,000 - $20,000/month)' },
    { value: 'large', label: 'Large ($20,000 - $50,000/month)' },
    { value: 'enterprise', label: 'Enterprise (Over $50,000/month)' },
]

const orderFrequencies = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'one_time', label: 'One Time' },
]

export default function WholesaleEnquiryForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
        reset,
    } = useForm<WholesaleEnquiryForm>({
        resolver: zodResolver(wholesaleEnquirySchema),
        defaultValues: {
            productCategories: [],
            priority: 'medium',
        },
    })

    const selectedCategories = watch('productCategories')

    const onSubmit = async (data: WholesaleEnquiryForm) => {
        setIsSubmitting(true)
        try {
            const response = await fetch('/api/wholesale-enquiry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (result.success) {
                toast.success('Your wholesale enquiry has been submitted successfully!')
                reset()
            } else {
                if (result.errors) {
                    result.errors.forEach((error: any) => {
                        toast.error(`${error.field}: ${error.message}`)
                    })
                } else {
                    toast.error(result.message || 'Failed to submit enquiry')
                }
            }
        } catch (error) {
            toast.error('An error occurred while submitting your enquiry')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCategoryChange = (category: string, checked: boolean) => {
        const currentCategories = selectedCategories || []
        if (checked) {
            setValue('productCategories', [...currentCategories, category])
        } else {
            setValue('productCategories', currentCategories.filter(c => c !== category))
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
                        <Building2 className="w-8 h-8" />
                        Wholesale Enquiry
                    </CardTitle>
                    <CardDescription>
                        Join our wholesale program and get access to exclusive pricing and products
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Business Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Business Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="businessName">Business Name *</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="businessName"
                                            {...register('businessName')}
                                            placeholder="Your business name"
                                            className="pl-10"
                                        />
                                    </div>
                                    {errors.businessName && (
                                        <p className="text-sm text-destructive">{errors.businessName.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contactPerson">Contact Person *</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="contactPerson"
                                            {...register('contactPerson')}
                                            placeholder="Your name"
                                            className="pl-10"
                                        />
                                    </div>
                                    {errors.contactPerson && (
                                        <p className="text-sm text-destructive">{errors.contactPerson.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address *</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            {...register('email')}
                                            placeholder="your@email.com"
                                            className="pl-10"
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="text-sm text-destructive">{errors.email.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number *</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            {...register('phone')}
                                            placeholder="+1 (555) 123-4567"
                                            className="pl-10"
                                        />
                                    </div>
                                    {errors.phone && (
                                        <p className="text-sm text-destructive">{errors.phone.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="businessType">Business Type *</Label>
                                    <Select onValueChange={(value) => setValue('businessType', value as any)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select business type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {businessTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.businessType && (
                                        <p className="text-sm text-destructive">{errors.businessType.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="taxId">Tax ID (Optional)</Label>
                                    <Input
                                        id="taxId"
                                        {...register('taxId')}
                                        placeholder="Your tax identification number"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website">Website (Optional)</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="website"
                                        {...register('website')}
                                        placeholder="https://yourwebsite.com"
                                        className="pl-10"
                                    />
                                </div>
                                {errors.website && (
                                    <p className="text-sm text-destructive">{errors.website.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Business Address */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Business Address *
                            </h3>
                            
                            <div className="space-y-2">
                                <Label htmlFor="street">Street Address *</Label>
                                <Input
                                    id="street"
                                    {...register('businessAddress.street')}
                                    placeholder="123 Business Street"
                                />
                                {errors.businessAddress?.street && (
                                    <p className="text-sm text-destructive">{errors.businessAddress.street.message}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City *</Label>
                                    <Input
                                        id="city"
                                        {...register('businessAddress.city')}
                                        placeholder="City"
                                    />
                                    {errors.businessAddress?.city && (
                                        <p className="text-sm text-destructive">{errors.businessAddress.city.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state">State *</Label>
                                    <Input
                                        id="state"
                                        {...register('businessAddress.state')}
                                        placeholder="State"
                                    />
                                    {errors.businessAddress?.state && (
                                        <p className="text-sm text-destructive">{errors.businessAddress.state.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="postalCode">Postal Code *</Label>
                                    <Input
                                        id="postalCode"
                                        {...register('businessAddress.postalCode')}
                                        placeholder="12345"
                                    />
                                    {errors.businessAddress?.postalCode && (
                                        <p className="text-sm text-destructive">{errors.businessAddress.postalCode.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="country">Country *</Label>
                                <Input
                                    id="country"
                                    {...register('businessAddress.country')}
                                    placeholder="Country"
                                />
                                {errors.businessAddress?.country && (
                                    <p className="text-sm text-destructive">{errors.businessAddress.country.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Product Categories */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Product Categories *</h3>
                            <p className="text-sm text-muted-foreground">
                                Select all product categories you're interested in
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {productCategories.map((category) => (
                                    <div key={category} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={category}
                                            checked={selectedCategories.includes(category)}
                                            onCheckedChange={(checked) => 
                                                handleCategoryChange(category, checked as boolean)
                                            }
                                        />
                                        <Label htmlFor={category} className="text-sm font-normal">
                                            {category}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {errors.productCategories && (
                                <p className="text-sm text-destructive">{errors.productCategories.message}</p>
                            )}
                        </div>

                        {/* Order Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Order Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="estimatedOrderVolume">Estimated Order Volume *</Label>
                                    <Select onValueChange={(value) => setValue('estimatedOrderVolume', value as any)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select order volume" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {orderVolumes.map((volume) => (
                                                <SelectItem key={volume.value} value={volume.value}>
                                                    {volume.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.estimatedOrderVolume && (
                                        <p className="text-sm text-destructive">{errors.estimatedOrderVolume.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="orderFrequency">Order Frequency *</Label>
                                    <Select onValueChange={(value) => setValue('orderFrequency', value as any)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {orderFrequencies.map((frequency) => (
                                                <SelectItem key={frequency.value} value={frequency.value}>
                                                    {frequency.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.orderFrequency && (
                                        <p className="text-sm text-destructive">{errors.orderFrequency.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Message */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Additional Information
                            </h3>
                            <div className="space-y-2">
                                <Label htmlFor="message">Message *</Label>
                                <Textarea
                                    id="message"
                                    {...register('message')}
                                    placeholder="Tell us about your business, your requirements, and any specific products you're interested in..."
                                    rows={5}
                                />
                                <p className="text-sm text-muted-foreground">
                                    {watch('message')?.length || 0}/1000 characters
                                </p>
                                {errors.message && (
                                    <p className="text-sm text-destructive">{errors.message.message}</p>
                                )}
                            </div>
                        </div>

                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Wholesale Enquiry'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
