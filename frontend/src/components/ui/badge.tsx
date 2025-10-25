import * as React from "react";
import { cn, getSeverityStyles, getSeverityIcon } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  severity?: "critical" | "high" | "medium" | "low" | "info";
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  icon?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      className,
      variant = "default",
      severity,
      size = "md",
      pulse = false,
      icon = false,
      children,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      "inline-flex items-center font-medium rounded-full transition-all duration-200";

    const sizeClasses = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-xs",
      lg: "px-3 py-1.5 text-sm",
    };

    const variantClasses = {
      default:
        "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
      secondary:
        "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
      destructive:
        "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
      outline:
        "text-neutral-950 border border-neutral-200 dark:border-neutral-800 dark:text-neutral-50",
      ghost:
        "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800",
    };

    // Use severity styling if provided, otherwise use variant
    const finalClasses = severity
      ? getSeverityStyles(severity)
      : variantClasses[variant];

    const pulseClasses = pulse ? "animate-pulse" : "";

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          finalClasses,
          pulseClasses,
          className,
        )}
        {...props}
      >
        {icon && severity && (
          <span className="mr-1 text-xs" aria-hidden="true">
            {getSeverityIcon(severity)}
          </span>
        )}
        {children}
      </div>
    );
  },
);

Badge.displayName = "Badge";

// Specialized Error-IQ severity badge
export interface SeverityBadgeProps
  extends Omit<BadgeProps, "variant" | "severity"> {
  severity: "critical" | "high" | "medium" | "low" | "info";
  showIcon?: boolean;
  showPulse?: boolean;
}

const SeverityBadge = React.forwardRef<HTMLDivElement, SeverityBadgeProps>(
  (
    { severity, showIcon = true, showPulse = false, children, ...props },
    ref,
  ) => {
    const severityLabels = {
      critical: "Critical",
      high: "High",
      medium: "Medium",
      low: "Low",
      info: "Info",
    };

    return (
      <Badge
        ref={ref}
        severity={severity}
        icon={showIcon}
        pulse={showPulse && severity === "critical"}
        aria-label={`${severityLabels[severity]} severity level`}
        {...props}
      >
        {children || severityLabels[severity]}
      </Badge>
    );
  },
);

SeverityBadge.displayName = "SeverityBadge";

// Status badge for workflow states
export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: "active" | "pending" | "resolved" | "ignored" | "investigating";
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, children, ...props }, ref) => {
    const statusConfig = {
      active: {
        variant: "destructive" as const,
        label: "Active",
        icon: "🔴",
      },
      pending: {
        variant: "default" as const,
        label: "Pending",
        icon: "🟡",
      },
      resolved: {
        variant: "default" as const,
        label: "Resolved",
        icon: "✅",
      },
      ignored: {
        variant: "secondary" as const,
        label: "Ignored",
        icon: "⭕",
      },
      investigating: {
        variant: "default" as const,
        label: "Investigating",
        icon: "🔍",
      },
    };

    const config = statusConfig[status];

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        aria-label={`Status: ${config.label}`}
        {...props}
      >
        <span className="mr-1" aria-hidden="true">
          {config.icon}
        </span>
        {children || config.label}
      </Badge>
    );
  },
);

StatusBadge.displayName = "StatusBadge";

export { Badge, SeverityBadge, StatusBadge };


