import React, { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { AnalysisConfigProps, AnalysisConfig } from '../types';
import { Card, Button, Input, Label, ErrorMessage } from '../styles/GlobalStyles';

const ConfigForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[6]};
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
`;

const SectionTitle = styled.h3`
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[2]};
`;

const SectionDescription = styled.p`
  color: ${theme.colors.text.muted};
  font-size: ${theme.typography.fontSize.sm};
  margin-bottom: ${theme.spacing[4]};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[2]};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing[4]};
  
  @media (max-width: ${theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[3]};
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing[3]};
  cursor: pointer;
  padding: ${theme.spacing[3]};
  border: 1px solid ${theme.colors.border.light};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background.primary};
  transition: all ${theme.transitions.fast};
  
  &:hover {
    background: ${theme.colors.grey[50]};
    border-color: ${theme.colors.border.medium};
  }
  
  &:has(input:checked) {
    border-color: ${theme.colors.primary};
    background: ${theme.colors.primary}08;
  }
`;

const CheckboxInput = styled.input.attrs({ type: 'checkbox' })`
  width: 18px;
  height: 18px;
  margin-top: 2px;
  accent-color: ${theme.colors.primary};
`;

const CheckboxContent = styled.div`
  flex: 1;
`;

const CheckboxLabel = styled.div`
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[1]};
`;

const CheckboxDescription = styled.div`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.muted};
  line-height: ${theme.typography.lineHeight.normal};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing[3]};
  justify-content: flex-end;
  padding-top: ${theme.spacing[4]};
  border-top: 1px solid ${theme.colors.border.light};
  
  @media (max-width: ${theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const PreviewSection = styled.div`
  background: ${theme.colors.grey[50]};
  border: 1px solid ${theme.colors.border.light};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing[4]};
  margin-top: ${theme.spacing[4]};
`;

const PreviewTitle = styled.h4`
  font-size: ${theme.typography.fontSize.base};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[3]};
`;

const PreviewItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing[2]} 0;
  border-bottom: 1px solid ${theme.colors.border.light};
  
  &:last-child {
    border-bottom: none;
  }
`;

const PreviewLabel = styled.span`
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.sm};
`;

const PreviewValue = styled.span`
  color: ${theme.colors.text.primary};
  font-weight: ${theme.typography.fontWeight.medium};
  font-size: ${theme.typography.fontSize.sm};
