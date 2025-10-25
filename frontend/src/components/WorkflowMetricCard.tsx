import React from "react";

interface WorkflowMetricCardProps {
  title: string;
  value: string | number;
  change: string;
  changeType: "positive" | "negative";
  onClick: () => void;
}

const WorkflowMetricCard: React.FC<WorkflowMetricCardProps> = ({
  title,
  value,
  change,
  changeType,
  onClick,
}) => {
  return (
    <div
      className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md cursor-pointer"
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
        {value}
      </p>
      <p
        className={`text-sm ${changeType === "positive" ? "text-green-500" : "text-red-500"}`}
      >
        {change}
      </p>
    </div>
  );
};

export default WorkflowMetricCard;


