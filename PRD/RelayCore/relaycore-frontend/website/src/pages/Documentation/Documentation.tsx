import React, { useState } from 'react';
import styled from 'styled-components';
import { Card } from '@relaycore/design-system';

const DocContainer = styled.div`
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  gap: 40px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Sidebar = styled.div`
  width: 280px;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const Content = styled.div`
  flex: 1;
`;

const SidebarCard = styled(Card)`
  position: sticky;
  top: 100px;
`;

const NavSection = styled.div`
  margin-bottom: 20px;
`;

const NavTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const NavItem = styled.li<{ active?: boolean }>`
  margin-bottom: 5px;
  
  a {
    display: block;
    padding: 8px 15px;
    text-decoration: none;
    color: ${({ active, theme }) => active ? theme.colors.primary : theme.colors.textPrimary};
    border-radius: 4px;
    background-color: ${({ active, theme }) => active ? theme.colors.primaryLighter : 'transparent'};
    font-weight: ${({ active }) => active ? '500' : 'normal'};
    
    &:hover {
      background-color: ${({ theme, active }) => active ? theme.colors.primaryLighter : theme.colors.backgroundLight};
    }
  }
`;

const DocHeader = styled.div`
  margin-bottom: 40px;
`;

const DocTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 10px;
`;

const DocDescription = styled.p`
  font-size: 1.2rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const DocContent = styled.div`
  h2 {
    font-size: 1.8rem;
    margin: 40px 0 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  
  h3 {
    font-size: 1.4rem;
    margin: 30px 0 15px;
  }
  
  p {
    margin-bottom: 20px;
    line-height: 1.6;
  }
  
  code {
    background-color: ${({ theme }) => theme.colors.backgroundLight};
    padding: 2px 5px;
    border-radius: 4px;
    font-family: monospace;
  }
  
  pre {
    background-color: ${({ theme }) => theme.colors.backgroundDark};
    color: ${({ theme }) => theme.colors.white};
    padding: 15px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 20px 0;
  }
  
  ul, ol {
    margin: 20px 0;
    padding-left: 20px;
    
    li {
      margin-bottom: 10px;
    }
  }
  
  blockquote {
    border-left: 4px solid ${({ theme }) => theme.colors.primary};
    padding-left: 15px;
    margin: 20px 0;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
  
  img {
    max-width: 100%;
    border-radius: 8px;
    margin: 20px 0;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    
    th, td {
      padding: 10px;
      border: 1px solid ${({ theme }) => theme.colors.border};
    }
    
    th {
      background-color: ${({ theme }) => theme.colors.backgroundLight};
    }
  }
`;

const sections = [
  {
    title: 'Getting Started',
    items: [
      { id: 'introduction', title: 'Introduction' },
      { id: 'quick-start', title: 'Quick Start Guide' },
      { id: 'installation', title: 'Installation' },
      { id: 'configuration', title: 'Configuration' },
    ],
  },
  {
    title: 'Core Concepts',
    items: [
      { id: 'architecture', title: 'Architecture' },
      { id: 'routing', title: 'Smart Routing' },
      { id: 'caching', title: 'Caching System' },
      { id: 'optimization', title: 'Token Optimization' },
    ],
  },
  {
    title: 'API Reference',
    items: [
      { id: 'authentication', title: 'Authentication' },
      { id: 'endpoints', title: 'Endpoints' },
      { id: 'request-format', title: 'Request Format' },
      { id: 'response-format', title: 'Response Format' },
      { id: 'error-handling', title: 'Error Handling' },
    ],
  },
  {
    title: 'Plugins',
    items: [
      { id: 'vscode', title: 'VS Code Plugin' },
      { id: 'claude-cli', title: 'Claude CLI' },
      { id: 'langchain', title: 'LangChain Integration' },
      { id: 'custom-plugins', title: 'Creating Custom Plugins' },
    ],
  },
];

const introductionContent = `
## Introduction to RelayCore

RelayCore is a universal HTTP relay service designed to connect external tools (IDEs, CLIs, agent orchestrators) to AI model endpoints. It provides smart routing, cost optimization, context injection, and plug-and-play agent interoperability.

### What is RelayCore?

RelayCore acts as an intelligent middleware layer between your applications and various AI model providers like OpenAI, Anthropic, and Mistral. Instead of integrating directly with each provider's API, you connect to RelayCore's unified API, which then handles the communication with the appropriate AI service.

### Key Benefits

- **Smart Routing**: Automatically route requests to the best AI provider based on performance, cost, and availability.
- **Cost Optimization**: Reduce AI costs with intelligent caching, request deduplication, and token optimization.
- **Unified Interface**: Connect to multiple AI providers through a single, consistent API.
- **Plug-and-Play Integration**: Seamlessly integrate with your existing tools and workflows with our IDE plugins and CLI tools.
- **Analytics & Monitoring**: Track usage, costs, and performance metrics across all your AI integrations in one place.

### Use Cases

1. **Development Teams**: Integrate AI capabilities into your development workflow with our IDE plugins.
2. **Enterprise AI Infrastructure**: Centralize and optimize your organization's AI usage across multiple providers.
3. **AI Application Developers**: Build applications that can leverage multiple AI models without managing multiple integrations.
4. **Research Teams**: Experiment with different AI models through a consistent interface.

### Getting Started

To get started with RelayCore, check out our [Quick Start Guide](#quick-start) or dive into the [Installation](#installation) instructions.
`;

export const Documentation: React.FC = () => {
  const [activeSection, setActiveSection] = useState('introduction');
  
  const renderContent = () => {
    switch (activeSection) {
      case 'introduction':
        return introductionContent;
      default:
        return <p>This documentation section is coming soon.</p>;
    }
  };
  
  return (
    <DocContainer>
      <Sidebar>
        <SidebarCard>
          {sections.map((section) => (
            <NavSection key={section.title}>
              <NavTitle>{section.title}</NavTitle>
              <NavList>
                {section.items.map((item) => (
                  <NavItem 
                    key={item.id} 
                    active={activeSection === item.id}
                  >
                    <a 
                      href={`#${item.id}`} 
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveSection(item.id);
                      }}
                    >
                      {item.title}
                    </a>
                  </NavItem>
                ))}
              </NavList>
            </NavSection>
          ))}
        </SidebarCard>
      </Sidebar>
      
      <Content>
        <Card>
          <DocHeader>
            <DocTitle>Documentation</DocTitle>
            <DocDescription>
              Learn how to use RelayCore to optimize your AI infrastructure
            </DocDescription>
          </DocHeader>
          
          <DocContent dangerouslySetInnerHTML={{ __html: renderContent() }} />
        </Card>
      </Content>
    </DocContainer>
  );
};