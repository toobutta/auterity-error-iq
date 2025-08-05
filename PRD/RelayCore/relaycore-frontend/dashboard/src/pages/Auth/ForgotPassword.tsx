import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Button, Input, Form, FormItem } from '@relaycore/design-system';
import { useAuth } from '../../context/AuthContext';

const ForgotPasswordContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.backgroundLight};
`;

const ForgotPasswordCard = styled(Card)`
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

export const ForgotPassword: React.FC = () => {
  const { forgotPassword, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      await forgotPassword(values.email);
      setIsSubmitted(true);
    } catch (err) {
      // Error is handled by the AuthContext
      console.error('Forgot password error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = (values: any) => {
    const errors: Record<string, string> = {};
    
    if (!values.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }
    
    return errors;
  };

  return (
    <ForgotPasswordContainer>
      <ForgotPasswordCard>
        <Logo>RelayCore</Logo>
        <Title>Reset your password</Title>
        <Subtitle>
          Enter your email address and we'll send you a link to reset your password.
        </Subtitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {isSubmitted && (
          <SuccessMessage>
            If an account exists with that email, we've sent password reset instructions.
          </SuccessMessage>
        )}
        
        {!isSubmitted ? (
          <Form
            initialValues={{
              email: '',
            }}
            onSubmit={handleSubmit}
            validate={validateForm}
          >
            <FormItem name="email" label="Email">
              <Input 
                name="email" 
                type="email" 
                placeholder="your.email@example.com" 
                fullWidth 
              />
            </FormItem>
            
            <Button 
              type="submit" 
              fullWidth 
              isLoading={isSubmitting}
            >
              Send Reset Link
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
      </ForgotPasswordCard>
    </ForgotPasswordContainer>
  );
};