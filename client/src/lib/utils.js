import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const SITE_BASE_URL = 'https://www.codecircle.online'

export function getApiBase() {
  const rawApiBase = import.meta.env.VITE_API_URL || '/api'
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && rawApiBase.includes('localhost')) {
    return '/api'
  }
  return rawApiBase.endsWith('/api') ? rawApiBase : `${rawApiBase.replace(/\/$/, '')}/api`
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read image file'))
    reader.readAsDataURL(file)
  })
}
