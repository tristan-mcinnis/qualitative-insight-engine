import React, { useState } from 'react';
import styled from 'styled-components';
import { theme } from '../styles/theme';
import { ResultsViewerProps } from '../types';
import { Card } from '../styles/GlobalStyles';

const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[6]};
`;

const ResultsHeader = styled.div`
  text-align: center;
  padding-bottom: ${theme.spacing[4]};
  border-bottom: 1px solid ${theme.colors.border.light};
`;

const ResultsTitle = styled.h2`
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[2]};
`;

const ResultsSubtitle = styled.p`
  color: ${theme.colors.text.muted};
  font-size: ${theme.typography.fontSize.base};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: ${theme.spacing[4]};
  margin-bottom: ${theme.spacing[6]};
`;

const ViewControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[4]};
  margin-bottom: ${theme.spacing[4]};
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  background: ${theme.colors.grey[50]};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border.light};
  
  @media (max-width: ${theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${theme.spacing[3]};
  }
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  
  @media (max-width: ${theme.breakpoints.sm}) {
    flex-wrap: wrap;
  }
`;

const ViewModeButton = styled.button<{ $active: boolean }>`
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border: 1px solid ${props => props.$active ? theme.colors.grey[700] : theme.colors.border.medium};
  background: ${props => props.$active ? theme.colors.grey[900] : theme.colors.background.primary};
  color: ${props => props.$active ? theme.colors.text.inverse : theme.colors.text.primary};
  border-radius: ${theme.borderRadius.base};
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${theme.transitions.fast};
  
  &:hover {
    background: ${props => props.$active ? theme.colors.grey[800] : theme.colors.grey[50]};
  }
  
  &:focus {
    outline: 2px solid ${theme.colors.grey[400]};
    outline-offset: 2px;
  }
`;

const FilterInput = styled.input`
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border: 1px solid ${theme.colors.border.medium};
  border-radius: ${theme.borderRadius.base};
  background: ${theme.colors.background.primary};
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize.sm};
  min-width: 200px;
  
  &:focus {
    outline: 2px solid ${theme.colors.grey[400]};
    outline-offset: 2px;
    border-color: ${theme.colors.grey[600]};
  }
  
  &::placeholder {
    color: ${theme.colors.text.muted};
  }
`;

const SortSelect = styled.select`
  padding: ${theme.spacing[2]} ${theme.spacing[3]};
  border: 1px solid ${theme.colors.border.medium};
  border-radius: ${theme.borderRadius.base};
  background: ${theme.colors.background.primary};
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize.sm};
  cursor: pointer;
  
  &:focus {
    outline: 2px solid ${theme.colors.grey[400]};
    outline-offset: 2px;
    border-color: ${theme.colors.grey[600]};
  }
`;

const StatCard = styled(Card)`
  text-align: center;
  padding: ${theme.spacing[5]};
  position: relative;
  overflow: hidden;
  transition: all ${theme.transitions.normal};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.shadows.md};
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, ${theme.colors.grey[600]}, ${theme.colors.grey[800]});
  }
`;

const StatValue = styled.div`
  font-size: ${theme.typography.fontSize['3xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.grey[900]};
  margin-bottom: ${theme.spacing[2]};
  letter-spacing: -0.05em;
`;

const StatLabel = styled.div`
  color: ${theme.colors.text.muted};
  font-size: ${theme.typography.fontSize.sm};
`;

const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
`;

const TabList = styled.div`
  display: flex;
  gap: ${theme.spacing[2]};
  border-bottom: 1px solid ${theme.colors.border.light};
  overflow-x: auto;
  
  @media (max-width: ${theme.breakpoints.md}) {
    gap: ${theme.spacing[1]};
  }
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: ${theme.spacing[3]} ${theme.spacing[4]};
  font-size: ${theme.typography.fontSize.base};
  font-weight: ${theme.typography.fontWeight.medium};
  border: none;
  background: none;
  color: ${props => props.$active ? theme.colors.primary : theme.colors.text.muted};
  border-bottom: 2px solid ${props => props.$active ? theme.colors.primary : 'transparent'};
  cursor: pointer;
  transition: all ${theme.transitions.fast};
  white-space: nowrap;
  
  &:hover {
    color: ${theme.colors.primary};
  }
