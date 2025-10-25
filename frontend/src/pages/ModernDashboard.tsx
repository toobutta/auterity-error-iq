import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MetricCard from "../components/MetricCard";
import MetricGrid from "../components/MetricGrid";
import RevenueMetricCard from "../components/RevenueMetricCard";
import CustomerMetricCard from "../components/CustomerMetricCard";
import WorkflowMetricCard from "../components/WorkflowMetricCard";
import ServiceMetricCard from "../components/ServiceMetricCard";

const mockMetrics = {
  activeWorkflows: {
    value: 147,
    change: "+12%",
    changeType: "positive" as const,
  },
  customerInquiries: {
    value: 89,
    change: "+8%",
    changeType: "positive" as const,
  },
  serviceAppointments: {
    value: 234,
    change: "+15%",
    changeType: "positive" as const,
  },
  monthlyRevenue: {
    value: "$45.2k",
    change: "+22%",
    changeType: "positive" as const,
  },
  inventoryTurnover: {
    value: 8.3,
    change: "+5%",
    changeType: "positive" as const,
  },
  customerSatisfaction: {
    value: "4.8/5",
    change: "+0.2",
    changeType: "positive" as const,
  },
};

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const handleNewVehicle = useCallback(() => {
    navigate("/inventory/new");
  }, [navigate]);

  const handleScheduleService = useCallback(() => {
    navigate("/service/schedule");
  }, [navigate]);

  const handleViewReports = useCallback(() => {
    navigate("/reports");
  }, [navigate]);

  const handleManageInventory = useCallback(() => {
    navigate("/inventory");
  }, [navigate]);

  return (
    <div className="flex flex-wrap gap-3">
      <button onClick={handleNewVehicle} className="btn-automotive-primary">
        <span className="mr-2">🚗</span>
        New Vehicle Entry
      </button>
      <button
        onClick={handleScheduleService}
        className="btn-automotive-secondary"
      >
        <span className="mr-2">📅</span>
        Schedule Service
      </button>
      <button onClick={handleViewReports} className="btn-automotive-secondary">
        <span className="mr-2">📊</span>
        View Reports
      </button>
      <button
        onClick={handleManageInventory}
        className="btn-automotive-secondary"
      >
        <span className="mr-2">📦</span>
        Manage Inventory
      </button>
    </div>
  );
};

