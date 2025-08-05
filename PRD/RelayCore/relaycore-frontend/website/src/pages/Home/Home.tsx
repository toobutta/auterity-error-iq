import React from 'react';
import styled from 'styled-components';
import { Button } from '@relaycore/design-system';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Hero = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 100px 20px;
  background: linear-gradient(135deg, #0a2540 0%, #1a365d 100%);
  color: white;
  width: 100%;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  margin-bottom: 20px;
  max-width: 800px;
`;

const HeroSubtitle = styled.p`
  font-size: 1.5rem;
  margin-bottom: 40px;
  max-width: 600px;
  opacity: 0.8;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 20px;
`;

const Section = styled.section`
  padding: 80px 20px;
  width: 100%;
  max-width: 1200px;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 20px;
  text-align: center;
`;

const SectionSubtitle = styled.p`
  font-size: 1.2rem;
  margin-bottom: 40px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 40px;
  margin-top: 60px;
`;

const Feature = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const FeatureIcon = styled.div`
  width: 80px;
  height: 80px;
  background-color: ${({ theme }) => theme.colors.primaryLighter};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: ${({ theme }) => theme.colors.primary};
  font-size: 2rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 10px;
`;

const FeatureDescription = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const CTASection = styled.section`
  background-color: ${({ theme }) => theme.colors.primaryLighter};
  padding: 80px 20px;
  text-align: center;
  width: 100%;
`;

const CTATitle = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 20px;
`;

const CTADescription = styled.p`
  font-size: 1.2rem;
  margin-bottom: 40px;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
`;

export const Home: React.FC = () => {
  return (
    <HomeContainer>
      <Hero>
        <HeroTitle>Universal HTTP Relay for AI Models</HeroTitle>
        <HeroSubtitle>
          Connect your tools to any AI model with smart routing, cost optimization, and plug-and-play interoperability
        </HeroSubtitle>
        <ButtonGroup>
          <Button size="large">Get Started</Button>
          <Button size="large" variant="tertiary">View Documentation</Button>
        </ButtonGroup>
      </Hero>

      <Section>
        <SectionTitle>Why RelayCore?</SectionTitle>
        <SectionSubtitle>
          RelayCore provides a unified interface to connect your applications with any AI model provider, optimizing costs and improving performance.
        </SectionSubtitle>

        <FeaturesGrid>
          <Feature>
            <FeatureIcon>🔄</FeatureIcon>
            <FeatureTitle>Smart Routing</FeatureTitle>
            <FeatureDescription>
              Automatically route requests to the best AI provider based on performance, cost, and availability.
            </FeatureDescription>
          </Feature>

          <Feature>
            <FeatureIcon>💰</FeatureIcon>
            <FeatureTitle>Cost Optimization</FeatureTitle>
            <FeatureDescription>
              Reduce AI costs with intelligent caching, request deduplication, and token optimization.
            </FeatureDescription>
          </Feature>

          <Feature>
            <FeatureIcon>🔌</FeatureIcon>
            <FeatureTitle>Plug-and-Play</FeatureTitle>
            <FeatureDescription>
              Seamlessly integrate with your existing tools and workflows with our IDE plugins and CLI tools.
            </FeatureDescription>
          </Feature>

          <Feature>
            <FeatureIcon>📊</FeatureIcon>
            <FeatureTitle>Analytics & Monitoring</FeatureTitle>
            <FeatureDescription>
              Track usage, costs, and performance metrics across all your AI integrations in one place.
            </FeatureDescription>
          </Feature>

          <Feature>
            <FeatureIcon>🔒</FeatureIcon>
            <FeatureTitle>Security & Compliance</FeatureTitle>
            <FeatureDescription>
              Enterprise-grade security with role-based access control and data privacy features.
            </FeatureDescription>
          </Feature>

          <Feature>
            <FeatureIcon>🚀</FeatureIcon>
            <FeatureTitle>Performance Boost</FeatureTitle>
            <FeatureDescription>
              Improve response times with distributed caching and batch processing capabilities.
            </FeatureDescription>
          </Feature>
        </FeaturesGrid>
      </Section>

      <CTASection>
        <CTATitle>Ready to optimize your AI infrastructure?</CTATitle>
        <CTADescription>
          Get started with RelayCore today and transform how your applications interact with AI models.
        </CTADescription>
        <Button size="large">Start Free Trial</Button>
      </CTASection>
    </HomeContainer>
  );
};