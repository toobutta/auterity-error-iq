import React, { useState, useRef } from 'react';
import { PropertyDefinition, PropertyType, PropertyOption } from '../../types/studio';
import './PropertyComponents.css';

interface PropertyFieldProps {
  definition: PropertyDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export const PropertyField: React.FC<PropertyFieldProps> = ({
  definition,
  value,
  onChange,
  error,
}) => {
  const handleChange = (newValue: any) => {
    onChange(newValue);
  };

  const renderField = () => {
    switch (definition.type) {
      case 'text':
        return (
          <TextField
            definition={definition}
            value={value || ''}
            onChange={handleChange}
          />
        );

      case 'number':
        return (
          <NumberField
            definition={definition}
            value={value || 0}
            onChange={handleChange}
          />
        );

      case 'boolean':
        return (
          <BooleanField
            definition={definition}
            value={value || false}
            onChange={handleChange}
          />
        );

      case 'select':
        return (
          <SelectField
            definition={definition}
            value={value || ''}
            onChange={handleChange}
          />
        );

      case 'textarea':
        return (
          <TextareaField
            definition={definition}
            value={value || ''}
            onChange={handleChange}
          />
        );

      case 'json':
        return (
          <JsonField
            definition={definition}
            value={value || {}}
            onChange={handleChange}
          />
        );

      case 'code':
        return (
          <CodeField
            definition={definition}
            value={value || ''}
            onChange={handleChange}
          />
        );

      case 'file':
        return (
          <FileField
            definition={definition}
            value={value || ''}
            onChange={handleChange}
          />
        );

      case 'multiselect':
        return (
          <MultiselectField
            definition={definition}
            value={value || []}
            onChange={handleChange}
          />
        );

      case 'date':
        return (
          <DateField
            definition={definition}
            value={value || ''}
            onChange={handleChange}
          />
        );

      case 'time':
        return (
          <TimeField
            definition={definition}
            value={value || ''}
            onChange={handleChange}
          />
        );

      case 'datetime':
        return (
          <DateTimeField
            definition={definition}
            value={value || ''}
            onChange={handleChange}
          />
        );

      case 'color':
        return (
          <ColorField
            definition={definition}
            value={value || '#000000'}
            onChange={handleChange}
          />
        );

      case 'range':
        return (
          <RangeField
            definition={definition}
            value={value || definition.min || 0}
            onChange={handleChange}
          />
        );

      case 'password':
        return (
          <PasswordField
            definition={definition}
            value={value || ''}
            onChange={handleChange}
          />
        );

      case 'url':
        return (
          <UrlField
            definition={definition}
            value={value || ''}
            onChange={handleChange}
          />
        );

      default:
        return (
          <TextField
            definition={definition}
            value={value || ''}
            onChange={handleChange}
          />
        );
    }
  };

  return (
    <div className={`property-field ${error ? 'error' : ''}`}>
      <label className="property-label">
        {definition.label}
        {definition.required && <span className="required">*</span>}
      </label>
      {definition.description && (
        <div className="property-description">{definition.description}</div>
      )}
      <div className="property-input">
        {renderField()}
      </div>
      {error && <div className="property-error">{error}</div>}
    </div>
  );
};

// Individual field components
const TextField: React.FC<{
  definition: PropertyDefinition;
  value: string;
  onChange: (value: string) => void;
}> = ({ definition, value, onChange }) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={definition.placeholder}
    pattern={definition.pattern}
    required={definition.required}
    className="property-input-text"
  />
);

const NumberField: React.FC<{
  definition: PropertyDefinition;
  value: number;
  onChange: (value: number) => void;
}> = ({ definition, value, onChange }) => (
  <input
    type="number"
    value={value}
    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    min={definition.min}
    max={definition.max}
    step={definition.step}
    required={definition.required}
    className="property-input-number"
  />
);

const BooleanField: React.FC<{
  definition: PropertyDefinition;
  value: boolean;
  onChange: (value: boolean) => void;
}> = ({ definition, value, onChange }) => (
  <label className="property-checkbox">
    <input
      type="checkbox"
      checked={value}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="checkmark"></span>
  </label>
);

