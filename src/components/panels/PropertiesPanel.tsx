import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useStudioStore } from '../../hooks/useStudioStore';
import { StudioNode } from '../../types/studio';
import { NODE_PROPERTY_SCHEMAS } from '../../constants/propertySchemas';
import { PropertySchema, PropertyGroup, PropertyTemplate, ValidationResult } from '../../types/properties';
import {
  CogIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import './PropertiesPanel.css';

interface PropertiesPanelProps {
  width: number;
  collapsed: boolean;
  onResize: (width: number) => void;
  onToggleCollapse: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  width,
  collapsed,
  onResize,
  onToggleCollapse,
}) => {
  const { state, actions } = useStudioStore();
  const { selection, nodes } = state;

  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['general']));
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PropertyTemplate | null>(null);

  const selectedNode = selection.selectedNodes.length === 1
    ? nodes.get(selection.selectedNodes[0])
    : null;

  const isMultiSelect = selection.selectedNodes.length > 1;

  // Get property schema for the selected node
  const nodeSchema = useMemo(() => {
    if (!selectedNode) return null;
    return NODE_PROPERTY_SCHEMAS[selectedNode.type] || null;
  }, [selectedNode]);

  // Filter properties based on search and visibility
  const filteredProperties = useMemo(() => {
    if (!nodeSchema) return [];

    let properties = nodeSchema.properties;

    // Filter by search term
    if (searchTerm) {
      properties = properties.filter(prop =>
        prop.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter advanced properties
    if (!showAdvanced) {
      properties = properties.filter(prop => !prop.advanced);
    }

    return properties;
  }, [nodeSchema, searchTerm, showAdvanced]);

  // Validate property value
  const validateProperty = useCallback((schema: PropertySchema, value: any): ValidationResult => {
    const errors: string[] = [];

    for (const validation of schema.validation) {
      switch (validation.type) {
        case 'required':
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            errors.push(validation.message);
          }
          break;
        case 'min':
          if (typeof value === 'number' && value < validation.value) {
            errors.push(validation.message);
          }
          break;
        case 'max':
          if (typeof value === 'number' && value > validation.value) {
            errors.push(validation.message);
          }
          if (typeof value === 'string' && value.length > validation.value) {
            errors.push(validation.message);
          }
          break;
        case 'pattern':
          if (typeof value === 'string' && !validation.value.test(value)) {
            errors.push(validation.message);
          }
          break;
        case 'custom':
          if (validation.validator && !validation.validator(value)) {
            errors.push(validation.message);
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Handle property change with validation
  const handlePropertyChange = useCallback((propertyId: string, value: any) => {
    if (!selectedNode || !nodeSchema) return;

    // Find property schema
    const propertySchema = nodeSchema.properties.find(p => p.id === propertyId);
    if (!propertySchema) return;

    // Validate the value
    const validation = validateProperty(propertySchema, value);

    // Update edited values
    setEditedValues(prev => ({ ...prev, [propertyId]: value }));

    // Update validation errors
    setValidationErrors(prev => ({
      ...prev,
      [propertyId]: validation.errors
    }));

    // Update node if validation passes
    if (validation.isValid) {
      const updates: Partial<StudioNode> = {};

      if (propertyId === 'label') {
        updates.data = { ...selectedNode.data, label: value };
      } else if (propertyId === 'description') {
        updates.data = { ...selectedNode.data, description: value };
      } else if (['x', 'y'].includes(propertyId)) {
        updates.position = {
          ...selectedNode.position,
          [propertyId]: parseFloat(value) || 0
        };
      } else if (['width', 'height'].includes(propertyId)) {
        updates.size = {
          ...selectedNode.size,
          [propertyId]: parseFloat(value) || 0
        };
      } else {
        // Update other properties in data
        updates.data = {
          ...selectedNode.data,
          properties: {
            ...selectedNode.data.properties,
            [propertyId]: value
          }
        };
      }

      actions.updateNode(selectedNode.id, updates);
    }
  }, [selectedNode, nodeSchema, validateProperty, actions]);

  // Apply property template
  const applyTemplate = useCallback((template: PropertyTemplate) => {
    if (!selectedNode || !nodeSchema) return;

    setSelectedTemplate(template);

    // Apply template properties
    Object.entries(template.properties).forEach(([propertyId, value]) => {
      handlePropertyChange(propertyId, value);
    });
  }, [selectedNode, nodeSchema, handlePropertyChange]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    if (!selectedNode || !nodeSchema) return;

    nodeSchema.properties.forEach(property => {
      handlePropertyChange(property.id, property.defaultValue);
    });

    setEditedValues({});
    setValidationErrors({});
  }, [selectedNode, nodeSchema, handlePropertyChange]);

  // Toggle group expansion
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  // Get current property value
  const getPropertyValue = useCallback((propertyId: string): any => {
    if (editedValues.hasOwnProperty(propertyId)) {
      return editedValues[propertyId];
    }

    if (!selectedNode) return '';

    switch (propertyId) {
      case 'label':
        return selectedNode.data.label;
      case 'description':
        return selectedNode.data.description || '';
      case 'x':
        return selectedNode.position.x;
      case 'y':
        return selectedNode.position.y;
      case 'width':
        return selectedNode.size.width;
      case 'height':
        return selectedNode.size.height;
      default:
        return selectedNode.data.properties?.[propertyId] || '';
    }
  }, [selectedNode, editedValues]);

  // Clear edited values when node changes
  useEffect(() => {
    setEditedValues({});
    setValidationErrors({});
    setSelectedTemplate(null);
  }, [selectedNode?.id]);

  if (collapsed) {
    return (
      <div className="properties-panel collapsed">
        <button
          className="panel-toggle"
          onClick={onToggleCollapse}
          aria-label="Expand properties panel"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="properties-panel" style={{ width }}>
      {/* Header */}
      <div className="panel-header">
        <h3>Properties</h3>
        <button
          className="panel-toggle"
          onClick={onToggleCollapse}
          aria-label="Collapse properties panel"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Search and Controls */}
      {selectedNode && nodeSchema && (
        <div className="panel-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="property-search"
            />
          </div>

          <div className="control-buttons">
            <button
              className="btn-icon"
              onClick={() => setShowAdvanced(!showAdvanced)}
              title={showAdvanced ? 'Hide advanced properties' : 'Show advanced properties'}
            >
              <CogIcon className="w-4 h-4" />
            </button>
            <button
              className="btn-icon"
              onClick={resetToDefaults}
              title="Reset to defaults"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Templates */}
      {selectedNode && nodeSchema && nodeSchema.templates.length > 0 && (
        <div className="templates-section">
          <div className="templates-header">
            <h4>Templates</h4>
          </div>
          <div className="templates-list">
            {nodeSchema.templates.map(template => (
              <button
                key={template.id}
                className={`template-item ${selectedTemplate?.id === template.id ? 'active' : ''}`}
                onClick={() => applyTemplate(template)}
                title={template.description}
              >
                <span className="template-name">{template.name}</span>
                <span className="template-category">{template.category}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="panel-content">
        {isMultiSelect ? (
          <div className="multi-selection">
            <div className="multi-selection-header">
              <h4>{selection.selectedNodes.length} nodes selected</h4>
              <span className="selection-count">
                {selection.selectedNodes.length} items
              </span>
            </div>
            <div className="bulk-actions">
              <button className="btn-primary">Edit Properties</button>
              <button className="btn-secondary">Align Nodes</button>
              <button className="btn-secondary">Distribute</button>
            </div>
          </div>
        ) : selectedNode && nodeSchema ? (
          <div className="node-properties">
            {/* Grouped Properties */}
            {nodeSchema.groups.map(group => {
              const groupProperties = filteredProperties.filter(prop => prop.group === group.id);
              if (groupProperties.length === 0) return null;

              const isExpanded = expandedGroups.has(group.id);

              return (
                <div key={group.id} className="property-group">
                  <div
                    className="group-header"
                    onClick={() => group.collapsible && toggleGroup(group.id)}
                  >
                    <h4>{group.label}</h4>
                    {group.collapsible && (
                      <button className="group-toggle">
                        {isExpanded ? 
                          <ChevronDownIcon className="w-4 h-4" /> : 
                          <ChevronRightIcon className="w-4 h-4" />
                        }
                      </button>
                    )}
                  </div>

                  {(!group.collapsible || isExpanded) && (
                    <div className="group-content">
                      {groupProperties
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map(property => (
                          <PropertyField
                            key={property.id}
                            schema={property}
                            value={getPropertyValue(property.id)}
                            onChange={(value) => handlePropertyChange(property.id, value)}
                            error={validationErrors[property.id]?.[0]}
                          />
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-selection">
            <div className="no-selection-icon">
              <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h4>No Node Selected</h4>
            <p>Select a node to edit its properties</p>
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        className="panel-resize-handle"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startWidth = width;

          const handleMouseMove = (e: MouseEvent) => {
            const newWidth = Math.max(280, Math.min(500, startWidth - (e.clientX - startX)));
            onResize(newWidth);
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      />
    </div>
  );
};

// Enhanced Property Field Component
interface PropertyFieldProps {
  schema: PropertySchema;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  isValidating?: boolean;
}

const PropertyField: React.FC<PropertyFieldProps> = ({
  schema,
  value,
  onChange,
  error,
  isValidating = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    setIsFocused(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const renderField = () => {
    const baseProps = {
      value: localValue || '',
      onChange: (e: any) => setLocalValue(e.target.value),
      onFocus: () => setIsFocused(true),
      onBlur: handleBlur,
      className: `property-input-field ${error ? 'error' : ''} ${isFocused ? 'focused' : ''}`,
      'aria-describedby': schema.description ? `${schema.id}-description` : undefined,
      'aria-invalid': !!error,
      'aria-required': schema.required
    };

    switch (schema.type) {
      case 'text':
        return (
          <input
            type="text"
            {...baseProps}
            placeholder={schema.placeholder || schema.description}
            maxLength={schema.validation.find(v => v.type === 'max')?.value}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            {...baseProps}
            min={schema.validation.find(v => v.type === 'min')?.value}
            max={schema.validation.find(v => v.type === 'max')?.value}
            step={schema.step || 1}
            value={localValue || 0}
            onChange={(e) => setLocalValue(Number(e.target.value))}
          />
        );

      case 'boolean':
        return (
          <div className="toggle-container">
            <input
              type="checkbox"
              id={`${schema.id}-toggle`}
              checked={localValue || false}
              onChange={(e) => {
                setLocalValue(e.target.checked);
                onChange(e.target.checked);
              }}
              className="toggle-input"
            />
            <label
              htmlFor={`${schema.id}-toggle`}
              className="toggle-label"
            >
              <span className="toggle-switch"></span>
              <span className="toggle-text">
                {localValue ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        );

      case 'select':
        return (
          <select
            {...baseProps}
            value={localValue || ''}
            onChange={(e) => {
              setLocalValue(e.target.value);
              onChange(e.target.value);
            }}
            className="property-select"
          >
            <option value="">
              {schema.placeholder || 'Select...'}
            </option>
            {schema.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            {...baseProps}
            rows={schema.rows || 3}
            placeholder={schema.placeholder || schema.description}
            maxLength={schema.validation.find(v => v.type === 'max')?.value}
            className="property-textarea"
          />
        );

      case 'slider':
        const min = schema.validation.find(v => v.type === 'min')?.value || 0;
        const max = schema.validation.find(v => v.type === 'max')?.value || 1;
        const step = schema.step || 0.1;

        return (
          <div className="slider-container">
            <div className="slider-wrapper">
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={localValue || schema.defaultValue || min}
                onChange={(e) => {
                  setLocalValue(Number(e.target.value));
                  onChange(Number(e.target.value));
                }}
                className="property-slider"
              />
              <div className="slider-track"></div>
            </div>
            <div className="slider-value-display">
              <span className="slider-value">
                {(localValue || schema.defaultValue || min).toFixed(1)}
              </span>
              <span className="slider-range">
                ({min} - {max})
              </span>
            </div>
          </div>
        );

      case 'color':
        return (
          <div className="color-picker-container">
            <input
              type="color"
              {...baseProps}
              value={localValue || '#3b82f6'}
              onChange={(e) => {
                setLocalValue(e.target.value);
                onChange(e.target.value);
              }}
              className="property-color"
            />
            <input
              type="text"
              value={localValue || '#3b82f6'}
              onChange={(e) => {
                setLocalValue(e.target.value);
                onChange(e.target.value);
              }}
              className="property-color-text"
              placeholder="#3b82f6"
            />
          </div>
        );

      default:
        return (
          <input
            type="text"
            {...baseProps}
            placeholder={schema.placeholder || `Enter ${schema.type}...`}
          />
        );
    }
  };

  return (
    <div className={`property-field ${error ? 'has-error' : ''} ${isValidating ? 'validating' : ''}`}>
      <div className="property-header">
        <label className="property-label">
          <span className="label-text">{schema.label}</span>
          {schema.required && <span className="required-indicator">*</span>}
          {schema.advanced && <span className="advanced-indicator">Advanced</span>}
        </label>

        {isValidating && (
          <div className="validation-indicator">
            <ArrowPathIcon className="validation-spinner" />
          </div>
        )}
      </div>

      {schema.description && (
        <div
          id={`${schema.id}-description`}
          className="property-description"
        >
          {schema.description}
        </div>
      )}

      <div className="property-input-wrapper">
        {renderField()}
      </div>

      {error && (
        <div className="property-error-message" role="alert">
          <span className="error-icon">⚠</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {schema.hint && !error && (
        <div className="property-hint">
          <span className="hint-text">{schema.hint}</span>
        </div>
      )}
    </div>
  );
};
