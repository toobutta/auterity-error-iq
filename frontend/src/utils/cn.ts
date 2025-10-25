type ClassValue = string | number | boolean | undefined | null;

/**
 * Simple utility function to merge CSS classes
 * Handles conditional classes and filters out falsy values
 */
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .filter(Boolean)
    .filter((input): input is string => typeof input === 'string')
    .join(' ')
    .trim();
}


