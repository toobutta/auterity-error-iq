import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Calendar,
  CreditCard,
  PieChart,
  Target,
  Clock,
  Settings,
  Plus,
  CheckCircle,
} from "lucide-react";

interface BudgetData {
  totalBudget: number;
  usedAmount: number;
  remainingAmount: number;
  period: string;
  startDate: string;
  endDate: string;
}

interface CostBreakdown {
  provider: string;
  amount: number;
  percentage: number;
  trend: "up" | "down" | "stable";
}

interface CostAlert {
  id: string;
  type: "warning" | "critical";
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: string;
}

const BudgetMonitoring: React.FC = () => {
  const [budget] = useState<BudgetData>({
    totalBudget: 500,
    usedAmount: 247.5,
    remainingAmount: 252.5,
    period: "monthly",
    startDate: "2025-08-01",
    endDate: "2025-08-31",
  });

  const [costBreakdown] = useState<CostBreakdown[]>([
    { provider: "OpenAI", amount: 145.3, percentage: 58.7, trend: "up" },
    { provider: "Anthropic", amount: 78.2, percentage: 31.6, trend: "stable" },
    { provider: "NeuroWeaver", amount: 24.0, percentage: 9.7, trend: "down" },
  ]);

  const [alerts, setAlerts] = useState<CostAlert[]>([
    {
      id: "1",
      type: "warning",
      message: "OpenAI usage approaching 60% of budget",
      threshold: 60,
      currentValue: 58.7,
      timestamp: "2025-08-24T11:45:00Z",
    },
    {
      id: "2",
      type: "critical",
      message: "Total budget usage exceeds 80%",
      threshold: 80,
      currentValue: 49.5,
      timestamp: "2025-08-24T10:30:00Z",
    },
  ]);

  const [dailyCosts] = useState([
    { date: "2025-08-18", amount: 12.45 },
    { date: "2025-08-19", amount: 15.2 },
    { date: "2025-08-20", amount: 8.9 },
    { date: "2025-08-21", amount: 22.15 },
    { date: "2025-08-22", amount: 18.75 },
    { date: "2025-08-23", amount: 25.3 },
    { date: "2025-08-24", amount: 14.65 },
  ]);

  const budgetUsage = (budget.usedAmount / budget.totalBudget) * 100;
  const daysRemaining = Math.ceil(
    (new Date(budget.endDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const dailyBudget = budget.remainingAmount / Math.max(daysRemaining, 1);

  const getStatusColor = (usage: number) => {
    if (usage >= 90) return "text-red-600";
    if (usage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const getStatusText = (usage: number) => {
    if (usage >= 90) return "Critical";
    if (usage >= 75) return "Warning";
    return "Healthy";
  };

  const dismissAlert = (alertId: string) => {
    setAlerts((prevAlerts) =>
      prevAlerts.filter((alert) => alert.id !== alertId),
    );
  };

  const CostBreakdownChart = ({ data }: { data: CostBreakdown[] }) => (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={item.provider} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: `hsl(${index * 120}, 70%, 50%)` }}
            ></div>
            <span className="text-sm font-medium text-gray-900">
              {item.provider}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-semibold text-gray-900">
              ${item.amount.toFixed(2)}
            </span>
            <span className="text-sm text-gray-600">
              {item.percentage.toFixed(1)}%
            </span>
            <div
              className={`flex items-center ${item.trend === "up" ? "text-red-600" : item.trend === "down" ? "text-green-600" : "text-gray-600"}`}
            >
              {item.trend === "up" && <TrendingUp className="h-4 w-4" />}
              {item.trend === "down" && <TrendingDown className="h-4 w-4" />}
              {item.trend === "stable" && (
                <div className="h-4 w-4 border-t-2 border-gray-600" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const DailyCostChart = ({ data }: { data: any[] }) => (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-end justify-between h-32 space-x-2">
        {data.map((day) => (
          <div key={day.date} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
              style={{
                height: `${(day.amount / Math.max(...data.map((d) => d.amount))) * 100}%`,
                minHeight: "4px",
              }}
            ></div>
            <span className="text-xs text-gray-600 mt-2">
              {new Date(day.date).getDate()}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">Daily Cost Trend (Last 7 Days)</p>
      </div>
    </div>
  );

  const AlertItem = ({
    alert,
    onDismiss,
  }: {
    alert: CostAlert;
    onDismiss: (id: string) => void;
  }) => (
    <div
      className={`p-4 rounded-lg border ${
        alert.type === "critical"
          ? "bg-red-50 border-red-200"
          : "bg-yellow-50 border-yellow-200"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertTriangle
            className={`h-5 w-5 mt-0.5 ${
              alert.type === "critical" ? "text-red-600" : "text-yellow-600"
            }`}
          />
          <div>
            <p className="text-sm font-medium text-gray-900">{alert.message}</p>
            <p className="text-xs text-gray-600 mt-1">
              Threshold: {alert.threshold}% | Current:{" "}
              {alert.currentValue.toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {new Date(alert.timestamp).toLocaleTimeString()}
          </span>
          <button
            onClick={() => onDismiss(alert.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Dismiss alert"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Budget Monitoring
          </h1>
          <p className="text-gray-600 mt-2">
            Track and manage AI provider costs and budget allocation
          </p>
        </div>

        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Budget
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${budget.totalBudget.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-50">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Used</p>
                <p className="text-2xl font-bold text-red-600">
                  ${budget.usedAmount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600">
                  {budgetUsage.toFixed(1)}% used
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-50">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-green-600">
                  ${budget.remainingAmount.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600">
                  {daysRemaining} days left
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-50">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Daily Budget
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  ${dailyBudget.toFixed(2)}
                </p>
                <p className="text-xs text-gray-600">per day remaining</p>
              </div>
              <div className="p-3 rounded-full bg-purple-50">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Budget Usage Progress */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Budget Usage
            </h2>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(budgetUsage)} bg-current`}
            >
              {getStatusText(budgetUsage)}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Current Usage</span>
              <span className="font-medium">
                {budgetUsage.toFixed(1)}% of budget
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-300 ${
                  budgetUsage >= 90
                    ? "bg-red-500"
                    : budgetUsage >= 75
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${budgetUsage}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>${budget.usedAmount.toFixed(2)} used</span>
              <span>${budget.remainingAmount.toFixed(2)} remaining</span>
            </div>
          </div>
        </div>

        {/* Cost Breakdown & Daily Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Cost Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Cost Breakdown by Provider
              </h2>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <CostBreakdownChart data={costBreakdown} />
          </div>

          {/* Daily Cost Trends */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Daily Cost Trends
              </h2>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <DailyCostChart data={dailyCosts} />
          </div>
        </div>

        {/* Cost Alerts */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Cost Alerts</h2>
            <button className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
              <Settings className="h-4 w-4" />
              <span>Configure Alerts</span>
            </button>
          </div>

          <div className="space-y-4">
            {alerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onDismiss={dismissAlert}
              />
            ))}
          </div>

          {alerts.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-gray-600">No cost alerts at this time</p>
            </div>
          )}
        </div>

        {/* Budget Settings */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Budget Settings
            </h2>
            <button className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4" />
              <span>Add Budget Rule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">
                  Monthly Budget
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Set monthly spending limits
              </p>
              <p className="text-lg font-semibold text-gray-900">
                ${budget.totalBudget}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-medium text-gray-900">
                  Alert Thresholds
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Configure spending alerts
              </p>
              <p className="text-lg font-semibold text-gray-900">75% / 90%</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-3 mb-3">
                <Clock className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">
                  Reset Schedule
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Automatic budget reset
              </p>
              <p className="text-lg font-semibold text-gray-900">
                1st of month
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetMonitoring;


