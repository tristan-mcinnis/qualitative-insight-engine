import React from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { Container } from '../styles/GlobalStyles';

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: ${theme.colors.background.secondary};
`;

const Header = styled.header`
  background: ${theme.colors.background.primary};
  border-bottom: 1px solid ${theme.colors.border.light};
  padding: ${theme.spacing[5]} 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: ${theme.zIndex.dropdown};
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
`;

const LogoIcon = styled.div`
  width: 48px;
  height: 48px;
  background: ${theme.colors.grey[900]};
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.text.inverse};
  font-weight: ${theme.typography.fontWeight.bold};
  font-size: ${theme.typography.fontSize.lg};
  transition: all ${theme.transitions.normal};
  
  &:hover {
    transform: scale(1.05);
    background: ${theme.colors.grey[800]};
  }
`;

const LogoText = styled.h1`
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin: 0;
  letter-spacing: -0.025em;
  
  @media (max-width: ${theme.breakpoints.md}) {
    display: none;
  }
`;

const LogoSubtext = styled.p`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  margin: 0;
  font-weight: ${theme.typography.fontWeight.medium};
  
  @media (max-width: ${theme.breakpoints.lg}) {
    display: none;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[4]};
`;

const StatusIndicator = styled.div<{ $status: 'online' | 'offline' | 'loading' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.grey[50]};
  border: 1px solid ${theme.colors.border.light};
  transition: all ${theme.transitions.fast};
  cursor: ${props => props.$status === 'offline' ? 'pointer' : 'default'};
  
  &:hover {
    ${props => props.$status === 'offline' && `
      background: ${theme.colors.grey[100]};
    `}
  }
  
  &::before {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${props => {
      switch (props.$status) {
        case 'online':
          return theme.colors.grey[700];
        case 'offline':
          return theme.colors.grey[400];
        case 'loading':
          return theme.colors.grey[500];
        default:
          return theme.colors.grey[400];
      }
    }};
    
    ${props => props.$status === 'loading' && `
      animation: pulse 1.5s infinite;
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `}
  }
`;

const SkipLink = styled.a`
  position: absolute;
  top: -40px;
  left: 6px;
  background: ${theme.colors.grey[900]};
  color: ${theme.colors.text.inverse};
  padding: 8px;
  text-decoration: none;
  border-radius: ${theme.borderRadius.base};
  z-index: ${theme.zIndex.modal};
  transition: top 0.2s;
  font-weight: ${theme.typography.fontWeight.semibold};
  
  &:focus {
    top: 6px;
  }
`;

const Main = styled.main`
  flex: 1;
  padding: ${theme.spacing[6]} 0;
  
  @media (max-width: ${theme.breakpoints.md}) {
    padding: ${theme.spacing[4]} 0;
  }
`;

const Footer = styled.footer`
  background: ${theme.colors.grey[50]};
  border-top: 1px solid ${theme.colors.border.light};
  padding: ${theme.spacing[6]} 0;
  margin-top: auto;
`;

const FooterContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.muted};
  
  @media (max-width: ${theme.breakpoints.md}) {
    flex-direction: column;
    gap: ${theme.spacing[2]};
    text-align: center;
  }
`;

const FooterLinks = styled.div`
  display: flex;
  gap: ${theme.spacing[4]};
  
  a {
    color: ${theme.colors.text.muted};
    
    &:hover {
      color: ${theme.colors.text.primary};
    }
  }
`;

interface LayoutComponentProps extends LayoutProps {
  connectionStatus?: 'online' | 'offline' | 'loading';
  onRetryConnection?: () => void;
}

const Layout: React.FC<LayoutComponentProps> = ({ 
  children, 
  connectionStatus = 'loading',
  onRetryConnection 
}) => {
  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Connected';
      case 'offline':
        return 'Disconnected';
      case 'loading':
        return 'Connecting...';
      default:
        return 'Unknown';
    }
  };

  return (
    <LayoutWrapper>
      <SkipLink href="#main">Skip to main content</SkipLink>
      
      <Header role="banner">
        <Container>
          <HeaderContent>
            <Logo>
              <LogoIcon aria-hidden="true">QR</LogoIcon>
              <div>
                <LogoText>Qualitative Research Pipeline</LogoText>
                <LogoSubtext>Advanced text analysis and reporting</LogoSubtext>
              </div>
            </Logo>
            <HeaderActions>
              <StatusIndicator 
                $status={connectionStatus}
                onClick={connectionStatus === 'offline' ? onRetryConnection : undefined}
                title={connectionStatus === 'offline' ? 'Click to retry connection' : ''}
                role={connectionStatus === 'offline' ? 'button' : undefined}
                tabIndex={connectionStatus === 'offline' ? 0 : undefined}
                aria-label={`Connection status: ${getStatusText(connectionStatus)}${connectionStatus === 'offline' ? '. Click to retry' : ''}`}
                onKeyDown={(e) => {
                  if (connectionStatus === 'offline' && (e.key === 'Enter' || e.key === ' ') && onRetryConnection) {
                    e.preventDefault();
                    onRetryConnection();
                  }
                }}
              >
                {getStatusText(connectionStatus)}
              </StatusIndicator>
            </HeaderActions>
          </HeaderContent>
        </Container>
      </Header>
      
      <Main id="main" role="main">
        <Container>
          {children}
        </Container>
      </Main>
      
      <Footer role="contentinfo">
        <Container>
          <FooterContent>
            <div>
              © 2025 Qualitative Research Pipeline. Professional text analysis toolkit.
            </div>
            <FooterLinks role="navigation" aria-label="Footer navigation">
              <a href="#help">Help</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </FooterLinks>
          </FooterContent>
        </Container>
      </Footer>
    </LayoutWrapper>
  );
};

export default Layout;