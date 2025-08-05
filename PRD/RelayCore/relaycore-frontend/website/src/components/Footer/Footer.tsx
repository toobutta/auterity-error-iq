import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const FooterContainer = styled.footer`
  background-color: ${({ theme }) => theme.colors.backgroundDark};
  color: ${({ theme }) => theme.colors.white};
  padding: 60px 40px;
`;

const FooterContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FooterSection = styled.div`
  margin-bottom: 30px;
  min-width: 200px;
  
  @media (max-width: 768px) {
    margin-bottom: 40px;
  }
`;

const FooterLogo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 15px;
  display: block;
  color: ${({ theme }) => theme.colors.white};
  text-decoration: none;
`;

const FooterDescription = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 20px;
  max-width: 300px;
`;

const FooterHeading = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 20px;
  font-weight: 600;
`;

const FooterLinks = styled.ul`
  list-style: none;
  padding: 0;
`;

const FooterLink = styled.li`
  margin-bottom: 10px;
`;

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.white};
  }
`;

const ExternalLink = styled.a`
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.white};
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;
`;

const SocialIcon = styled.a`
  color: ${({ theme }) => theme.colors.white};
  font-size: 1.2rem;
  transition: color 0.2s ease;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const BottomBar = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 20px;
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const Copyright = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const BottomLinks = styled.div`
  display: flex;
  gap: 20px;
`;

export const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterSection>
          <FooterLogo to="/">RelayCore</FooterLogo>
          <FooterDescription>
            Universal HTTP relay for AI models with smart routing, cost optimization, and plug-and-play interoperability.
          </FooterDescription>
          <SocialLinks>
            <SocialIcon href="#" aria-label="Twitter">
              <span>𝕏</span>
            </SocialIcon>
            <SocialIcon href="#" aria-label="GitHub">
              <span>GitHub</span>
            </SocialIcon>
            <SocialIcon href="#" aria-label="LinkedIn">
              <span>in</span>
            </SocialIcon>
          </SocialLinks>
        </FooterSection>
        
        <FooterSection>
          <FooterHeading>Product</FooterHeading>
          <FooterLinks>
            <FooterLink><StyledLink to="/">Features</StyledLink></FooterLink>
            <FooterLink><StyledLink to="/pricing">Pricing</StyledLink></FooterLink>
            <FooterLink><StyledLink to="/docs">Integrations</StyledLink></FooterLink>
            <FooterLink><ExternalLink href="#">Changelog</ExternalLink></FooterLink>
            <FooterLink><ExternalLink href="#">Roadmap</ExternalLink></FooterLink>
          </FooterLinks>
        </FooterSection>
        
        <FooterSection>
          <FooterHeading>Resources</FooterHeading>
          <FooterLinks>
            <FooterLink><StyledLink to="/docs">Documentation</StyledLink></FooterLink>
            <FooterLink><StyledLink to="/docs">API Reference</StyledLink></FooterLink>
            <FooterLink><StyledLink to="/docs">Guides</StyledLink></FooterLink>
            <FooterLink><StyledLink to="/blog">Blog</StyledLink></FooterLink>
            <FooterLink><ExternalLink href="#">Community</ExternalLink></FooterLink>
          </FooterLinks>
        </FooterSection>
        
        <FooterSection>
          <FooterHeading>Company</FooterHeading>
          <FooterLinks>
            <FooterLink><ExternalLink href="#">About</ExternalLink></FooterLink>
            <FooterLink><ExternalLink href="#">Careers</ExternalLink></FooterLink>
            <FooterLink><StyledLink to="/contact">Contact</StyledLink></FooterLink>
            <FooterLink><ExternalLink href="#">Partners</ExternalLink></FooterLink>
            <FooterLink><ExternalLink href="#">Legal</ExternalLink></FooterLink>
          </FooterLinks>
        </FooterSection>
      </FooterContent>
      
      <BottomBar>
        <Copyright>© {new Date().getFullYear()} RelayCore. All rights reserved.</Copyright>
        <BottomLinks>
          <ExternalLink href="#">Terms of Service</ExternalLink>
          <ExternalLink href="#">Privacy Policy</ExternalLink>
          <ExternalLink href="#">Security</ExternalLink>
        </BottomLinks>
      </BottomBar>
    </FooterContainer>
  );
};