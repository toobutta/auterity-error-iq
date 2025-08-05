import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Form } from './Form';
import { Button } from '../Button';

export default {
  title: 'Components/Form',
  component: Form,
  argTypes: {
    onSubmit: {
      action: 'submitted',
      description: 'Function called when the form is submitted',
      table: {
        type: { summary: 'function' },
      },
    },
    initialValues: {
      control: 'object',
      description: 'Initial values for form fields',
      table: {
        type: { summary: 'object' },
      },
    },
    validationSchema: {
      control: 'object',
      description: 'Validation schema for form fields',
      table: {
        type: { summary: 'object' },
      },
    },
    children: {
      control: 'text',
      description: 'Form content',
      table: {
        type: { summary: 'React.ReactNode' },
      },
    },
  },
} as ComponentMeta<typeof Form>;

const Template: ComponentStory<typeof Form> = (args) => <Form {...args} />;

export const BasicForm = Template.bind({});
BasicForm.args = {
  initialValues: {
    firstName: '',
    lastName: '',
    email: '',
  },
  children: ({ values, handleChange, handleBlur, errors, touched }) => (
    <>
      <Form.Group>
        <Form.Label htmlFor="firstName">First Name</Form.Label>
        <Form.Input
          id="firstName"
          name="firstName"
          value={values.firstName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.firstName && errors.firstName}
        />
        {touched.firstName && errors.firstName && (
          <Form.ErrorMessage>{errors.firstName}</Form.ErrorMessage>
        )}
      </Form.Group>
      
      <Form.Group>
        <Form.Label htmlFor="lastName">Last Name</Form.Label>
        <Form.Input
          id="lastName"
          name="lastName"
          value={values.lastName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.lastName && errors.lastName}
        />
        {touched.lastName && errors.lastName && (
          <Form.ErrorMessage>{errors.lastName}</Form.ErrorMessage>
        )}
      </Form.Group>
      
      <Form.Group>
        <Form.Label htmlFor="email">Email</Form.Label>
        <Form.Input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.email && errors.email}
        />
        {touched.email && errors.email && (
          <Form.ErrorMessage>{errors.email}</Form.ErrorMessage>
        )}
      </Form.Group>
      
      <Form.Group>
        <Button type="submit">Submit</Button>
      </Form.Group>
    </>
  ),
};

export const WithValidation = Template.bind({});
WithValidation.args = {
  initialValues: {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
  validationSchema: {
    username: (value: string) => {
      if (!value) return 'Username is required';
      if (value.length < 3) return 'Username must be at least 3 characters';
      return null;
    },
    email: (value: string) => {
      if (!value) return 'Email is required';
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
        return 'Invalid email address';
      }
      return null;
    },
    password: (value: string) => {
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      return null;
    },
    confirmPassword: (value: string, values: any) => {
      if (!value) return 'Please confirm your password';
      if (value !== values.password) return 'Passwords do not match';
      return null;
    },
  },
  children: ({ values, handleChange, handleBlur, errors, touched }) => (
    <>
      <Form.Group>
        <Form.Label htmlFor="username">Username</Form.Label>
        <Form.Input
          id="username"
          name="username"
          value={values.username}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.username && errors.username}
        />
        {touched.username && errors.username && (
          <Form.ErrorMessage>{errors.username}</Form.ErrorMessage>
        )}
      </Form.Group>
      
      <Form.Group>
        <Form.Label htmlFor="email">Email</Form.Label>
        <Form.Input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.email && errors.email}
        />
        {touched.email && errors.email && (
          <Form.ErrorMessage>{errors.email}</Form.ErrorMessage>
        )}
      </Form.Group>
      
      <Form.Group>
        <Form.Label htmlFor="password">Password</Form.Label>
        <Form.Input
          id="password"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.password && errors.password}
        />
        {touched.password && errors.password && (
          <Form.ErrorMessage>{errors.password}</Form.ErrorMessage>
        )}
      </Form.Group>
      
      <Form.Group>
        <Form.Label htmlFor="confirmPassword">Confirm Password</Form.Label>
        <Form.Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={values.confirmPassword}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.confirmPassword && errors.confirmPassword}
        />
        {touched.confirmPassword && errors.confirmPassword && (
          <Form.ErrorMessage>{errors.confirmPassword}</Form.ErrorMessage>
        )}
      </Form.Group>
      
      <Form.Group>
        <Button type="submit">Register</Button>
      </Form.Group>
    </>
  ),
};

