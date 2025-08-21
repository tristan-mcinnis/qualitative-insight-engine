import React, { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { theme } from '../styles/theme';
import { ProgressTrackerProps } from '../types';
import { Card, Button, ProgressBar, LoadingSpinner } from '../styles/GlobalStyles';

const ProgressContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[6]};
`;

const ProgressHeader = styled.div`
  text-align: center;
`;

const ProgressTitle = styled.h3`
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[2]};
`;

const ProgressDescription = styled.p`
  color: ${theme.colors.text.muted};
  font-size: ${theme.typography.fontSize.base};
`;

const ProgressSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing[2]};
`;

const ProgressLabel = styled.div`
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${theme.spacing[2]};
`;

const ProgressPercentage = styled.div`
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.sm};
`;

const CurrentStepCard = styled.div<{ $isActive: boolean }>`
  padding: ${theme.spacing[6]};
  background: ${props => props.$isActive ? theme.colors.grey[900] : theme.colors.grey[50]};
  color: ${props => props.$isActive ? theme.colors.text.inverse : theme.colors.text.primary};
  border: 1px solid ${props => props.$isActive ? theme.colors.grey[700] : theme.colors.border.light};
  border-radius: ${theme.borderRadius.lg};
  display: flex;
  align-items: center;
  gap: ${theme.spacing[4]};
  transition: all ${theme.transitions.normal};
  position: relative;
  overflow: hidden;
  
  ${props => props.$isActive && `
    box-shadow: ${theme.shadows.lg};
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, ${theme.colors.grey[600]}, ${theme.colors.grey[800]});
    }
  `}
`;

