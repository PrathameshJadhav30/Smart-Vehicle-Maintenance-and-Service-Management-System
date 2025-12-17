# Backend: Smart Vehicle Maintenance and Service Management System

This directory contains the Node.js and Express.js backend for the SVMMS application. It provides a RESTful API for the frontend, handles business logic, and interacts with the PostgreSQL database.

## Table of Contents
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation and Setup](#-installation-and-setup)
- [Database Management](#-database-management)
- [Available Scripts](#-available-scripts)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Error Handling and Validation](#-error-handling-and-validation)
- [Testing](#-testing)

## 🚀 Tech Stack

- **Node.js**: A JavaScript runtime for building the server-side application.
- **Express.js**: A web application framework for Node.js, used to build the REST API.
- **PostgreSQL**: A powerful, open-source object-relational database system.
- **node-postgres (pg)**: The PostgreSQL client for Node.js.
- **JSON Web Tokens (JWT)**: For implementing secure, token-based authentication.
- **bcrypt**: A library for hashing user passwords.
- **express-validator**: Middleware for validating incoming request data.

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **npm**: v8 or higher
- **PostgreSQL**: v14 or higher (and have it running)

## 🛠️ Installation and Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file by copying the example file:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your PostgreSQL database connection details:
   ```env
   DB_USER=your_postgres_user
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=svmms_db
   JWT_SECRET=your_super_secret_jwt_key
   ```

4. **Create the database**:
   Connect to PostgreSQL and run the following SQL command to create the database:
   ```sql
   CREATE DATABASE svmms_db;
   ```

5. **Run the server**:
   ```bash
   npm run dev
   ```
   The backend API will be available at `http://localhost:5000`.

## 🗄️ Database Management

### Migrations
Database migrations are used to create and update the database schema. They are located in the `src/migrations` directory. To run all migrations, use the following command:
```bash
npm run migrate
```
This command will create all the necessary tables in your database.

### Seeding
The database can be seeded with initial data for testing and development. The seed scripts are in the `src/seeders` directory. To seed the database, run:
```bash
npm run seed
```
This will populate the database with sample users, vehicles, parts, and other data.

## 📜 Available Scripts

- `npm run dev`: Starts the server in development mode with `nodemon`, which automatically restarts the server on file changes.
- `npm start`: Starts the server in production mode.
- `npm run migrate`: Runs the database migrations.
- `npm run seed`: Seeds the database with initial data.
- `npm test`: Runs the backend test suite using Jest.

## 📁 Project Structure

The `src` directory is organized to separate concerns and make the codebase easy to navigate.

```
src/
├── config/         # Database connection configuration
├── controllers/    # Contains the business logic for each API endpoint
├── middleware/     # Express middleware for authentication, validation, etc.
├── migrations/     # Scripts for creating and modifying the database schema
├── routes/         # Defines the API routes and maps them to controllers
├── seeders/        # Scripts to populate the database with initial data
├── utils/          # Utility functions used across the application
└── server.js       # The main entry point for the Express server
```

## 🔌 API Endpoints

The API is versioned under the `/api` prefix. A summary of the main endpoints includes:

- **Authentication**: `POST /api/auth/register`, `POST /api/auth/login`
- **Users**: `GET /api/users`, `PUT /api/users/:id`
- **Vehicles**: `GET /api/vehicles`, `POST /api/vehicles`
- **Bookings**: `GET /api/bookings`, `POST /api/bookings`
- **Job Cards**: `GET /api/jobcards`, `POST /api/jobcards`
- **Parts**: `GET /api/parts`, `POST /api/parts`
- **Invoices**: `GET /api/invoices`, `POST /api/invoices`
- **Analytics**: `GET /api/analytics/dashboard-stats`

All protected routes require a valid JWT to be sent in the `Authorization` header.

## ❗ Error Handling and Validation

- **Validation**: Incoming data for `POST` and `PUT` requests is validated using `express-validator`. If validation fails, a `400 Bad Request` response is returned with a list of errors.
- **Error Handling**: The application uses a centralized error-handling middleware. It catches errors that occur during request processing and sends a structured JSON response with an appropriate status code (usually `500 Internal Server Error`).

## 🧪 Testing

The backend uses **Jest** for testing. Test files are located in the `src/__tests__` directory and follow a structure that mirrors the `src` directory.

For detailed instructions on how to run the tests, see the [Backend Testing Documentation](./TESTING.md).
