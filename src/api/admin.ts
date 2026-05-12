import axiosInstance from './axiosInstance'

export interface MinutiaePoint {
  x: number
  y: number
  angle: number
  type: 'ending' | 'bifurcation'
}

export interface Employee {
  id: string
  jshshir: string
  full_name: string
  birth_date: string
  phone: string
  email: string
  role: 'employee' | 'manager' | 'admin'
  created_at: string
  updated_at: string
}

export interface EmployeeUpdate {
  full_name?: string
  phone?: string
  email?: string
  role?: 'employee' | 'manager' | 'admin'
}

export interface OrganizationLocation {
  id: string
  latitude: number
  longitude: number
  radius_meters: number
}

export interface OrganizationLocationUpdate {
  latitude: number
  longitude: number
  radius_meters: number
}

export interface AttendanceLog {
  _id?: string
  id?: string
  employee_id: any
  timestamp: string
  event_type: 'check_in' | 'check_out' | 'failed_attempt'
  device_id?: string
  ip_address?: string
  attempt_latitude?: number
  attempt_longitude?: number
  success: boolean
}

export const adminApi = {
  getEmployees: async () => {
    const response = await axiosInstance.get<Employee[]>('/admin/employees')
    return response.data
  },
  
  updateEmployee: async (id: string, data: EmployeeUpdate) => {
    const response = await axiosInstance.patch<Employee>(`/admin/employees/${id}`, data)
    return response.data
  },
  
  deleteEmployee: async (id: string) => {
    const response = await axiosInstance.delete(`/admin/employees/${id}`)
    return response.data
  },

  getOrgLocation: async () => {
    const response = await axiosInstance.get<OrganizationLocation>('/admin/organization-location')
    return response.data
  },

  updateOrgLocation: async (data: OrganizationLocationUpdate) => {
    const response = await axiosInstance.post<OrganizationLocation>('/admin/organization-location', data)
    return response.data
  },

  getDailyAnalytics: async () => {
    const response = await axiosInstance.get<AttendanceLog[]>('/admin/analytics/daily')
    return response.data
  }
}