const StepIcon = styled.div<{ $isActive: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: ${theme.borderRadius.lg};
  background: ${props => props.$isActive ? 'rgba(255, 255, 255, 0.15)' : theme.colors.grey[200]};
  color: ${props => props.$isActive ? theme.colors.text.inverse : theme.colors.text.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${theme.typography.fontWeight.bold};
  font-size: ${theme.typography.fontSize.xl};
  flex-shrink: 0;
  transition: all ${theme.transitions.normal};
  border: 2px solid ${props => props.$isActive ? 'rgba(255, 255, 255, 0.3)' : 'transparent'};
  
  ${props => props.$isActive && css`
    animation: ${pulse} 2s infinite;
  `}
`;

const StepInfo = styled.div`
  flex: 1;
`;

const StepName = styled.div`
  font-weight: ${theme.typography.fontWeight.semibold};
  margin-bottom: ${theme.spacing[1]};
`;

const StepDescription = styled.div<{ $isActive: boolean }>`
  font-size: ${theme.typography.fontSize.sm};
  color: ${props => props.$isActive ? 'rgba(255, 255, 255, 0.8)' : theme.colors.text.muted};
`;

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[1]};
  background: ${theme.colors.background.primary};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing[4]};
  border: 1px solid ${theme.colors.border.light};
`;

const ProgressControls = styled.div`
  display: flex;
  justify-content: center;
  gap: ${theme.spacing[3]};
  margin-top: ${theme.spacing[4]};
  padding: ${theme.spacing[4]};
  background: ${theme.colors.grey[50]};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border.light};
`;

const ControlButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: ${theme.spacing[2]} ${theme.spacing[4]};
  border: 1px solid ${props => props.$variant === 'primary' ? theme.colors.grey[700] : theme.colors.border.medium};
  border-radius: ${theme.borderRadius.md};
  background: ${props => props.$variant === 'primary' ? theme.colors.grey[900] : theme.colors.background.primary};
  color: ${props => props.$variant === 'primary' ? theme.colors.text.inverse : theme.colors.text.primary};
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${theme.transitions.fast};
  
  &:hover {
    background: ${props => props.$variant === 'primary' ? theme.colors.grey[800] : theme.colors.grey[50]};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  &:focus {
    outline: 2px solid ${theme.colors.grey[400]};
    outline-offset: 2px;
  }
`;

const LiveMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: ${theme.spacing[3]};
  margin-top: ${theme.spacing[4]};
  padding: ${theme.spacing[4]};
  background: ${theme.colors.background.primary};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border.light};
`;

const MetricItem = styled.div`
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[1]};
`;

const MetricLabel = styled.div`
  font-size: ${theme.typography.fontSize.xs};
  color: ${theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TimelineItem = styled.div<{ $status: 'completed' | 'active' | 'pending' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  padding: ${theme.spacing[3]};
  border-radius: ${theme.borderRadius.md};
  background: ${props => {
    switch (props.$status) {
      case 'completed':
        return theme.colors.grey[50];
      case 'active':
        return theme.colors.grey[100];
      default:
        return 'transparent';
    }
  }};
  transition: all ${theme.transitions.fast};
  position: relative;
  
  ${props => props.$status === 'active' && `
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: ${theme.colors.grey[700]};
      border-radius: 2px;
    }
  `}
`;

const TimelineDot = styled.div<{ $status: 'completed' | 'active' | 'pending' }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${props => {
    switch (props.$status) {
      case 'completed':
        return theme.colors.grey[700];
      case 'active':
        return theme.colors.grey[900];
      default:
        return theme.colors.border.medium;
    }
  }};
  border: 2px solid ${props => {
    switch (props.$status) {
      case 'completed':
        return theme.colors.grey[300];
      case 'active':
        return theme.colors.grey[600];
      default:
        return theme.colors.border.light;
    }
  }};
  transition: all ${theme.transitions.normal};
  position: relative;
  
  ${props => props.$status === 'active' && css`
    animation: ${pulse} 2s infinite;
    box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.1);
  `}
  
  ${props => props.$status === 'completed' && `
    &::after {
      content: '✓';
      position: absolute;
      color: white;
      font-size: 10px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
    }
  `}
`;

const TimelineContent = styled.div<{ $status: 'completed' | 'active' | 'pending' }>`
  flex: 1;
  font-size: ${theme.typography.fontSize.sm};
  color: ${props => {
    switch (props.$status) {
      case 'completed':
        return theme.colors.text.primary;
      case 'active':
        return theme.colors.text.primary;
      default:
        return theme.colors.text.muted;
    }
  }};
  font-weight: ${props => props.$status !== 'pending' ? theme.typography.fontWeight.semibold : 'normal'};
`;

const TimelineTimestamp = styled.div`
  font-size: ${theme.typography.fontSize.xs};
  color: ${theme.colors.text.muted};
`;

const ErrorSection = styled.div`
  background: ${theme.colors.error}10;
  border: 1px solid ${theme.colors.error}40;
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing[4]};
  color: ${theme.colors.error};
`;

const ErrorTitle = styled.div`
  font-weight: ${theme.typography.fontWeight.semibold};
  margin-bottom: ${theme.spacing[2]};
`;

const ErrorMessage = styled.div`
  font-size: ${theme.typography.fontSize.sm};
  line-height: ${theme.typography.lineHeight.normal};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing[3]};
  justify-content: center;
  margin-top: ${theme.spacing[4]};
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
`;

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  isRunning,
  progress,
  currentStep,
  error
}) => {
  const [timelineHistory, setTimelineHistory] = useState<Array<{
    step: string;
    timestamp: Date;
    status: 'completed' | 'active' | 'pending';
  }>>([]);
  
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('');
  const [canPause, setCanPause] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [processingRate, setProcessingRate] = useState<number>(0);

  // Define analysis steps
  const analysisSteps = [
    { 
      id: 'initialize', 
      name: 'Initializing', 
      description: 'Setting up analysis environment' 
    },
    { 
      id: 'upload', 
      name: 'Processing Files', 
      description: 'Reading and validating uploaded files' 
    },
    { 
      id: 'analyze', 
      name: 'Running Analysis', 
      description: 'Extracting themes and patterns' 
    },
    { 
      id: 'generate', 
      name: 'Generating Reports', 
      description: 'Creating Word and Excel documents' 
    },
    { 
      id: 'finalize', 
      name: 'Finalizing', 
      description: 'Preparing results for download' 
    }
  ];

  // Update timeline when step changes
  useEffect(() => {
    if (currentStep && isRunning) {
      setTimelineHistory(prev => {
        // Mark previous step as completed
        const updated: Array<{
          step: string;
          timestamp: Date;
          status: 'completed' | 'active' | 'pending';
        }> = prev.map(item => ({ 
          step: item.step,
          timestamp: item.timestamp,
          status: 'completed' as const 
        }));
        
        // Add current step if not already present
        const currentExists = updated.find(item => item.step === currentStep);
        if (!currentExists) {
          updated.push({
            step: currentStep,
            timestamp: new Date(),
            status: 'active' as const
          });
        }
        
        return updated;
      });
    }
  }, [currentStep, isRunning]);

  // Track elapsed time and processing rate
  useEffect(() => {
    if (isRunning && !startTime) {
      setStartTime(new Date());
    }
    
    if (!isRunning && startTime) {
      // Analysis finished or stopped
      setStartTime(null);
    }
  }, [isRunning, startTime]);
  
  // Calculate processing rate
  useEffect(() => {
    if (isRunning && startTime && progress > 0) {
      const now = new Date();
      const elapsedMinutes = (now.getTime() - startTime.getTime()) / 60000;
      const rate = progress / elapsedMinutes;
      setProcessingRate(rate);
      
      // Enable pause after first minute
      if (elapsedMinutes > 1) {
        setCanPause(true);
      }
    }
  }, [isRunning, startTime, progress]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setElapsedTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, startTime]);

  const getCurrentStepInfo = () => {
    return analysisSteps.find(step => step.id === currentStep) || analysisSteps[0];
  };

  const getStepStatus = (stepId: string): 'completed' | 'active' | 'pending' => {
    if (error) return 'pending';
    
    const stepIndex = analysisSteps.findIndex(step => step.id === stepId);
    const currentStepIndex = analysisSteps.findIndex(step => step.id === currentStep);
    
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex && isRunning) return 'active';
    return 'pending';
  };

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString();
  };

  if (error) {
    return (
      <Card>
        <ProgressContainer>
          <ProgressHeader>
            <ProgressTitle>Analysis Failed</ProgressTitle>
            <ProgressDescription>
              An error occurred during the analysis process.
            </ProgressDescription>
          </ProgressHeader>
          
          <ErrorSection>
            <ErrorTitle>Error Details</ErrorTitle>
            <ErrorMessage>{error}</ErrorMessage>
          </ErrorSection>
          
          <ActionButtons>
            <Button $variant="primary" onClick={() => window.location.reload()}>
              Start Over
            </Button>
          </ActionButtons>
        </ProgressContainer>
      </Card>
    );
  }

  return (
    <Card>
      <ProgressContainer>
        <ProgressHeader>
          <ProgressTitle>
            {isRunning ? 'Analysis in Progress' : 'Analysis Complete'}
          </ProgressTitle>
          <ProgressDescription>
            {isRunning 
              ? `Processing your files and generating insights... ${elapsedTime ? `(${elapsedTime})` : ''}`
              : 'Your qualitative research analysis has been completed successfully.'
            }
          </ProgressDescription>
        </ProgressHeader>

        <ProgressSection>
          <ProgressInfo>
            <ProgressLabel>
              {isRunning && <LoadingSpinner />}
              Overall Progress
            </ProgressLabel>
            <ProgressPercentage>{Math.round(progress)}%</ProgressPercentage>
          </ProgressInfo>
          <ProgressBar $progress={progress} />
        </ProgressSection>

        {isRunning && (
          <>
            <CurrentStepCard $isActive={true}>
              <StepIcon $isActive={true}>
                {getCurrentStepInfo()?.id === 'initialize' ? '🚀' :
                 getCurrentStepInfo()?.id === 'upload' ? '📁' :
                 getCurrentStepInfo()?.id === 'analyze' ? '🔍' :
                 getCurrentStepInfo()?.id === 'generate' ? '📊' :
                 '✅'}
              </StepIcon>
              <StepInfo>
                <StepName>{getCurrentStepInfo()?.name}</StepName>
                <StepDescription $isActive={true}>
                  {getCurrentStepInfo()?.description}
                </StepDescription>
              </StepInfo>
            </CurrentStepCard>
            
            <LiveMetrics>
              <MetricItem>
                <MetricValue>{Math.round(progress)}%</MetricValue>
                <MetricLabel>Complete</MetricLabel>
              </MetricItem>
              <MetricItem>
                <MetricValue>{elapsedTime || '0:00'}</MetricValue>
                <MetricLabel>Elapsed</MetricLabel>
              </MetricItem>
              <MetricItem>
                <MetricValue>{processingRate.toFixed(1)}%/min</MetricValue>
                <MetricLabel>Rate</MetricLabel>
              </MetricItem>
              <MetricItem>
                <MetricValue>{Math.max(0, Math.round((100 - progress) / Math.max(processingRate, 1)))}</MetricValue>
                <MetricLabel>ETA (min)</MetricLabel>
              </MetricItem>
            </LiveMetrics>
          </>
        )}

        <Timeline>
          <h4 style={{ 
            margin: `${theme.spacing[2]} 0`, 
            color: theme.colors.text.primary,
            fontSize: theme.typography.fontSize.base,
            fontWeight: theme.typography.fontWeight.medium
          }}>
            Analysis Steps
          </h4>
          {analysisSteps.map((step) => (
            <TimelineItem key={step.id} $status={getStepStatus(step.id)}>
              <TimelineDot $status={getStepStatus(step.id)} />
              <TimelineContent $status={getStepStatus(step.id)}>
                <div>{step.name}</div>
                <div style={{ 
                  fontSize: theme.typography.fontSize.xs, 
                  opacity: 0.8,
                  marginTop: theme.spacing[1]
                }}>
                  {step.description}
                </div>
              </TimelineContent>
              {timelineHistory.find(item => item.step === step.id) && (
                <TimelineTimestamp>
                  {formatTimestamp(timelineHistory.find(item => item.step === step.id)!.timestamp)}
                </TimelineTimestamp>
              )}
            </TimelineItem>
          ))}
        </Timeline>

        {!isRunning && !error && (
          <ProgressControls>
            <ControlButton $variant="primary">
              View Results
            </ControlButton>
          </ProgressControls>
        )}
        
        {isRunning && canPause && (
          <ProgressControls>
            <ControlButton 
              onClick={() => setIsPaused(!isPaused)}
              disabled={!canPause}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </ControlButton>
            <ControlButton 
              $variant="secondary"
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel the analysis?')) {
                  window.location.reload();
                }
              }}
            >
              Cancel
            </ControlButton>
          </ProgressControls>
        )}
      </ProgressContainer>
    </Card>
  );
};

export default ProgressTracker;