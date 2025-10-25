import * as React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "elevated" | "outline";
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className, variant = "default", interactive = false, children, ...props },
    ref,
  ) => {
    const baseClasses = "rounded-xl transition-all duration-300";

    const variantClasses = {
      default:
        "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-soft",
      glass: "glass backdrop-blur-xl",
      elevated: "bg-white dark:bg-neutral-900 shadow-xl border-0",
      outline:
        "bg-transparent border-2 border-neutral-200 dark:border-neutral-800",
    };

    const interactiveClasses = interactive
      ? "hover-lift cursor-pointer hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
      : "";

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          interactiveClasses,
          className,
        )}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? "button" : undefined}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "compact";
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "p-6 pb-4",
      compact: "p-4 pb-2",
    };

    return (
      <div
        ref={ref}
        className={cn(variantClasses[variant], className)}
        {...props}
      />
    );
  },
);

CardHeader.displayName = "CardHeader";

export interface CardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, level = 3, children, ...props }, ref) => {
    const Component = `h${level}` as keyof JSX.IntrinsicElements;

    return (
      <Component
        ref={ref}
        className={cn(
          "font-semibold leading-none tracking-tight",
          level <= 2 ? "text-2xl" : level === 3 ? "text-xl" : "text-lg",
          "text-neutral-900 dark:text-neutral-100",
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

CardTitle.displayName = "CardTitle";

export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-neutral-600 dark:text-neutral-400 mt-2",
      className,
    )}
    {...props}
  />
));

CardDescription.displayName = "CardDescription";

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "compact" | "none";
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "p-6 pt-0",
      compact: "p-4 pt-0",
      none: "",
    };

    return (
      <div
        ref={ref}
        className={cn(variantClasses[variant], className)}
        {...props}
      />
    );
  },
);

CardContent.displayName = "CardContent";

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "compact";
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variantClasses = {
      default: "p-6 pt-0",
      compact: "p-4 pt-0",
    };

    return (
      <div
        ref={ref}
        className={cn("flex items-center", variantClasses[variant], className)}
        {...props}
      />
    );
  },
);

CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};


