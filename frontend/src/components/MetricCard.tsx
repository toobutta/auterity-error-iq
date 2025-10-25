interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend = "neutral",
  className = "",
}) => (
  <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <div className="mt-2 flex items-baseline">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {change && (
        <p
          className={`ml-2 text-sm ${
            trend === "up"
              ? "text-green-600"
              : trend === "down"
                ? "text-red-600"
                : "text-gray-500"
          }`}
        >
          {change}
        </p>
      )}
    </div>
  </div>
);

export default MetricCard;


