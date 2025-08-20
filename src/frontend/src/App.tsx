import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { ThemeProvider, keyframes, css } from 'styled-components';
import { theme } from './styles/theme';
import { GlobalStyles } from './styles/GlobalStyles';
import Layout from './components/Layout';
import FileUpload from './components/FileUpload';
import AnalysisConfig from './components/AnalysisConfig';
import ProgressTracker from './components/ProgressTracker';
import ResultsViewer from './components/ResultsViewer';
import { ApiService, handleApiError } from './services/api';
import { AppState, AnalysisConfig as AnalysisConfigType, AnalysisResults } from './types';

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[6]};
`;

// Keyboard shortcut pulse animation
const pulseGlow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.1);
  }
  50% { 
    box-shadow: 0 0 0 8px rgba(0, 0, 0, 0.05);
  }
`;

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing[1]};
  margin-bottom: ${theme.spacing[8]};
  padding: ${theme.spacing[4]};
  background: ${theme.colors.background.primary};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border.light};
  position: relative;
  
  @media (max-width: ${theme.breakpoints.md}) {
    flex-wrap: wrap;
    gap: ${theme.spacing[2]};
    padding: ${theme.spacing[3]};
  }
`;

const StepContainer = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing[2]};
  padding: ${theme.spacing[2]};
  border-radius: ${theme.borderRadius.md};
  background: ${props => 
    props.$active 
      ? theme.colors.grey[100]
      : 'transparent'
  };
  transition: all ${theme.transitions.normal};
  cursor: pointer;
  position: relative;
  
  ${props => props.$active && css`
    animation: ${pulseGlow} 2s infinite;
  `}
  
  &:hover {
    background: ${theme.colors.grey[50]};
  }
`;

const StepDot = styled.div<{ $active: boolean; $completed: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => 
    props.$completed 
      ? theme.colors.grey[900]
      : props.$active 
        ? theme.colors.grey[700]
        : theme.colors.border.medium
  };
  color: ${props => 
    props.$completed || props.$active
      ? theme.colors.text.inverse
      : theme.colors.text.muted
  };
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${theme.typography.fontWeight.bold};
  font-size: ${theme.typography.fontSize.sm};
  transition: all ${theme.transitions.normal};
  
  ${props => props.$active && `
    transform: scale(1.1);
  `}
`;

const StepLine = styled.div<{ $completed: boolean }>`
  width: 60px;
  height: 1px;
  background: ${props => props.$completed ? theme.colors.grey[400] : theme.colors.border.light};
  transition: all ${theme.transitions.normal};
  margin: 0 ${theme.spacing[2]};
  
  @media (max-width: ${theme.breakpoints.sm}) {
    width: 30px;
  }
  
  @media (max-width: ${theme.breakpoints.md}) {
    display: none;
  }
`;

const StepLabel = styled.div<{ $active: boolean; $completed: boolean }>`
  font-size: ${theme.typography.fontSize.xs};
  color: ${props => 
    props.$completed 
      ? theme.colors.text.primary
      : props.$active 
        ? theme.colors.text.primary 
        : theme.colors.text.muted
  };
  font-weight: ${props => 
    props.$active || props.$completed 
      ? theme.typography.fontWeight.semibold 
      : theme.typography.fontWeight.normal
  };
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  @media (max-width: ${theme.breakpoints.md}) {
    display: none;
  }
`;

const StepNumber = styled.div`
  position: absolute;
  top: -${theme.spacing[2]};
  right: -${theme.spacing[2]};
  font-size: ${theme.typography.fontSize.xs};
  color: ${theme.colors.text.muted};
  font-weight: ${theme.typography.fontWeight.medium};
`;

const ErrorBanner = styled.div`
  background: ${theme.colors.grey[50]};
  border: 1px solid ${theme.colors.grey[300]};
  border-left: 4px solid ${theme.colors.grey[700]};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing[4]};
  margin-bottom: ${theme.spacing[6]};
  color: ${theme.colors.text.primary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[3]};
  box-shadow: ${theme.shadows.sm};
`;

const KeyboardShortcutsIndicator = styled.div`
  position: fixed;
  bottom: ${theme.spacing[4]};
  right: ${theme.spacing[4]};
  background: ${theme.colors.grey[900]};
  color: ${theme.colors.text.inverse};
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSize.xs};
  display: flex;
  gap: ${theme.spacing[2]};
  align-items: center;
  z-index: ${theme.zIndex.tooltip};
  opacity: 0.9;
  transition: all ${theme.transitions.fast};
  
  &:hover {
    opacity: 1;
  }
  
  @media (max-width: ${theme.breakpoints.md}) {
    display: none;
  }
