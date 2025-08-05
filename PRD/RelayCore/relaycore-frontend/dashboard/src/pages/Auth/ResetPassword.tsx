import React, { useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Button, Input, Form, FormItem } from '@relaycore/design-system';
import { useAuth } from '../../context/AuthContext';

const ResetPasswordContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.backgroundLight};
`;

const ResetPasswordCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  padding: 2rem;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
`;

const Title = styled.h1`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const Subtitle = styled.p`
  text-align: center;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: ${({ theme }) => theme.colors.dangerLighter};
  border-radius: 4px;
  text-align: center;
`;

const SuccessMessage = styled.div`
  color: ${({ theme }) => theme.colors.success};
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: ${({ theme }) => theme.colors.successLighter};
  border-radius: 4px;
  text-align: center;
`;

const BackToLoginLink = styled.div`
  text-align: center;
  margin-top: 1rem;
  
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

export const ResetPassword: React.FC = () => {
  const { resetPassword, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();

  const handleSubmit = async (values: any) => {
    if (!token) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      await resetPassword(token, values.password);
      setIsSubmitted(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      // Error is handled by the AuthContext
      console.error('Reset password error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = (values: any) => {
    const errors: Record<string, string> = {};
    
    if (!values.password) {
      errors.password = 'Password is required';
    } else if (values.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };

  if (!token) {
    return (
      <ResetPasswordContainer>
        <ResetPasswordCard>
          <Logo>RelayCore</Logo>
          <Title>Invalid Reset Link</Title>
          <Subtitle>
            The password reset link is invalid or has expired.
          </Subtitle>
          <BackToLoginLink>
            <Link to="/login">Back to login</Link>
          </BackToLoginLink>
        </ResetPasswordCard>
      </ResetPasswordContainer>
    );
  }

  return (
    <ResetPasswordContainer>
      <ResetPasswordCard>
        <Logo>RelayCore</Logo>
        <Title>Reset your password</Title>
        <Subtitle>
          Enter your new password below.
        </Subtitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {isSubmitted && (
          <SuccessMessage>
            Your password has been reset successfully. Redirecting to login...
          </SuccessMessage>
        )}
        
        {!isSubmitted ? (
          <Form
            initialValues={{
              password: '',
              confirmPassword: '',
            }}
            onSubmit={handleSubmit}
            validate={validateForm}
          >
            <FormItem name="password" label="New Password">
              <Input 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                fullWidth 
              />
            </FormItem>
            
            <FormItem name="confirmPassword" label="Confirm New Password">
              <Input 
                name="confirmPassword" 
                type="password" 
                placeholder="••••••••" 
                fullWidth 
              />
            </FormItem>
            
            <Button 
              type="submit" 
              fullWidth 
              isLoading={isSubmitting}
            >
              Reset Password
            </Button>
            
            <BackToLoginLink>
              <Link to="/login">Back to login</Link>
            </BackToLoginLink>
          </Form>
        ) : (
          <BackToLoginLink>
            <Link to="/login">Back to login</Link>
          </BackToLoginLink>
        )}
      </ResetPasswordCard>
    </ResetPasswordContainer>
  );
};