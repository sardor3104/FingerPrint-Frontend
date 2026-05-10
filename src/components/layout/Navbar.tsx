import { useAuthStore } from '@/store/authStore'
import { Bell, Search, User, Menu } from 'lucide-react'

interface NavbarProps {
  title: string
  onMenuClick: () => void
}

const Navbar = ({ title, onMenuClick }: NavbarProps) => {
  const { user } = useAuthStore()

  return (
    <header className="h-16 border-b bg-card px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center">
        <button 
          className="mr-3 md:hidden p-2 rounded-md hover:bg-accent text-muted-foreground" 
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            className="pl-10 h-10 w-48 lg:w-64 rounded-full border bg-accent/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Search activities..."
          />
        </div>
        
        <button className="relative p-2 rounded-full hover:bg-accent text-muted-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full border-2 border-card"></span>
        </button>

        <div className="flex items-center space-x-3 pl-4 border-l">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border text-primary">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
