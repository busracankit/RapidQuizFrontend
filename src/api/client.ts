import axios, { AxiosError } from 'axios'

import { tr } from '@/i18n/tr'

/** API'nin sabit hata formatı: `{ error: { code, message, details? } }`. */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const SESSION_TOKEN_HEADER = 'X-Session-Token'

const baseURL = `${(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')}/api/v1`

export const http = axios.create({
  baseURL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

interface ErrorBody {
  error?: { code?: string; message?: string; details?: unknown }
}

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorBody>) => {
    const body = error.response?.data?.error
    if (error.response && body?.code) {
      return Promise.reject(
        new ApiError(body.code, body.message ?? tr.errors.generic, error.response.status, body.details),
      )
    }
    if (error.response) {
      return Promise.reject(new ApiError('http_error', tr.errors.generic, error.response.status))
    }
    return Promise.reject(new ApiError('network_error', tr.errors.network, 0))
  },
)

export function withToken(token: string) {
  return { headers: { [SESSION_TOKEN_HEADER]: token } }
}
