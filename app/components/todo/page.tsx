// app/components/Dashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { redirect } from 'next/navigation'
import useSWR from 'swr'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'

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

interface Analytics {
  totalReviews: number
  averageRating: number
  recommendationRate: number
  productTypeDistribution: { name: string; value: number }[]
  qualityDistribution: {
    product: { name: string; value: number }[]
    service: { name: string; value: number }[]
  }
  starDistribution: { name: string; value: number }[]
  recentActivity: { date: string; count: number }[]
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
const QUALITY_COLORS = ['#10b981', '#84cc16', '#f59e0b', '#ef4444']

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [selectedStars, setSelectedStars] = useState(0)
  const [isHovering, setIsHovering] = useState(0)

  const { 
    data: reviews = [], 
    error: fetchError, 
    isLoading, 
    mutate 
  } = useSWR<Review[]>('/api/mobile-reviews', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  // Calculate analytics when reviews change
  useEffect(() => {
    if (reviews.length > 0) {
      const totalReviews = reviews.length
      const averageRating = reviews.reduce((sum, review) => sum + (review.stars || 0), 0) / totalReviews
      const recommendationRate = (reviews.filter(review => review.wouldRecommend).length / totalReviews) * 100
      
      const productTypeDistribution: Record<string, number> = {}
      const productQualityDistribution: Record<string, number> = {}
      const serviceQualityDistribution: Record<string, number> = {}
      const starDistribution: Record<number, number> = {}
      const recentActivity: Record<string, number> = {}

      reviews.forEach(review => {
        productTypeDistribution[review.productType] = (productTypeDistribution[review.productType] || 0) + 1
        productQualityDistribution[review.productQuality] = (productQualityDistribution[review.productQuality] || 0) + 1
        serviceQualityDistribution[review.serviceQuality] = (serviceQualityDistribution[review.serviceQuality] || 0) + 1
        starDistribution[review.stars] = (starDistribution[review.stars] || 0) + 1
        
        const date = new Date(review.createdAt).toLocaleDateString()
        recentActivity[date] = (recentActivity[date] || 0) + 1
      })

      setAnalytics({
        totalReviews,
        averageRating,
        recommendationRate,
        productTypeDistribution: Object.entries(productTypeDistribution).map(([name, value]) => ({ name, value })),
        qualityDistribution: {
          product: Object.entries(productQualityDistribution).map(([name, value]) => ({ name, value })),
          service: Object.entries(serviceQualityDistribution).map(([name, value]) => ({ name, value }))
        },
        starDistribution: Object.entries(starDistribution).map(([name, value]) => ({ name: `${name} Star${value > 1 ? 's' : ''}`, value })),
        recentActivity: Object.entries(recentActivity).map(([date, count]) => ({ date, count })).slice(-7)
      })
    }
  }, [reviews])

  // Timer for review form
  useEffect(() => {
    if (showReviewForm && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setShowReviewForm(false)
    }
  }, [showReviewForm, timeLeft])

  // Redirect if not authenticated
  if (status === 'loading') return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Loading dashboard...</p>
      </div>
    </div>
  )
  
  if (status === 'unauthenticated') redirect('/auth/signin')

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAddReview = () => {
    setShowReviewForm(true)
    setTimeLeft(60)
    setSelectedStars(0)
  }