`;

const KeyboardShortcut = styled.span`
  background: rgba(255, 255, 255, 0.2);
  padding: ${theme.spacing[1]} ${theme.spacing[2]};
  border-radius: ${theme.borderRadius.base};
  font-family: ${theme.typography.fontFamily.mono};
  font-size: ${theme.typography.fontSize.xs};
`;

const ErrorContent = styled.div`
  flex: 1;
`;

const ErrorTitle = styled.div`
  font-weight: ${theme.typography.fontWeight.semibold};
  margin-bottom: ${theme.spacing[1]};
  color: ${theme.colors.text.primary};
`;

const ErrorMessage = styled.div`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
  line-height: ${theme.typography.lineHeight.normal};
`;

const ErrorDismiss = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.text.muted};
  cursor: pointer;
  padding: ${theme.spacing[1]};
  font-size: ${theme.typography.fontSize.lg};
  border-radius: ${theme.borderRadius.base};
  transition: all ${theme.transitions.fast};
  
  &:hover {
    background: ${theme.colors.grey[200]};
    color: ${theme.colors.text.primary};
  }
  
  &:focus {
    outline: 2px solid ${theme.colors.grey[400]};
    outline-offset: 2px;
  }
`;

// Main App Component
const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    currentStep: 'upload',
    uploadedFiles: [],
    config: {
      projectName: '',
      skipWord: false,
      skipExcel: false,
      debug: false,
      dryRun: false
    },
    isAnalysisRunning: false,
    analysisProgress: 0,
    analysisStep: '',
    results: null,
    error: null
  });

  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [isPolling, setIsPolling] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      // Only handle shortcuts if not in an input field
      const isInInput = (e.target as HTMLElement).tagName === 'INPUT' || 
                       (e.target as HTMLElement).tagName === 'TEXTAREA' ||
                       (e.target as HTMLElement).contentEditable === 'true';
      
      if (isInInput) return;
      
      // Ctrl+U: Focus on upload
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        if (appState.currentStep === 'upload' && fileInputRef.current) {
          fileInputRef.current.click();
        } else {
          setAppState(prev => ({ ...prev, currentStep: 'upload' }));
        }
      }
      
      // Ctrl+Enter: Proceed to next step or submit current step
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const nextStepButton = document.querySelector('[data-testid="next-step-button"]') as HTMLButtonElement;
        const submitButton = document.querySelector('[data-testid="submit-button"]') as HTMLButtonElement;
        if (nextStepButton && !nextStepButton.disabled) {
          nextStepButton.click();
        } else if (submitButton && !submitButton.disabled) {
          submitButton.click();
        }
      }
      
      // Ctrl+R: Restart analysis
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        if (appState.currentStep === 'results') {
          handleStartOver();
        }
      }
      
      // Esc: Dismiss error or close modals
      if (e.key === 'Escape') {
        if (appState.error) {
          dismissError();
        }
      }
      
      // Ctrl+K: Toggle keyboard shortcuts visibility
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
      }
    };
    
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [appState.currentStep, appState.error]);
  
  // Check API connection on mount
  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = useCallback(async () => {
    setConnectionStatus('loading');
    try {
      await ApiService.checkHealth();
      setConnectionStatus('online');
    } catch (error) {
      setConnectionStatus('offline');
      console.error('API connection failed:', error);
    }
  }, []);

  // Poll analysis status when running
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (appState.isAnalysisRunning && connectionStatus === 'online') {
      setIsPolling(true);
      pollInterval = setInterval(async () => {
        try {
          const status = await ApiService.getAnalysisStatus();
          
          setAppState(prev => ({
            ...prev,
            analysisProgress: status.progress,
            analysisStep: status.currentStep,
            isAnalysisRunning: status.isRunning
          }));

          if (!status.isRunning) {
            setIsPolling(false);
            if (status.error) {
              setAppState(prev => ({
                ...prev,
                error: status.error || 'Analysis failed',
                currentStep: 'upload'
              }));
            } else {
              setAppState(prev => ({
                ...prev,
                currentStep: 'results'
              }));
            }
          }
        } catch (error) {
          console.error('Failed to poll analysis status:', error);
          setIsPolling(false);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        setIsPolling(false);
      }
    };
  }, [appState.isAnalysisRunning, connectionStatus]);

  const handleFilesSelected = useCallback((files: File[]) => {
    setAppState(prev => ({
      ...prev,
      uploadedFiles: files,
      currentStep: files.length > 0 ? 'config' : 'upload',
      error: null
    }));
  }, []);

  const handleConfigSubmit = useCallback(async (config: AnalysisConfigType) => {
    if (appState.uploadedFiles.length === 0) {
      setAppState(prev => ({
        ...prev,
        error: 'Please upload files before starting analysis'
      }));
      return;
    }

    setAppState(prev => ({
      ...prev,
      config,
      currentStep: 'analysis',
      isAnalysisRunning: true,
      analysisProgress: 0,
      analysisStep: 'initialize',
      error: null
    }));

    try {
      // First upload files
      const uploadResult = await ApiService.uploadFiles(appState.uploadedFiles);
      
      // Then start analysis
      const analysisRequest = {
        projectDir: uploadResult.projectDir,
        skipWord: config.skipWord,
        skipExcel: config.skipExcel,
        debug: config.debug,
        dryRun: config.dryRun
      };

      const response = await ApiService.runAnalysis(analysisRequest);
      
      if (response.success && response.results) {
        setAppState(prev => ({
          ...prev,
          results: response.results!,
          currentStep: 'results',
          isAnalysisRunning: false,
          analysisProgress: 100
        }));
      } else {
        throw new Error(response.error || 'Analysis failed');
      }
    } catch (error) {
      const apiError = handleApiError(error);
      setAppState(prev => ({
        ...prev,
        error: apiError.message,
        isAnalysisRunning: false,
        currentStep: 'config'
      }));
    }
  }, [appState.uploadedFiles]);

  const handleDownload = useCallback(async (reportPath: string) => {
    try {
      const blob = await ApiService.downloadReport(reportPath);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = reportPath.split('/').pop() || 'report';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const apiError = handleApiError(error);
      setAppState(prev => ({
        ...prev,
        error: `Download failed: ${apiError.message}`
      }));
    }
  }, []);

  const handleStartOver = useCallback(() => {
    setAppState({
      currentStep: 'upload',
      uploadedFiles: [],
      config: {
        projectName: '',
        skipWord: false,
        skipExcel: false,
        debug: false,
        dryRun: false
      },
      isAnalysisRunning: false,
      analysisProgress: 0,
      analysisStep: '',
      results: null,
      error: null
    });
  }, []);

  const dismissError = useCallback(() => {
    setAppState(prev => ({ ...prev, error: null }));
  }, []);

  const getStepNumber = (step: string): number => {
    switch (step) {
      case 'upload': return 1;
      case 'config': return 2;
      case 'analysis': return 3;
      case 'results': return 4;
      default: return 1;
    }
  };

  const isStepCompleted = (step: string): boolean => {
    const currentStepNum = getStepNumber(appState.currentStep);
    const stepNum = getStepNumber(step);
    return stepNum < currentStepNum;
  };

  const isStepActive = (step: string): boolean => {
    return step === appState.currentStep;
  };
  
  const canNavigateToStep = (step: string): boolean => {
    if (appState.isAnalysisRunning) return false;
    
    switch (step) {
      case 'upload':
        return true;
      case 'config':
        return appState.uploadedFiles.length > 0;
      case 'analysis':
        return false; // Can't manually navigate to analysis
      case 'results':
        return appState.results !== null;
      default:
        return false;
    }
  };

  const renderCurrentStep = () => {
    switch (appState.currentStep) {
      case 'upload':
        return (
          <FileUpload
            onFilesSelected={handleFilesSelected}
            disabled={connectionStatus !== 'online'}
          />
        );
      
      case 'config':
        return (
          <AnalysisConfig
            onConfigSubmit={handleConfigSubmit}
            disabled={connectionStatus !== 'online' || appState.isAnalysisRunning}
          />
        );
      
      case 'analysis':
        return (
          <ProgressTracker
            isRunning={appState.isAnalysisRunning}
            progress={appState.analysisProgress}
            currentStep={appState.analysisStep}
            error={appState.error}
          />
        );
      
      case 'results':
        return (
          <ResultsViewer
            results={appState.results}
            onDownload={handleDownload}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <AppContainer>
        <Layout 
          connectionStatus={connectionStatus}
          onRetryConnection={checkApiConnection}
        >
          <MainContent>
            {/* Error Banner */}
            {appState.error && (
              <ErrorBanner>
                <ErrorContent>
                  <ErrorTitle>Error</ErrorTitle>
                  <ErrorMessage>{appState.error}</ErrorMessage>
                </ErrorContent>
                <ErrorDismiss onClick={dismissError}>×</ErrorDismiss>
              </ErrorBanner>
            )}

            {/* Step Indicator */}
            <StepIndicator>
              <StepContainer 
                $active={isStepActive('upload')} 
                $completed={isStepCompleted('upload')}
                onClick={() => !appState.isAnalysisRunning && setAppState(prev => ({ ...prev, currentStep: 'upload' }))}
                role="button"
                tabIndex={0}
                aria-label="Go to upload step"
              >
                <StepDot 
                  $active={isStepActive('upload')} 
                  $completed={isStepCompleted('upload')} 
                >
                  1
                </StepDot>
                <StepLabel 
                  $active={isStepActive('upload')} 
                  $completed={isStepCompleted('upload')}
                >
                  Upload
                </StepLabel>
              </StepContainer>
              
              <StepLine $completed={isStepCompleted('config')} />
              
              <StepContainer 
                $active={isStepActive('config')} 
                $completed={isStepCompleted('config')}
                onClick={() => !appState.isAnalysisRunning && appState.uploadedFiles.length > 0 && setAppState(prev => ({ ...prev, currentStep: 'config' }))}
                role="button"
                tabIndex={0}
                aria-label="Go to configuration step"
              >
                <StepDot 
                  $active={isStepActive('config')} 
                  $completed={isStepCompleted('config')} 
                >
                  2
                </StepDot>
                <StepLabel 
                  $active={isStepActive('config')} 
                  $completed={isStepCompleted('config')}
                >
                  Configure
                </StepLabel>
              </StepContainer>
              
              <StepLine $completed={isStepCompleted('analysis')} />
              
              <StepContainer 
                $active={isStepActive('analysis')} 
                $completed={isStepCompleted('analysis')}
                role="button"
                tabIndex={0}
                aria-label="Analysis step"
              >
                <StepDot 
                  $active={isStepActive('analysis')} 
                  $completed={isStepCompleted('analysis')} 
                >
                  3
                </StepDot>
                <StepLabel 
                  $active={isStepActive('analysis')} 
                  $completed={isStepCompleted('analysis')}
                >
                  Analysis
                </StepLabel>
              </StepContainer>
              
              <StepLine $completed={isStepCompleted('results')} />
              
              <StepContainer 
                $active={isStepActive('results')} 
                $completed={isStepCompleted('results')}
                onClick={() => appState.results && setAppState(prev => ({ ...prev, currentStep: 'results' }))}
                role="button"
                tabIndex={0}
                aria-label="Go to results step"
              >
                <StepDot 
                  $active={isStepActive('results')} 
                  $completed={isStepCompleted('results')} 
                >
                  4
                </StepDot>
                <StepLabel 
                  $active={isStepActive('results')} 
                  $completed={isStepCompleted('results')}
                >
                  Results
                </StepLabel>
              </StepContainer>
            </StepIndicator>

            {/* Main Content */}
            {renderCurrentStep()}

            {/* Navigation Controls */}
            {appState.currentStep === 'results' && (
              <div style={{ textAlign: 'center', marginTop: theme.spacing[6] }}>
                <button
                  onClick={handleStartOver}
                  data-testid="restart-button"
                  style={{
                    padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
                    background: theme.colors.grey[100],
                    border: `1px solid ${theme.colors.grey[300]}`,
                    borderRadius: theme.borderRadius.md,
                    color: theme.colors.text.primary,
                    cursor: 'pointer',
                    fontSize: theme.typography.fontSize.base,
                    fontWeight: theme.typography.fontWeight.semibold,
                    transition: `all ${theme.transitions.normal}`,
                    boxShadow: theme.shadows.sm
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.colors.grey[200];
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = theme.colors.grey[100];
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Start New Analysis
                  <span style={{ 
                    marginLeft: theme.spacing[2], 
                    fontSize: theme.typography.fontSize.xs,
                    opacity: 0.7
                  }}>
                    (Ctrl+R)
                  </span>
                </button>
              </div>
            )}
            
            {/* Keyboard Shortcuts Indicator */}
            {showKeyboardShortcuts && (
              <KeyboardShortcutsIndicator>
                <KeyboardShortcut>Ctrl+U</KeyboardShortcut> Upload
                <span style={{ margin: `0 ${theme.spacing[1]}` }}>•</span>
                <KeyboardShortcut>Ctrl+↵</KeyboardShortcut> Next
                <span style={{ margin: `0 ${theme.spacing[1]}` }}>•</span>
                <KeyboardShortcut>Ctrl+R</KeyboardShortcut> Restart
                <span style={{ margin: `0 ${theme.spacing[1]}` }}>•</span>
                <KeyboardShortcut>Esc</KeyboardShortcut> Dismiss
              </KeyboardShortcutsIndicator>
            )}
            
            {/* Hidden file input for keyboard shortcuts */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.docx,.pdf,.md"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files) {
                  handleFilesSelected(Array.from(e.target.files));
                }
              }}
            />
          </MainContent>
        </Layout>
      </AppContainer>
    </ThemeProvider>
  );
};

export default App;