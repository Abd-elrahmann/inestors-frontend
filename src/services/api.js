import axios from 'axios'
import {toast} from 'react-toastify'
const Api = axios.create({
 // baseURL: "http://localhost:5000",
    baseURL: "https://investors-backend-production.up.railway.app",
  headers: {
    'Content-Type': 'application/json',
  },
  
})

Api.interceptors.request.use(
  (config) => {
    config.headers["page"] = window.location.pathname.split('/').pop();
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

export const handleApiError = (error) => {
  try {
    const status = error?.response?.status
    const responseBody = error?.response?.data
    if (status == 500) {
      return toast.error('Unexpected Error Happen ')
    }
    if (Array.isArray(responseBody)) {
      responseBody.map((e) => toast.error(e.message))
    } else if (Array.isArray(responseBody?.message)) {
      responseBody?.message?.map((e) => toast.error(e))
    } else {
      const errorMes = responseBody?.message || responseBody?.error || responseBody
      console.log('🚀 ~ handleApiError ~ errorMes:', errorMes)
      toast.error(errorMes)
    }
  } catch (error) {
    console.log(error)
  }
}

export default Api
