import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Button, Input, Form, FormItem } from '@relaycore/design-system';
import { useAuth } from '../../context/AuthContext';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.backgroundLight};
`;

const LoginCard = styled(Card)`
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
  margin-bottom: 1.5rem;
  text-align: center;
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.danger};
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: ${({ theme }) => theme.colors.dangerLighter};
  border-radius: 4px;
  text-align: center;
`;

const ForgotPasswordLink = styled(Link)`
  display: block;
  text-align: right;
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const RegisterLink = styled.div`
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

export const Login: React.FC = () => {
  const { login, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      await login(values.email, values.password);
      navigate('/');
    } catch (err) {
      // Error is handled by the AuthContext
      console.error('Login error:', err);
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
    
    if (!values.password) {
      errors.password = 'Password is required';
    }
    
    return errors;
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>RelayCore</Logo>
        <Title>Sign in to your account</Title>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form
          initialValues={{
            email: '',
            password: '',
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
          
          <FormItem name="password" label="Password">
            <Input 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              fullWidth 
            />
          </FormItem>
          
          <ForgotPasswordLink to="/forgot-password">
            Forgot your password?
          </ForgotPasswordLink>
          
          <Button 
            type="submit" 
            fullWidth 
            isLoading={isSubmitting}
          >
            Sign In
          </Button>
          
          <RegisterLink>
            Don't have an account? <Link to="/register">Sign up</Link>
          </RegisterLink>
        </Form>
      </LoginCard>
    </LoginContainer>
  );
};