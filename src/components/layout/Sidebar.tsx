import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { 
  LayoutDashboard, 
  History, 
  MessageSquare, 
  Fingerprint, 
  ShieldCheck, 
  Users, 
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react'

const Sidebar = () => {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const navigation = [
    { name: 'Bosh sahifa', href: '/dashboard', icon: LayoutDashboard, roles: ['employee', 'manager', 'admin'] },
    { name: 'Tarix', href: '/attendance', icon: History, roles: ['employee', 'manager', 'admin'] },
    { name: 'Chat', href: '/chat', icon: MessageSquare, roles: ['employee', 'manager', 'admin'] },
    { name: 'Biometriya', href: '/biometric', icon: Fingerprint, roles: ['employee', 'manager', 'admin'] },
    { name: 'Menejer Portali', href: '/manager', icon: ShieldCheck, roles: ['manager', 'admin'] },
    { name: 'Admin Panel', href: '/admin', icon: Users, roles: ['admin'] },
    { name: 'Analitika', href: '/analytics', icon: BarChart3, roles: ['admin'] },
  ]

  const filteredNavigation = navigation.filter(item => 
    user && item.roles.includes(user.role)
  )

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="flex h-full flex-col bg-card border-r w-64">
      <div className="flex h-16 items-center px-6 border-b">
        <Fingerprint className="h-8 w-8 text-primary mr-2" />
        <span className="text-lg font-bold tracking-tight">XAVFSIZ KIRISH</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {filteredNavigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive(item.href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t space-y-2">
        <Link 
          to="/settings"
          className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="mr-3 h-5 w-5" />
          Sozlamalar
        </Link>
        <button
          onClick={logout}
          className="flex w-full items-center px-3 py-2 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Chiqish
        </button>
      </div>
    </div>
  )
}

export default Sidebar
