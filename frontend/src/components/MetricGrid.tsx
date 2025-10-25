import React from "react";

interface MetricGridProps {
  children: React.ReactNode;
  columns?: number;
  className?: string;
}

const MetricGrid: React.FC<MetricGridProps> = ({
  children,
  columns = 4,
  className = "",
}) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  const gridClass = gridCols[columns as keyof typeof gridCols] || gridCols[4];

  return (
    <div className={`grid ${gridClass} gap-6 ${className}`}>{children}</div>
  );
};

export default MetricGrid;


