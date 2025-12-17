# Frontend Testing Guide

This document outlines the testing strategy and procedures for the frontend of the Smart Vehicle Maintenance and Service Management System (SVMMS).

## 🚀 Testing Frameworks

The frontend testing suite is built using the following technologies:

- **[Vitest](https://vitest.dev/)**: A modern and fast test runner that is compatible with Vite projects out of the box.
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)**: A library for testing React components in a way that resembles how users interact with them.
- **[jsdom](https://github.com/jsdom/jsdom)**: A pure-JavaScript implementation of many web standards, used to simulate a browser environment for tests in Node.js.

## ✅ How to Run Tests

You can run the entire test suite using a single npm script.

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Run the tests**:
   ```bash
   npm test
   ```
   This command will execute all test files in the project and provide a summary of the results in the console.

### Watch Mode
To run tests in watch mode, which automatically re-runs tests when files are changed, use the following command:
```bash
npm test -- --watch
```

## 📁 Test File Location

Test files are co-located with the source code in `__tests__` directories. The structure mirrors the `src` directory, making it easy to find the tests for a specific component, hook, or service.

```
src/
├── components/
│   ├── __tests__/
│   │   └── Button.test.jsx
│   └── Button.jsx
├── pages/
│   └── admin/
│       ├── __tests__/
│       │   └── AnalyticsDashboard.test.jsx
│       └── AnalyticsDashboard.jsx
└── services/
    ├── __tests__/
    │   └── authService.test.js
    └── authService.js
```

## 🔬 Types of Tests

- **Unit Tests**: These tests focus on a single, isolated part of the application, such as a utility function or a custom hook. They ensure that the individual pieces of your code work correctly.
- **Component Tests**: These tests render individual React components and verify that they behave as expected. They check for correct rendering, event handling, and user interactions.
- **Integration Tests**: These tests cover the interaction between multiple components. For example, a test might cover the entire login flow, ensuring that the form, API service, and authentication context all work together correctly.

## 📊 Test Coverage

To check the test coverage of the codebase, you can run the following command:

```bash
npm test -- --coverage
```

This will generate a coverage report in the console and create a `coverage` directory with an HTML report that you can view in your browser. The goal is to maintain a high level of test coverage to ensure the stability and reliability of the application.
