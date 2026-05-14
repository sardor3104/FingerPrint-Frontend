import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuthStore } from './store/authStore'

// Auth Pages (Lazy)
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))

// Dashboard Pages (Lazy)
const EmployeeDashboard = lazy(() => import('./pages/dashboard/EmployeeDashboard'))
const ManagerDashboard = lazy(() => import('./pages/dashboard/ManagerDashboard'))
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'))
const AnalyticsDashboard = lazy(() => import('./pages/dashboard/AnalyticsDashboard'))

// Feature Pages (Lazy)
const AttendanceHistory = lazy(() => import('./pages/attendance/AttendanceHistory'))
const ChatInterface = lazy(() => import('./pages/chat/ChatInterface'))

const RootRedirect = () => {
  const { user, isAuthenticated } = useAuthStore()
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'manager') return <Navigate to="/manager" replace />
  return <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-background text-primary">Yuklanmoqda...</div>}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<EmployeeDashboard />} />
            <Route path="/attendance" element={<AttendanceHistory />} />
            <Route path="/chat" element={<ChatInterface />} />
          </Route>

          {/* Manager Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['manager', 'admin']} />}>
            <Route path="/manager" element={<ManagerDashboard />} />
          </Route>

          {/* Admin Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
