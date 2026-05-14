import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  const getPageTitle = (pathname: string) => {
    const titles: Record<string, string> = {
      '/dashboard': 'Bosh sahifa',
      '/attendance': 'Davomat tarixi',
      '/chat': 'Ichki yozishmalar',
      '/manager': 'Ruxsatlarni boshqarish',
      '/admin': 'Xodimlarni boshqarish',
      '/analytics': 'Tizim analitikasi',
      '/settings': 'Hisob sozlamalari',
    }
    return titles[pathname] || 'Xush kelibsiz'
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex flex-col flex-1 w-full min-w-0">
        <Navbar title={getPageTitle(location.pathname)} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppLayout
