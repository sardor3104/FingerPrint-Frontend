import axiosInstance from './axiosInstance'
import { Employee } from './admin'

export interface UserUpdate {
  full_name?: string
  phone?: string
  email?: string
  password?: string
}

export const usersApi = {
  getMe: async () => {
    const response = await axiosInstance.get<Employee>('/users/me')
    return response.data
  },
  
  updateMe: async (data: UserUpdate) => {
    const response = await axiosInstance.patch<Employee>('/users/me', data)
    return response.data
  }
}