`;

const TabContent = styled.div`
  min-height: 300px;
`;

const SummarySection = styled.div`
  background: ${theme.colors.grey[50]};
  border: 1px solid ${theme.colors.border.light};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing[6]};
`;

const SummaryText = styled.p`
  font-size: ${theme.typography.fontSize.base};
  line-height: ${theme.typography.lineHeight.relaxed};
  color: ${theme.colors.text.primary};
  margin: 0;
`;

const ThemesGrid = styled.div<{ $viewMode: 'grid' | 'list' | 'chart' }>`
  display: ${props => props.$viewMode === 'list' ? 'flex' : 'grid'};
  flex-direction: ${props => props.$viewMode === 'list' ? 'column' : 'unset'};
  gap: ${theme.spacing[4]};
  
  ${props => props.$viewMode === 'grid' && `
    @media (min-width: ${theme.breakpoints.lg}) {
      grid-template-columns: repeat(2, 1fr);
    }
  `}
  
  ${props => props.$viewMode === 'chart' && `
    grid-template-columns: 1fr;
  `}
`;

const ChartView = styled.div`
  background: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.light};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing[6]};
  margin-bottom: ${theme.spacing[4]};
`;

const ChartBar = styled.div<{ $width: number }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing[3]};
  margin-bottom: ${theme.spacing[3]};
  padding: ${theme.spacing[2]};
  border-radius: ${theme.borderRadius.base};
  background: ${theme.colors.grey[50]};
  transition: all ${theme.transitions.normal};
  
  &:hover {
    background: ${theme.colors.grey[100]};
  }
`;

const ChartBarFill = styled.div<{ $width: number }>`
  height: 8px;
  background: linear-gradient(90deg, ${theme.colors.grey[600]}, ${theme.colors.grey[800]});
  border-radius: 4px;
  width: ${props => props.$width}%;
  transition: width ${theme.transitions.normal};
  min-width: 20px;
`;

const ChartLabel = styled.div`
  flex: 1;
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.medium};
  color: ${theme.colors.text.primary};
`;

const ChartValue = styled.div`
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.text.secondary};
  min-width: 40px;
  text-align: right;
`;

const ThemeCard = styled(Card)<{ $listView?: boolean }>`
  padding: ${props => props.$listView ? theme.spacing[4] : theme.spacing[5]};
  transition: all ${theme.transitions.normal};
  
  &:hover {
    transform: ${props => props.$listView ? 'translateX(8px)' : 'translateY(-2px)'};
    box-shadow: ${theme.shadows.md};
  }
  
  ${props => props.$listView && `
    display: flex;
    align-items: center;
    gap: ${theme.spacing[4]};
  `}
`;

const ThemeHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: flex-start;
  gap: ${theme.spacing[3]};
  margin-bottom: ${theme.spacing[4]};
`;

const ThemeInfo = styled.div`
  flex: 1;
`;

const ThemeName = styled.h3`
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[2]};
`;

const ThemeDescription = styled.p`
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.fontSize.base};
  line-height: ${theme.typography.lineHeight.normal};
  margin: 0;
`;

const ThemeFrequency = styled.div`
  text-align: right;
  flex-shrink: 0;
`;

const FrequencyNumber = styled.div`
  font-size: ${theme.typography.fontSize['2xl']};
  font-weight: ${theme.typography.fontWeight.bold};
  color: ${theme.colors.grey[900]};
`;

const FrequencyLabel = styled.div`
  font-size: ${theme.typography.fontSize.xs};
  color: ${theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ExamplesList = styled.div`
  margin-top: ${theme.spacing[4]};
`;

const ExamplesTitle = styled.h4`
  font-size: ${theme.typography.fontSize.sm};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[2]};
`;

const ExampleItem = styled.div`
  background: ${theme.colors.background.primary};
  border: 1px solid ${theme.colors.border.light};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing[3]};
  margin-bottom: ${theme.spacing[2]};
  font-size: ${theme.typography.fontSize.sm};
  font-style: italic;
  color: ${theme.colors.text.secondary};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DownloadsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing[4]};
`;

const DownloadCard = styled(Card)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing[4]};
  padding: ${theme.spacing[5]};
  transition: all ${theme.transitions.normal};
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${theme.shadows.md};
  }
