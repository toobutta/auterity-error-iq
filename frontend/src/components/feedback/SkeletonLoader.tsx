import React from 'react';
import { cn } from '../../design-system/utils/cn';

// Skeleton loader variants
export const SKELETON_VARIANTS = {
  text: 'h-4 bg-gray-200 rounded',
  title: 'h-6 bg-gray-200 rounded w-3/4',
  avatar: 'w-10 h-10 bg-gray-200 rounded-full',
  button: 'h-10 bg-gray-200 rounded-md',
  card: 'bg-gray-200 rounded-lg',
  image: 'bg-gray-200 rounded aspect-video',
  table: 'h-4 bg-gray-200 rounded',
  input: 'h-10 bg-gray-200 rounded-md',
  badge: 'h-6 bg-gray-200 rounded-full w-16'
} as const;

// Skeleton loader component
export const SkeletonLoader: React.FC<{
  variant?: keyof typeof SKELETON_VARIANTS;
  className?: string;
  animate?: boolean;
  lines?: number;
}> = ({
  variant = 'text',
  className = '',
  animate = true,
  lines = 1
}) => {
  const baseClasses = SKELETON_VARIANTS[variant];
  const animationClasses = animate ? 'animate-pulse' : '';

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              animationClasses,
              className,
              index === lines - 1 ? 'w-2/3' : 'w-full' // Last line shorter
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, animationClasses, className)}
      role="presentation"
      aria-hidden="true"
    />
  );
};

// Card skeleton
export const CardSkeleton: React.FC<{
  className?: string;
  showAvatar?: boolean;
  showImage?: boolean;
  lines?: number;
}> = ({
  className = '',
  showAvatar = false,
  showImage = false,
  lines = 3
}) => (
  <div className={cn('p-6 bg-white rounded-lg shadow-sm border border-gray-200', className)}>
    {showImage && (
      <SkeletonLoader variant="image" className="mb-4" />
    )}

    <div className="flex items-center space-x-4 mb-4">
      {showAvatar && <SkeletonLoader variant="avatar" />}
      <div className="flex-1">
        <SkeletonLoader variant="title" className="mb-2" />
        <SkeletonLoader variant="text" className="w-1/2" />
      </div>
    </div>

    <SkeletonLoader variant="text" lines={lines} />
  </div>
);

// Table skeleton
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({
  rows = 5,
  columns = 4,
  className = ''
}) => (
  <div className={cn('space-y-3', className)}>
    {/* Table header skeleton */}
    <div className="flex space-x-4 pb-3 border-b border-gray-200">
      {Array.from({ length: columns }, (_, index) => (
        <SkeletonLoader
          key={index}
          variant="text"
          className={index === 0 ? 'w-1/4' : 'w-1/6'}
        />
      ))}
    </div>

    {/* Table rows skeleton */}
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4 py-3">
        {Array.from({ length: columns }, (_, colIndex) => (
          <SkeletonLoader
            key={colIndex}
            variant="text"
            className={colIndex === 0 ? 'w-1/4' : 'w-1/6'}
          />
        ))}
      </div>
    ))}
  </div>
);

// Form skeleton
export const FormSkeleton: React.FC<{
  fields?: number;
  className?: string;
  showButtons?: boolean;
}> = ({
  fields = 4,
  className = '',
  showButtons = true
}) => (
  <div className={cn('space-y-6', className)}>
    {Array.from({ length: fields }, (_, index) => (
      <div key={index} className="space-y-2">
        <SkeletonLoader variant="text" className="w-1/4" />
        <SkeletonLoader variant="input" />
      </div>
    ))}

    {showButtons && (
      <div className="flex space-x-4 pt-4">
        <SkeletonLoader variant="button" className="w-24" />
        <SkeletonLoader variant="button" className="w-20" />
      </div>
    )}
  </div>
);

// List skeleton
export const ListSkeleton: React.FC<{
  items?: number;
  className?: string;
  showAvatar?: boolean;
  showSubtitle?: boolean;
}> = ({
  items = 5,
  className = '',
  showAvatar = false,
  showSubtitle = false
}) => (
  <div className={cn('space-y-4', className)}>
    {Array.from({ length: items }, (_, index) => (
      <div key={index} className="flex items-center space-x-4">
        {showAvatar && <SkeletonLoader variant="avatar" />}
        <div className="flex-1 space-y-2">
          <SkeletonLoader variant="title" className="w-2/3" />
          {showSubtitle && (
            <SkeletonLoader variant="text" className="w-1/2" />
          )}
        </div>
        <SkeletonLoader variant="badge" />
      </div>
    ))}
  </div>
);

// Dashboard skeleton
export const DashboardSkeleton: React.FC<{
  className?: string;
}> = ({ className = '' }) => (
  <div className={cn('space-y-6', className)}>
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <SkeletonLoader variant="title" className="w-48" />
      <div className="flex space-x-2">
        <SkeletonLoader variant="button" className="w-20" />
        <SkeletonLoader variant="button" className="w-24" />
      </div>
    </div>

    {/* KPI cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>

    {/* Charts skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <SkeletonLoader variant="title" className="mb-4 w-32" />
        <SkeletonLoader variant="image" className="w-full h-64" />
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <SkeletonLoader variant="title" className="mb-4 w-32" />
        <SkeletonLoader variant="image" className="w-full h-64" />
      </div>
    </div>

    {/* Table skeleton */}
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <SkeletonLoader variant="title" className="mb-4 w-40" />
      <TableSkeleton rows={6} columns={5} />
    </div>
  </div>
);

// Profile skeleton
export const ProfileSkeleton: React.FC<{
  className?: string;
}> = ({ className = '' }) => (
  <div className={cn('space-y-6', className)}>
    {/* Profile header */}
    <div className="flex items-center space-x-6">
      <SkeletonLoader variant="avatar" className="w-20 h-20" />
      <div className="space-y-2">
        <SkeletonLoader variant="title" className="w-48" />
        <SkeletonLoader variant="text" className="w-32" />
        <SkeletonLoader variant="text" className="w-40" />
      </div>
    </div>

    {/* Profile content */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <SkeletonLoader variant="title" className="w-32" />
        <FormSkeleton fields={3} showButtons={false} />
      </div>
      <div className="space-y-4">
        <SkeletonLoader variant="title" className="w-32" />
        <FormSkeleton fields={2} showButtons={false} />
      </div>
    </div>
  </div>
);

// Content loading states
export const CONTENT_LOADING_STATES = {
  dashboard: DashboardSkeleton,
  profile: ProfileSkeleton,
  list: ListSkeleton,
  table: TableSkeleton,
  form: FormSkeleton,
  card: CardSkeleton
} as const;

// Utility function to get appropriate skeleton
export const getSkeletonFor = (
  type: keyof typeof CONTENT_LOADING_STATES,
  props?: any
) => {
  const SkeletonComponent = CONTENT_LOADING_STATES[type];
  return <SkeletonComponent {...props} />;
};
