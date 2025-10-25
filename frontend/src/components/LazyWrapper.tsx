import React, { Suspense } from "react";

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const DefaultFallback: React.FC = () => (
  <div className="flex items-center justify-center p-4 bg-gray-50 rounded">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
    <span className="text-gray-600">Loading component...</span>
  </div>
);

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback = <DefaultFallback />,
  className = "",
}) => {
  return (
    <div className={className}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </div>
  );
};

export default LazyWrapper;


