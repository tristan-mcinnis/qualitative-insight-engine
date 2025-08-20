# Qualitative Research Analysis Frontend

A modern React-based frontend application for the Qualitative Research Analysis Pipeline.

## Features

- **File Upload Interface**: Drag-and-drop file upload with support for multiple text formats
- **Project Configuration**: Configurable analysis settings and output options
- **Real-time Progress Tracking**: Visual progress indicators during analysis
- **Results Visualization**: Tabbed interface for viewing analysis results and themes
- **Report Downloads**: Direct download of generated Word and Excel reports
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Professional UI**: Clean black, white, and grey color scheme

## Technology Stack

- **React 18** with TypeScript
- **Styled Components** for CSS-in-JS styling
- **Modern Hooks** for state management
- **Responsive Design** with CSS Grid and Flexbox
- **REST API Integration** with error handling

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API server running on port 5000

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd src/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Environment Configuration

Create a `.env` file in the frontend directory to configure the API URL:

```env
REACT_APP_API_URL=http://localhost:5000
```

## Project Structure

```
src/frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/          # React components
│   │   ├── Layout.tsx       # Main layout with header/footer
│   │   ├── FileUpload.tsx   # File upload interface
│   │   ├── AnalysisConfig.tsx # Analysis configuration form
│   │   ├── ProgressTracker.tsx # Progress tracking display
│   │   └── ResultsViewer.tsx   # Results and download interface
│   ├── services/
│   │   └── api.ts          # API client service
│   ├── styles/
│   │   ├── theme.ts        # Design system theme
│   │   └── GlobalStyles.ts # Global styles and components
│   ├── types/
│   │   └── index.ts        # TypeScript type definitions
│   ├── App.tsx             # Main application component
│   └── index.tsx           # React application entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Usage Workflow

1. **Upload Files**: Drag and drop or select discussion guides and transcripts
2. **Configure Analysis**: Set project name and select output options
3. **Monitor Progress**: View real-time analysis progress and current step
4. **Review Results**: Explore identified themes and analysis summary
5. **Download Reports**: Download generated Word and Excel reports

## API Integration

The frontend communicates with the Flask backend through these endpoints:

- `GET /health` - Check API status
- `GET /config` - Get application configuration
- `POST /upload` - Upload files for analysis
- `POST /run` - Start analysis process
- `GET /status` - Get analysis progress
- `GET /download` - Download generated reports

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run test suite
- `npm run eject` - Eject from Create React App (use with caution)

### Code Style

- TypeScript for type safety
- Styled Components for styling
- Functional components with hooks
- Props validation with TypeScript interfaces
- Error boundary patterns for error handling

## Deployment

### Production Build

1. Build the application:
   ```bash
   npm run build
   ```

2. The `build` folder contains the production-ready files

3. Serve the static files using a web server like nginx or Apache

### Environment Variables

For production deployment, set the following environment variables:

- `REACT_APP_API_URL` - Backend API URL
- `PUBLIC_URL` - Base URL for the application (if not served from root)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for all new interfaces
3. Include proper error handling
4. Test on multiple screen sizes
5. Update documentation for new features

## License

This project is part of the Qualitative Research Analysis Pipeline and follows the same licensing terms.