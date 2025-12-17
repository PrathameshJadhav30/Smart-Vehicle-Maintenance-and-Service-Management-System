# Backend Testing Guide

This document provides instructions for running and writing tests for the backend of the Smart Vehicle Maintenance and Service Management System (SVMMS).

## Table of Contents
- [Testing Frameworks](#-testing-frameworks)
- [How to Run Tests](#-how-to-run-tests)
- [Test File Location](#-test-file-location)
- [Writing New Tests](#-writing-new-tests)
- [Debugging Tests](#-debugging-tests)

## 🧪 Testing Frameworks

The backend testing suite uses the following technologies:

- **[Jest](https://jestjs.io/)**: A delightful JavaScript testing framework with a focus on simplicity.
- **[Supertest](https://github.com/visionmedia/supertest)**: A library for testing Node.js HTTP servers, used for making requests to the API endpoints.

## ✅ How to Run Tests

### Prerequisites
Make sure all dependencies are installed by running `npm install` in the `backend` directory.

### Running the Full Test Suite
To run all tests, use the following command:

```bash
npm test
```
This command will execute all `.test.js` files inside the `src/__tests__` directory.

### Watch Mode
To run tests in watch mode, which is useful during development, use:
```bash
npm test -- --watch
```

### Generating a Coverage Report
To see how much of your code is covered by tests, run:
```bash
npm test -- --coverage
```
This will generate a `coverage` directory with a detailed HTML report.

## 📁 Test File Location

All test files are located in the `src/__tests__` directory. The folder structure within `__tests__` mirrors the `src` directory, making it easy to find tests related to specific parts of the application.

```
src/
└── __tests__/
    ├── controllers/   # Tests for the business logic in controllers
    ├── middleware/    # Tests for authentication and validation middleware
    └── utils/         # Tests for utility functions
```

## ✍️ Writing New Tests

When adding new features, you should also add corresponding tests.

### Naming Convention
Test files should be named `{feature-name}.test.js` (e.g., `authController.test.js`).

### Test Structure
Follow the "Arrange-Act-Assert" pattern to structure your tests:
1.  **Arrange**: Set up the test environment by mocking functions and preparing data.
2.  **Act**: Execute the code you want to test (e.g., call a controller function or make an API request).
3.  **Assert**: Check that the results are what you expect.

### Example Controller Test

```javascript
import request from 'supertest';
import app from '../app'; // Assuming your Express app is exported from 'app.js'

describe('Auth Controller', () => {
  it('should return a JWT token for valid credentials', async () => {
    // Arrange
    const validCredentials = {
      email: 'customer@example.com',
      password: 'password',
    };

    // Act
    const response = await request(app)
      .post('/api/auth/login')
      .send(validCredentials);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

## 🐛 Debugging Tests

If you need to debug a failing test, you can use `console.log` statements within your test files. To see the output, run Jest with the `--verbose` flag:
```bash
npm test -- --verbose
```
For more complex debugging, you can use the Node.js inspector by running:
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```
You can then connect a debugger like the one in Chrome DevTools.
