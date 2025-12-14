import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import { BackgroundSettingsProvider } from '@/contexts/BackgroundSettingsContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { QueryProvider } from '@/providers/QueryProvider'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { NotificationToast } from '@/components/NotificationToast'

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
        <QueryProvider>
          <SidebarProvider>
            <BackgroundSettingsProvider>
              <AuthProvider>
                <NotificationProvider>
                  <Layout>
                    {children}
                  </Layout>
                  <NotificationToast />
                </NotificationProvider>
              </AuthProvider>
            </BackgroundSettingsProvider>
          </SidebarProvider>
        </QueryProvider>
      </body>
    </html>
  )
}