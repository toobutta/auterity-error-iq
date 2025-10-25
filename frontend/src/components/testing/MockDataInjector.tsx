import React, { useState, useCallback } from 'react';

interface MockDataItem {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
}

interface MockDataInjectorProps {
  mockData: Record<string, any>;
  onUpdateMockData: (key: string, value: any) => void;
  onRemoveMockData: (key: string) => void;
  onClearAllMockData: () => void;
}

export const MockDataInjector: React.FC<MockDataInjectorProps> = ({
  mockData,
  onUpdateMockData,
  onRemoveMockData,
  onClearAllMockData
}) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newType, setNewType] = useState<'string' | 'number' | 'boolean' | 'object' | 'array'>('string');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddMockData = useCallback(() => {
    if (!newKey.trim()) return;

    let parsedValue: any = newValue;

    try {
      switch (newType) {
        case 'number':
          parsedValue = parseFloat(newValue) || 0;
          break;
        case 'boolean':
          parsedValue = newValue.toLowerCase() === 'true';
          break;
        case 'object':
        case 'array':
          parsedValue = JSON.parse(newValue);
          break;
        default:
          parsedValue = newValue;
      }

      onUpdateMockData(newKey.trim(), parsedValue);
      setNewKey('');
      setNewValue('');
      setNewType('string');
      setShowAddForm(false);
    } catch (error) {
      alert('Invalid value format for selected type');
    }
  }, [newKey, newValue, newType, onUpdateMockData]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'string': return 'bg-blue-100 text-blue-800';
      case 'number': return 'bg-green-100 text-green-800';
      case 'boolean': return 'bg-yellow-100 text-yellow-800';
      case 'object': return 'bg-purple-100 text-purple-800';
      case 'array': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatValue = (value: any): string => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getValueType = (value: any): string => {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'null';
    return typeof value;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Mock Data Injector</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            {showAddForm ? 'Cancel' : '+ Add Data'}
          </button>
          {Object.keys(mockData).length > 0 && (
            <button
              onClick={onClearAllMockData}
              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Key name"
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="object">Object</option>
              <option value="array">Array</option>
            </select>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={`Value (${newType})`}
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddMockData}
              disabled={!newKey.trim()}
              className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
          <div className="text-xs text-gray-600">
            <p><strong>Tips:</strong></p>
            <p>• For objects/arrays, use valid JSON format: {"{key: 'value'}"} or ["item1", "item2"]</p>
            <p>• For booleans, use "true" or "false" (case insensitive)</p>
          </div>
        </div>
      )}

      {/* Mock Data List */}
      <div className="space-y-2">
        {Object.keys(mockData).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-sm">No mock data configured</p>
            <p className="text-xs">Add data that will be injected into your workflow during testing</p>
          </div>
        ) : (
          Object.entries(mockData).map(([key, value]) => (
            <div key={key} className="flex items-start space-x-3 p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900">{key}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(getValueType(value))}`}>
                    {getValueType(value)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 font-mono bg-white p-2 rounded border max-h-32 overflow-y-auto">
                  {formatValue(value)}
                </div>
              </div>
              <button
                onClick={() => onRemoveMockData(key)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Remove this mock data"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {Object.keys(mockData).length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{Object.keys(mockData).length}</span> mock data item{Object.keys(mockData).length !== 1 ? 's' : ''} configured
          </div>
        </div>
      )}
    </div>
  );
};