export const WithDifferentInputTypes = Template.bind({});
WithDifferentInputTypes.args = {
  initialValues: {
    name: '',
    email: '',
    password: '',
    rememberMe: false,
    role: 'user',
    interests: [],
    bio: '',
  },
  children: ({ values, handleChange, handleBlur, setFieldValue }) => (
    <>
      <Form.Group>
        <Form.Label htmlFor="name">Name</Form.Label>
        <Form.Input
          id="name"
          name="name"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </Form.Group>
      
      <Form.Group>
        <Form.Label htmlFor="email">Email</Form.Label>
        <Form.Input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </Form.Group>
      
      <Form.Group>
        <Form.Label htmlFor="password">Password</Form.Label>
        <Form.Input
          id="password"
          name="password"
          type="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </Form.Group>
      
      <Form.Group>
        <Form.Checkbox
          id="rememberMe"
          name="rememberMe"
          checked={values.rememberMe}
          onChange={handleChange}
          label="Remember me"
        />
      </Form.Group>
      
      <Form.Group>
        <Form.Label>Role</Form.Label>
        <Form.RadioGroup
          name="role"
          value={values.role}
          onChange={(value) => setFieldValue('role', value)}
          options={[
            { value: 'admin', label: 'Admin' },
            { value: 'editor', label: 'Editor' },
            { value: 'user', label: 'User' },
          ]}
        />
      </Form.Group>
      
      <Form.Group>
        <Form.Label>Interests</Form.Label>
        <Form.CheckboxGroup
          name="interests"
          value={values.interests}
          onChange={(value) => setFieldValue('interests', value)}
          options={[
            { value: 'sports', label: 'Sports' },
            { value: 'music', label: 'Music' },
            { value: 'movies', label: 'Movies' },
            { value: 'books', label: 'Books' },
          ]}
        />
      </Form.Group>
      
      <Form.Group>
        <Form.Label htmlFor="bio">Bio</Form.Label>
        <Form.Textarea
          id="bio"
          name="bio"
          value={values.bio}
          onChange={handleChange}
          onBlur={handleBlur}
          rows={4}
        />
      </Form.Group>
      
      <Form.Group>
        <Button type="submit">Submit</Button>
      </Form.Group>
    </>
  ),
};

export const LoginForm = () => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loginError, setLoginError] = React.useState('');
  
  const handleSubmit = (values: any) => {
    setIsSubmitting(true);
    setLoginError('');
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      if (values.email !== 'user@example.com' || values.password !== 'password') {
        setLoginError('Invalid email or password');
      } else {
        alert('Login successful!');
      }
    }, 1000);
  };
  
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>Login</h2>
      {loginError && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          {loginError}
        </div>
      )}
      <Form
        initialValues={{ email: '', password: '', rememberMe: false }}
        onSubmit={handleSubmit}
        validationSchema={{
          email: (value: string) => {
            if (!value) return 'Email is required';
            return null;
          },
          password: (value: string) => {
            if (!value) return 'Password is required';
            return null;
          },
        }}
      >
        {({ values, handleChange, handleBlur, errors, touched }) => (
          <>
            <Form.Group>
              <Form.Label htmlFor="email">Email</Form.Label>
              <Form.Input
                id="email"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.email && errors.email}
                placeholder="Enter your email"
              />
              {touched.email && errors.email && (
                <Form.ErrorMessage>{errors.email}</Form.ErrorMessage>
              )}
            </Form.Group>
            
            <Form.Group>
              <Form.Label htmlFor="password">Password</Form.Label>
              <Form.Input
                id="password"
                name="password"
                type="password"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.password && errors.password}
                placeholder="Enter your password"
              />
              {touched.password && errors.password && (
                <Form.ErrorMessage>{errors.password}</Form.ErrorMessage>
              )}
            </Form.Group>
            
            <Form.Group>
              <Form.Checkbox
                id="rememberMe"
                name="rememberMe"
                checked={values.rememberMe}
                onChange={handleChange}
                label="Remember me"
              />
            </Form.Group>
            
            <Form.Group>
              <Button type="submit" fullWidth isLoading={isSubmitting}>
                Login
              </Button>
            </Form.Group>
            
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <a href="#" style={{ color: '#1976d2', textDecoration: 'none' }}>
                Forgot password?
              </a>
            </div>
          </>
        )}
      </Form>
    </div>
  );
};

