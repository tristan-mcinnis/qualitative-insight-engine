import styled, { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    font-family: ${theme.typography.fontFamily.primary};
    font-size: ${theme.typography.fontSize.base};
    line-height: ${theme.typography.lineHeight.normal};
    color: ${theme.colors.text.primary};
    background-color: ${theme.colors.background.primary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  #root {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
    
    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
    
    &:focus {
      outline: 2px solid ${theme.colors.primary};
      outline-offset: 2px;
    }
  }

  a {
    color: ${theme.colors.primary};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }

  /* Scrollbar Styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${theme.colors.grey[100]};
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.grey[400]};
    border-radius: ${theme.borderRadius.base};
    
    &:hover {
      background: ${theme.colors.grey[500]};
    }
  }

  /* Focus visible for accessibility */
  button:focus-visible,
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }
`;

// Common styled components
export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${theme.spacing[4]};
  
  @media (min-width: ${theme.breakpoints.md}) {
    padding: 0 ${theme.spacing[6]};
  }
`;

export const Card = styled.div<{ $padding?: boolean }>`
  background: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.light};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.sm};
  padding: ${props => props.$padding !== false ? theme.spacing[6] : '0'};
`;

export const Button = styled.button<{
  $variant?: 'primary' | 'secondary' | 'outline';
  $size?: 'small' | 'medium' | 'large';
  $loading?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: ${theme.typography.fontWeight.medium};
  border-radius: ${theme.borderRadius.md};
  transition: all ${theme.transitions.fast};
  text-align: center;
  white-space: nowrap;
  
  ${props => {
    switch (props.$size) {
      case 'small':
        return `
          padding: ${theme.spacing[2]} ${theme.spacing[3]};
          font-size: ${theme.typography.fontSize.sm};
        `;
      case 'large':
        return `
          padding: ${theme.spacing[4]} ${theme.spacing[6]};
          font-size: ${theme.typography.fontSize.lg};
        `;
      default:
        return `
          padding: ${theme.spacing[3]} ${theme.spacing[4]};
          font-size: ${theme.typography.fontSize.base};
        `;
    }
  }}
  
  ${props => {
    switch (props.$variant) {
      case 'secondary':
        return `
          background: ${theme.colors.grey[100]};
          color: ${theme.colors.text.primary};
          border: 1px solid ${theme.colors.border.light};
          
          &:hover:not(:disabled) {
            background: ${theme.colors.grey[200]};
            border-color: ${theme.colors.border.medium};
          }
        `;
      case 'outline':
        return `
          background: transparent;
          color: ${theme.colors.primary};
          border: 1px solid ${theme.colors.primary};
          
          &:hover:not(:disabled) {
            background: ${theme.colors.primary};
            color: ${theme.colors.text.inverse};
          }
        `;
      default:
        return `
          background: ${theme.colors.primary};
          color: ${theme.colors.text.inverse};
          border: 1px solid ${theme.colors.primary};
          
          &:hover:not(:disabled) {
            background: ${theme.colors.grey[800]};
            border-color: ${theme.colors.grey[800]};
          }
        `;
    }
  }}
  
  ${props => props.$loading && `
    opacity: 0.7;
    cursor: wait;
  `}
`;

export const Input = styled.input`
  width: 100%;
  padding: ${theme.spacing[3]};
  border: 1px solid ${theme.colors.border.light};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSize.base};
  transition: border-color ${theme.transitions.fast};
  
  &:focus {
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 1px ${theme.colors.primary};
  }
  
  &::placeholder {
    color: ${theme.colors.text.muted};
  }
  
  &:disabled {
    background: ${theme.colors.grey[50]};
    cursor: not-allowed;
  }
`;

export const Label = styled.label`
  display: block;
  font-weight: ${theme.typography.fontWeight.medium};
  margin-bottom: ${theme.spacing[2]};
  color: ${theme.colors.text.primary};
`;

export const ErrorMessage = styled.div`
  color: ${theme.colors.error};
  font-size: ${theme.typography.fontSize.sm};
  margin-top: ${theme.spacing[1]};
`;

export const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid ${theme.colors.border.light};
  border-top: 2px solid ${theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: ${theme.spacing[2]};
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const ProgressBar = styled.div<{ $progress: number }>`
  width: 100%;
  height: 8px;
  background: ${theme.colors.grey[200]};
  border-radius: ${theme.borderRadius.full};
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    width: ${props => props.$progress}%;
    height: 100%;
    background: ${theme.colors.primary};
    transition: width ${theme.transitions.normal};
  }
`;