const SelectField: React.FC<{
  definition: PropertyDefinition;
  value: string;
  onChange: (value: string) => void;
}> = ({ definition, value, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    required={definition.required}
    className="property-select"
  >
    <option value="">Select...</option>
    {definition.options?.map((option) => (
      <option key={option.value} value={option.value}>
        {option.icon && `${option.icon} `}{option.label}
      </option>
    ))}
  </select>
);

const TextareaField: React.FC<{
  definition: PropertyDefinition;
  value: string;
  onChange: (value: string) => void;
}> = ({ definition, value, onChange }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={definition.placeholder}
    required={definition.required}
    className="property-textarea"
    rows={4}
  />
);

const JsonField: React.FC<{
  definition: PropertyDefinition;
  value: any;
  onChange: (value: any) => void;
}> = ({ definition, value, onChange }) => {
  const [jsonString, setJsonString] = useState(JSON.stringify(value, null, 2));
  const [isValid, setIsValid] = useState(true);

  const handleChange = (newJsonString: string) => {
    setJsonString(newJsonString);
    try {
      const parsed = JSON.parse(newJsonString);
      setIsValid(true);
      onChange(parsed);
    } catch {
      setIsValid(false);
    }
  };

  return (
    <div className="json-editor">
      <textarea
        value={jsonString}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={definition.placeholder || 'Enter JSON...'}
        className={`property-textarea json-input ${!isValid ? 'invalid' : ''}`}
        rows={8}
      />
      {!isValid && <div className="json-error">Invalid JSON</div>}
    </div>
  );
};

const CodeField: React.FC<{
  definition: PropertyDefinition;
  value: string;
  onChange: (value: string) => void;
}> = ({ definition, value, onChange }) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={definition.placeholder || `Enter ${definition.language || 'code'}...`}
    className="property-textarea code-input"
    rows={10}
    spellCheck={false}
  />
);

const FileField: React.FC<{
  definition: PropertyDefinition;
  value: string;
  onChange: (value: string) => void;
}> = ({ definition, value, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, just store the file name. In a real app, you'd upload the file
      onChange(file.name);
    }
  };

  return (
    <div className="file-input">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept={definition.fileTypes?.join(',')}
        style={{ display: 'none' }}
      />
      <input
        type="text"
        value={value}
        readOnly
        placeholder="Select file..."
        className="property-input-text file-display"
        onClick={() => fileInputRef.current?.click()}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="file-browse-btn"
      >
        Browse
      </button>
    </div>
  );
};

const MultiselectField: React.FC<{
  definition: PropertyDefinition;
  value: string[];
  onChange: (value: string[]) => void;
}> = ({ definition, value, onChange }) => {
  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  return (
    <div className="multiselect">
      {definition.options?.map((option) => (
        <label key={option.value} className="multiselect-option">
          <input
            type="checkbox"
            checked={value.includes(option.value)}
            onChange={() => handleToggle(option.value)}
          />
          <span className="checkmark"></span>
          {option.icon && `${option.icon} `}{option.label}
        </label>
      ))}
    </div>
  );
};

const DateField: React.FC<{
  definition: PropertyDefinition;
  value: string;
  onChange: (value: string) => void;
}> = ({ definition, value, onChange }) => (
  <input
    type="date"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    required={definition.required}
    className="property-input-date"
  />
);

const TimeField: React.FC<{
  definition: PropertyDefinition;
  value: string;
  onChange: (value: string) => void;
}> = ({ definition, value, onChange }) => (
  <input
    type="time"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    required={definition.required}
    className="property-input-time"
  />
);

const DateTimeField: React.FC<{
  definition: PropertyDefinition;
  value: string;
  onChange: (value: string) => void;
}> = ({ definition, value, onChange }) => (
  <input
    type="datetime-local"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    required={definition.required}
    className="property-input-datetime"
  />
);

const ColorField: React.FC<{
  definition: PropertyDefinition;
  value: string;
  onChange: (value: string) => void;
}> = ({ definition, value, onChange }) => (
  <input
    type="color"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    required={definition.required}
    className="property-input-color"
  />
);

const RangeField: React.FC<{
  definition: PropertyDefinition;
  value: number;
  onChange: (value: number) => void;
}> = ({ definition, value, onChange }) => (
  <div className="range-input">
    <input
      type="range"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      min={definition.min || 0}
      max={definition.max || 100}
      step={definition.step || 1}
      className="property-input-range"
    />
    <span className="range-value">{value}</span>
  </div>
);

const PasswordField: React.FC<{
  definition: PropertyDefinition;
  value: string;
  onChange: (value: string) => void;
}> = ({ definition, value, onChange }) => (
  <input
    type="password"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={definition.placeholder}
    required={definition.required}
    className="property-input-password"
  />
);

const UrlField: React.FC<{
  definition: PropertyDefinition;
  value: string;
  onChange: (value: string) => void;
}> = ({ definition, value, onChange }) => (
  <input
    type="url"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={definition.placeholder || 'https://...'}
    required={definition.required}
    className="property-input-url"
  />
);
