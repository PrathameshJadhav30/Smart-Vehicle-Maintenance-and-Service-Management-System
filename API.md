# API Documentation

This document provides a comprehensive list of all API endpoints available in the Smart Vehicle Maintenance and Service Management System.

## Base URL
```
http://localhost:5000/api
```

## Authentication Routes
Base path: `/auth`

| Method | Endpoint           | Description             | Authentication |
|--------|--------------------|-------------------------|----------------|
| POST   | `/register`        | Register a new user     | None           |
| POST   | `/login`           | Login user              | None           |
| GET    | `/profile`         | Get user profile        | Required       |
| PUT    | `/users/:id`       | Update user profile     | Required       |
| PUT    | `/users/:id/change-password` | Change password | Required       |
| POST   | `/forgot-password` | Request password reset  | None           |
| POST   | `/reset-password`  | Reset password          | None           |
| POST   | `/refresh-token`   | Refresh access token    | None           |
| POST   | `/logout`          | Logout user             | None           |

## User Routes
Base path: `/users`

| Method | Endpoint           | Description             | Role Required |
|--------|--------------------|-------------------------|---------------|
| GET    | `/`                | Get all users           | Admin         |
| PUT    | `/:id/role`        | Update user role        | Admin         |
| DELETE | `/:id`             | Delete user             | Admin         |
| GET    | `/mechanics`       | Get all mechanics       | Admin         |

## Vehicle Routes
Base path: `/vehicles`

| Method | Endpoint           | Description                  | Authentication |
|--------|--------------------|------------------------------|----------------|
| POST   | `/`                | Create vehicle               | Required       |
| GET    | `/`                | Get all vehicles             | Required       |
| GET    | `/user/:id`        | Get vehicles by user ID      | Required       |
| GET    | `/:id`             | Get vehicle by ID            | Required       |
| GET    | `/:id/history`     | Get vehicle service history  | Required       |
| PUT    | `/:id`             | Update vehicle               | Required       |
| DELETE | `/:id`             | Delete vehicle               | Required       |

## Booking Routes
Base path: `/bookings`

| Method | Endpoint                 | Description                    | Role Required        |
|--------|--------------------------|--------------------------------|----------------------|
| POST   | `/`                      | Create booking                 | Customer             |
| GET    | `/pending`               | Get pending bookings           | Mechanic, Admin      |
| GET    | `/:id`                   | Get booking by ID              | Mechanic, Admin      |
| GET    | `/customer/:id`          | Get customer bookings          | Required             |
| GET    | `/`                      | Get all bookings               | Admin, Mechanic      |
| GET    | `/servicecenter/:id`     | Get service center bookings    | Required             |
| GET    | `/mechanic/:id`          | Get mechanic bookings          | Required             |
| GET    | `/date-range`            | Get bookings by date range     | Required             |
| PUT    | `/:id/approve`           | Approve booking                | Admin                |
| PUT    | `/:id/reject`            | Reject booking                 | Mechanic, Admin      |
| PUT    | `/:id/confirm`           | Confirm booking                | Admin                |
| PUT    | `/:id/assign`            | Assign booking to mechanic     | Admin                |
| PUT    | `/:id/cancel`            | Cancel booking                 | Customer, Mech, Admin|
| PUT    | `/:id/reschedule`        | Reschedule booking             | Customer, Mech, Admin|
| PUT    | `/:id/status`            | Update booking status          | Admin                |

## Job Card Routes
Base path: `/jobcards`

