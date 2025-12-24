# SVMMS Project Architecture Diagram

## Overview
This document provides a comprehensive architecture overview of the Service Vehicle Management and Monitoring System (SVMMS), showing the flow from user interactions through the frontend, backend, and database layers.

## System Architecture Flow

```
                    ┌─────────────────┐
                    │    End Users    │
                    │                 │
                    │  • Customers    │
                    │  • Mechanics    │
                    │  • Admins       │
                    └─────────┬───────┘
                              │
                    ┌─────────▼─────────┐
                    │   Frontend Layer  │
                    │   (React/Vite)    │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼────────┐   ┌──────▼─────────┐
│  Components    │   │   Pages/Views   │   │   Services     │
│                │   │                 │   │                │
│ • Button      │   │ • Home          │   │ • API Service  │
│ • Modal       │   │ • Login         │   │ • Auth Service │
│ • Card        │   │ • Register      │   │ • Booking      │
│ • Table       │   │ • BookService   │   │ • Jobcard      │
│ • Input       │   │ • Dashboard     │   │ • Invoice      │
│ • Select      │   │ • JobCards      │   │ • Parts        │
│ • Toast       │   │ • Invoices      │   │ • Vehicle      │
│ • Loading     │   │ • Vehicles      │   │ • User         │
│ • ErrorDisp   │   │ • Profile       │   │ • Payment      │
└───────────────┘   │ • Admin Pages   │   └────────────────┘
                    │ • Mechanic Pages│
                    │ • Customer Pages│
                    └─────────────────┘

                              │
                    ┌─────────▼─────────┐
                    │   Backend Layer   │
                    │  (Node.js/Express)│
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼────────┐   ┌──────▼─────────┐
│  Middleware    │   │    Routes       │   │  Controllers   │
│                │   │                 │   │                │
│ • Auth         │   │ • authRoutes    │   │ • authControl  │
│ • Validator    │   │ • userRoutes    │   │ • userControl  │
│ • JWT          │   │ • bookingRoutes │   │ • bookingCtrl  │
│ • Error Handle │   │ • vehicleRoutes │   │ • vehicleCtrl  │
│ • CORS         │   │ • jobcardRoutes │   │ • jobcardCtrl  │
│ • Body Parser  │   │ • invoiceRoutes │   │ • invoiceCtrl  │
│ • Logging      │   │ • partRoutes    │   │ • partCtrl     │
└────────────────┘   │ • paymentRoutes │   │ • paymentCtrl  │
                     │ • analyticsRt   │   │ • analyticsCtrl│
                     │ • cacheRoutes   │   │ • cacheCtrl    │
                     │ • seedRoutes    │   │ • seedCtrl     │
                     │ • clearRoutes   │   │ • clearCtrl    │
                     └─────────────────┘   └────────────────┘

                              │
                    ┌─────────▼─────────┐
                    │    Database       │
                    │   (PostgreSQL)    │
                    └───────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼────────┐   ┌──────▼─────────┐
│  Core Tables   │   │  Transaction    │   │  Utility       │
│                │   │    Tables       │   │    Tables      │
│ • Users        │   │ • Bookings      │   │ • Migrations   │
│ • Vehicles     │   │ • JobCards      │   │ • RefreshToken │
│ • Suppliers    │   │ • Invoices      │   │                │
│ • Parts        │   │ • JobCardTasks  │   │                │
│                │   │ • JobCardSpare  │   │                │
└────────────────┘   └─────────────────┘   └────────────────┘
```

## Detailed Architecture Breakdown

### 1. User Layer
- **Customers**: Book services, track job progress, view invoices
- **Mechanics**: View assigned jobs, update job status, add parts/labor costs
- **Admins**: Manage users, vehicles, parts, analytics and system configuration

### 2. Frontend Layer (React/Vite)
#### Components
- **Reusable UI Components**: Buttons, Modals, Cards, Tables, Inputs, Selects, etc.
- **Context Providers**: AuthContext, ToastContext for global state management
- **Layout Components**: AuthLayout, DashboardLayout for consistent UI structure

#### Pages/Views
- **Authentication Pages**: Login, Register, Forgot/Reset Password
- **Customer Pages**: Dashboard, Book Service, My Bookings, Vehicles, Invoices, Profile
- **Mechanic Pages**: Dashboard, Assigned Jobs, Job Cards, Parts Usage, Invoices
- **Admin Pages**: Dashboard, Analytics, User Management, Vehicle Management, Parts Management

#### Services
- **API Service Layer**: Centralized API calls with error handling
- **Authentication Service**: JWT token management and user session
- **Domain Services**: Booking, Jobcard, Invoice, Parts, Vehicle, User services

### 3. Backend Layer (Node.js/Express)
#### Middleware
- **Authentication**: JWT token verification and user role validation
- **Validation**: Request data validation using custom validators
- **Security**: CORS, body parsing, error handling, logging
- **Authorization**: Role-based access control for different user types

#### Routes
- **Auth Routes**: User authentication and authorization endpoints
- **User Routes**: User management and profile endpoints
- **Booking Routes**: Service booking creation and management
- **Vehicle Routes**: Vehicle registration and management
- **Jobcard Routes**: Job card creation, updates, and tracking
- **Invoice Routes**: Billing and invoice generation
- **Part Routes**: Inventory management and parts tracking
- **Payment Routes**: Payment processing and transaction tracking
- **Analytics Routes**: Business intelligence and reporting
- **Utility Routes**: Cache management, data seeding, cleanup operations

#### Controllers
- **Business Logic**: Core application logic and data processing
- **Service Integration**: Communication with external services
- **Data Validation**: Input validation and sanitization
- **Error Handling**: Proper error responses and logging

### 4. Database Layer (PostgreSQL)
#### Core Tables
- **Users**: Stores user information (customers, mechanics, admins) with role-based access
- **Vehicles**: Vehicle registration and customer association
- **Suppliers**: Parts supplier information and contact details
- **Parts**: Inventory management with pricing and stock levels

#### Transaction Tables
- **Bookings**: Service booking requests and scheduling
- **JobCards**: Detailed work orders linked to bookings
- **Invoices**: Billing information and payment tracking
- **JobCardTasks**: Individual tasks within job cards
- **JobCardSpareParts**: Parts usage tracking for each job

#### Utility Tables
- **Migrations**: Database schema version tracking
- **RefreshTokens**: Session management and security

## Data Flow Examples

### Customer Booking Flow
```
Customer → BookService Page → bookingService.createBooking() → bookingController → bookings table
```

### Job Card Processing Flow
```
Admin assigns job → jobcardController → jobcards table → Mechanic updates → jobcard_spareparts table → invoice generation
```

### Parts Management Flow
```
Admin adds parts → partController → parts table → Mechanic uses parts → jobcard_spareparts table → inventory update
```

## Security & Authentication Flow
```
User Login → authController → JWT Token → Auth Middleware → Protected Routes → Role Validation
```

## Technology Stack
- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express.js, JWT for authentication
- **Database**: PostgreSQL with proper indexing and constraints
- **Development**: JavaScript/ES6, RESTful API design
- **Security**: JWT tokens, role-based access control, input validation

## Key Features
- **Role-based Access Control**: Different permissions for customers, mechanics, and admins
- **Real-time Updates**: Live job status and progress tracking
- **Inventory Management**: Automated parts tracking and low-stock alerts
- **Payment Integration**: Secure payment processing and invoice management
- **Analytics Dashboard**: Business intelligence and performance metrics
- **Responsive Design**: Mobile-first approach for all devices