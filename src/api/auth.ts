import axiosInstance from './axiosInstance'

export const authApi = {
  register: async (data: any) => {
    // The backend expects fingerprint_minutiae as an array. We can pass an empty array if not enrolled physically yet.
    const payload = {
      ...data,
      fingerprint_minutiae: []
    };
    const response = await axiosInstance.post('/auth/register', payload)
    return response.data
  }
}
