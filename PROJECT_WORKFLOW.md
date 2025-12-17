# Project Workflow and Feature Guide

This document provides a comprehensive overview of the Smart Vehicle Maintenance and Service Management System (SVMMS), detailing its architecture, features, and the workflow of the application.

## 1. High-Level Overview

The SVMMS is a full-stack web application designed to streamline vehicle service and maintenance operations. It provides a platform for customers to book services, for mechanics to manage jobs, and for administrators to oversee the entire system. The application is built with a role-based access control system to ensure that users only have access to the features relevant to them.

## 2. Application Architecture

The application is divided into two main parts: a **frontend** single-page application (SPA) and a **backend** RESTful API.

- **Frontend**: Built with **React**, the frontend provides a dynamic and responsive user interface. It handles all user interactions and communicates with the backend via API calls. It is responsible for rendering the UI, managing client-side state, and providing a seamless user experience.

- **Backend**: Built with **Node.js and Express.js**, the backend serves as the core of the application. It handles business logic, processes data, interacts with the **PostgreSQL** database, and exposes a secure REST API for the frontend to consume. It is also responsible for user authentication and authorization.

## 3. User Roles and Permissions

The application has three distinct user roles, each with a specific set of permissions:

- **Customer**: The end-user of the service. Customers can:
  - Register and manage their profile.
  - Add and manage their vehicles.
  - Book service appointments for their vehicles.
  - View the status of their bookings.
  - View and pay their invoices.

- **Mechanic**: The staff responsible for carrying out the services. Mechanics can:
  - View all pending service bookings.
  - Approve or reject bookings.
  - Create and manage job cards for approved bookings.
  - Add tasks and parts used to a job card.
  - Update the status of a job (e.g., "In Progress," "Completed").

- **Admin**: The superuser with full control over the system. Admins can:
  - Access an analytics dashboard with key metrics.
  - Manage all users (customers, mechanics, and other admins).
  - Manage all vehicles, bookings, job cards, and invoices in the system.
  - Manage the parts inventory, including adding new parts and updating stock levels.

## 4. Core Feature Workflows

### Authentication

1.  **Registration**: A new user signs up by providing their name, email, password, and role (Customer or Mechanic). The backend hashes the password and stores the new user in the database.
2.  **Login**: A user logs in with their email and password. The backend verifies the credentials and, if successful, returns a JSON Web Token (JWT). This token is stored on the frontend and sent with all subsequent API requests to authenticate the user.
3.  **Password Reset**: A user who has forgotten their password can request a reset link to be sent to their email. This feature is not yet fully implemented with a real email service but the UI and backend routes are in place.

### Customer Workflow

1.  **Dashboard**: After logging in, the customer sees a dashboard with a summary of their vehicles and recent bookings.
2.  **Vehicle Management**: The customer can add their vehicle(s) to the system, including details like make, model, and year.
3.  **Service Booking**: The customer selects one of their vehicles, chooses a service type, and picks a preferred date. A new booking is created with a "Pending" status.
4.  **View Bookings**: The customer can track the status of their bookings (e.g., Pending, Approved, In Progress, Completed).
5.  **View Invoices**: Once a job is completed and an invoice is generated, the customer can view the invoice details.

### Mechanic Workflow

1.  **Dashboard**: The mechanic's dashboard shows a summary of pending bookings and jobs currently in progress.
2.  **Manage Bookings**: The mechanic can view all pending bookings and either approve or reject them.
3.  **Job Card Management**: When a booking is approved, the mechanic creates a job card. On the job card, they can:
    - Add specific tasks to be performed.
    - Assign spare parts from the inventory to the job.
    - Update the status of the job.
4.  **Invoice Generation**: When a job is marked as "Completed," the system can generate an invoice based on the labor and parts used in the job card.

### Admin Workflow

1.  **Dashboard**: The admin dashboard provides a high-level view of the entire system, with analytics on revenue, parts usage, and user activity.
2.  **User Management**: The admin can view, create, edit, and delete all users in the system.
3.  **Inventory Management**: The admin is responsible for managing the spare parts inventory, including adding new parts and updating stock levels. The system provides alerts for low-stock parts.
4.  **System-wide Oversight**: The admin has access to view and manage all data in the system, including all bookings, job cards, and invoices, providing full control and oversight.

## 5. Data Flow Example: Creating a Booking

1.  **Frontend**: The customer fills out the service booking form in the React application and clicks "Submit."
2.  **API Call**: The frontend makes a `POST` request to the `/api/bookings` endpoint on the backend, sending the booking details and the user's JWT in the request headers.
3.  **Backend (Middleware)**: The backend's authentication middleware verifies the JWT to ensure the user is authenticated.
4.  **Backend (Controller)**: The `bookingController` receives the request. It validates the incoming data and then creates a new booking record in the `bookings` table in the PostgreSQL database with a "Pending" status.
5.  **Backend (Response)**: The backend sends a success response to the frontend.
6.  **Frontend (UI Update)**: The frontend receives the success response and updates the UI to show the user that their booking has been successfully created. The user can then see the new booking in their list of bookings.

This workflow demonstrates the separation of concerns between the frontend and backend and how they work together to provide a seamless experience for the user.
