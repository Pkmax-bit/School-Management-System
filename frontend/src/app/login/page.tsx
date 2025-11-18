'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, AlertCircle, User, Crown, BookOpen, GraduationCap, ArrowLeft } from 'lucide-react'
import { supabase, isValidSupabaseConfig } from '@/lib/supabase'
import { getApiEndpoint } from '@/lib/apiUrl'

// Test accounts with different roles
const testAccounts = [
  {
    name: 'Admin',
    email: 'admin@school.com',
    password: 'password123',
    role: 'ADMIN',
    icon: Crown,
    color: 'bg-red-500',
    description: 'Toàn quyền - Quản lý hệ thống'
  },
  {
    name: 'Giáo viên',
    email: 'teacher@school.com',
    password: 'teacher123',
    role: 'TEACHER',
    icon: BookOpen,
    color: 'bg-green-500',
    description: 'Quản lý lớp học và học sinh'
  },
  {
    name: 'Học sinh',
    email: 'student@school.com',
    password: 'student123',
    role: 'STUDENT',
    icon: GraduationCap,
    color: 'bg-purple-500',
    description: 'Xem thông tin và điểm số'
  }
]

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate form data
    if (!formData.email || !formData.password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu')
      setLoading(false)
      return
    }

    if (!formData.email.includes('@')) {
      setError('Email không hợp lệ')
      setLoading(false)
      return
    }

    try {
      // Try Supabase auth first (only if config is valid)
      if (isValidSupabaseConfig) {
        try {
          const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
            email: formData.email.trim(),
            password: formData.password,
          })

          if (supabaseError) {
            console.log('Supabase auth error:', supabaseError)
            // Continue to backend API fallback
          } else if (data?.user) {
            // Supabase auth successful
            console.log('Supabase auth success:', data)
            
            // Store token
            if (data.session?.access_token) {
              localStorage.setItem('access_token', data.session.access_token)
              localStorage.setItem('auth_token', data.session.access_token)
            }
            
            // Get user data from database
            try {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single()

              if (userData && !userError) {
                localStorage.setItem('user', JSON.stringify(userData))
              }
            } catch (userLoadError) {
              console.log('Error loading user data:', userLoadError)
              // Still continue even if user data load fails
            }
            
            router.push('/dashboard')
            setLoading(false)
            return
          }
        } catch (supabaseErr: any) {
          // Supabase failed (network error, etc.), try backend API
          console.log('Supabase auth failed, trying backend API:', supabaseErr)
        }
      }

      // Fallback to backend API if Supabase config is invalid or auth failed
      console.log('Trying backend API with:', { email: formData.email.trim(), password: formData.password })
      
      const response = await fetch(getApiEndpoint('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Backend auth success:', result)
        
        // Store token
        if (result.access_token) {
          localStorage.setItem('access_token', result.access_token)
          localStorage.setItem('auth_token', result.access_token)
          
          // Use user data from response (backend now returns user data)
          if (result.user) {
            const userData = {
              id: result.user.id || '',
              email: result.user.email || formData.email.trim(),
              full_name: result.user.full_name || '',
              role: result.user.role || '',
              is_active: result.user.is_active !== false
            }
            
            console.log('User data to save:', userData)
            localStorage.setItem('user', JSON.stringify(userData))
            
            // Redirect based on role
            const role = (userData.role || '').toLowerCase()
            if (role === 'admin') {
              router.push('/admin/dashboard')
            } else if (role === 'teacher') {
              router.push('/teacher/dashboard')
            } else if (role === 'student') {
              router.push('/student/dashboard')
            } else {
              router.push('/dashboard')
            }
          } else {
            // Fallback: decode JWT token if user data not in response
            try {
              const tokenParts = result.access_token.split('.')
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]))
                const userData = {
                  id: payload.sub || '',
                  email: payload.email || formData.email.trim(),
                  full_name: '',
                  role: payload.role || '',
                  is_active: true
                }
                localStorage.setItem('user', JSON.stringify(userData))
                
                const role = (userData.role || '').toLowerCase()
                if (role === 'admin') {
                  router.push('/admin/dashboard')
                } else if (role === 'teacher') {
                  router.push('/teacher/dashboard')
                } else if (role === 'student') {
                  router.push('/student/dashboard')
                } else {
                  router.push('/dashboard')
                }
              } else {
                router.push('/dashboard')
              }
            } catch (tokenError) {
              console.error('Error processing token:', tokenError)
              router.push('/dashboard')
            }
          }
        }
      } else {
        console.log('Backend API error:', response.status, response.statusText)
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { detail: 'Đăng nhập thất bại' }
        }
        console.log('Backend API error details:', errorData)
        setError(errorData.detail || `Đăng nhập thất bại: ${response.status}`)
      }
    } catch (err: any) {
      console.log('General error:', err)
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleTestAccountClick = (account: typeof testAccounts[0]) => {
    setFormData({
      email: account.email,
      password: account.password
    })
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to Home Button */}
      <div className="absolute top-4 left-4">
        <Link 
          href="/" 
          className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-full font-medium hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Trở về trang chủ</span>
        </Link>
      </div>

      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng nhập vào tài khoản
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Địa chỉ email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-black" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Nhập email của bạn"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-black" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Nhập mật khẩu của bạn"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-black hover:text-black"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <div className="text-sm">
              <Link 
                href="/forgot-password" 
                className="font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang đăng nhập...
                </div>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-black mb-4">
              Hoặc chọn tài khoản test để đăng nhập nhanh:
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-600 mb-2">Đăng nhập theo vai trò:</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Link 
                  href="/admin/login"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Admin Login
                </Link>
                <Link 
                  href="/teacher/login"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Teacher Login
                </Link>
                <Link 
                  href="/student/login"
                  className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Student Login
                </Link>
              </div>
            </div>
          </div>
        </form>

        {/* Test Accounts Section */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
            Tài khoản Test
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            {testAccounts.map((account, index) => {
              const IconComponent = account.icon
              return (
                <button
                  key={index}
                  onClick={() => handleTestAccountClick(account)}
                  className={`relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 ${
                    formData.email === account.email ? 'border-blue-500 bg-blue-50' : 'bg-white'
                  }`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 ${account.color} rounded-full flex items-center justify-center text-white`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="ml-4 flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{account.name}</h4>
                      <span className="text-xs font-mono text-gray-500">{account.role}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{account.description}</p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      {account.email} / {account.password}
                    </p>
                  </div>
                  {formData.email === account.email && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              💡 Bấm vào tài khoản để tự động điền thông tin đăng nhập
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}