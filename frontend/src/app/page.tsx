/**
 * Home Page
 * Trang chủ
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Hệ thống Quản lý Trường học
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Quản lý giáo viên, học sinh, lớp học, thời khóa biểu và tài chính một cách hiệu quả
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  Đăng nhập
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link
                  href="/register"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                >
                  Đăng ký
                </Link>
              </div>
            </div>
            
            {/* Quick Access Buttons */}
            <div className="mt-8 max-w-2xl mx-auto">
              <p className="text-sm text-gray-500 mb-4">Truy cập nhanh:</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/teacher/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  🎓 Teacher Login
                </Link>
                <Link
                  href="/teacher/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  📊 Teacher Dashboard
                </Link>
                <Link
                  href="/admin/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                >
                  👨‍💼 Admin Dashboard
                </Link>
                <Link
                  href="/student/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                >
                  👨‍🎓 Student Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="py-12">
          <div className="max-w-7xl mx-auto">
            <div className="lg:text-center">
              <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">
                Tính năng
              </h2>
              <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-gray-900 sm:text-4xl">
                Quản lý toàn diện
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Hệ thống cung cấp đầy đủ các tính năng cần thiết cho việc quản lý trường học
              </p>
            </div>

            <div className="mt-10">
              <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    👨‍🏫
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                    Quản lý Giáo viên
                  </p>
                  <p className="mt-2 ml-16 text-base text-gray-500">
                    Quản lý thông tin giáo viên, phân công giảng dạy và theo dõi hiệu suất
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    👨‍🎓
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                    Quản lý Học sinh
                  </p>
                  <p className="mt-2 ml-16 text-base text-gray-500">
                    Quản lý thông tin học sinh, điểm danh và theo dõi tiến độ học tập
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    📚
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                    Quản lý Môn học
                  </p>
                  <p className="mt-2 ml-16 text-base text-gray-500">
                    Quản lý chương trình học, môn học và phân bổ thời gian
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    📅
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">
                    Thời khóa biểu
                  </p>
                  <p className="mt-2 ml-16 text-base text-gray-500">
                    Lập và quản lý thời khóa biểu cho các lớp học
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}