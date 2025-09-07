'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { redirect } from 'next/navigation'
import useSWR from 'swr'

interface Review {
  id: string
  customerName: string
  mobileNumber: string
  productType: string
  productName: string
  stars: number
  productQuality: string
  serviceQuality: string
  wouldRecommend: boolean
  description?: string
  imageUrl?: string
  boughtFromUrl?: string
  createdAt: string
  updatedAt: string
}

// Fetcher for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function ReviewsPage() {
  const { data: session, status } = useSession()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    productType: '',
    productName: '',
    stars: 5,
    productQuality: '',
    serviceQuality: '',
    wouldRecommend: null as boolean | null,
    description: '',
    imageUrl: '',
    boughtFromUrl: ''
  })

  // Fetch reviews
  const { 
    data: reviews = [], 
    error: fetchError, 
    isLoading, 
    mutate 
  } = useSWR<Review[]>('/api/mobile-reviews', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  // Redirect if not authenticated
  if (status === 'loading') return <p>Loading...</p>
  if (status === 'unauthenticated') redirect('/auth/signin')

  // Add new review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.productType || !formData.productName || !formData.productQuality || 
        !formData.serviceQuality || formData.wouldRecommend === null) {
      setError('Please fill all required fields')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/mobile-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create review')
      }

      const newReview = await response.json()
      mutate([newReview, ...reviews], false) // Optimistic update
      // Reset form
      setFormData({
        customerName: '',
        mobileNumber: '',
        productType: '',
        productName: '',
        stars: 5,
        productQuality: '',
        serviceQuality: '',
        wouldRecommend: null,
        description: '',
        imageUrl: '',
        boughtFromUrl: ''
      })
      mutate() // Revalidate
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      mutate() // rollback
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleRadioChange = (name: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-8 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Mobile Shop Reviews
            </h1>
            <p className="text-gray-600">Welcome back, {session?.user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg"
          >
            Sign Out
          </button>
        </div>

        {/* Add Review Form */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6 text-center">📋 Customer Review Form</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                1. Customer Name (optional)
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border rounded-xl"
                placeholder="Enter your name"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                2. Mobile Number (optional)
              </label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border rounded-xl"
                placeholder="Enter your mobile number"
              />
            </div>

            {/* Product Purchased */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                3. Product Purchased *
              </label>
              <select
                name="productType"
                value={formData.productType}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border rounded-xl"
              >
                <option value="">Select product type</option>
                <option value="Grocery">Grocery</option>
                <option value="Accessories">Accessories</option>
                <option value="= Service"> Service</option>
                <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border rounded-xl"
                placeholder="e.g., iPhone 15, Samsung Repair, etc."
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                4. Rate Your Experience (1 = Very Poor, 5 = Excellent) *
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, stars: star }))}
                    className={`text-2xl ${star <= formData.stars ? 'text-yellow-400' : 'text-gray-300'}`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            {/* Product Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                5. How was the product quality? *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Excellent', 'Good', 'Average', 'Poor'].map((quality) => (
                  <label key={quality} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="productQuality"
                      checked={formData.productQuality === quality}
                      onChange={() => handleRadioChange('productQuality', quality)}
                      required
                      className="text-indigo-600"
                    />
                    <span>{quality}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Service Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                6. How was the service at our shop? *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Excellent', 'Good', 'Average', 'Poor'].map((quality) => (
                  <label key={quality} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="serviceQuality"
                      checked={formData.serviceQuality === quality}
                      onChange={() => handleRadioChange('serviceQuality', quality)}
                      required
                      className="text-indigo-600"
                    />
                    <span>{quality}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Would Recommend */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                7. Would you recommend us to others? *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="wouldRecommend"
                    checked={formData.wouldRecommend === true}
                    onChange={() => handleRadioChange('wouldRecommend', true)}
                    required
                    className="text-indigo-600"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="wouldRecommend"
                    checked={formData.wouldRecommend === false}
                    onChange={() => handleRadioChange('wouldRecommend', false)}
                    required
                    className="text-indigo-600"
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {/* Additional Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                8. Additional Comments / Suggestions
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border rounded-xl resize-none"
                placeholder="Share your thoughts or suggestions..."
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL (optional)
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border rounded-xl"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Bought From URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product URL (optional)
              </label>
              <input
                type="url"
                name="boughtFromUrl"
                value={formData.boughtFromUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border rounded-xl"
                placeholder="https://example.com/product"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        {/* Reviews List */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Customer Reviews ({reviews.length})</h2>
          {isLoading ? (
            <p>Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p>No reviews yet. Add your first one above!</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="p-6 border rounded-xl hover:bg-gray-50">
                  <h3 className="text-lg font-medium">{review.productName}</h3>
                  <p className="text-gray-600">Type: {review.productType}</p>
                  {review.customerName && (
                    <p className="text-sm text-gray-600">Customer: {review.customerName}</p>
                  )}
                  {review.mobileNumber && (
                    <p className="text-sm text-gray-600">Mobile: {review.mobileNumber}</p>
                  )}
                  <p className="text-yellow-600">⭐ {review.stars} / 5</p>
                  <p className="text-sm text-gray-600">Product Quality: {review.productQuality}</p>
                  <p className="text-sm text-gray-600">Service Quality: {review.serviceQuality}</p>
                  <p className="text-sm text-gray-600">
                    Would Recommend: {review.wouldRecommend ? 'Yes' : 'No'}
                  </p>
                  {review.description && (
                    <p className="text-gray-600 mt-2">{review.description}</p>
                  )}
                  {review.imageUrl && (
                    <img
                      src={review.imageUrl}
                      alt={review.productName}
                      className="mt-2 w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                  {review.boughtFromUrl && (
                    <a
                      href={review.boughtFromUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 underline mt-2 block"
                    >
                      View Product
                    </a>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Created {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 