const RecentActivityFeed: React.FC = () => {
  const activities = useMemo(
    () => [
      {
        id: 1,
        type: "sale",
        message: "New vehicle sold: 2024 Honda Civic",
        time: "2 minutes ago",
        icon: "🚗",
      },
      {
        id: 2,
        type: "service",
        message: "Service appointment completed for Customer #1234",
        time: "15 minutes ago",
        icon: "🔧",
      },
      {
        id: 3,
        type: "inquiry",
        message: "New customer inquiry for SUV models",
        time: "1 hour ago",
        icon: "📞",
      },
      {
        id: 4,
        type: "finance",
        message: "Loan application approved for $25,000",
        time: "2 hours ago",
        icon: "💰",
      },
      {
        id: 5,
        type: "inventory",
        message: "Low stock alert: 2024 Toyota Camry",
        time: "3 hours ago",
        icon: "📦",
      },
    ],
    [],
  );

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/10 dark:hover:bg-slate-800/30 transition-colors"
        >
          <div className="text-2xl">{activity.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 dark:text-white font-medium">
              {activity.message}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {activity.time}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

const SystemStatus: React.FC = () => {
  const systems = useMemo(
    () => [
      { name: "AutoMatrix Core", status: "operational", uptime: "99.9%" },
      { name: "Inventory Sync", status: "operational", uptime: "99.8%" },
      { name: "Customer Portal", status: "operational", uptime: "99.7%" },
      { name: "Payment Gateway", status: "operational", uptime: "99.9%" },
    ],
    [],
  );

  return (
    <div className="space-y-3">
      {systems.map((system) => (
        <div
          key={system.name}
          className="flex items-center justify-between p-3 rounded-lg bg-white/5 dark:bg-slate-800/20"
        >
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {system.name}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {system.uptime}
          </span>
        </div>
      ))}
    </div>
  );
};

const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <MetricCard key={i} title="" value="" loading={true} />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
      <div className="glass-card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics] = useState(mockMetrics);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleNavigateToWorkflows = useCallback(() => {
    navigate("/workflows");
  }, [navigate]);

  const handleNavigateToCustomers = useCallback(() => {
    navigate("/customers");
  }, [navigate]);

  const handleNavigateToService = useCallback(() => {
    navigate("/service");
  }, [navigate]);

  const handleNavigateToFinancials = useCallback(() => {
    navigate("/financials");
  }, [navigate]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AutoMatrix AI Hub - Dealership Operations Overview
          </p>
        </div>
        <QuickActions />
      </div>

      <MetricGrid columns={4}>
        <WorkflowMetricCard
          title="Active Workflows"
          value={metrics.activeWorkflows.value}
          change={metrics.activeWorkflows.change}
          changeType={metrics.activeWorkflows.changeType}
          onClick={handleNavigateToWorkflows}
        />
        <CustomerMetricCard
          title="Customer Inquiries"
          value={metrics.customerInquiries.value}
          change={metrics.customerInquiries.change}
          changeType={metrics.customerInquiries.changeType}
          onClick={handleNavigateToCustomers}
        />
        <ServiceMetricCard
          title="Service Appointments"
          value={metrics.serviceAppointments.value}
          change={metrics.serviceAppointments.change}
          changeType={metrics.serviceAppointments.changeType}
          onClick={handleNavigateToService}
        />
        <RevenueMetricCard
          title="Monthly Revenue"
          value={metrics.monthlyRevenue.value}
          change={metrics.monthlyRevenue.change}
          changeType={metrics.monthlyRevenue.changeType}
          onClick={handleNavigateToFinancials}
        />
      </MetricGrid>

      <MetricGrid columns={2}>
        <MetricCard
          title="Inventory Turnover"
          value={metrics.inventoryTurnover.value}
          change={metrics.inventoryTurnover.change}
          changeType={metrics.inventoryTurnover.changeType}
          icon="📦"
          gradient="bg-gradient-to-r from-cyan-500 to-blue-600"
        />
        <MetricCard
          title="Customer Satisfaction"
          value={metrics.customerSatisfaction.value}
          change={metrics.customerSatisfaction.change}
          changeType={metrics.customerSatisfaction.changeType}
          icon="⭐"
          gradient="bg-gradient-to-r from-purple-500 to-pink-600"
        />
      </MetricGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Workflow Performance
              </h2>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-xs bg-automotive-primary text-white rounded-full">
                  7 Days
                </button>
                <button className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-white/10 rounded-full">
                  30 Days
                </button>
                <button className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-white/10 rounded-full">
                  90 Days
                </button>
              </div>
            </div>

            <div className="h-64 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800/50 dark:to-slate-700/50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">📈</div>
                <p className="text-gray-600 dark:text-gray-400">
                  Performance Chart
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Integration with charting library needed
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            <RecentActivityFeed />
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              System Status
            </h2>
            <SystemStatus />
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Dealership Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 rounded-lg bg-white/5 dark:bg-slate-800/20">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Top Performing
            </h3>
            <p className="text-automotive-accent font-medium">
              Sales Department
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              125% of monthly target
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-white/5 dark:bg-slate-800/20">
            <div className="text-3xl mb-2">🚗</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Best Seller
            </h3>
            <p className="text-automotive-accent font-medium">
              2024 Honda Civic
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              23 units sold this month
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-white/5 dark:bg-slate-800/20">
            <div className="text-3xl mb-2">⏱️</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Avg. Response Time
            </h3>
            <p className="text-automotive-success font-medium">2.3 minutes</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Customer inquiries
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


