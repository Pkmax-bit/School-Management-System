import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
// import { DemoAuthProvider } from '@/contexts/DemoAuthContext'
import Layout from '@/components/Layout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'School Management System',
  description: 'Hệ thống quản lý trường học',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  )
}