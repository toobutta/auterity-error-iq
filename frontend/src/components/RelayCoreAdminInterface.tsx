import React, { useState } from "react";
import { RelayCoreAdminInterfaceProps } from "../types/components";

export const RelayCoreAdminInterface: React.FC<
  RelayCoreAdminInterfaceProps
> = ({
  onBudgetUpdate: _onBudgetUpdate,
  onProviderChange: _onProviderChange,
}) => {
  const [budgetLimit, setBudgetLimit] = useState<number>(1000);
  const [currentUsage] = useState<number>(650);

  const providers = [
    { id: "openai", name: "OpenAI", cost: 0.002, status: "active" },
    { id: "anthropic", name: "Anthropic", cost: 0.008, status: "active" },
    { id: "google", name: "Google", cost: 0.001, status: "inactive" },
  ];

  const usagePercent = (currentUsage / budgetLimit) * 100;

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        RelayCore Admin Interface
      </h2>

      {/* Budget Management */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Budget Management
        </h3>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">
              Monthly Budget Limit: ${budgetLimit}
            </span>
            <span className="text-gray-800 font-medium">
              ${currentUsage} / ${budgetLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full"
              style={{ width: `${usagePercent}%` }}
            ></div>
          </div>
          <div className="mt-4">
            <label
              htmlFor="budget"
              className="block text-sm font-medium text-gray-700"
            >
              Set Budget Limit
            </label>
            <input
              type="range"
              id="budget"
              min="100"
              max="10000"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Provider Configuration */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Provider Configuration
        </h3>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`p-4 rounded-lg border-2 ${provider.status === "active" ? "border-green-500" : "border-gray-300"}`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-gray-800">{provider.name}</h4>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${provider.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {provider.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Cost: ${provider.cost}/1k tokens
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Analytics Placeholder */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Cost Analytics
        </h3>
        <div className="bg-white p-4 rounded-lg shadow text-center text-gray-500">
          <p>Cost analytics dashboard coming soon.</p>
        </div>
      </div>
    </div>
  );
};

export default RelayCoreAdminInterface;


