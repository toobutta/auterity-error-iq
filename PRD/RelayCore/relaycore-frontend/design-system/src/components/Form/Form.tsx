import React, { createContext, useContext, useState } from 'react';
import styled from 'styled-components';
import { tokens } from '../../tokens';

// Form Context
interface FormContextType {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  setFieldValue: (name: string, value: any) => void;
  setFieldError: (name: string, error: string) => void;
  setFieldTouched: (name: string, touched: boolean) => void;
  validateField: (name: string) => void;
  submitForm: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a Form component');
  }
  return context;
};

// Form Components
export interface FormProps {
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  validate?: (values: Record<string, any>) => Record<string, string>;
  children: React.ReactNode;
  className?: string;
}

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const Form: React.FC<FormProps> = ({
  initialValues,
  onSubmit,
  validate,
  children,
  className,
}) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setFieldValue = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const setFieldError = (name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const setFieldTouched = (name: string, isTouched: boolean) => {
    setTouched((prev) => ({ ...prev, [name]: isTouched }));
  };

  const validateField = (name: string) => {
    if (!validate) return;

    const fieldErrors = validate(values);
    if (fieldErrors[name]) {
      setFieldError(name, fieldErrors[name]);
    } else {
      setFieldError(name, '');
    }
  };

  const validateForm = () => {
    if (!validate) return true;

    const formErrors = validate(values);
    const errorKeys = Object.keys(formErrors);
    
    if (errorKeys.length === 0) return true;
    
    // Update all errors
    setErrors(formErrors);
    
    // Mark fields with errors as touched
    const newTouched: Record<string, boolean> = { ...touched };
    errorKeys.forEach((key) => {
      newTouched[key] = true;
    });
    setTouched(newTouched);
    
    return false;
  };

  const submitForm = () => {
    const isValid = validateForm();
    if (isValid) {
      onSubmit(values);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm();
  };

  return (
    <FormContext.Provider
      value={{
        values,
        errors,
        touched,
        setFieldValue,
        setFieldError,
        setFieldTouched,
        validateField,
        submitForm,
      }}
    >
      <StyledForm onSubmit={handleSubmit} className={className}>
        {children}
      </StyledForm>
    </FormContext.Provider>
  );
};

// Form Item
export interface FormItemProps {
  name: string;
  label?: string;
  required?: boolean;
  children: React.ReactNode;
  help?: string;
}

const FormItemContainer = styled.div`
  margin-bottom: ${tokens.spacing.md};
  width: 100%;
`;

const FormItemLabel = styled.label<{ required?: boolean }>`
  display: block;
  margin-bottom: ${tokens.spacing.xs};
  font-weight: ${tokens.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  
  ${({ required }) =>
    required &&
    `
    &::after {
      content: ' *';
      color: ${({ theme }) => theme.colors.danger};
    }
  `}
`;

const FormItemError = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${tokens.typography.fontSize.sm};
  margin-top: ${tokens.spacing.xs};
`;

const FormItemHelp = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${tokens.typography.fontSize.sm};
  margin-top: ${tokens.spacing.xs};
`;

export const FormItem: React.FC<FormItemProps> = ({
  name,
  label,
  required,
  children,
  help,
}) => {
  const { errors, touched } = useForm();
  const hasError = touched[name] && errors[name];

  return (
    <FormItemContainer>
      {label && (
        <FormItemLabel htmlFor={name} required={required}>
          {label}
        </FormItemLabel>
      )}
      {children}
      {hasError && <FormItemError>{errors[name]}</FormItemError>}
      {help && !hasError && <FormItemHelp>{help}</FormItemHelp>}
    </FormItemContainer>
  );
};

// Form Group
export interface FormGroupProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const FormGroupContainer = styled.div`
  margin-bottom: ${tokens.spacing.lg};
  padding-bottom: ${tokens.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const FormGroupTitle = styled.h3`
  margin: 0 0 ${tokens.spacing.xs} 0;
  font-size: ${tokens.typography.fontSize.lg};
  font-weight: ${tokens.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const FormGroupDescription = styled.p`
  margin: 0 0 ${tokens.spacing.md} 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${tokens.typography.fontSize.md};
`;

export const FormGroup: React.FC<FormGroupProps> = ({
  children,
  title,
  description,
}) => {
  return (
    <FormGroupContainer>
      {title && <FormGroupTitle>{title}</FormGroupTitle>}
      {description && <FormGroupDescription>{description}</FormGroupDescription>}
      {children}
    </FormGroupContainer>
  );
};

// Form Actions
export interface FormActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

const FormActionsContainer = styled.div<{ align: string }>`
  display: flex;
  justify-content: ${({ align }) => {
    switch (align) {
      case 'left':
        return 'flex-start';
      case 'center':
        return 'center';
      case 'right':
        return 'flex-end';
      default:
        return 'flex-end';
    }
  }};
  gap: ${tokens.spacing.md};
  margin-top: ${tokens.spacing.lg};
`;

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  align = 'right',
}) => {
  return <FormActionsContainer align={align}>{children}</FormActionsContainer>;
};