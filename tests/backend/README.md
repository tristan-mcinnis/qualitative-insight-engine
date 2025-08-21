# Backend Test Suite

Comprehensive test suite for the Supabase backend services of the Qualitative Insight Engine.

## Test Structure

```
tests/backend/
├── package.json          # Test dependencies and scripts
├── jest.config.js         # Jest configuration
├── setup.ts              # Global test setup and utilities
├── README.md             # This file
├── unit/                 # Unit tests for individual components
├── integration/          # Integration tests for API endpoints
├── services/             # Service layer tests
└── coverage/             # Test coverage reports (generated)
```

## Test Categories

### Unit Tests (`unit/`)
- Individual function and class testing
- Isolated component behavior
- Mock external dependencies
- Fast execution

### Integration Tests (`integration/`)
- API endpoint testing
- Database interaction testing
- Full request/response cycle
- Error handling scenarios

### Service Tests (`services/`)
- Service layer functionality
- Business logic validation
- Database service integration
- External API interaction

## Running Tests

### Install Dependencies
```bash
cd tests/backend
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Categories
```bash
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:services    # Service tests only
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Utilities

The test suite includes global utilities accessible via `testUtils`:

### Data Generation
- `generateTestId()`: Generate unique test IDs
- `generateTestProject()`: Create test project data
- `generateTestVerbatim()`: Create test verbatim data
- `createMockFile()`: Create mock Express.Multer.File objects

### File Utilities
- `generateTestFileBuffer()`: Create test file buffers

## Mocking Strategy

### Supabase Client
The Supabase client is mocked consistently across all tests:
```typescript
jest.mock('@supabase/supabase-js');
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  // ... other methods
};
```

### External APIs
- OpenAI API calls are mocked in service tests
- File upload operations use mock storage
- Real-time subscriptions use mock channels

## Environment Variables

Test environment uses the following variables:
- `SUPABASE_URL`: Test Supabase instance URL
- `SUPABASE_ANON_KEY`: Test Supabase anonymous key
- `OPENAI_API_KEY`: Mock OpenAI API key for tests
- `NODE_ENV`: Set to 'test'

## Coverage Targets

Minimum coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Test Data Management

### Database State
- Each test uses isolated mock data
- No persistent test database required
- Supabase operations are fully mocked

### File Uploads
- Mock file buffers for upload testing
- No actual files stored during tests
- Storage operations are mocked

## Best Practices

### Test Isolation
- Each test is independent
- Mocks are reset between tests
- No shared state between test cases

### Naming Conventions
- Descriptive test names
- Group related tests in describe blocks
- Use consistent assertion patterns

### Error Testing
- Test both success and failure scenarios
- Validate error messages and status codes
- Test edge cases and boundary conditions

### Async Testing
- Proper async/await usage
- Handle promises correctly
- Test timeout scenarios where appropriate

## Debugging Tests

### Console Output
Console methods are mocked by default. To see actual output:
```typescript
beforeEach(() => {
  // Don't mock console in this test
});
```

### Test Debugging
Use Jest's debugging capabilities:
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Verbose Output
```bash
npm test -- --verbose
```

## Adding New Tests

### Service Tests
1. Create test file in `services/` directory
2. Mock Supabase client and external dependencies
3. Test all public methods
4. Include error scenarios

### Integration Tests
1. Add to `integration/` directory
2. Use supertest for HTTP testing
3. Mock database responses
4. Test complete request/response cycles

### Unit Tests
1. Place in `unit/` directory
2. Focus on isolated component testing
3. Mock all external dependencies
4. Test edge cases thoroughly

## Continuous Integration

Tests are designed to run in CI environments:
- No external dependencies required
- Consistent mock data
- Deterministic test results
- Fast execution times

## Troubleshooting

### Common Issues

**Tests timing out:**
- Check async/await usage
- Increase timeout in jest.config.js
- Ensure mocks are properly configured

**Mock not working:**
- Verify mock is imported before the module
- Check mock implementation
- Reset mocks between tests

**Coverage issues:**
- Ensure all code paths are tested
- Check for untested files
- Review coverage report in `coverage/` directory