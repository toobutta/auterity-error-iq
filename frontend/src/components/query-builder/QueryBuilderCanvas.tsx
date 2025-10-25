import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDatabaseQueryBuilder } from '../../hooks/useDatabaseQueryBuilder';
import { Node, Edge } from '@xyflow/react';
import { NodeData } from '../../types/workflow';

interface QueryBuilderCanvasProps {
  connectionId?: string;
  onQueryGenerated?: (query: any) => void;
  onQueryExecuted?: (result: any) => void;
}

export const QueryBuilderCanvas: React.FC<QueryBuilderCanvasProps> = ({
  connectionId,
  onQueryGenerated,
  onQueryExecuted
}) => {
  const {
    currentConnection,
    tables,
    queryElements,
    addQueryElement,
    removeQueryElement,
    updateQueryElement,
    generatedQuery,
    executeQuery,
    isExecuting,
    clearCanvas
  } = useDatabaseQueryBuilder({ connectionId });

  const [draggedElement, setDraggedElement] = useState<any>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle drag start from sidebar
  const handleDragStart = useCallback((elementType: string, data?: any) => {
    setDraggedElement({ type: elementType, data });
  }, []);

  // Handle drop on canvas
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    if (!draggedElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const elementData = {
      type: draggedElement.type,
      position: { x, y },
      ...draggedElement.data
    };

    addQueryElement(elementData);
    setDraggedElement(null);
  }, [draggedElement, addQueryElement]);

  // Handle drag over
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  // Handle element selection
  const handleElementClick = useCallback((elementId: string) => {
    setSelectedElement(elementId === selectedElement ? null : elementId);
  }, [selectedElement]);

  // Handle element position update
  const handleElementMove = useCallback((elementId: string, newPosition: { x: number; y: number }) => {
    updateQueryElement(elementId, { position: newPosition });
  }, [updateQueryElement]);

  // Handle element property update
  const handleElementUpdate = useCallback((elementId: string, updates: any) => {
    updateQueryElement(elementId, updates);
  }, [updateQueryElement]);

  // Render query element on canvas
  const renderQueryElement = useCallback((element: any) => {
    const isSelected = selectedElement === element.id;

    const baseClasses = `
      absolute cursor-move border-2 rounded-lg p-3 bg-white shadow-md
      transition-all duration-200 hover:shadow-lg
      ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
    `;

    switch (element.type) {
      case 'table':
        return (
          <div
            key={element.id}
            className={`${baseClasses} w-48`}
            style={{ left: element.position.x, top: element.position.y }}
            onClick={() => handleElementClick(element.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="font-semibold text-sm">Table</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeQueryElement(element.id);
                }}
                className="text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </div>
            <div className="text-sm text-gray-700 font-medium">{element.table}</div>
            <div className="text-xs text-gray-500 mt-1">
              {tables.find(t => t.name === element.table)?.rowCount || 0} rows
            </div>
          </div>
        );

      case 'column':
        return (
          <div
            key={element.id}
            className={`${baseClasses} w-40`}
            style={{ left: element.position.x, top: element.position.y }}
            onClick={() => handleElementClick(element.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="font-semibold text-sm">Column</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeQueryElement(element.id);
                }}
                className="text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </div>
            <div className="text-sm text-gray-700">{element.column}</div>
            <div className="text-xs text-gray-500">{element.table}</div>
          </div>
        );

      case 'filter':
        return (
          <div
            key={element.id}
            className={`${baseClasses} w-56`}
            style={{ left: element.position.x, top: element.position.y }}
            onClick={() => handleElementClick(element.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="font-semibold text-sm">Filter</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeQueryElement(element.id);
                }}
                className="text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </div>
            <div className="text-sm text-gray-700">
              {element.table}.{element.column} {element.operator} {element.value || '...'}
            </div>
          </div>
        );

      case 'join':
        return (
          <div
            key={element.id}
            className={`${baseClasses} w-64`}
            style={{ left: element.position.x, top: element.position.y }}
            onClick={() => handleElementClick(element.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="font-semibold text-sm">Join</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeQueryElement(element.id);
                }}
                className="text-gray-400 hover:text-red-500"
              >
                ×
              </button>
            </div>
            <div className="text-sm text-gray-700">
              <div className="font-medium capitalize">{element.joinType || 'inner'} join</div>
              <div className="text-xs mt-1">{element.joinTable}</div>
              <div className="text-xs text-gray-500">{element.joinCondition}</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [selectedElement, handleElementClick, removeQueryElement, tables]);

  // Notify parent when query is generated
  useEffect(() => {
    if (generatedQuery && onQueryGenerated) {
      onQueryGenerated(generatedQuery);
    }
  }, [generatedQuery, onQueryGenerated]);

  if (!currentConnection) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="text-4xl mb-4">🔌</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Database Connection</h3>
          <p className="text-gray-600">Connect to a database to start building queries</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Query Elements</h3>

        {/* Tables */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Tables</h4>
          <div className="space-y-2">
            {tables.map((table) => (
              <div
                key={table.name}
                draggable
                onDragStart={() => handleDragStart('table', { table: table.name })}
                className="p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="font-medium text-sm text-gray-900">{table.name}</div>
                <div className="text-xs text-gray-500">{table.columns.length} columns</div>
              </div>
            ))}
          </div>
        </div>

        {/* Query Operations */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Operations</h4>
          <div className="space-y-2">
            {[
              { type: 'filter', label: 'Filter', icon: '🔍' },
              { type: 'join', label: 'Join', icon: '🔗' },
              { type: 'group', label: 'Group By', icon: '📊' },
              { type: 'sort', label: 'Sort', icon: '↕️' },
              { type: 'limit', label: 'Limit', icon: '📏' }
            ].map((op) => (
              <div
                key={op.type}
                draggable
                onDragStart={() => handleDragStart(op.type)}
                className="p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:border-blue-300 hover:shadow-sm transition-all flex items-center space-x-3"
              >
                <span className="text-lg">{op.icon}</span>
                <span className="font-medium text-sm text-gray-900">{op.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={clearCanvas}
            className="w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear Canvas
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <div
          ref={canvasRef}
          className="h-full bg-white relative overflow-hidden"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {/* Grid Background */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />

          {/* Query Elements */}
          {queryElements.map(renderQueryElement)}

          {/* Empty State */}
          {queryElements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Building Your Query</h3>
                <p className="text-gray-600">Drag tables and operations from the sidebar to build your query</p>
              </div>
            </div>
          )}

          {/* Connection Lines (simplified) */}
          {queryElements.length > 1 && (
            <svg className="absolute inset-0 pointer-events-none">
              {queryElements.slice(1).map((element, index) => {
                const prevElement = queryElements[index];
                if (!prevElement) return null;

                return (
                  <line
                    key={`connection-${index}`}
                    x1={prevElement.position.x + 96} // Half width of element
                    y1={prevElement.position.y + 40} // Half height of element
                    x2={element.position.x + 96}
                    y2={element.position.y + 40}
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                );
              })}
            </svg>
          )}
        </div>

        {/* Generated Query Preview */}
        {generatedQuery && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Generated Query</h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  ~{generatedQuery.estimatedRows} rows expected
                </span>
                <button
                  onClick={() => executeQuery(generatedQuery)}
                  disabled={isExecuting}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExecuting ? 'Executing...' : 'Execute Query'}
                </button>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm text-gray-800 max-h-32 overflow-y-auto">
              {generatedQuery.sql}
            </div>
          </div>
        )}
      </div>

      {/* Properties Panel */}
      {selectedElement && (
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Properties</h3>

          {(() => {
            const element = queryElements.find(el => el.id === selectedElement);
            if (!element) return null;

            switch (element.type) {
              case 'filter':
                return (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Column</label>
                      <select
                        value={`${element.table}.${element.column}`}
                        onChange={(e) => {
                          const [table, column] = e.target.value.split('.');
                          handleElementUpdate(element.id, { table, column });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {queryElements
                          .filter(el => el.type === 'table')
                          .flatMap(tableEl =>
                            tables.find(t => t.name === tableEl.table)?.columns.map(col => (
                              <option key={`${tableEl.table}.${col.name}`} value={`${tableEl.table}.${col.name}`}>
                                {tableEl.table}.{col.name}
                              </option>
                            )) || []
                          )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                      <select
                        value={element.operator || '='}
                        onChange={(e) => handleElementUpdate(element.id, { operator: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'IS NULL', 'IS NOT NULL'].map(op => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                    </div>

                    {element.operator !== 'IS NULL' && element.operator !== 'IS NOT NULL' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                        <input
                          type="text"
                          value={element.value || ''}
                          onChange={(e) => handleElementUpdate(element.id, { value: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter value..."
                        />
                      </div>
                    )}
                  </div>
                );

              case 'join':
                return (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Join Type</label>
                      <select
                        value={element.joinType || 'inner'}
                        onChange={(e) => handleElementUpdate(element.id, { joinType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="inner">Inner Join</option>
                        <option value="left">Left Join</option>
                        <option value="right">Right Join</option>
                        <option value="full">Full Outer Join</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Join Table</label>
                      <select
                        value={element.joinTable || ''}
                        onChange={(e) => handleElementUpdate(element.id, { joinTable: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select table...</option>
                        {tables.map(table => (
                          <option key={table.name} value={table.name}>{table.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Join Condition</label>
                      <input
                        type="text"
                        value={element.joinCondition || ''}
                        onChange={(e) => handleElementUpdate(element.id, { joinCondition: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., users.id = orders.user_id"
                      />
                    </div>
                  </div>
                );

              default:
                return (
                  <div className="text-sm text-gray-600">
                    No configurable properties for this element type.
                  </div>
                );
            }
          })()}
        </div>
      )}
    </div>
  );
};


