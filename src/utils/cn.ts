import { type ClassValue, clsx } from 'clsx';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes
 */
export const cn = (...classes: ClassValue[]): string => {
  return clsx(...classes);
};
