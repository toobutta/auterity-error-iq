import React from 'react';
import styled from 'styled-components';
import { Modal, Form, Button } from '@relaycore/design-system';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: { email: string; role: string; message?: string }) => void;
}

const ModalContent = styled.div`
  width: 100%;
`;

export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onInvite,
}) => {
  const initialValues = {
    email: '',
    role: 'User',
    message: '',
  };

  const handleSubmit = (values: any) => {
    onInvite(values);
    onClose();
  };

  const validationSchema = {
    email: (value: string) => {
      if (!value) return 'Email is required';
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
        return 'Invalid email address';
      }
      return null;
    },
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite User"
      size="medium"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          <Button form="invite-user-form" type="submit">
            Send Invitation
          </Button>
        </div>
      }
    >
      <ModalContent>
        <Form
          id="invite-user-form"
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, handleBlur, errors, touched, setFieldValue }) => (
            <>
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
                  placeholder="Enter email address"
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

              <Form.Group>
                <Form.Label htmlFor="message">Personal Message (Optional)</Form.Label>
                <Form.Textarea
                  id="message"
                  name="message"
                  value={values.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Add a personal message to the invitation email"
                  rows={3}
                />
              </Form.Group>
            </>
          )}
        </Form>
      </ModalContent>
    </Modal>
  );
};