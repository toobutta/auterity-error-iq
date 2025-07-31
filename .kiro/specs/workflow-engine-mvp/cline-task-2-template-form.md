# CLINE TASK 2: Template Instantiation Form Component

## Task Overview
**Priority**: 🔥 HIGH  
**Estimated Time**: 2-3 hours  
**Recommended Model**: Cerebras Qwen-3-32b  
**Status**: Ready for Assignment

## Objective
Create a complete Template Instantiation Form component that allows users to convert templates into workflows by providing parameter values through a dynamic form interface.

## Current State Analysis
- Template system backend is complete with API endpoints
- Template browsing and preview components exist
- Missing: The form component to instantiate templates into workflows
- No TypeScript conflicts - independent component development

## Success Criteria
- [ ] `TemplateInstantiationForm` component created and functional
- [ ] Dynamic form generation based on template parameters
- [ ] Parameter validation and type checking implemented
- [ ] Form wizard for complex templates with multiple steps
- [ ] Template-to-workflow conversion logic working
- [ ] Proper TypeScript types throughout
- [ ] Component tests written and passing
- [ ] Integration with existing template system

## Technical Requirements

### Component Specifications
**File Location**: `frontend/src/components/TemplateInstantiationForm.tsx`

**Props Interface**:
```typescript
interface TemplateInstantiationFormProps {
  templateId: string;
  onSuccess: (workflowId: string) => void;
  onCancel: () => void;
  className?: string;
}
```

### API Integration
**Endpoints to Use**:
- `GET /api/templates/{templateId}` - Fetch template details
- `POST /api/workflows/` - Create workflow from template
- Template parameter validation using existing schemas

**API Client Pattern**:
```typescript
import { apiClient } from '../api/client';
import { Template, WorkflowCreate } from '../api/workflows.d';
```

### Form Generation Requirements

#### Dynamic Field Types
Support these parameter types from template schema:
- **Text Input**: `string` parameters
- **Number Input**: `number` parameters  
- **Boolean Toggle**: `boolean` parameters
- **Select Dropdown**: `enum` parameters
- **Textarea**: `string` parameters with `multiline: true`
- **Date Picker**: `date` parameters
- **File Upload**: `file` parameters (if supported)

#### Form Validation
- **Required Field Validation**: Mark required parameters
- **Type Validation**: Ensure correct data types
- **Custom Validation**: Use parameter validation rules from template
- **Real-time Validation**: Show errors as user types
- **Form-level Validation**: Validate entire form before submission

#### Multi-step Wizard (for complex templates)
- **Step Detection**: Group parameters by category or dependency
- **Progress Indicator**: Show current step and progress
- **Navigation**: Next/Previous buttons with validation
- **Step Validation**: Validate each step before proceeding
- **Summary Step**: Review all inputs before final submission

### UI/UX Requirements

#### Design Patterns
- **Consistent Styling**: Use existing Tailwind classes from codebase
- **Form Layout**: Clean, organized form with proper spacing
- **Loading States**: Show loading during template fetch and submission
- **Error Handling**: Clear error messages for validation and API errors
- **Success Feedback**: Confirmation when workflow is created

#### Responsive Design
- **Mobile-friendly**: Form works on mobile devices
- **Flexible Layout**: Adapts to different screen sizes
- **Touch-friendly**: Appropriate touch targets for mobile

### Implementation Guidelines

#### Component Structure
```typescript
export const TemplateInstantiationForm: React.FC<TemplateInstantiationFormProps> = ({
  templateId,
  onSuccess,
  onCancel,
  className
}) => {
  // State management
  const [template, setTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Implementation...
};
```

#### Form Field Generation
```typescript
const renderFormField = (parameter: TemplateParameter) => {
  switch (parameter.type) {
    case 'string':
      return parameter.multiline ? 
        <textarea /> : <input type="text" />;
    case 'number':
      return <input type="number" />;
    case 'boolean':
      return <input type="checkbox" />;
    case 'enum':
      return <select>{parameter.options.map(...)}</select>;
    // ... other types
  }
};
```

