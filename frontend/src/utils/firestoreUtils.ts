import { Timestamp } from 'firebase/firestore';

// Convert Firestore Timestamp to JavaScript Date
export const toDate = (timestamp: Timestamp | undefined): Date | null => {
  return timestamp ? timestamp.toDate() : null;
};

// Convert JavaScript Date to Firestore Timestamp
export const toTimestamp = (date: Date | string | undefined): Timestamp | null => {
  if (!date) return null;
  
  const jsDate = typeof date === 'string' ? new Date(date) : date;
  return Timestamp.fromDate(jsDate);
};

// Format date to YYYY-MM-DD
export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

// Format currency (basic implementation, can be enhanced with Intl.NumberFormat)
export const formatCurrency = (amount: number, currency: string = 'TRY'): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Calculate percentage change
export const calculatePercentageChange = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
};

// Generate a unique ID (for client-side ID generation)
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate password strength
export const isPasswordStrong = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])(?=.{8,})/;
  return re.test(password);
};

// Format number with commas as thousand separators
export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};
