# Frontend: Smart Vehicle Maintenance and Service Management System

This directory contains the React-based frontend for the SVMMS application. It is a modern, responsive, and role-based user interface built with Vite, React, and Tailwind CSS.

## Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation and Setup](#-installation-and-setup)
- [Available Scripts](#-available-scripts)
- [Project Structure](#-project-structure)
- [State Management](#-state-management)
- [Testing](#-testing)
- [Development Guidelines](#-development-guidelines)

## ✨ Features

- **Role-Based Access Control**: Separate, tailored dashboards and functionality for Customers, Mechanics, and Admins.
- **Responsive Design**: A mobile-first interface built with Tailwind CSS that works seamlessly across all devices.
- **API Integration**: Full integration with the backend API for real-time data handling.
- **Interactive UI**: Features like toast notifications, modals, and loading states to enhance user experience.
- **Client-Side Validation**: Robust form validation to ensure data integrity before it's sent to the server.

## 🚀 Tech Stack

- **React**: v18+, with extensive use of Hooks and functional components.
- **Vite**: For a fast and efficient development experience and optimized builds.
- **React Router**: For client-side routing and navigation.
- **Tailwind CSS**: For a utility-first styling workflow.
- **Axios**: For making HTTP requests to the backend API.
- **React Context**: For managing global state like authentication.
- **Vitest & React Testing Library**: For unit and component testing.

## 🛠️ Installation and Setup

### Prerequisites
- **Node.js**: v18 or higher
- **npm**: v8 or higher
- The [backend server](../backend) must be running.

### Quick Start

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

### Environment Variables
The frontend is configured to connect to the backend API at `http://localhost:5000` by default, using a proxy defined in `vite.config.js`. You do not need to create a `.env` file unless you need to override the default API URL.

## 📜 Available Scripts

- `npm run dev`: Starts the Vite development server with hot module reloading.
- `npm run build`: Compiles and bundles the application for production.
- `npm run preview`: Serves the production build locally for testing.
- `npm test`: Runs the test suite using Vitest.
- `npm run lint`: Lints the codebase for potential errors and style issues.

## 📁 Project Structure

The `src` directory is organized to promote scalability and maintainability.

```
src/
├── assets/         # Static files like images and SVGs
├── components/     # Reusable UI components (Button, Card, Input)
├── contexts/       # React Context for global state (AuthContext, ToastContext)
├── layouts/        # Wraps pages with a consistent structure (e.g., AuthLayout)
├── pages/          # Top-level page components, organized by user role
│   ├── admin/      # Pages accessible only to Admins
│   ├── auth/       # Login, Register, Forgot Password pages
│   ├── customer/   # Pages for the Customer dashboard
│   └── mechanic/   # Pages for the Mechanic dashboard
├── services/       # Functions for interacting with the backend API
├── styles/         # Global styles and Tailwind design tokens
└── utils/          # Helper functions and formatters
```

## 🧠 State Management

This project uses **React Context** for managing global state.

- **`AuthContext`**: Manages the user's authentication status, role, and token. It provides this information to all components, allowing the UI to adapt based on whether a user is logged in and what their role is.
- **`ToastContext`**: Provides a global method for displaying toast notifications, making it easy to give users feedback from any component.

For local component state, standard React hooks like `useState` and `useReducer` are used.

## 🧪 Testing

The frontend uses **Vitest** for running tests and **React Testing Library** for rendering and interacting with components in a test environment.

For detailed instructions on how to run the test suite and a summary of test results, see the [Frontend Testing Documentation](./TESTING.md).

## 🎨 Development Guidelines

- **Component-Based Architecture**: Build features as small, reusable components.
- **Styling**: Use Tailwind CSS utility classes. Avoid writing custom CSS files unless absolutely necessary.
- **Error Handling**: Gracefully handle API errors and display informative messages to the user.
- **Accessibility**: Ensure all components are accessible by using semantic HTML and providing necessary ARIA attributes.
