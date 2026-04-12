import axiosInstance from './axiosInstance'

export interface PermissionRequest {
  id: string
  employee_id: string
  employee_name: string
  type: string
  start_time: string
  end_time: string
  reason: string
  status: 'pending' | 'approved' | 'denied'
  reviewed_by_name?: string
  created_at: string
  updated_at: string
}

export interface PermissionCreate {
  type: string
  start_time: string
  end_time: string
  reason: string
}

export const permissionsApi = {
  createRequest: async (data: PermissionCreate): Promise<PermissionRequest> => {
    const res = await axiosInstance.post<PermissionRequest>('/permissions/create', data)
    return res.data
  },

  getMyRequests: async (): Promise<PermissionRequest[]> => {
    const res = await axiosInstance.get<PermissionRequest[]>('/permissions/my')
    return res.data
  },

  getTeamRequests: async (): Promise<PermissionRequest[]> => {
    const res = await axiosInstance.get<PermissionRequest[]>('/permissions/team')
    return res.data
  },

  updateStatus: async (id: string, status: 'approved' | 'denied'): Promise<PermissionRequest> => {
    const res = await axiosInstance.patch<PermissionRequest>(`/permissions/${id}/status`, { status })
    return res.data
  }
}