export const FormWithFieldArray = Template.bind({});
FormWithFieldArray.args = {
  initialValues: {
    name: '',
    email: '',
    phoneNumbers: [''],
    addresses: [{ street: '', city: '', zipCode: '' }],
  },
  children: ({ values, handleChange, handleBlur, setFieldValue }) => (
    <>
      <Form.Group>
        <Form.Label htmlFor="name">Name</Form.Label>
        <Form.Input
          id="name"
          name="name"
          value={values.name}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </Form.Group>
      
      <Form.Group>
        <Form.Label htmlFor="email">Email</Form.Label>
        <Form.Input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </Form.Group>
      
      <Form.Group>
        <Form.Label>Phone Numbers</Form.Label>
        {values.phoneNumbers.map((phone: string, index: number) => (
          <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <Form.Input
              name={`phoneNumbers[${index}]`}
              value={phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Phone number"
            />
            <Button
              type="button"
              variant="tertiary"
              onClick={() => {
                const newPhoneNumbers = [...values.phoneNumbers];
                newPhoneNumbers.splice(index, 1);
                setFieldValue('phoneNumbers', newPhoneNumbers);
              }}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setFieldValue('phoneNumbers', [...values.phoneNumbers, '']);
          }}
        >
          Add Phone Number
        </Button>
      </Form.Group>
      
      <Form.Group>
        <Form.Label>Addresses</Form.Label>
        {values.addresses.map((address: any, index: number) => (
          <div key={index} style={{ 
            border: '1px solid #e0e0e0', 
            borderRadius: '4px', 
            padding: '16px', 
            marginBottom: '16px' 
          }}>
            <h4 style={{ marginTop: 0 }}>Address {index + 1}</h4>
            
            <Form.Group>
              <Form.Label htmlFor={`addresses[${index}].street`}>Street</Form.Label>
              <Form.Input
                id={`addresses[${index}].street`}
                name={`addresses[${index}].street`}
                value={address.street}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Form.Group>
            
            <Form.Group>
              <Form.Label htmlFor={`addresses[${index}].city`}>City</Form.Label>
              <Form.Input
                id={`addresses[${index}].city`}
                name={`addresses[${index}].city`}
                value={address.city}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Form.Group>
            
            <Form.Group>
              <Form.Label htmlFor={`addresses[${index}].zipCode`}>Zip Code</Form.Label>
              <Form.Input
                id={`addresses[${index}].zipCode`}
                name={`addresses[${index}].zipCode`}
                value={address.zipCode}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Form.Group>
            
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                const newAddresses = [...values.addresses];
                newAddresses.splice(index, 1);
                setFieldValue('addresses', newAddresses);
              }}
            >
              Remove Address
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setFieldValue('addresses', [
              ...values.addresses,
              { street: '', city: '', zipCode: '' },
            ]);
          }}
        >
          Add Address
        </Button>
      </Form.Group>
      
      <Form.Group>
        <Button type="submit">Submit</Button>
      </Form.Group>
    </>
  ),
};