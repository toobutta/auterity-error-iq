import React from 'react';
import styled from 'styled-components';
import { Form, Button, Card, CardHeader, CardBody } from '@relaycore/design-system';
import { User } from '../../types/user';

interface UserFormProps {
  user?: Partial<User>;
  isEditing: boolean;
  onSubmit: (userData: Partial<User>) => void;
  onCancel: () => void;
}

const FormContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const BackButton = styled(Button)`
  margin-right: 16px;
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 24px;
`;

export const UserForm: React.FC<UserFormProps> = ({
  user,
  isEditing,
  onSubmit,
  onCancel,
}) => {
  const initialValues = {
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'User',
    status: user?.status || 'Active',
    permissions: user?.permissions || [],
    teams: user?.teams || [],
  };

  const handleSubmit = (values: any) => {
    onSubmit(values);
  };

  const validationSchema = {
    name: (value: string) => {
      if (!value) return 'Name is required';
      return null;
    },
    email: (value: string) => {
      if (!value) return 'Email is required';
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
        return 'Invalid email address';
      }
      return null;
    },
  };

  return (
    <FormContainer>
      <Header>
        <h1>{isEditing ? 'Edit User' : 'Create User'}</h1>
      </Header>

      <Card>
        <CardBody>
          <Form
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, handleChange, handleBlur, errors, touched, setFieldValue }) => (
              <>
                <Form.Group>
                  <Form.Label htmlFor="name" required>
                    Name
                  </Form.Label>
                  <Form.Input
                    id="name"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.name && errors.name}
                    placeholder="Enter user's full name"
                  />
                  {touched.name && errors.name && (
                    <Form.ErrorMessage>{errors.name}</Form.ErrorMessage>
                  )}
                </Form.Group>

                <Form.Group>
                  <Form.Label htmlFor="email" required>
                    Email
                  </Form.Label>
                  <Form.Input
                    id="email"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && errors.email}
                    placeholder="Enter user's email address"
                    disabled={isEditing} // Email cannot be changed for existing users
                  />
                  {touched.email && errors.email && (
                    <Form.ErrorMessage>{errors.email}</Form.ErrorMessage>
                  )}
                </Form.Group>

                <Form.Group>
                  <Form.Label htmlFor="role">Role</Form.Label>
                  <Form.Select
                    id="role"
                    name="role"
                    value={values.role}
                    onChange={(e) => setFieldValue('role', e.target.value)}
                    onBlur={handleBlur}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="User">User</option>
                  </Form.Select>
                </Form.Group>

                {isEditing && (
                  <Form.Group>
                    <Form.Label htmlFor="status">Status</Form.Label>
                    <Form.Select
                      id="status"
                      name="status"
                      value={values.status}
                      onChange={(e) => setFieldValue('status', e.target.value)}
                      onBlur={handleBlur}
                    >
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="Inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                )}

                <Form.Group>
                  <Form.Label>Permissions</Form.Label>
                  <Form.CheckboxGroup
                    name="permissions"
                    value={values.permissions}
                    onChange={(value) => setFieldValue('permissions', value)}
                    options={[
                      { value: 'read:logs', label: 'Read Logs' },
                      { value: 'write:logs', label: 'Write Logs' },
                      { value: 'read:config', label: 'Read Configuration' },
                      { value: 'write:config', label: 'Write Configuration' },
                      { value: 'manage:users', label: 'Manage Users' },
                      { value: 'manage:api_keys', label: 'Manage API Keys' },
                    ]}
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Teams</Form.Label>
                  <Form.CheckboxGroup
                    name="teams"
                    value={values.teams}
                    onChange={(value) => setFieldValue('teams', value)}
                    options={[
                      { value: 'engineering', label: 'Engineering' },
                      { value: 'product', label: 'Product' },
                      { value: 'design', label: 'Design' },
                      { value: 'marketing', label: 'Marketing' },
                      { value: 'support', label: 'Support' },
                    ]}
                  />
                </Form.Group>

                <FormActions>
                  <Button variant="tertiary" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isEditing ? 'Update User' : 'Create User'}
                  </Button>
                </FormActions>
              </>
            )}
          </Form>
        </CardBody>
      </Card>
    </FormContainer>
  );
};