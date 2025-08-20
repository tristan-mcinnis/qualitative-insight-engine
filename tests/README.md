# TextGrouping Frontend Tests

Comprehensive end-to-end tests for the TextGrouping frontend using Playwright.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with UI
```bash
npm run test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Debug tests
```bash
npm run test:debug
```

### View test report
```bash
npm run test:report
```

## Test Coverage

The test suite covers:

### Core Functionality
- **app.spec.ts**: Main application flow and navigation
- **file-upload.spec.ts**: File upload functionality including drag-drop, validation, and multiple files
- **analysis-config.spec.ts**: Configuration form validation and options
- **progress-tracking.spec.ts**: Analysis progress monitoring and status updates
- **results-viewer.spec.ts**: Results display, themes, and downloads

### Quality Assurance
- **responsive.spec.ts**: Mobile, tablet, and desktop responsiveness
- **accessibility.spec.ts**: WCAG compliance, ARIA labels, keyboard navigation

## Test Structure

```
tests/
├── package.json            # Test dependencies
├── playwright.config.ts    # Playwright configuration
├── e2e/                   # End-to-end tests
│   ├── app.spec.ts
│   ├── file-upload.spec.ts
│   ├── analysis-config.spec.ts
│   ├── progress-tracking.spec.ts
│   ├── results-viewer.spec.ts
│   ├── responsive.spec.ts
│   └── accessibility.spec.ts
└── README.md              # This file
```

## Configuration

Tests are configured to:
- Run against `http://localhost:3000`
- Test on multiple browsers (Chrome, Firefox, Safari)
- Test on mobile devices (iPhone, Android)
- Generate HTML reports
- Capture screenshots on failure
- Record videos for failed tests

## CI/CD Integration

To run tests in CI:

```bash
# Set CI environment variable
CI=true npm test
```

This will:
- Run tests in headless mode
- Retry failed tests twice
- Use single worker for stability
- Generate JSON report for CI parsing