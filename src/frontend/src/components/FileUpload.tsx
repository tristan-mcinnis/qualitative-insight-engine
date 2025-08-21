import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { FileUploadProps } from '../types';
import { Card, ErrorMessage } from '../styles/GlobalStyles';

const UploadArea = styled.div<{ $isDragOver: boolean; $disabled: boolean }>`
  border: 1px dashed ${props => 
    props.$isDragOver 
      ? theme.colors.grey[700]
      : props.$disabled 
        ? theme.colors.border.light 
        : theme.colors.grey[400]
  };
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing[16]} ${theme.spacing[8]};
  text-align: center;
  background: ${props => 
    props.$isDragOver 
      ? theme.colors.grey[100]
      : props.$disabled
        ? theme.colors.grey[50]
        : theme.colors.background.primary
  };
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all ${theme.transitions.normal};
  position: relative;
  overflow: hidden;
  
  &:hover {
    ${props => !props.$disabled && `
      border-color: ${theme.colors.grey[600]};
      background: ${theme.colors.grey[50]};
      transform: translateY(-1px);
    `}
  }
  
  &:focus-within {
    outline: 2px solid ${theme.colors.grey[400]};
    outline-offset: 2px;
  }
  
  ${props => props.$isDragOver && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, transparent 0%, ${theme.colors.grey[100]} 50%, transparent 100%);
      opacity: 0.5;
    }
  `}
`;

const UploadIcon = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto ${theme.spacing[6]};
  background: ${theme.colors.grey[100]};
  border: 1px solid ${theme.colors.border.light};
  border-radius: ${theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${theme.typography.fontSize['3xl']};
  color: ${theme.colors.grey[600]};
  transition: all ${theme.transitions.normal};
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: ${theme.borderRadius.lg};
    background: linear-gradient(135deg, ${theme.colors.grey[200]}, ${theme.colors.grey[100]});
    opacity: 0;
    transition: opacity ${theme.transitions.normal};
    z-index: -1;
  }
  
  .upload-area:hover & {
    transform: scale(1.05);
    
    &::after {
      opacity: 1;
    }
  }
`;

const UploadText = styled.div`
  margin-bottom: ${theme.spacing[4]};
`;

const UploadTitle = styled.h3`
  font-size: ${theme.typography.fontSize.xl};
  font-weight: ${theme.typography.fontWeight.bold};
  margin-bottom: ${theme.spacing[3]};
  color: ${theme.colors.text.primary};
  letter-spacing: -0.025em;
`;

const UploadDescription = styled.p`
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing[4]};
  font-size: ${theme.typography.fontSize.base};
  line-height: ${theme.typography.lineHeight.normal};
`;

const UploadHint = styled.p`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.muted};
  margin-bottom: ${theme.spacing[6]};
`;

const UploadButton = styled.button<{ $disabled: boolean }>`
  background: ${props => props.$disabled ? theme.colors.grey[100] : theme.colors.grey[900]};
  color: ${props => props.$disabled ? theme.colors.text.muted : theme.colors.text.inverse};
  border: none;
  padding: ${theme.spacing[3]} ${theme.spacing[6]};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSize.base};
  font-weight: ${theme.typography.fontWeight.semibold};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: all ${theme.transitions.normal};
  
  &:hover:not(:disabled) {
    background: ${theme.colors.grey[800]};
    transform: translateY(-1px);
    box-shadow: ${theme.shadows.md};
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:focus {
    outline: 2px solid ${theme.colors.grey[400]};
    outline-offset: 2px;
  }
`;

const FileList = styled.div`
  margin-top: ${theme.spacing[6]};
`;

const FileListTitle = styled.h4`
  font-size: ${theme.typography.fontSize.base};
  font-weight: ${theme.typography.fontWeight.medium};
  margin-bottom: ${theme.spacing[3]};
  color: ${theme.colors.text.primary};
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing[4]};
  background: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.light};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing[2]};
  transition: all ${theme.transitions.fast};
  
  &:hover {
    border-color: ${theme.colors.grey[300]};
    transform: translateX(4px);
    box-shadow: ${theme.shadows.sm};
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  flex: 1;
`;

const FileIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${theme.colors.grey[200]};
  border: 1px solid ${theme.colors.border.light};
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize.xs};
  font-weight: ${theme.typography.fontWeight.bold};
  flex-shrink: 0;
`;

const FileDetails = styled.div`
  flex: 1;
`;

const FileName = styled.div`
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[1]};
  word-break: break-all;
`;

const FileSize = styled.div`
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.muted};
`;

const RemoveButton = styled.button`
  padding: ${theme.spacing[2]};
  color: ${theme.colors.text.muted};
  background: none;
  border: 1px solid transparent;
  border-radius: ${theme.borderRadius.base};
  cursor: pointer;
  font-size: ${theme.typography.fontSize.base};
  transition: all ${theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${theme.colors.text.primary};
    background: ${theme.colors.grey[100]};
    border-color: ${theme.colors.border.light};
  }
  
  &:focus {
    outline: 2px solid ${theme.colors.grey[400]};
    outline-offset: 2px;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing[3]};
  margin-top: ${theme.spacing[6]};
  padding-top: ${theme.spacing[4]};
  border-top: 1px solid ${theme.colors.border.light};
