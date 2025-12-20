# SVMMS Activity Diagram

This document provides activity diagrams illustrating the main workflows in the Service Vehicle Management and Monitoring System (SVMMS).

## Table of Contents
1. [User Authentication Workflow](#user-authentication-workflow)
2. [Customer Service Booking Workflow](#customer-service-booking-workflow)
3. [Mechanic Job Management Workflow](#mechanic-job-management-workflow)
4. [Admin Inventory Management Workflow](#admin-inventory-management-workflow)

## User Authentication Workflow

```mermaid
activityDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant D as Database
    
    U->>F: Access Application
    F->>F: Display Login/Register Page
    
    alt Registration
        U->>F: Fill Registration Form
        F->>B: POST /api/auth/register
        B->>D: Check if user exists
        D-->>B: User availability result
        B->>B: Hash password
        B->>D: Insert new user
        D-->>B: User created
        B->>B: Generate JWT tokens
        B-->>F: Return tokens and user data
        F->>F: Store tokens in localStorage
        F->>U: Redirect to Dashboard
    else Login
        U->>F: Fill Login Form
        F->>B: POST /api/auth/login
        B->>D: Verify credentials
        D-->>B: User data
        B->>B: Validate password
        B->>B: Generate JWT tokens
        B-->>F: Return tokens and user data
        F->>F: Store tokens in localStorage
        F->>U: Redirect to Dashboard
    end
    
    U->>F: Access Protected Route
    F->>B: Request with JWT in header
    B->>B: Validate JWT
    alt Valid Token
        B-->>F: Process Request
        F->>U: Display Protected Content
    else Expired Token
        B->>B: Check refresh token
        alt Valid Refresh Token
            B->>B: Generate new access token
            B-->>F: Return new access token
            F->>F: Update localStorage
            F->>B: Retry original request
            B-->>F: Process Request
            F->>U: Display Protected Content
        else Invalid Refresh Token
            B-->>F: 401 Unauthorized
            F->>F: Clear tokens
            F->>U: Redirect to Login
        end
    end
```

## Customer Service Booking Workflow

```mermaid
activityDiagram
    participant C as Customer
    participant F as Frontend
    participant B as Backend API
    participant D as Database
    
    C->>F: Navigate to Book Service
    F->>B: GET /api/vehicles (customer's vehicles)
    B->>D: Fetch customer vehicles
    D-->>B: Vehicle data
    B-->>F: Return vehicles
    F->>C: Display Vehicle Selection
    
    C->>F: Select Vehicle and Service Type
    F->>F: Show Booking Form
    
    C->>F: Fill Booking Details
    F->>B: POST /api/bookings
    B->>B: Validate booking data
    B->>D: Insert booking (status: pending)
    D-->>B: Booking created
    B-->>F: Return booking details
    F->>C: Show Booking Confirmation
    
    loop Status Updates
        B->>D: Update booking status
        D-->>B: Status updated
        B->>C: Send notification (if implemented)
    end
    
    C->>F: View Booking History
    F->>B: GET /api/bookings/customer/{id}
    B->>D: Fetch customer bookings
    D-->>B: Booking data
    B-->>F: Return bookings
    F->>C: Display Booking List
```

## Mechanic Job Management Workflow

```mermaid
activityDiagram
    participant M as Mechanic
    participant F as Frontend
    participant B as Backend API
    participant D as Database
    
    M->>F: Access Dashboard
    F->>B: GET /api/bookings?status=pending
    B->>D: Fetch pending bookings
    D-->>B: Booking data
    B-->>F: Return pending bookings
    F->>M: Display Pending Bookings
    
    M->>F: Select Booking to Review
    F->>M: Show Booking Details
    
    alt Approve Booking
        M->>F: Click Approve
        F->>B: PUT /api/bookings/{id}/approve
        B->>D: Update booking status to approved
        B->>D: Create job card for booking
        D-->>B: Updates completed
        B-->>F: Return updated data
        F->>M: Show Success Message
    else Reject Booking
        M->>F: Click Reject
        F->>B: PUT /api/bookings/{id}/reject
        B->>D: Update booking status to rejected
        D-->>B: Update completed
        B-->>F: Return updated data
        F->>M: Show Success Message
    end
    
    M->>F: Access Job Cards
    F->>B: GET /api/jobcards?mechanic_id={id}
    B->>D: Fetch mechanic job cards
    D-->>B: Job card data
    B-->>F: Return job cards
    F->>M: Display Job Cards
    
    M->>F: Select Job Card
    F->>M: Show Job Card Details
    
    loop Work on Job
        M->>F: Add Task
        F->>B: POST /api/jobcard-tasks
        B->>D: Insert task
        D-->>B: Task created
        B-->>F: Return task data
        F->>M: Update UI
        
        M->>F: Add Parts
        F->>B: POST /api/jobcard-spareparts
        B->>D: Insert parts usage
        D-->>B: Parts usage recorded
        B-->>F: Return parts data
        F->>M: Update UI
        
        M->>F: Update Status
        F->>B: PUT /api/jobcards/{id}
        B->>D: Update job card status
        D-->>B: Status updated
        B-->>F: Return updated job card
        F->>M: Update UI
    end
    
    M->>F: Mark Job as Completed
    F->>B: PUT /api/jobcards/{id}/complete
    B->>D: Update job card status to completed
    B->>D: Create invoice for job card
    D-->>B: Updates completed
    B-->>F: Return updated data
    F->>M: Show Completion Confirmation
```

## Admin Inventory Management Workflow

```mermaid
activityDiagram
    participant A as Admin
    participant F as Frontend
    participant B as Backend API
    participant D as Database
    
    A->>F: Navigate to Parts Management
    F->>B: GET /api/parts
    B->>D: Fetch all parts
    D-->>B: Parts data
    B-->>F: Return parts
    F->>A: Display Parts Inventory
    
    alt Add New Part
        A->>F: Click Add Part
        F->>A: Show Add Part Form
        
        A->>F: Fill Part Details
        F->>B: POST /api/parts
        B->>B: Validate part data
        B->>D: Insert new part
        D-->>B: Part created
        B-->>F: Return part data
        F->>A: Show Success & Update List
    else Update Existing Part
        A->>F: Select Part to Edit
        F->>A: Show Edit Form with Current Data
        
        A->>F: Modify Part Details
        F->>B: PUT /api/parts/{id}
        B->>B: Validate updated data
        B->>D: Update part
        D-->>B: Part updated
        B-->>F: Return updated part
        F->>A: Show Success & Update List
    else Delete Part
        A->>F: Select Part to Delete
        F->>A: Confirm Deletion
        
        A->>F: Confirm Delete
        F->>B: DELETE /api/parts/{id}
        B->>D: Delete part
        D-->>B: Part deleted
        B-->>F: Return success
        F->>A: Update List
    end
    
    loop Low Stock Alert
        D->>D: Check stock levels
        alt Stock below reorder level
            D->>A: Send low stock alert (if implemented)
        end
    end
    
    A->>F: View Analytics
    F->>B: GET /api/analytics/top-parts
    B->>D: Fetch analytics data
    D-->>B: Analytics data
    B-->>F: Return analytics
    F->>A: Display Charts and Reports
```