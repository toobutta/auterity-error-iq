import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Button, Input, Form, FormItem } from '@relaycore/design-system';
import { useAuth } from '../../context/AuthContext';

const RegisterContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.backgroundLight};
`;

const RegisterCard = styled(Card)`
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

const LoginLink = styled.div`
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

export const Register: React.FC = () => {
  const { register, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      await register(values.name, values.email, values.password);
      navigate('/');
    } catch (err) {
      // Error is handled by the AuthContext
      console.error('Registration error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = (values: any) => {
    const errors: Record<string, string> = {};
    
    if (!values.name) {
      errors.name = 'Name is required';
    }
    
    if (!values.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }
    
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

  return (
    <RegisterContainer>
      <RegisterCard>
        <Logo>RelayCore</Logo>
        <Title>Create your account</Title>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form
          initialValues={{
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
          }}
          onSubmit={handleSubmit}
          validate={validateForm}
        >
          <FormItem name="name" label="Name">
            <Input 
              name="name" 
              placeholder="Your name" 
              fullWidth 
            />
          </FormItem>
          
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
          
          <FormItem name="confirmPassword" label="Confirm Password">
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
            Create Account
          </Button>
          
          <LoginLink>
            Already have an account? <Link to="/login">Sign in</Link>
          </LoginLink>
        </Form>
      </RegisterCard>
    </RegisterContainer>
  );
};