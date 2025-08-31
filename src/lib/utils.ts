import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

const FORMAT_THRESHOLDS = {
  MILLION: 1000000,
  THOUSAND: 1000,
} as const;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString();
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString();
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  
  const days = Math.floor(diff / TIME_CONSTANTS.DAY);
  const hours = Math.floor(diff / TIME_CONSTANTS.HOUR);
  const minutes = Math.floor(diff / TIME_CONSTANTS.MINUTE);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

export function truncateText(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : text.substring(0, maxLength) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatNumber(num: number): string {
  if (num >= FORMAT_THRESHOLDS.MILLION) {
    return `${(num / FORMAT_THRESHOLDS.MILLION).toFixed(1)}M`;
  }
  if (num >= FORMAT_THRESHOLDS.THOUSAND) {
    return `${(num / FORMAT_THRESHOLDS.THOUSAND).toFixed(1)}K`;
  }
  return num.toString();
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function generateId(prefix?: string): string {
  const id = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}-${id}` : id;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const attempt = async () => {
      attempts++;
      
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        if (attempts >= maxAttempts) {
          reject(error);
        } else {
          setTimeout(() => {
            void attempt();
          }, delay * attempts);
        }
      }
    };
    
    void attempt();
  });
}