import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, fmt = 'dd MMM yyyy'): string {
  return format(new Date(date), fmt)
}

export function formatDatetime(date: Date | string): string {
  return format(new Date(date), 'dd MMM yyyy, HH:mm')
}

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function formatCurrency(pence: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100)
}

export function formatOvers(overs: number): string {
  const full = Math.floor(overs)
  const balls = Math.round((overs - full) * 10)
  return `${full}.${balls}`
}

export function getBattingAverage(runs: number, dismissals: number): string {
  if (dismissals === 0) return 'N/A'
  return (runs / dismissals).toFixed(2)
}

export function getBowlingAverage(runs: number, wickets: number): string {
  if (wickets === 0) return 'N/A'
  return (runs / wickets).toFixed(2)
}

export function getEconomyRate(runs: number, overs: number): string {
  if (overs === 0) return 'N/A'
  return (runs / overs).toFixed(2)
}

export function getStrikeRate(runs: number, balls: number): string {
  if (balls === 0) return 'N/A'
  return ((runs / balls) * 100).toFixed(2)
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen) + '...'
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()
}

export function getMatchResultColor(result: string | null): string {
  switch (result) {
    case 'WIN': return 'text-green-600 bg-green-50'
    case 'LOSS': return 'text-red-600 bg-red-50'
    case 'DRAW': return 'text-yellow-600 bg-yellow-50'
    case 'TIE': return 'text-orange-600 bg-orange-50'
    default: return 'text-gray-600 bg-gray-50'
  }
}
