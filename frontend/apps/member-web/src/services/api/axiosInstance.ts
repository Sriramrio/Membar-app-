import axios from 'axios';
import { env } from '@/config/env';
import { attachInterceptors } from './interceptors';

export const axiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 12_000,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});
attachInterceptors(axiosInstance);