#### Validation Logic
```typescript
const validateField = (name: string, value: any, parameter: TemplateParameter) => {
  // Required validation
  if (parameter.required && !value) {
    return `${parameter.label} is required`;
  }
  
  // Type validation
  if (parameter.type === 'number' && isNaN(Number(value))) {
    return `${parameter.label} must be a number`;
  }
  
  // Custom validation rules
  if (parameter.validation) {
    // Apply custom validation logic
  }
  
  return null;
};
```

### Integration Requirements

#### Template System Integration
- **Use Existing Types**: Import types from `workflows.d.ts`
- **API Client**: Use existing `apiClient` from `api/client.ts`
- **Error Handling**: Follow existing error handling patterns
- **Loading States**: Use consistent loading UI patterns

#### Workflow Creation
- **Template Conversion**: Convert template + parameters to workflow definition
- **Parameter Substitution**: Replace template placeholders with user values
- **Workflow Naming**: Generate appropriate workflow name from template
- **User Association**: Ensure workflow is created for current user

### Testing Requirements

#### Unit Tests
**File**: `frontend/src/components/__tests__/TemplateInstantiationForm.test.tsx`

**Test Cases**:
- Component renders with template data
- Form fields generated correctly for different parameter types
- Validation works for required fields
- Form submission creates workflow correctly
- Error handling for API failures
- Multi-step wizard navigation (if implemented)
- Cancel functionality works

#### Mock Data
```typescript
const mockTemplate: Template = {
  id: 'test-template-id',
  name: 'Test Template',
  description: 'Test template description',
  parameters: [
    {
      name: 'customerName',
      type: 'string',
      label: 'Customer Name',
      required: true
    },
    {
      name: 'vehicleYear',
      type: 'number',
      label: 'Vehicle Year',
      required: true,
      validation: { min: 1900, max: 2025 }
    }
  ]
};
```

### Error Handling

#### API Error Scenarios
- **Template Not Found**: Show appropriate error message
- **Network Errors**: Retry mechanism with user feedback
- **Validation Errors**: Display field-specific errors
- **Workflow Creation Failure**: Clear error message with retry option

#### User Experience
- **Graceful Degradation**: Form still usable if some features fail
- **Clear Error Messages**: User-friendly error descriptions
- **Recovery Options**: Allow user to retry or modify inputs

### Performance Considerations

#### Optimization Strategies
- **Lazy Loading**: Load template data only when needed
- **Debounced Validation**: Avoid excessive validation calls
- **Memoization**: Use React.memo and useMemo for expensive operations
- **Form State Management**: Efficient form state updates

### Accessibility Requirements

#### WCAG Compliance
- **Keyboard Navigation**: All form elements accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Logical focus order and visible focus indicators
- **Error Announcements**: Screen reader announces validation errors

### File Structure
```
frontend/src/components/
├── TemplateInstantiationForm.tsx          # Main component
├── __tests__/
│   └── TemplateInstantiationForm.test.tsx # Unit tests
└── forms/                                 # Form utilities (if needed)
    ├── FormField.tsx                      # Reusable form field component
    └── FormWizard.tsx                     # Multi-step wizard component
```

## Completion Criteria
Task is complete when:
- [ ] Component renders and functions correctly
- [ ] All parameter types supported with proper validation
- [ ] Template-to-workflow conversion works
- [ ] Tests pass with good coverage
- [ ] Integration with existing template system works
- [ ] No TypeScript errors or linting issues
- [ ] Component follows existing code patterns and styling

## Notes
- This component is independent of the TypeScript fixes happening in Task 1
- Use existing API client and type definitions
- Follow established patterns from other form components in the codebase
- Focus on user experience and form usability
- Ensure proper error handling and loading states throughout

## Ready for Delegation ✅
This task is fully specified and ready for immediate Cline assignment with no dependencies on other ongoing work.