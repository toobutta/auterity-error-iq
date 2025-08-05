import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, Card } from '@relaycore/design-system';

const PricingContainer = styled.div`
  padding: 100px 20px;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
`;

const PricingHeader = styled.div`
  margin-bottom: 60px;
`;

const PricingTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 20px;
`;

const PricingSubtitle = styled.p`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 600px;
  margin: 0 auto;
`;

const PricingToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 40px 0;
`;

const ToggleOption = styled.span<{ active: boolean }>`
  padding: 10px 20px;
  cursor: pointer;
  font-weight: ${({ active }) => (active ? 'bold' : 'normal')};
  color: ${({ active, theme }) => (active ? theme.colors.primary : theme.colors.textSecondary)};
`;

const ToggleSwitch = styled.div`
  width: 50px;
  height: 26px;
  background-color: ${({ theme }) => theme.colors.primary};
  border-radius: 13px;
  margin: 0 10px;
  position: relative;
  cursor: pointer;
`;

const ToggleKnob = styled.div<{ isYearly: boolean }>`
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: ${({ isYearly }) => (isYearly ? '27px' : '3px')};
  transition: left 0.3s ease;
`;

const PricingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 20px;
`;

const PricingCard = styled(Card)<{ featured?: boolean }>`
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: ${({ featured, theme }) => (featured ? `2px solid ${theme.colors.primary}` : 'none')};
  transform: ${({ featured }) => (featured ? 'scale(1.05)' : 'none')};
  
  @media (max-width: 768px) {
    transform: none;
  }
`;

const PlanName = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 10px;
`;

const PlanPrice = styled.div`
  margin: 20px 0;
`;

const Price = styled.span`
  font-size: 3rem;
  font-weight: bold;
`;

const PriceUnit = styled.span`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-left: 5px;
`;

const PlanDescription = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 30px;
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 30px 0;
  text-align: left;
  width: 100%;
`;

const Feature = styled.li`
  padding: 10px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  
  &:last-child {
    border-bottom: none;
  }
`;

const FeatureIcon = styled.span`
  margin-right: 10px;
  color: ${({ theme }) => theme.colors.primary};
`;

const PopularBadge = styled.div`
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  position: absolute;
  top: -10px;
`;

const FAQSection = styled.section`
  margin-top: 100px;
  text-align: left;
`;

const FAQTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 40px;
  text-align: center;
`;

const FAQItem = styled.div`
  margin-bottom: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding-bottom: 20px;
  
  &:last-child {
    border-bottom: none;
  }
`;

const FAQQuestion = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 10px;
`;

const FAQAnswer = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(true);
  
  const togglePricing = () => {
    setIsYearly(!isYearly);
  };

  const plans = [
    {
      name: 'Starter',
      monthlyPrice: 49,
      yearlyPrice: 39,
      description: 'Perfect for individuals and small teams',
      features: [
        'Up to 100,000 requests/month',
        'Basic analytics',
        'Standard support',
        '2 AI providers',
        'Basic caching',
        'Community plugins',
      ],
      buttonText: 'Start Free Trial',
      featured: false,
    },
    {
      name: 'Professional',
      monthlyPrice: 99,
      yearlyPrice: 79,
      description: 'Ideal for growing teams and businesses',
      features: [
        'Up to 500,000 requests/month',
        'Advanced analytics',
        'Priority support',
        'All AI providers',
        'Semantic caching',
        'All plugins included',
        'Custom routing rules',
      ],
      buttonText: 'Start Free Trial',
      featured: true,
    },
    {
      name: 'Enterprise',
      monthlyPrice: 299,
      yearlyPrice: 249,
      description: 'For large organizations with advanced needs',
      features: [
        'Unlimited requests',
        'Enterprise analytics',
        'Dedicated support',
        'All AI providers',
        'Advanced caching strategies',
        'Custom plugins',
        'Advanced routing',
        'SLA guarantees',
        'On-premise deployment',
      ],
      buttonText: 'Contact Sales',
      featured: false,
    },
  ];

  const faqs = [
    {
      question: 'How does the pricing work?',
      answer: 'Our pricing is based on the number of requests you make through RelayCore. Each plan includes a set number of requests per month, and you can always upgrade if you need more.',
    },
    {
      question: 'Can I switch plans later?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. If you upgrade, the new pricing will be prorated for the remainder of your billing cycle.',
    },
    {
      question: 'Do you offer a free trial?',
      answer: 'Yes, we offer a 14-day free trial for all plans. No credit card required to start.',
    },
    {
      question: 'What happens if I exceed my request limit?',
      answer: 'If you exceed your monthly request limit, you\'ll be charged a small fee for each additional request. We\'ll notify you when you\'re approaching your limit.',
    },
    {
      question: 'Do you offer discounts for startups or non-profits?',
      answer: 'Yes, we offer special pricing for startups, educational institutions, and non-profit organizations. Please contact our sales team for more information.',
    },
  ];

  return (
    <PricingContainer>
      <PricingHeader>
        <PricingTitle>Simple, transparent pricing</PricingTitle>
        <PricingSubtitle>
          Choose the plan that's right for you and start optimizing your AI infrastructure today.
        </PricingSubtitle>
      </PricingHeader>
      
      <PricingToggle>
        <ToggleOption active={!isYearly}>Monthly</ToggleOption>
        <ToggleSwitch onClick={togglePricing}>
          <ToggleKnob isYearly={isYearly} />
        </ToggleSwitch>
        <ToggleOption active={isYearly}>Yearly (20% off)</ToggleOption>
      </PricingToggle>
      
      <PricingGrid>
        {plans.map((plan, index) => (
          <PricingCard key={index} featured={plan.featured}>
            {plan.featured && <PopularBadge>Most Popular</PopularBadge>}
            <PlanName>{plan.name}</PlanName>
            <PlanPrice>
              <Price>${isYearly ? plan.yearlyPrice : plan.monthlyPrice}</Price>
              <PriceUnit>/month</PriceUnit>
            </PlanPrice>
            <PlanDescription>{plan.description}</PlanDescription>
            <FeaturesList>
              {plan.features.map((feature, featureIndex) => (
                <Feature key={featureIndex}>
                  <FeatureIcon>✓</FeatureIcon>
                  {feature}
                </Feature>
              ))}
            </FeaturesList>
            <Button fullWidth>{plan.buttonText}</Button>
          </PricingCard>
        ))}
      </PricingGrid>
      
      <FAQSection>
        <FAQTitle>Frequently Asked Questions</FAQTitle>
        {faqs.map((faq, index) => (
          <FAQItem key={index}>
            <FAQQuestion>{faq.question}</FAQQuestion>
            <FAQAnswer>{faq.answer}</FAQAnswer>
          </FAQItem>
        ))}
      </FAQSection>
    </PricingContainer>
  );
};