  const handleCloseForm = () => {
    setShowReviewForm(false)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-bold text-gray-800">{label}</p>
          <p className="text-sm text-gray-600">{payload[0].value} reviews</p>
        </div>
      )
    }
    return null
  }

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ⭐
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white text-gray-800 w-64 min-h-screen transition-all duration-300 ${isSidebarOpen ? 'ml-0' : '-ml-64'} fixed z-40 shadow-lg border-r border-gray-200`}>
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            ReviewHub
          </h1>
          <p className="text-gray-500 text-sm mt-2">Customer Feedback Analytics</p>
        </div>
        
        <nav className="mt-6">
          {[
            { icon: '📊', label: 'Dashboard' },
            
          ].map((item, index) => (
            <div
              key={index}
              className={`px-6 py-3 cursor-pointer transition-all duration-200 hover:bg-indigo-50 ${
                index === 0 ? 'bg-indigo-50 text-indigo-600 font-semibold border-r-2 border-indigo-600' : 'text-gray-600'
              }`}
            >
              <span className="flex items-center space-x-3">
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </span>
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
              {session?.user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{session?.user?.email}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ☰
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Customer Feedback Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome back, {session?.user?.email}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddReview}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center space-x-2"
              >
                <span>+</span>
                <span>Add Review</span>
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-sm"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { 
                  title: 'Total Reviews', 
                  value: analytics.totalReviews, 
                  color: 'bg-blue-500', 
                  icon: '📝',
                  trend: '+12%' 
                },
                { 
                  title: 'Avg Rating', 
                  value: analytics.averageRating.toFixed(1), 
                  color: 'bg-amber-500', 
                  icon: '⭐',
                  trend: '+0.3' 
                },
                { 
                  title: 'Recommendation', 
                  value: `${analytics.recommendationRate.toFixed(1)}%`, 
                  color: 'bg-emerald-500', 
                  icon: '👍',
                  trend: '+5%' 
                },
                { 
                  title: 'Satisfaction', 
                  value: '92%', 
                  color: 'bg-purple-500', 
                  icon: '😊',
                  trend: '+3%' 
                }
              ].map((card, index) => (
                <div key={index} className="bg-white rounded-xl p-6 text-gray-800 hover:shadow-md transition-all duration-200 shadow-sm border border-gray-200 group">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r from-${card.color.split('-')[1]}-100 to-${card.color.split('-')[1]}-50 flex items-center justify-center text-xl text-${card.color.split('-')[1]}-600`}>
                      {card.icon}
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                      {card.trend}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                  <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
                    <div 
                      className={`h-2 rounded-full bg-gradient-to-r from-${card.color.split('-')[1]}-500 to-${card.color.split('-')[1]}-600 transition-all duration-1000`}
                      style={{ width: `${Math.min(100, parseInt(card.value.toString()) * 10)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Charts Section */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Product Type Distribution */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2 text-indigo-600">📦</span>
                  Product Types Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.productTypeDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    >
                      {analytics.productTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Star Rating Distribution */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2 text-amber-500">⭐</span>
                  Star Ratings Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.starDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Quality Ratings */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2 text-emerald-500">🏆</span>
                  Quality Ratings
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.qualityDistribution.product}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2 text-purple-600">📈</span>
                  Recent Activity
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.recentActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8b5cf6" 
                      strokeWidth={3} 
                      dot={{ r: 5, fill: "#8b5cf6" }}
                      activeDot={{ r: 8, fill: "#ef4444" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Review Form Modal */}
          {showReviewForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 border border-gray-200 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Add Customer Review</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Time left: </span>
                    <span className={`font-bold ${timeLeft <= 30 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
                
                {timeLeft > 0 ? (
                  <ReviewForm 
                    onClose={handleCloseForm}
                    onSuccess={() => {
                      setShowReviewForm(false)
                      mutate()
                    }}
                    selectedStars={selectedStars}
                    setSelectedStars={setSelectedStars}
                    isHovering={isHovering}
                    setIsHovering={setIsHovering}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-red-500 font-semibold mb-4">Time's up! Form has been discarded.</p>
                    <button
                      onClick={handleCloseForm}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Customer Reviews ({reviews.length})</h2>
              <div className="flex space-x-3">
                <button
                  onClick={() => mutate()}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2 shadow-sm"
                >
                  <span>🔄</span>
                  <span>Refresh</span>
                </button>
                <button
                  onClick={handleAddReview}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center space-x-2 shadow-sm"
                >
                  <span>+</span>
                  <span>Add Review</span>
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-500 text-lg">No reviews yet</p>
                <p className="text-gray-400">Be the first to add a review!</p>
                <button
                  onClick={handleAddReview}
                  className="mt-4 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
                >
                  Add First Review
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 p-6 rounded-lg hover:bg-indigo-50 transition-colors duration-200 group border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 group-hover:text-indigo-600 transition-colors">
                          {review.productName}
                        </h3>
                        <p className="text-gray-500">Type: {review.productType}</p>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {review.customerName && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Customer:</span> {review.customerName}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-gray-600">Product Quality: </span>
                        <span className="text-sm font-semibold text-emerald-600">{review.productQuality}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Service Quality: </span>
                        <span className="text-sm font-semibold text-blue-600">{review.serviceQuality}</span>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      {renderStarRating(review.stars)}
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-sm text-gray-600">Would recommend: </span>
                      <span className={`text-sm font-semibold ${review.wouldRecommend ? 'text-emerald-600' : 'text-red-600'}`}>
                        {review.wouldRecommend ? 'Yes' : 'No'}
                      </span>
                    </div>
                    
                    {review.description && (
                      <p className="text-gray-600 text-sm mb-4 italic">{review.description}</p>
                    )}
                    
                    {review.imageUrl && (
                      <img
                        src={review.imageUrl}
                        alt={review.productName}
                        className="w-32 h-32 object-cover rounded-lg mb-4 border border-gray-200"
                      />
                    )}
                    
                    {review.boughtFromUrl && (
                      <a
                        href={review.boughtFromUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 text-sm flex items-center space-x-1"
                      >
                        <span>🔗</span>
                        <span>View Product</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Review Form Component with improved star interaction
function ReviewForm({ 
  onClose, 
  onSuccess, 
  selectedStars, 
  setSelectedStars, 
  isHovering, 
  setIsHovering 
}: { 
  onClose: () => void; 
  onSuccess: () => void;
  selectedStars: number;
  setSelectedStars: (stars: number) => void;
  isHovering: number;
  setIsHovering: (stars: number) => void;
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    productType: '',
    productName: '',
    productQuality: '',
    serviceQuality: '',
    wouldRecommend: null as boolean | null,
    description: '',
    imageUrl: '',
    boughtFromUrl: ''
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.productType || !formData.productName || !formData.productQuality || 
        !formData.serviceQuality || formData.wouldRecommend === null || selectedStars === 0) {
      setError('Please fill all required fields including star rating')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/mobile-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          stars: selectedStars
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create review')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto pr-2">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ⚠️ {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name (optional)</label>
          <input
            type="text"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number (optional)</label>
          <input
            type="tel"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your mobile number"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Product Type *</label>
        <select
          name="productType"
          value={formData.productType}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select product type</option>
          <option value="Grocery">Grocery</option>
          <option value="Accessories">Accessories</option>
          <option value="Service">Service</option>
          <option value="Beauty & Personal Care">Beauty & Personal Care</option>
          <option value="Others">Others</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
        <input
          type="text"
          name="productName"
          value={formData.productName}
          onChange={handleInputChange}
          required
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter product name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5) *</label>
        <div className="flex space-x-1" onMouseLeave={() => setIsHovering(0)}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setSelectedStars(star)}
              onMouseEnter={() => setIsHovering(star)}
              className="text-3xl transition-all duration-200 ease-in-out transform hover:scale-125"
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            >
              {star <= (isHovering || selectedStars) ? (
                // Filled star
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-amber-500">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
              ) : (
                // Empty star
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              )}
            </button>
          ))}
        </div>
        <p className="text-gray-500 text-sm mt-2">
          {selectedStars > 0 ? (
            <span className="flex items-center">
              <span className="text-amber-600 font-medium mr-1">Selected: {selectedStars} star{selectedStars > 1 ? 's' : ''}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-amber-500 ml-1">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            </span>
          ) : (
            <span className="text-gray-500">Click to rate</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Quality *</label>
          <select
            name="productQuality"
            value={formData.productQuality}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select quality</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Poor">Poor</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Service Quality *</label>
          <select
            name="serviceQuality"
            value={formData.serviceQuality}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select quality</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Poor">Poor</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Would Recommend? *</label>
        <select
          name="wouldRecommend"
          value={formData.wouldRecommend === null ? '' : formData.wouldRecommend.toString()}
          onChange={(e) => handleRadioChange('wouldRecommend', e.target.value === 'true')}
          required
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select option</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Share your experience..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Image URL (optional)</label>
          <input
            type="url"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="https://example.com/image.jpg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product URL (optional)</label>
          <input
            type="url"
            name="boughtFromUrl"
            value={formData.boughtFromUrl}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="https://example.com/product"
          />
        </div>
      </div>

      <div className="flex space-x-3 pt-6">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg disabled:opacity-50 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-sm"
        >
          {submitting ? (
            <span className="flex items-center justify-center">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
              Submitting...
            </span>
          ) : (
            'Submit Review'
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-semibold shadow-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}