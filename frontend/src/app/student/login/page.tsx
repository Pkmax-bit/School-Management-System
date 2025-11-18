'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, AlertCircle, GraduationCap, ArrowLeft } from 'lucide-react';
import { getApiEndpoint } from '@/lib/apiUrl';

export default function StudentLoginPage() {
  const [formData, setFormData] = useState({
    email: 'student@school.com',
    password: 'student123'
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
        console.log('Student login success:', result)
        
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
              role: result.user.role || 'student',
              is_active: result.user.is_active !== false
            }
            
            console.log('Student user data to save:', userData)
            localStorage.setItem('user', JSON.stringify(userData))
            
            // Verify role is student before redirecting
            const role = (userData.role || '').toLowerCase()
            if (role === 'student') {
              router.push('/student/dashboard')
            } else {
              setError(`Tài khoản này không phải Student. Role: ${role}`)
              setLoading(false)
              return
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
                  role: 'student', // Default to student for student login page
                  is_active: true
                }
                localStorage.setItem('user', JSON.stringify(userData))
                router.push('/student/dashboard')
              } else {
                setError('Token không hợp lệ')
                setLoading(false)
                return
              }
            } catch (tokenError) {
              console.error('Error processing token:', tokenError)
              setError('Lỗi xử lý token đăng nhập')
              setLoading(false)
              return
            }
          }
        }
      } else {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { detail: 'Đăng nhập thất bại' }
        }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back to Home Button */}
      <div className="absolute top-4 left-4">
        <Link 
          href="/login" 
          className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-full font-medium hover:bg-white hover:shadow-lg transition-all duration-300 border border-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Trở về trang đăng nhập chung</span>
        </Link>
      </div>

      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-purple-100">
            <GraduationCap className="h-8 w-8 text-purple-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Đăng nhập Học sinh
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Xem thông tin và điểm số
          </p>
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
                  className="appearance-none relative block w-full pl-10 pr-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="student@school.com"
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
                  className="appearance-none relative block w-full pl-10 pr-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="Nhập mật khẩu"
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
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <div className="text-sm">
              <Link 
                href="/forgot-password" 
                className="font-medium text-purple-600 hover:text-purple-700 underline underline-offset-2 transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang đăng nhập...
                </div>
              ) : (
                'Đăng nhập Student'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Tài khoản test: <span className="font-mono">student@school.com</span> / <span className="font-mono">student123</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

