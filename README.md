# Smart Vehicle Maintenance and Service Management System (SVMMS)

A complete full-stack application for managing vehicle maintenance and service operations with role-based access control for Customers, Mechanics, and Admins.

## 📜 Table of Contents
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Project Workflow](#-project-workflow)
- [Installation & Setup](#️-installation--setup)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

### 🔐 Authentication & Authorization
- Role-based login system (Customer, Mechanic, Admin).
- JWT token-based authentication and secure password hashing with `bcrypt`.
- Protected routes to restrict access based on user roles.

### 👤 Customer Features
- Manage personal vehicle information.
- Book new service appointments.
- View booking history, status updates, and details.
- Access and review final invoices and payment information.

### 🔧 Mechanic Features
- View and manage assigned service bookings.
- Approve or reject incoming booking requests.
- Create and update detailed job cards for each service.
- Track the status of ongoing and completed jobs.

### ⚙️ Admin Features
- Access an analytics dashboard with revenue insights and key metrics.
- Full control over users, vehicles, and service bookings.
- Manage the spare parts inventory, including stock levels.
- View analytics on top parts usage and receive low-stock alerts.

## 🌊 Project Workflow

This project follows a standard Git workflow for development. All changes are made in feature branches and merged into the `main` branch after review.

1. **Create a new branch** for each feature or bugfix:
   ```bash
   git checkout -b <branch-name>
   ```
   *(e.g., `feature/add-payment-gateway` or `bugfix/fix-login-error`)*

2. **Develop the feature** on the new branch. Write clean, well-documented code.

3. **Test your changes** locally by running the frontend and backend test suites.

4. **Commit your changes** with a clear and descriptive message:
   ```bash
   git commit -m "feat: Add payment gateway integration"
   ```

5. **Push the branch** to the remote repository:
   ```bash
   git push origin <branch-name>
   ```

6. **Create a Pull Request** (PR) on GitHub to merge the changes into the `main` branch.

7. **Review and Merge**: Once the PR is reviewed and approved, it can be merged into `main`.

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js**: v18 or higher
- **npm**: v8 or higher
- **PostgreSQL**: v14 or higher

### Backend Setup

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
   Update the `.env` file with your PostgreSQL credentials:
   ```env
   DB_USER=your_postgres_user
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=svmms_db
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Create the PostgreSQL database**:
   Connect to PostgreSQL and run:
   ```sql
   CREATE DATABASE svmms_db;
   ```

5. **Run database migrations**:
   This command sets up the required tables.
   ```bash
   npm run migrate
   ```

6. **Seed the database (optional)**:
   This command populates the database with initial test data, including user accounts.
   ```bash
   npm run seed
   ```

7. **Start the backend server**:
   ```bash
   npm run dev
   ```
   The backend server will be available at `http://localhost:5000`.

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
    The frontend requires the backend API URL. No `.env` file is needed if the backend is running on the default port `5000`. The proxy in `vite.config.js` will automatically redirect requests.

4. **Start the frontend development server**:
   ```bash
   npm run dev
   ```
   The frontend application will be available at `http://localhost:5173`.

### Test Accounts

After seeding the database, you can use the following accounts to log in:

| Role     | Email                  | Password    |
|----------|------------------------|-------------|
| Admin    | `admin@example.com`    | `password`  |
| Mechanic | `mechanic@example.com` | `password`  |
| Customer | `customer@example.com` | `password`  |

## 🧪 Testing

For detailed instructions on how to run tests for the frontend and backend, please refer to the respective `TESTING.md` files:

- [Backend Testing Documentation](./backend/TESTING.md)
- [Frontend Testing Documentation](./frontend/TESTING.md)

## 📁 Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/       # Database configuration
│   │   ├── controllers/  # Request handlers and business logic
│   │   ├── middleware/   # Express middleware (auth, validation)
│   │   ├── migrations/   # Database migration scripts
│   │   ├── routes/       # API route definitions
│   │   ├── seeders/      # Database seeding scripts
│   │   └── server.js     # Main server entry point
│   ├── .env.example      # Environment variable template
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── assets/       # Static assets (images, icons)
    │   ├── components/   # Reusable React components
    │   ├── contexts/     # React Context providers (state management)
    │   ├── layouts/      # Page layout components
    │   ├── pages/        # Application pages organized by role
    │   ├── services/     # API interaction layer
    │   ├── styles/       # Global styles and design tokens
    │   └── utils/        # Helper functions
    ├── index.html        # Main HTML file
    └── vite.config.js    # Vite configuration
```

## 🔌 API Endpoints

A summary of the main API endpoints available.

### Authentication
- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Log in a user.
- `GET /api/auth/profile`: Get the profile of the authenticated user.

### Bookings & Job Cards
- `POST /api/bookings`: Create a new service booking.
- `GET /api/bookings/pending`: Get all pending bookings (Mechanic).
- `PUT /api/bookings/:id/approve`: Approve a booking.
- `POST /api/jobcards`: Create a job card from a booking.

### Inventory & Analytics
- `GET /api/parts`: Get all parts in the inventory.
- `GET /api/parts/low-stock`: Get parts that are low in stock.
- `GET /api/analytics/dashboard-stats`: Get key statistics for the admin dashboard.

## 📝 Database Schema

The database schema is designed to support the core features of the application.

### Key Tables
- **users**: Stores user accounts and their roles (customer, mechanic, admin).
- **vehicles**: Stores information about customer vehicles.
- **bookings**: Manages service appointment requests.
- **jobcards**: Tracks the details of each service job, including tasks and parts used.
- **parts**: Manages the inventory of spare parts.
- **invoices**: Stores invoice information generated after a job is completed.

## 🆘 Troubleshooting

### Backend Issues
- **Connection Errors**: Ensure PostgreSQL is running and the credentials in `backend/.env` are correct.
- **Port Conflict**: If port `5000` is in use, check for other running processes or update the port in `backend/src/server.js`.

### Frontend Issues
- **API Errors**: Make sure the backend server is running before starting the frontend.
- **Dependency Problems**: If you encounter issues after pulling changes, try deleting `node_modules` and `package-lock.json` and running `npm install` again.