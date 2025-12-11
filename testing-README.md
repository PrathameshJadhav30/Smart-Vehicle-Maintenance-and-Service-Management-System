# Testing Documentation

## Unit Testing Setup

This project includes comprehensive unit testing for both frontend and backend components.

### Frontend Testing (Vitest)

- **Framework**: Vitest with React Testing Library
- **Environment**: JSDOM for browser-like testing
- **Configuration**: `vitest.config.js`
- **Setup**: `src/test/setup.js`

#### Running Frontend Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

### Backend Testing (Jest)

- **Framework**: Jest with Supertest
- **Environment**: Node.js
- **Configuration**: `jest.config.js`
- **Mocking**: Built-in Jest mocking capabilities

#### Running Backend Tests

```bash
# Run all backend tests
npm test
```

## Test Coverage

Currently implemented tests:

### Frontend
- Button component tests
- More components to be added

### Backend
- Authentication controller tests (register, login)
- More controllers to be added

## Adding New Tests

### Frontend
1. Create test files in `src/components/__tests__/` with `.test.jsx` extension
2. Use React Testing Library for component testing
3. Follow existing test patterns

### Backend
1. Create test files in `__tests__/` directory with `.test.js` extension
2. Use Jest for mocking dependencies
3. Follow existing test patterns

## CI/CD Integration

Tests can be integrated into CI/CD pipelines by running:
- `npm run test:run` for frontend
- `npm test` for backend