| Method | Endpoint                 | Description                     | Role Required |
|--------|--------------------------|---------------------------------|---------------|
| POST   | `/`                      | Create job card                 | Mech, Admin   |
| GET    | `/`                      | Get all job cards               | Mech, Admin   |
| GET    | `/:id`                   | Get job card by ID              | Mech, Admin   |
| GET    | `/booking/:bookingId`    | Get job card by booking ID      | Mech, Admin   |
| GET    | `/completed`             | Get completed job cards         | Mech, Admin   |
| GET    | `/mechanic/:id`          | Get mechanic job cards          | Mech, Admin   |
| GET    | `/:id/notes`             | Get job card notes              | Mech, Admin   |
| PUT    | `/:id/add-task`          | Add task to job card            | Mech, Admin   |
| PUT    | `/:id/add-mechanic`      | Assign mechanic to job card     | Mech, Admin   |
| PUT    | `/:id/add-sparepart`     | Add spare part to job card      | Mech, Admin   |
| PUT    | `/:id/update-status`     | Update job card status          | Mech, Admin   |
| PUT    | `/:id/update-progress`   | Update job card progress        | Mech, Admin   |
| DELETE | `/:id`                   | Delete job card                 | Admin         |

## Parts Routes
Base path: `/parts`

| Method | Endpoint                 | Description                     | Role Required |
|--------|--------------------------|---------------------------------|---------------|
| POST   | `/`                      | Create part                     | Mech, Admin   |
| GET    | `/`                      | Get all parts                   | Required      |
| GET    | `/low-stock`             | Get low stock parts             | Mech, Admin   |
| GET    | `/usage`                 | Get parts usage trends          | Required      |
| POST   | `/supplier`              | Create supplier                 | Mech, Admin   |
| GET    | `/suppliers`             | Get all suppliers               | Required      |
| GET    | `/:id`                   | Get part by ID                  | Required      |
| PUT    | `/supplier/:id`          | Update supplier                 | Mech, Admin   |
| PUT    | `/:id`                   | Update part                     | Mech, Admin   |
| DELETE | `/supplier/:id`          | Delete supplier                 | Admin         |
| DELETE | `/:id`                   | Delete part                     | Admin         |

## Invoice Routes
Base path: `/invoices`

| Method | Endpoint                 | Description                     | Role Required        |
|--------|--------------------------|---------------------------------|----------------------|
| POST   | `/`                      | Create invoice                  | Mech, Admin          |
| GET    | `/:id`                   | Get invoice by ID               | Admin, Mech, Customer|
| GET    | `/booking/:bookingId`    | Get invoice by booking ID       | Admin, Mech, Customer|
| GET    | `/customer/:id`          | Get customer invoices           | Admin, Customer      |
| GET    | `/`                      | Get all invoices                | Admin                |
| PUT    | `/:id/payment`           | Update payment status           | Mech, Admin          |
| POST   | `/mock`                  | Mock payment processing         | Admin, Mech, Customer|

## Payment Routes
Base path: `/payments`

| Method | Endpoint                 | Description                     | Role Required        |
|--------|--------------------------|---------------------------------|----------------------|
| GET    | `/mock`                  | Get mock payments               | Required             |
| POST   | `/mock`                  | Process mock payment            | Required             |
| POST   | `/process`               | Process payment                 | Admin, Mech, Customer|
| GET    | `/history/:invoiceId`    | Get payment history             | Admin, Mech, Customer|
| POST   | `/refund/:paymentId`     | Refund payment                  | Admin                |

## Analytics Routes
Base path: `/analytics`

| Method | Endpoint                 | Description                     | Role Required |
|--------|--------------------------|---------------------------------|---------------|
| GET    | `/vehicles`              | Get vehicle analytics           | Admin         |
| GET    | `/parts-usage`           | Get parts usage analytics       | Admin         |
| GET    | `/revenue`               | Get revenue analytics           | Admin         |
| GET    | `/dashboard-stats`       | Get dashboard stats             | Admin         |
| GET    | `/mechanic-performance`  | Get mechanic performance        | Admin, Mech   |

## Cache Routes
Base path: `/cache`

| Method | Endpoint                 | Description                     | Role Required |
|--------|--------------------------|---------------------------------|---------------|
| POST   | `/clear`                 | Clear all cache                 | Admin         |
| GET    | `/stats`                 | Get cache statistics            | Admin         |


## Utility Routes
Base path: `/` (Root)

| Method | Endpoint                 | Description                     | Authentication |
|--------|--------------------------|---------------------------------|----------------|
| GET    | `/`                      | API information                 | None           |