`;

const AnalysisConfigComponent: React.FC<AnalysisConfigProps> = ({
  onConfigSubmit,
  isLoading = false,
  disabled = false
}) => {
  const [config, setConfig] = useState<AnalysisConfig>({
    projectName: '',
    skipWord: false,
    skipExcel: false,
    debug: false,
    dryRun: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!config.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    } else if (config.projectName.trim().length < 3) {
      newErrors.projectName = 'Project name must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(config.projectName.trim())) {
      newErrors.projectName = 'Project name can only contain letters, numbers, spaces, hyphens, and underscores';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const trimmedConfig = {
        ...config,
        projectName: config.projectName.trim(),
        // Apply template-based configurations
        skipWord: reportTemplate === 'custom' ? config.skipWord : reportTemplate === 'executive',
        skipExcel: reportTemplate === 'custom' ? config.skipExcel : false,
        debug: reportTemplate === 'custom' ? config.debug : reportTemplate === 'detailed',
        dryRun: config.dryRun // Always respect user's dry run choice
      };
      onConfigSubmit(trimmedConfig);
    }
  };

  const handleInputChange = (field: keyof AnalysisConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const resetForm = () => {
    setConfig({
      projectName: '',
      skipWord: false,
      skipExcel: false,
      debug: false,
      dryRun: false
    });
    setErrors({});
  };

  return (
    <Card>
      <ConfigForm onSubmit={handleSubmit}>
        <FormSection>
          <SectionTitle>Project Configuration</SectionTitle>
          <SectionDescription>
            Configure your analysis settings and output preferences.
          </SectionDescription>
          
          <FormGroup>
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              type="text"
              value={config.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              placeholder="Enter a descriptive name for your analysis project"
              disabled={disabled}
              aria-describedby={errors.projectName ? 'projectName-error' : undefined}
            />
            {errors.projectName && (
              <ErrorMessage id="projectName-error">{errors.projectName}</ErrorMessage>
            )}
          </FormGroup>
        </FormSection>

        <FormSection>
          <SectionTitle>Output Options</SectionTitle>
          <SectionDescription>
            Choose which report formats to generate from your analysis.
          </SectionDescription>
          
          <CheckboxGroup>
            <CheckboxItem>
              <CheckboxInput
                checked={config.skipWord}
                onChange={(e) => handleInputChange('skipWord', e.target.checked)}
                disabled={disabled}
                id="skipWord"
              />
              <CheckboxContent>
                <CheckboxLabel>Skip Word Report</CheckboxLabel>
                <CheckboxDescription>
                  Don't generate a Microsoft Word document with detailed analysis results.
                  This can speed up processing if you only need Excel output.
                </CheckboxDescription>
              </CheckboxContent>
            </CheckboxItem>
            
            <CheckboxItem>
              <CheckboxInput
                checked={config.skipExcel}
                onChange={(e) => handleInputChange('skipExcel', e.target.checked)}
                disabled={disabled}
                id="skipExcel"
              />
              <CheckboxContent>
                <CheckboxLabel>Skip Excel Report</CheckboxLabel>
                <CheckboxDescription>
                  Don't generate an Excel spreadsheet with tabulated analysis data.
                  Choose this if you only need the Word document format.
                </CheckboxDescription>
              </CheckboxContent>
            </CheckboxItem>
          </CheckboxGroup>
        </FormSection>
        
        {reportTemplate === 'custom' && (
          <FormSection>
            <SectionTitle>Advanced Output Settings</SectionTitle>
            <SectionDescription>
              Fine-tune your report generation options.
            </SectionDescription>
          </FormSection>
        )}

        <FormSection>
          <SectionTitle>Advanced Options</SectionTitle>
          <SectionDescription>
            Additional settings for debugging and testing purposes.
          </SectionDescription>
          
          <CheckboxGroup>
            <CheckboxItem>
              <CheckboxInput
                checked={config.debug}
                onChange={(e) => handleInputChange('debug', e.target.checked)}
                disabled={disabled}
                id="debug"
              />
              <CheckboxContent>
                <CheckboxLabel>Enable Debug Mode</CheckboxLabel>
                <CheckboxDescription>
                  Generate additional logging information and intermediate files.
                  Useful for troubleshooting but may slow down processing.
                </CheckboxDescription>
              </CheckboxContent>
            </CheckboxItem>
            
            <CheckboxItem>
              <CheckboxInput
                checked={config.dryRun}
                onChange={(e) => handleInputChange('dryRun', e.target.checked)}
                disabled={disabled}
                id="dryRun"
              />
              <CheckboxContent>
                <CheckboxLabel>Dry Run Mode</CheckboxLabel>
                <CheckboxDescription>
                  Test the analysis process without generating final reports.
                  Perfect for validating your files and configuration.
                </CheckboxDescription>
              </CheckboxContent>
            </CheckboxItem>
          </CheckboxGroup>
        </FormSection>

        <PreviewSection>
          <PreviewTitle>Configuration Summary</PreviewTitle>
          <PreviewItem>
            <PreviewLabel>Project Name:</PreviewLabel>
            <PreviewValue>{config.projectName || 'Not specified'}</PreviewValue>
          </PreviewItem>
          <PreviewItem>
            <PreviewLabel>Report Template:</PreviewLabel>
            <PreviewValue>
              {reportTemplate === 'standard' && '📄 Standard Report'}
              {reportTemplate === 'detailed' && '📊 Detailed Analysis'}
              {reportTemplate === 'executive' && '📈 Executive Summary'}
              {reportTemplate === 'custom' && '⚙️ Custom Configuration'}
            </PreviewValue>
          </PreviewItem>
          <PreviewItem>
            <PreviewLabel>Estimated Time:</PreviewLabel>
            <PreviewValue>{estimatedTime}</PreviewValue>
          </PreviewItem>
          {reportTemplate === 'custom' && (
            <>
              <PreviewItem>
                <PreviewLabel>Word Report:</PreviewLabel>
                <PreviewValue>{config.skipWord ? 'Disabled' : 'Enabled'}</PreviewValue>
              </PreviewItem>
              <PreviewItem>
                <PreviewLabel>Excel Report:</PreviewLabel>
                <PreviewValue>{config.skipExcel ? 'Disabled' : 'Enabled'}</PreviewValue>
              </PreviewItem>
            </>
          )}
          {config.debug && (
            <PreviewItem>
              <PreviewLabel>Debug Mode:</PreviewLabel>
              <PreviewValue>Enabled</PreviewValue>
            </PreviewItem>
          )}
          {config.dryRun && (
            <PreviewItem>
              <PreviewLabel>Run Mode:</PreviewLabel>
              <PreviewValue>Dry Run (Test)</PreviewValue>
            </PreviewItem>
          )}
        </PreviewSection>

        <ButtonGroup>
          <Button
            type="button"
            $variant="secondary"
            onClick={resetForm}
            disabled={disabled}
          >
            Reset
          </Button>
          <button
            type="submit"
            disabled={disabled || isLoading}
            data-testid="submit-button"
            style={{
              background: isLoading || disabled ? theme.colors.grey[300] : theme.colors.grey[900],
              color: isLoading || disabled ? theme.colors.text.muted : theme.colors.text.inverse,
              border: 'none',
              padding: `${theme.spacing[3]} ${theme.spacing[8]}`,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.base,
              fontWeight: theme.typography.fontWeight.semibold,
              cursor: isLoading || disabled ? 'not-allowed' : 'pointer',
              transition: `all ${theme.transitions.normal}`,
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!isLoading && !disabled) {
                e.currentTarget.style.background = theme.colors.grey[800];
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && !disabled) {
                e.currentTarget.style.background = theme.colors.grey[900];
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                <span style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid currentColor',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></span>
                Starting Analysis...
              </span>
            ) : (
              <span>
                Start Analysis 
                <span style={{ 
                  marginLeft: theme.spacing[2], 
                  fontSize: theme.typography.fontSize.xs,
                  opacity: 0.8
                }}>
                  (Ctrl+↵)
                </span>
              </span>
            )}
          </button>
        </ButtonGroup>
      </ConfigForm>
    </Card>
  );
};

export default AnalysisConfigComponent;