`;

const DownloadInfo = styled.div`
  flex: 1;
`;

const DownloadTitle = styled.h3`
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.primary};
  margin-bottom: ${theme.spacing[2]};
`;

const DownloadDetails = styled.div`
  display: flex;
  gap: ${theme.spacing[4]};
  font-size: ${theme.typography.fontSize.sm};
  color: ${theme.colors.text.muted};
`;

const DownloadIcon = styled.div`
  width: 56px;
  height: 56px;
  background: ${theme.colors.grey[100]};
  border: 2px solid ${theme.colors.border.light};
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.fontSize['2xl']};
  flex-shrink: 0;
  transition: all ${theme.transitions.normal};
  
  .download-card:hover & {
    background: ${theme.colors.grey[200]};
    transform: scale(1.05);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing[12]} ${theme.spacing[6]};
  color: ${theme.colors.text.muted};
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: ${theme.spacing[4]};
`;

const EmptyTitle = styled.h3`
  font-size: ${theme.typography.fontSize.lg};
  font-weight: ${theme.typography.fontWeight.semibold};
  color: ${theme.colors.text.secondary};
  margin-bottom: ${theme.spacing[2]};
`;

const EmptyDescription = styled.p`
  color: ${theme.colors.text.muted};
  margin: 0;
`;

const ResultsViewer: React.FC<ResultsViewerProps> = ({
  results,
  onDownload
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'themes' | 'downloads' | 'insights'>('summary');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'chart'>('grid');
  const [sortBy, setSortBy] = useState<'frequency' | 'alphabetical' | 'relevance'>('frequency');
  const [filterKeyword, setFilterKeyword] = useState<string>('');

  if (!results) {
    return (
      <Card>
        <EmptyState>
          <EmptyIcon>📊</EmptyIcon>
          <EmptyTitle>No Results Available</EmptyTitle>
          <EmptyDescription>
            Complete an analysis to view your results here.
          </EmptyDescription>
        </EmptyState>
      </Card>
    );
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'word':
        return '📄';
      case 'excel':
        return '📊';
      default:
        return '📁';
    }
  };

  const getReportLabel = (type: string) => {
    switch (type) {
      case 'word':
        return 'Word Document';
      case 'excel':
        return 'Excel Spreadsheet';
      default:
        return 'Report File';
    }
  };
  
  const getSortedFilteredThemes = () => {
    let filtered = results.themes.filter(theme => 
      filterKeyword === '' || 
      theme.name.toLowerCase().includes(filterKeyword.toLowerCase()) ||
      theme.description.toLowerCase().includes(filterKeyword.toLowerCase())
    );
    
    switch (sortBy) {
      case 'frequency':
        return filtered.sort((a, b) => b.frequency - a.frequency);
      case 'alphabetical':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'relevance':
        // Simple relevance based on frequency and name match
        return filtered.sort((a, b) => {
          const aScore = a.frequency + (filterKeyword && a.name.toLowerCase().includes(filterKeyword.toLowerCase()) ? 10 : 0);
          const bScore = b.frequency + (filterKeyword && b.name.toLowerCase().includes(filterKeyword.toLowerCase()) ? 10 : 0);
          return bScore - aScore;
        });
      default:
        return filtered;
    }
  };

  return (
    <ResultsContainer>
      <ResultsHeader>
        <ResultsTitle>Analysis Results</ResultsTitle>
        <ResultsSubtitle>
          Your qualitative research analysis has been completed successfully
        </ResultsSubtitle>
      </ResultsHeader>

      <StatsGrid>
        <StatCard>
          <StatValue>{results.files_processed}</StatValue>
          <StatLabel>Files Processed</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{results.themes.length}</StatValue>
          <StatLabel>Themes Identified</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{formatDuration(results.processing_time)}</StatValue>
          <StatLabel>Processing Time</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{results.reports.length}</StatValue>
          <StatLabel>Reports Generated</StatLabel>
        </StatCard>
      </StatsGrid>

      <TabContainer>
        <TabList>
          <Tab 
            $active={activeTab === 'summary'} 
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </Tab>
          <Tab 
            $active={activeTab === 'themes'} 
            onClick={() => setActiveTab('themes')}
          >
            Themes ({results.themes.length})
          </Tab>
          <Tab 
            $active={activeTab === 'insights'} 
            onClick={() => setActiveTab('insights')}
          >
            📊 Insights
          </Tab>
          <Tab 
            $active={activeTab === 'downloads'} 
            onClick={() => setActiveTab('downloads')}
          >
            Downloads ({results.reports.length})
          </Tab>
        </TabList>

        <TabContent>
          {activeTab === 'summary' && (
            <SummarySection>
              <SummaryText>{results.summary}</SummaryText>
            </SummarySection>
          )}

          {activeTab === 'themes' && (
            <>
              <ViewControls>
                <ControlGroup>
                  <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text.secondary }}>View:</span>
                  <ViewModeButton 
                    $active={viewMode === 'grid'} 
                    onClick={() => setViewMode('grid')}
                    title="Grid view"
                  >
                    ▦
                  </ViewModeButton>
                  <ViewModeButton 
                    $active={viewMode === 'list'} 
                    onClick={() => setViewMode('list')}
                    title="List view"
                  >
                    ≡
                  </ViewModeButton>
                  <ViewModeButton 
                    $active={viewMode === 'chart'} 
                    onClick={() => setViewMode('chart')}
                    title="Chart view"
                  >
                    📊
                  </ViewModeButton>
                </ControlGroup>
                
                <ControlGroup>
                  <SortSelect 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as 'frequency' | 'alphabetical' | 'relevance')}
                  >
                    <option value="frequency">Sort by Frequency</option>
                    <option value="alphabetical">Sort Alphabetically</option>
                    <option value="relevance">Sort by Relevance</option>
                  </SortSelect>
                  
                  <FilterInput
                    type="text"
                    placeholder="Filter themes..."
                    value={filterKeyword}
                    onChange={(e) => setFilterKeyword(e.target.value)}
                  />
                </ControlGroup>
              </ViewControls>
              
              {viewMode === 'chart' ? (
                <ChartView>
                  <h4 style={{ 
                    margin: `0 0 ${theme.spacing[4]} 0`,
                    fontSize: theme.typography.fontSize.lg,
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.primary
                  }}>
                    Theme Frequency Distribution
                  </h4>
                  {getSortedFilteredThemes().map((theme, index) => {
                    const maxFrequency = Math.max(...results.themes.map(t => t.frequency));
                    const width = (theme.frequency / maxFrequency) * 100;
                    return (
                      <ChartBar key={theme.id} $width={width}>
                        <ChartLabel>{theme.name}</ChartLabel>
                        <ChartBarFill $width={width} />
                        <ChartValue>{theme.frequency}</ChartValue>
                      </ChartBar>
                    );
                  })}
                </ChartView>
              ) : (
                <ThemesGrid $viewMode={viewMode}>
                  {getSortedFilteredThemes().map((theme) => (
                    <ThemeCard key={theme.id} $listView={viewMode === 'list'}>
                      <ThemeHeader style={viewMode === 'list' ? { marginBottom: 0 } : {}}>
                        <ThemeInfo>
                          <ThemeName>{theme.name}</ThemeName>
                          <ThemeDescription>{theme.description}</ThemeDescription>
                        </ThemeInfo>
                        <ThemeFrequency>
                          <FrequencyNumber>{theme.frequency}</FrequencyNumber>
                          <FrequencyLabel>Mentions</FrequencyLabel>
                        </ThemeFrequency>
                      </ThemeHeader>
                      
                      {theme.examples.length > 0 && viewMode !== 'list' && (
                        <ExamplesList>
                          <ExamplesTitle>Example Quotes</ExamplesTitle>
                          {theme.examples.slice(0, 3).map((example, index) => (
                            <ExampleItem key={index}>"{example}"</ExampleItem>
                          ))}
                        </ExamplesList>
                      )}
                    </ThemeCard>
                  ))}
                </ThemesGrid>
              )}
            </>
          )}

          {activeTab === 'insights' && (
            <div style={{ display: 'grid', gap: theme.spacing[6] }}>
              <ChartView>
                <h4 style={{ 
                  margin: `0 0 ${theme.spacing[4]} 0`,
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.primary
                }}>
                  Key Insights
                </h4>
                <div style={{ display: 'grid', gap: theme.spacing[4] }}>
                  <div style={{ 
                    padding: theme.spacing[4], 
                    background: theme.colors.grey[50], 
                    borderRadius: theme.borderRadius.md,
                    borderLeft: `4px solid ${theme.colors.grey[700]}`
                  }}>
                    <h5 style={{ 
                      margin: `0 0 ${theme.spacing[2]} 0`,
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: theme.colors.text.primary
                    }}>
                      Most Significant Theme
                    </h5>
                    <p style={{ 
                      margin: 0,
                      fontSize: theme.typography.fontSize.sm,
                      color: theme.colors.text.secondary
                    }}>
                      {results.themes.length > 0 && 
                        `"${results.themes.reduce((prev, current) => 
                          (prev.frequency > current.frequency) ? prev : current
                        ).name}" appeared ${results.themes.reduce((prev, current) => 
                          (prev.frequency > current.frequency) ? prev : current
                        ).frequency} times across your data.`
                      }
                    </p>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: theme.spacing[3]
                  }}>
                    <div style={{ 
                      padding: theme.spacing[3], 
                      background: theme.colors.background.primary,
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: theme.borderRadius.md,
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: theme.typography.fontSize.xl,
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.grey[900],
                        marginBottom: theme.spacing[1]
                      }}>
                        {Math.round(results.themes.reduce((sum, theme) => sum + theme.frequency, 0) / results.themes.length)}
                      </div>
                      <div style={{ 
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.text.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Average Frequency
                      </div>
                    </div>
                    
                    <div style={{ 
                      padding: theme.spacing[3], 
                      background: theme.colors.background.primary,
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: theme.borderRadius.md,
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: theme.typography.fontSize.xl,
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.grey[900],
                        marginBottom: theme.spacing[1]
                      }}>
                        {results.themes.filter(theme => theme.frequency > 5).length}
                      </div>
                      <div style={{ 
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.text.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        High-Impact Themes
                      </div>
                    </div>
                    
                    <div style={{ 
                      padding: theme.spacing[3], 
                      background: theme.colors.background.primary,
                      border: `1px solid ${theme.colors.border.light}`,
                      borderRadius: theme.borderRadius.md,
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: theme.typography.fontSize.xl,
                        fontWeight: theme.typography.fontWeight.bold,
                        color: theme.colors.grey[900],
                        marginBottom: theme.spacing[1]
                      }}>
                        {Math.round((results.themes.reduce((sum, theme) => sum + theme.frequency, 0) / results.files_processed) * 10) / 10}
                      </div>
                      <div style={{ 
                        fontSize: theme.typography.fontSize.xs,
                        color: theme.colors.text.muted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Themes per File
                      </div>
                    </div>
                  </div>
                </div>
              </ChartView>
            </div>
          )}
          
          {activeTab === 'downloads' && (
            <DownloadsSection>
              {results.reports.map((report, index) => (
                <DownloadCard key={index} className="download-card">
                  <DownloadIcon>
                    {getReportIcon(report.type)}
                  </DownloadIcon>
                  <DownloadInfo>
                    <DownloadTitle>{getReportLabel(report.type)}</DownloadTitle>
                    <DownloadDetails>
                      <span>{report.filename}</span>
                      <span>•</span>
                      <span>{formatFileSize(report.size)}</span>
                      <span>•</span>
                      <span>Created: {new Date(report.created_at).toLocaleDateString()}</span>
                    </DownloadDetails>
                  </DownloadInfo>
                  <button
                    onClick={() => onDownload(report.path)}
                    style={{
                      padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
                      background: theme.colors.grey[900],
                      color: theme.colors.text.inverse,
                      border: 'none',
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.semibold,
                      cursor: 'pointer',
                      transition: `all ${theme.transitions.normal}`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.colors.grey[800];
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme.colors.grey[900];
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Download
                  </button>
                </DownloadCard>
              ))}
            </DownloadsSection>
          )}
        </TabContent>
      </TabContainer>
    </ResultsContainer>
  );
};

export default ResultsViewer;