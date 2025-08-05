import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, Button, Input, Form, FormItem, FormGroup } from '@relaycore/design-system';

const ContactContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const ContactHeader = styled.div`
  text-align: center;
  margin-bottom: 60px;
`;

const ContactTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 20px;
`;

const ContactDescription = styled.p`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 700px;
  margin: 0 auto;
`;

const ContactContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const InfoCard = styled(Card)`
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InfoTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 10px;
`;

const InfoDescription = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 20px;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 15px;
`;

const InfoIcon = styled.div`
  width: 40px;
  height: 40px;
  background-color: ${({ theme }) => theme.colors.primaryLighter};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.2rem;
  flex-shrink: 0;
`;

const InfoContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const InfoLabel = styled.div`
  font-weight: 500;
  margin-bottom: 5px;
`;

const InfoValue = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 10px;
`;

const SocialLink = styled.a`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.backgroundLight};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-decoration: none;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
  }
`;

const ContactForm = styled(Card)`
  padding: 30px;
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 20px;
`;

const SuccessMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.success + '20'};
  border: 1px solid ${({ theme }) => theme.colors.success};
  color: ${({ theme }) => theme.colors.success};
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SuccessIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.success};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
`;

export const Contact: React.FC = () => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const handleSubmit = (values: any) => {
    console.log('Form submitted:', values);
    setFormSubmitted(true);
    // In a real application, you would send this data to your backend
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
    
    if (!values.message) {
      errors.message = 'Message is required';
    }
    
    return errors;
  };
  
  return (
    <ContactContainer>
      <ContactHeader>
        <ContactTitle>Contact Us</ContactTitle>
        <ContactDescription>
          Have questions about RelayCore? Our team is here to help.
        </ContactDescription>
      </ContactHeader>
      
      <ContactContent>
        <ContactInfo>
          <InfoCard>
            <InfoTitle>Get in Touch</InfoTitle>
            <InfoDescription>
              We'd love to hear from you. Here's how you can reach us.
            </InfoDescription>
            
            <InfoItem>
              <InfoIcon>📍</InfoIcon>
              <InfoContent>
                <InfoLabel>Visit Us</InfoLabel>
                <InfoValue>
                  123 AI Street<br />
                  Palo Alto, CA 94301<br />
                  United States
                </InfoValue>
              </InfoContent>
            </InfoItem>
            
            <InfoItem>
              <InfoIcon>📞</InfoIcon>
              <InfoContent>
                <InfoLabel>Call Us</InfoLabel>
                <InfoValue>+1 (650) 123-4567</InfoValue>
              </InfoContent>
            </InfoItem>
            
            <InfoItem>
              <InfoIcon>✉️</InfoIcon>
              <InfoContent>
                <InfoLabel>Email Us</InfoLabel>
                <InfoValue>hello@relaycore.ai</InfoValue>
              </InfoContent>
            </InfoItem>
            
            <InfoItem>
              <InfoIcon>🕒</InfoIcon>
              <InfoContent>
                <InfoLabel>Working Hours</InfoLabel>
                <InfoValue>Monday - Friday: 9am - 5pm PST</InfoValue>
              </InfoContent>
            </InfoItem>
            
            <div>
              <InfoLabel>Follow Us</InfoLabel>
              <SocialLinks>
                <SocialLink href="#" aria-label="Twitter">𝕏</SocialLink>
                <SocialLink href="#" aria-label="LinkedIn">in</SocialLink>
                <SocialLink href="#" aria-label="GitHub">GH</SocialLink>
                <SocialLink href="#" aria-label="YouTube">YT</SocialLink>
              </SocialLinks>
            </div>
          </InfoCard>
        </ContactInfo>
        
        <ContactForm>
          <FormTitle>Send Us a Message</FormTitle>
          
          {formSubmitted && (
            <SuccessMessage>
              <SuccessIcon>✓</SuccessIcon>
              Thank you for your message! We'll get back to you shortly.
            </SuccessMessage>
          )}
          
          <Form
            initialValues={{
              name: '',
              email: '',
              company: '',
              subject: '',
              message: '',
            }}
            onSubmit={handleSubmit}
            validate={validateForm}
          >
            <FormGroup>
              <FormItem name="name" label="Name" required>
                <Input name="name" placeholder="Your name" />
              </FormItem>
              
              <FormItem name="email" label="Email" required>
                <Input name="email" placeholder="your.email@example.com" type="email" />
              </FormItem>
            </FormGroup>
            
            <FormGroup>
              <FormItem name="company" label="Company">
                <Input name="company" placeholder="Your company (optional)" />
              </FormItem>
              
              <FormItem name="subject" label="Subject">
                <Input name="subject" placeholder="What is this regarding?" />
              </FormItem>
            </FormGroup>
            
            <FormItem name="message" label="Message" required>
              <Input
                name="message"
                placeholder="How can we help you?"
                as="textarea"
                style={{ minHeight: '150px', resize: 'vertical' }}
              />
            </FormItem>
            
            <Button type="submit" fullWidth>Send Message</Button>
          </Form>
        </ContactForm>
      </ContactContent>
    </ContactContainer>
  );
};