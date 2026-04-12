import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://sardor-attendance.duckdns.org/api/v1'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      toast.error('Session expired. Please login again.')
      useAuthStore.getState().logout()
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.')
    } else {
      toast.error(error.response?.data?.detail || 'An unexpected error occurred.')
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
