import React, { useState } from 'react';

interface RelayCoreAdminInterfaceProps {
  onBudgetUpdate?: (budget: number) => void;
  onProviderChange?: (provider: string) => void;
}

export const RelayCoreAdminInterface: React.FC<RelayCoreAdminInterfaceProps> = ({
  onBudgetUpdate,
  onProviderChange,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [budgetLimit, setBudgetLimit] = useState<number>(1000);
  const [currentUsage, setCurrentUsage] = useState<number>(650);

  const providers = [
    { id: 'openai', name: 'OpenAI', cost: 0.002, status: 'active' },
    { id: 'anthropic', name: 'Anthropic', cost: 0.008, status: 'active' },
    { id: 'google', name: 'Google', cost: 0.001, status: 'active' },
  ];

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    onProviderChange?.(providerId);
  };

  const handleBudgetUpdate = (newBudget: number) => {
    setBudgetLimit(newBudget);
    onBudgetUpdate?.(newBudget);
  };

  const usagePercentage = (currentUsage / budgetLimit) * 100;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">RelayCore Admin</h1>
        <div className="w-3 h-3 bg-green-500 rounded-full" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Current Budget</h3>
          <p className="text-2xl font-bold text-gray-900">${currentUsage.toFixed(2)}</p>
          <p className="text-sm text-gray-500">of ${budgetLimit.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Providers</h3>
          <p className="text-2xl font-bold text-gray-900">
            {providers.filter(p => p.status === 'active').length}
          </p>
          <p className="text-sm text-gray-500">configured</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Cost Efficiency</h3>
          <p className="text-2xl font-bold text-gray-900">${(currentUsage / 1000).toFixed(4)}</p>
          <p className="text-sm text-gray-500">per 1K tokens</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Budget Management</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget Limit: ${budgetLimit}
            </label>
            <input
              type="range"
              min="100"
              max="5000"
              value={budgetLimit}
              onChange={(e) => handleBudgetUpdate(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${usagePercentage > 80 ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-md font-medium mb-3">Provider Configuration</h3>
          <div className="space-y-2">
            {providers.map((provider) => (
              <div key={provider.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="font-medium">{provider.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ${provider.cost}/token
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  provider.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {provider.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
