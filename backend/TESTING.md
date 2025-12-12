# SVMMS Backend Testing Guide

This document explains how to run and manage tests for the Smart Vehicle Maintenance and Service Management System (SVMMS) backend.

## Test Structure

All tests are located in the `src/__tests__` directory, organized by component type:

```
src/
└── __tests__/
    ├── controllers/          # Controller tests
    ├── middleware/           # Middleware tests
    ├── routes/               # Route definition tests
    ├── utils/               # Utility function tests
    └── setupTests.js        # Test setup configuration
```

### Comprehensive Test Coverage

The test suite provides comprehensive coverage for all backend components:

1. **Controllers** - All business logic and API endpoints
2. **Middleware** - Authentication, authorization, and validation middleware
3. **Routes** - Route definitions and HTTP method mappings
4. **Utilities** - Helper functions and caching mechanisms
5. **Integration** - End-to-end testing of complete workflows

## Prerequisites

Before running tests, ensure you have:

1. All npm dependencies installed:
   ```bash
   npm install
   ```

2. A test database configured (optional for mocked tests)

## Running Tests

### Run All Tests

```bash
npm run test:controllers
```

This command uses the custom Jest configuration to run all tests including controllers, middleware, routes, and utilities.

### Run Tests with Verbose Output

```bash
npm run test:controllers -- --verbose
```

### Run Specific Test Files

```bash
# Run a specific controller test
npm run test:controllers -- src/__tests__/controllers/authController.test.js

# Run a specific middleware test
npm run test:controllers -- src/__tests__/middleware/authMiddleware.test.js

# Run a specific utility test
npm run test:controllers -- src/__tests__/utils/cache.test.js
```

### Run Tests in Watch Mode

```bash
npm run test:controllers -- --watch
```

## Test Coverage

To generate a coverage report:

```bash
npm run test:controllers -- --coverage
```

Coverage reports will be generated in the `coverage/` directory.

## Test Environment

Tests run in an isolated environment with:

- Mocked database queries
- Mocked external services
- Mocked authentication
- Suppressed console output
- Custom environment variables

## Writing New Tests

### Test File Naming Convention

Test files should follow the pattern: `{component}.test.js`

Example: `authController.test.js`

### Test Structure

Each test file should:

1. Import required modules
2. Mock external dependencies
3. Group related tests in `describe` blocks
4. Use clear, descriptive test names
5. Follow the Arrange-Act-Assert pattern

### Example Tests

#### Controller Test

```javascript
describe('Auth Controller', () => {
  describe('POST /api/auth/login', () => {
    it('should login user successfully with valid credentials', async () => {
      // Arrange
      const loginData = { email: 'user@example.com', password: 'password123' };
      
      // Mock database response
      mockDb.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, email: 'user@example.com', password_hash: 'hashed_password' }] 
      });
      
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });
  });
});
```

#### Middleware Test

```javascript
describe('Auth Middleware', () => {
  it('should authenticate user successfully with valid token', () => {
    // Arrange
    const mockUser = { id: 1, email: 'test@example.com', role: 'customer' };
    req.headers.authorization = 'Bearer valid_token';
    
    jwt.verify.mockReturnValue(mockUser);
    
    // Act
    authMiddleware(req, res, next);
    
    // Assert
    expect(jwt.verify).toHaveBeenCalledWith('valid_token', process.env.JWT_SECRET);
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });
});
```

#### Utility Test

```javascript
describe('Cache Utility', () => {
  it('should store and retrieve values correctly', () => {
    // Act
    cache.set('key1', 'value1');
    
    // Assert
    expect(cache.get('key1')).toBe('value1');
  });
});
```

## Debugging Tests

### Enable Console Output

To see console logs during tests, temporarily modify `setupTests.js`:

```javascript
// Comment out these lines to see console output
// console.log = jest.fn();
// console.info = jest.fn();
// console.warn = jest.fn();
// console.error = jest.fn();
```

### Run Tests with Debug Information

```bash
npm run test:controllers -- --verbose --detectOpenHandles
```

## Continuous Integration

The test suite is designed to run in CI environments. All tests are self-contained and don't require external services to be running.

## Troubleshooting

### Common Issues

1. **Module not found errors**: Ensure all dependencies are installed
2. **Database connection errors**: Tests should use mocks, not real database connections
3. **Authentication errors**: Make sure JWT tokens are properly mocked

### Getting Help

If you encounter issues:
1. Check that you're in the `backend/` directory
2. Verify all npm packages are installed
3. Ensure you're using the correct Node.js version (14+)