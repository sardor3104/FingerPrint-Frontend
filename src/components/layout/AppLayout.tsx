import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation()
  
  const getPageTitle = (pathname: string) => {
    const titles: Record<string, string> = {
      '/dashboard': 'Dashboard Overview',
      '/attendance': 'Attendance History',
      '/chat': 'Internal Communications',
      '/biometric': 'Biometric Verification',
      '/manager': 'Permission Management',
      '/admin': 'Employee Administration',
      '/analytics': 'System Analytics',
      '/settings': 'Account Settings',
    }
    return titles[pathname] || 'Welcome back'
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar title={getPageTitle(location.pathname)} />
        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppLayout
