/**
 * Modern utility functions for the Auterity Error-IQ frontend
 */

/**
 * Enhanced class name concatenation utility with conflict resolution
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  const classList = classes.filter(Boolean) as string[];
  const classMap = new Map<string, string>();

  // Simple deduplication for Tailwind classes
  classList.forEach((cls) => {
    cls.split(" ").forEach((singleClass) => {
      if (singleClass) {
        // Keep the last occurrence of conflicting classes
        classMap.set(singleClass, singleClass);
      }
    });
  });

  return Array.from(classMap.values()).join(" ");
}

/**
 * Format relative time with modern approach
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

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Format numbers with K/M/B suffixes
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
 * Get modern severity styling with dark mode support
 */
export function getSeverityStyles(
  severity: "critical" | "high" | "medium" | "low" | "info",
) {
  const styles = {
    critical:
      "bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
    high: "bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    medium:
      "bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    low: "bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
    info: "bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  };

  return styles[severity];
}

/**
 * Get severity icon (returns Unicode or emoji)
 */
export function getSeverityIcon(
  severity: "critical" | "high" | "medium" | "low" | "info",
): string {
  const icons = {
    critical: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🟢",
    info: "🔵",
  };

  return icons[severity];
}

/**
 * Debounce utility for search and filters
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

/**
 * Generate unique IDs for components
 */
export function generateId(prefix = "component"): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create accessible aria labels for screen readers
 */
export function getAriaLabel(
  severity: "critical" | "high" | "medium" | "low" | "info",
  context: string,
): string {
  const severityText = {
    critical: "Critical severity",
    high: "High severity",
    medium: "Medium severity",
    low: "Low severity",
    info: "Information",
  };

  return `${severityText[severity]} ${context}`;
}

/**
 * Modern loading state generator
 */
export function createSkeletonClass(className?: string): string {
  return cn(
    "animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded",
    className || "h-4 w-full",
  );
}

/**
 * Format file sizes
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}


