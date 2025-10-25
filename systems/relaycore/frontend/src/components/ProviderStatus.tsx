import React from "react";

interface Provider {
  provider: string;
  total_requests: number;
  successful_requests: number;
  average_latency: number;
  average_cost: number;
  error_rate: number;
}

interface ProviderStatusProps {
  providers: Provider[];
}

export const ProviderStatus: React.FC<ProviderStatusProps> = ({
  providers,
}) => {
  const getStatusColor = (errorRate: number) => {
    if (errorRate < 0.01) return "text-green-400";
    if (errorRate < 0.05) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Provider Status</h3>

      {providers.length === 0 ? (
        <div className="text-gray-400">No provider data available</div>
      ) : (
        <div className="space-y-4">
          {providers.map((provider) => (
            <div
              key={provider.provider}
              className="border border-gray-700 rounded p-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold capitalize">
                  {provider.provider}
                </h4>
                <div
                  className={`text-sm ${getStatusColor(provider.error_rate)}`}
                >
                  {provider.error_rate < 0.01
                    ? "●"
                    : provider.error_rate < 0.05
                      ? "●"
                      : "●"}
                  {provider.error_rate < 0.01
                    ? " Healthy"
                    : provider.error_rate < 0.05
                      ? " Warning"
                      : " Error"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Requests:</span>
                  <span className="ml-2 text-white">
                    {provider.total_requests}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Success:</span>
                  <span className="ml-2 text-white">
                    {provider.successful_requests}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Latency:</span>
                  <span className="ml-2 text-white">
                    {provider.average_latency}ms
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Avg Cost:</span>
                  <span className="ml-2 text-white">
                    ${provider.average_cost.toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Error Rate:</span>
                  <span className={getStatusColor(provider.error_rate)}>
                    {(provider.error_rate * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


