# Test Suite for LemGendary Core

This directory contains comprehensive tests for the LemGendary Core image processing library.

## Structure
```
tests/
├── processors/ # Unit tests for processors
│ ├── LemGendaryResize.test.js
│ ├── LemGendaryCrop.test.js
│ ├── LemGendaryOptimize.test.js
│ └── LemGendaryRename.test.js
├── utils/ # Unit tests for utilities
│ ├── validation.test.js
│ ├── imageUtils.test.js
│ └── zipUtils.test.js
├── integration/ # Integration tests
│ └── processors.integration.test.js
├── mocks/ # Mock implementations
│ ├── fileMock.js
│ ├── imageMock.js
│ └── canvasMock.js
├── fixtures/ # Test fixtures
├── helpers.js # Test helper functions
├── setup.js # Test setup and teardown
└── index.test.js # Main test runner
```

## Running Tests

```
# From core directory
cd core

# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test categories
npm run test:processors
npm run test:utils
npm run test:integration

# Run specific test file
npx vitest run tests/processors/LemGendaryResize.test.js
```
## Test Coverage
We aim for:
- 80% line coverage
- 80% function coverage
- 70% branch coverage
- 80% statement coverage

## Writing Tests
1. Use descriptive test names
2. Test both positive and negative scenarios
3. Mock external dependencies
4. Clean up after each test
5. Follow AAA pattern (Arrange, Act, Assert)

## Mocking
- Use mocks for File API, Canvas, and Image loading
- Mock external libraries like JSZip
- Use vi.fn() and vi.mock() from Vitest

## Integration Tests
Integration tests verify that multiple processors work together correctly. They should:
- Test complete workflows
- Verify data flows between processors
- Check error handling chains