`;

const FileStats = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[4]};
  margin-top: ${theme.spacing[4]};
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  background: ${theme.colors.grey[50]};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.secondary};
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[1]};
  
  .stat-value {
    font-weight: ${theme.typography.fontWeight.semibold};
    color: ${theme.colors.text.primary};
  }
`;

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  acceptedTypes = '.txt,.docx,.pdf,.md',
  maxFiles = 10,
  disabled = false
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const validateFiles = (files: FileList | File[]): string | null => {
    const fileArray = Array.from(files);
    
    if (fileArray.length === 0) {
      return 'Please select at least one file';
    }
    
    if (fileArray.length > maxFiles) {
      return `Maximum ${maxFiles} files allowed`;
    }
    
    const allowedExtensions = acceptedTypes.split(',').map(ext => ext.trim().toLowerCase());
    const invalidFiles = fileArray.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return !allowedExtensions.includes(extension);
    });
    
    if (invalidFiles.length > 0) {
      return `Invalid file types. Allowed: ${acceptedTypes}`;
    }
    
    return null;
  };

  const handleFileSelection = useCallback((files: FileList | File[]) => {
    const error = validateFiles(files);
    if (error) {
      setError(error);
      return;
    }
    
    setError('');
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
    onFilesSelected(fileArray);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFilesSelected]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelection(files);
  }, [disabled, handleFileSelection]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelection(e.target.files);
    }
  }, [handleFileSelection]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const removeFile = useCallback((index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedFiles, onFilesSelected]);

  const clearAll = useCallback(() => {
    setSelectedFiles([]);
    setError('');
    onFilesSelected([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFilesSelected]);

  return (
    <Card>
      <UploadArea
        className="upload-area"
        $isDragOver={isDragOver}
        $disabled={disabled}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label="Upload files by clicking or dragging and dropping"
      >
        <UploadIcon>
          {isDragOver ? '📤' : selectedFiles.length > 0 ? '✓' : '📁'}
        </UploadIcon>
        <UploadText>
          <UploadTitle>
            {selectedFiles.length > 0 
              ? `${selectedFiles.length} file(s) selected` 
              : 'Upload Discussion Guides & Transcripts'
            }
          </UploadTitle>
          <UploadDescription>
            Drag and drop your files here, or click to browse
          </UploadDescription>
          <UploadHint>
            Supported formats: {acceptedTypes} • Max {maxFiles} files
          </UploadHint>
        </UploadText>
        <UploadButton
          type="button"
          disabled={disabled}
          $disabled={disabled}
          data-testid="upload-button"
        >
          {selectedFiles.length > 0 ? 'Add More Files' : 'Choose Files'}
        </UploadButton>
      </UploadArea>
      
      <HiddenInput
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={handleInputChange}
        disabled={disabled}
      />
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {selectedFiles.length > 0 && (
        <FileList>
          <FileListTitle>Selected Files ({selectedFiles.length})</FileListTitle>
          
          <FileStats>
            <StatItem>
              <span className="stat-value">{selectedFiles.length}</span>
              <span>file{selectedFiles.length !== 1 ? 's' : ''}</span>
            </StatItem>
            <StatItem>
              <span className="stat-value">
                {formatFileSize(selectedFiles.reduce((total, file) => total + file.size, 0))}
              </span>
              <span>total size</span>
            </StatItem>
            <StatItem>
              <span className="stat-value">
                {Math.round(selectedFiles.reduce((total, file) => total + file.size, 0) / selectedFiles.length / 1024)}
              </span>
              <span>KB average</span>
            </StatItem>
          </FileStats>
          
          {selectedFiles.map((file, index) => (
            <FileItem 
              key={`${file.name}-${index}`}
              role="listitem"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                  e.preventDefault();
                  removeFile(index);
                }
              }}
            >
              <FileInfo>
                <FileIcon>{getFileExtension(file.name)}</FileIcon>
                <FileDetails>
                  <FileName title={file.name}>{file.name}</FileName>
                  <FileSize>
                    {formatFileSize(file.size)} • Modified: {new Date(file.lastModified).toLocaleDateString()}
                  </FileSize>
                </FileDetails>
              </FileInfo>
              <RemoveButton
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    removeFile(index);
                  }
                }}
                title="Remove file (Delete key)"
                aria-label={`Remove ${file.name}`}
              >
                <span style={{ width: '16px', height: '16px', display: 'block' }}>×</span>
              </RemoveButton>
            </FileItem>
          ))}
          
          <ActionButtons>
            <button
              type="button"
              onClick={clearAll}
              style={{
                padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
                background: 'transparent',
                border: `1px solid ${theme.colors.border.medium}`,
                borderRadius: theme.borderRadius.md,
                color: theme.colors.text.secondary,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                transition: `all ${theme.transitions.fast}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.grey[50];
                e.currentTarget.style.color = theme.colors.text.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = theme.colors.text.secondary;
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = `2px solid ${theme.colors.grey[400]}`;
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              Clear All ({selectedFiles.length})
            </button>
            
            <button
              type="button"
              onClick={handleClick}
              data-testid="next-step-button"
              style={{
                padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
                background: theme.colors.grey[900],
                border: 'none',
                borderRadius: theme.borderRadius.md,
                color: theme.colors.text.inverse,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                transition: `all ${theme.transitions.fast}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.grey[800];
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.grey[900];
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = `2px solid ${theme.colors.grey[400]}`;
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              Continue to Configure
              <span style={{ 
                marginLeft: theme.spacing[2], 
                fontSize: theme.typography.fontSize.xs,
                opacity: 0.8
              }}>
                (Ctrl+↵)
              </span>
            </button>
          </ActionButtons>
        </FileList>
      )}
    </Card>
  );
};

export default FileUpload;