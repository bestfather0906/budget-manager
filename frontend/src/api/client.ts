import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail ?? '서버 오류가 발생했습니다.'
    return Promise.reject(new Error(message))
  }
)

export default client
