import axiosInstance from './axiosInstance'

export interface ChartData {
  name: string;
  value: number;
}

export interface EmployeeStats {
  last_check_in: string;
  weekly_attendance: string;
  failed_attempts: string;
  monthly_trend: string;
  charts: {
    weekly: ChartData[];
    monthly: ChartData[];
  }
}

export interface AttendanceHistoryItem {
  id: string;
  type: string;
  time: string;
  date: string;
  status: string;
}

export interface BiometricVerifyRequest {
  image_base64: string;
  latitude?: number;
  longitude?: number;
}

export const attendanceApi = {
  checkIn: async (data: BiometricVerifyRequest) => {
    const response = await axiosInstance.post('/attendance/check-in', data)
    return response.data
  },
  checkOut: async (data: BiometricVerifyRequest) => {
    const response = await axiosInstance.post('/attendance/check-out', data)
    return response.data
  },
  getMyStats: async () => {
    const response = await axiosInstance.get<EmployeeStats>('/attendance/my-stats')
    return response.data
  },
  getMyHistory: async () => {
    const response = await axiosInstance.get<AttendanceHistoryItem[]>('/attendance/my-history')
    return response.data
  }
}
