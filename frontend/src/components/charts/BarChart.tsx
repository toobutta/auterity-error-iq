import React from "react";
import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PerformanceMetrics } from "../../types/performance";

interface BarChartProps {
  data: PerformanceMetrics[];
  type: "execution-time" | "success-rate" | "resource-usage";
  "aria-label"?: string;
  className?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  type,
  "aria-label": ariaLabel,
  className = "",
}) => {
  const getBarColor = () => {
    switch (type) {
      case "execution-time":
        return "#3B82F6"; // Blue
      case "success-rate":
        return "#10B981"; // Green
      case "resource-usage":
        return "#F59E0B"; // Amber
      default:
        return "#6B7280"; // Gray
    }
  };

  const formatTooltipValue = (value: number) => {
    switch (type) {
      case "execution-time":
        return value < 1000 ? `${value}ms` : `${(value / 1000).toFixed(2)}s`;
      case "success-rate":
        return `${(value * 100).toFixed(1)}%`;
      case "resource-usage":
        return `${value.toFixed(1)}%`;
      default:
        return `${value}`;
    }
  };

  const getYAxisLabel = () => {
    switch (type) {
      case "execution-time":
        return "Time (ms)";
      case "success-rate":
        return "Success Rate (%)";
      case "resource-usage":
        return "Usage (%)";
      default:
        return "Value";
    }
  };

  const getDataKey = () => {
    switch (type) {
      case "execution-time":
        return "executionTime";
      case "success-rate":
        return "successRate";
      case "resource-usage":
        return "resourceUsage.cpu";
      default:
        return "executionTime";
    }
  };

  const formatXAxisValue = (value: string | Date) => {
    const date = new Date(value);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const chartData = data.map((item) => ({
    ...item,
    timestamp:
      item.timestamp instanceof Date
        ? item.timestamp.toISOString()
        : item.timestamp,
    successRate: item.successRate ? item.successRate * 100 : 0, // Convert to percentage for display
  }));

  return (
    <div
      className={`w-full h-80 ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBar
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="timestamp"
            stroke="#6B7280"
            fontSize={12}
            tickFormatter={formatXAxisValue}
          />
          <YAxis
            stroke="#6B7280"
            fontSize={12}
            label={{
              value: getYAxisLabel(),
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: "6px",
            }}
            formatter={(value: number) => [
              formatTooltipValue(value),
              getYAxisLabel(),
            ]}
            labelFormatter={(label: string) =>
              `Time: ${formatXAxisValue(label)}`
            }
          />
          <Legend />
          <Bar
            dataKey={getDataKey()}
            fill={getBarColor()}
            radius={[2, 2, 0, 0]}
          />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
};


