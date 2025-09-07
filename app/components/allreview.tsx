'use client'

import { useState, useEffect } from 'react'

interface Review {
  id: string
  productName: string
  productType: string
  description?: string
  stars: number
  imageUrl?: string
  boughtFromUrl?: string
  customerName?: string
  mobileNumber?: string
  productQuality: string
  serviceQuality: string
  wouldRecommend: boolean
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    name?: string
    email: string
  }
}

const renderStars = (rating: number = 0) => {
  return [...Array(5)].map((_, i) => (
    <svg
      key={i}
      className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.945a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.286 3.946c.3.92-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.175 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.286-3.946a1 1 0 00-.364-1.118L2.075 9.372c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.945z" />
    </svg>
  ))
}

const AllReviewPage = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [visibleCount, setVisibleCount] = useState(6)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/all-reviews')
        
        if (!response.ok) {
          throw new Error('Failed to fetch reviews')
        }
        
        const data = await response.json()
        setReviews(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [])

  // Filter and sort reviews
  const filteredAndSortedReviews = reviews
    .filter(review => {
      if (filter === 'all') return true
      if (filter === 'recommended') return review.wouldRecommend
      if (filter === 'highRating') return review.stars >= 4
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'highest') return b.stars - a.stars
      if (sortBy === 'lowest') return a.stars - b.stars
      return 0
    })

  const visibleReviews = filteredAndSortedReviews.slice(0, visibleCount)

  if (loading) {
    return (
      <section id="reviews" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
            <div className="h-2 w-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto"></div>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-6 py-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-32 bg-gray-300 rounded col-span-1"></div>
                    <div className="h-32 bg-gray-300 rounded col-span-1"></div>
                    <div className="h-32 bg-gray-300 rounded col-span-1"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="reviews" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Error loading reviews</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (reviews.length === 0) {
    return (
      <section id="reviews" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
            <div className="h-2 w-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto"></div>
          </div>
          <div className="text-center bg-white p-12 rounded-2xl shadow-lg border border-gray-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600 mb-6">Be the first to share your experience!</p>
            <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold">
              Write a Review
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="reviews" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Read what our customers are saying about their experience with our products and services.
          </p>
          <div className="h-2 w-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto mt-4"></div>
        </div>
        
        {/* Filters and Sorting */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-indigo-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
              All Reviews
            </button>
            <button 
              onClick={() => setFilter('recommended')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'recommended' ? 'bg-indigo-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
              Recommended
            </button>
            <button 
              onClick={() => setFilter('highRating')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'highRating' ? 'bg-indigo-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
            >
              High Rating
            </button>
          </div>
          
          <div className="flex items-center">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
            <select 
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 flex flex-col"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                      {review.customerName ? review.customerName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">{review.productName}</h3>
                      <p className="text-sm text-indigo-600 font-medium">{review.productType}</p>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {renderStars(review.stars)}
                <span className="text-sm text-gray-500 ml-2">({review.stars}/5)</span>
              </div>

              {/* Review Text */}
              {review.description && (
                <div className="mb-4 flex-1">
                  <p className="text-gray-700 leading-relaxed text-sm line-clamp-4">{review.description}</p>
                </div>
              )}

              {/* Quality Ratings */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium">Product Quality</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">{review.productQuality}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 font-medium">Service Quality</p>
                  <p className="text-sm font-medium text-gray-800 mt-1">{review.serviceQuality}</p>
                </div>
              </div>

              {/* Recommendation */}
              <div className="mb-4 flex items-center">
                <span className="text-sm text-gray-600 mr-2">Would recommend:</span>
                <span className={`text-sm font-medium ${review.wouldRecommend ? 'text-green-600' : 'text-red-600'}`}>
                  {review.wouldRecommend ? 'Yes' : 'No'}
                </span>
              </div>

              {/* Image */}
              {review.imageUrl && (
                <div className="mb-4 overflow-hidden rounded-lg">
                  <img
                    src={review.imageUrl}
                    alt={review.productName}
                    className="w-full h-48 object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}

              {/* Bought From */}
              {review.boughtFromUrl && (
                <a
                  href={review.boughtFromUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center text-indigo-600 hover:text-indigo-700 text-sm mt-auto py-2 px-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                  View Product
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {visibleCount < filteredAndSortedReviews.length && (
          <div className="text-center mt-12">
            <button
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center mx-auto"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Load More Reviews ({filteredAndSortedReviews.length - visibleCount} remaining)
            </button>
          </div>
        )}

        {/* Show all reviews loaded message */}
        {visibleCount >= filteredAndSortedReviews.length && filteredAndSortedReviews.length > 0 && (
          <div className="text-center mt-8 py-4 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500 font-medium">All reviews loaded ({filteredAndSortedReviews.length} total)</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default AllReviewPage