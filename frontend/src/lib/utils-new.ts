/**
 * Utility functions for the Auterity Error-IQ frontend
 */

/**
 * Simple class name concatenation utility
 * This will be replaced with clsx + tailwind-merge when dependencies are installed
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format relative time (for error timestamps)
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  return date.toLocaleDateString();
}

/**
 * Format numbers with appropriate suffixes (for metrics)
 */
export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }

  if (num < 1000000) {
    return `${(num / 1000).toFixed(1)}K`;
  }

  if (num < 1000000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }

  return `${(num / 1000000000).toFixed(1)}B`;
}

/**
 * Get severity color classes
 */
export function getSeverityStyles(
  severity: "critical" | "high" | "medium" | "low" | "info",
) {
  const styles = {
    critical: "bg-red-50 text-red-700 border-red-200",
    high: "bg-orange-50 text-orange-700 border-orange-200",
    medium: "bg-yellow-50 text-yellow-700 border-yellow-200",
    low: "bg-lime-50 text-lime-700 border-lime-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };

  return styles[severity];
}


