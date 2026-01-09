# Smart Vehicle Maintenance and Service Management System - API Flows Documentation

This document provides detailed flow explanations for each API endpoint in the Smart Vehicle Maintenance and Service Management System. It covers the complete request/response cycle, authentication, validation, business logic, and data flow for all implemented APIs.

## Base URL Structure
- Base URL: `http://localhost:5000/api/`
- All API endpoints are prefixed with `/api/`

## Authentication & Authorization
- JWT-based authentication is used throughout the system
- Different roles have different access levels: `customer`, `mechanic`, `admin`
- Authorization is enforced via middleware (`authMiddleware`, `roleMiddleware`)
- Rate limiting is applied to all endpoints with specific restrictions for authentication endpoints

---

## 1. Authentication APIs (`/api/auth`)

### 1.1 POST `/api/auth/register`
**Purpose:** Register a new user account
**Access Level:** Public (no authentication required)

**Request Flow:**
1. Client sends POST request with user details: `{name, email, password, role, phone, address}`
2. Express-validator validates the request body:
   - Name must be trimmed and non-empty
   - Email must be valid
   - Password must be at least 6 characters
   - Role must be one of ['customer', 'mechanic', 'admin']
   - Phone and address are optional
3. Validation middleware checks for errors and returns if validation fails
4. Request reaches `register` controller function
5. Controller hashes the password using bcrypt
6. Controller creates a new user record in the database
7. Controller generates JWT token and refresh token
8. Response returns user data along with tokens

**Response:**
- Success: `{message: "User registered successfully", user: {...}, token: "...", refreshToken: "..."}`
- Error: `{error: "...", code: 400/409/500}`

### 1.2 POST `/api/auth/login`
**Purpose:** Authenticate user and return tokens
**Access Level:** Public (no authentication required)

**Request Flow:**
1. Client sends POST request with credentials: `{email, password}`
2. Express-validator validates the request body:
   - Email must be valid
   - Password must not be empty
3. Validation middleware checks for errors and returns if validation fails
4. Request reaches `login` controller function
5. Controller finds user by email in the database
6. Controller compares provided password with hashed password
7. If passwords match, generates JWT token and refresh token
8. Response returns user data along with tokens

**Response:**
- Success: `{message: "Login successful", user: {...}, token: "...", refreshToken: "..."}`
- Error: `{error: "Invalid credentials", code: 401}`

### 1.3 GET `/api/auth/profile`
**Purpose:** Get authenticated user's profile information
**Access Level:** Authenticated users only

**Request Flow:**
1. Client sends GET request with Authorization header containing JWT token
2. `authMiddleware` validates the JWT token
3. Request reaches `getProfile` controller function
4. Controller retrieves user information from database using token payload
5. Response returns user profile data

**Response:**
- Success: `{user: {...}}`
- Error: `{message: "Unauthorized", code: 401}`

### 1.4 PUT `/api/auth/users/:id`
**Purpose:** Update user profile information
**Access Level:** Authenticated users (own profile) or admin

**Request Flow:**
1. Client sends PUT request with updated user details: `{name, phone, address}`
2. `authMiddleware` validates the JWT token
3. Express-validator validates optional fields
4. Request reaches `updateProfile` controller function
5. Controller checks if user can update the profile (own profile or admin)
6. Controller updates user information in database
7. Response returns updated user data

**Response:**
- Success: `{message: "Profile updated successfully", user: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 1.5 PUT `/api/auth/users/:id/change-password`
**Purpose:** Change user password
**Access Level:** Authenticated users (own password) or admin

**Request Flow:**
1. Client sends PUT request with password change details: `{oldPassword, newPassword}`
2. `authMiddleware` validates the JWT token
3. Express-validator validates:
   - Old password is required
   - New password must be at least 6 characters
4. Request reaches `changePassword` controller function
5. Controller verifies old password matches stored hash
6. Controller hashes new password and updates in database
7. Response confirms password change

**Response:**
- Success: `{message: "Password changed successfully"}`
- Error: `{error: "Current password is incorrect", code: 400/401/403}`

### 1.6 POST `/api/auth/forgot-password`
**Purpose:** Initiate password reset process
**Access Level:** Public

**Request Flow:**
1. Client sends POST request with email: `{email}`
2. Express-validator validates email format
3. Request reaches `forgotPassword` controller function
4. Controller generates password reset token
5. Controller stores token in database with expiration
6. Controller sends password reset email to user
7. Response confirms email sent (without revealing if email exists)

**Response:**
- Success: `{message: "Password reset link sent to your email"}`

### 1.7 POST `/api/auth/reset-password`
**Purpose:** Complete password reset process
**Access Level:** Public (with valid token)

**Request Flow:**
1. Client sends POST request with reset details: `{token, newPassword}`
2. Express-validator validates:
   - Token is required
   - New password must be at least 6 characters
3. Request reaches `resetPassword` controller function
4. Controller verifies reset token validity and expiration
5. Controller hashes new password and updates user record
6. Controller invalidates the reset token
7. Response confirms password reset

**Response:**
- Success: `{message: "Password reset successfully"}`
- Error: `{error: "Invalid or expired token", code: 400}`

### 1.8 POST `/api/auth/refresh-token`
**Purpose:** Refresh authentication token
**Access Level:** Public (with refresh token)

**Request Flow:**
1. Client sends POST request with refresh token: `{refreshToken}`
2. Request reaches `refreshToken` controller function
3. Controller validates refresh token
4. Controller generates new JWT access token
5. Response returns new access token

**Response:**
- Success: `{token: "..."}`
- Error: `{error: "Invalid refresh token", code: 401}`

### 1.9 POST `/api/auth/logout`
**Purpose:** Log out user (currently just returns success)
**Access Level:** Authenticated users

**Request Flow:**
1. Client sends POST request with authorization token
2. `authMiddleware` validates the JWT token
3. Request reaches `logout` controller function
4. Response confirms logout (future implementation may invalidate tokens)

**Response:**
- Success: `{message: "Logged out successfully"}`

### 1.10 POST `/api/auth/create-user`
**Purpose:** Admin creates a new user account
**Access Level:** Admin only

**Request Flow:**
1. Admin sends POST request with user details: `{name, email, password, role, phone, address}`
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Express-validator validates all required fields
5. Request reaches `createUser` controller function
6. Controller creates new user with provided role
7. Response returns created user information

**Response:**
- Success: `{message: "User created successfully", user: {...}}`
- Error: `{error: "...", code: 400/401/403/409}`

---

## 2. User Management APIs (`/api/users`)

### 2.1 GET `/api/users`
**Purpose:** Get all users in the system
**Access Level:** Admin only

**Request Flow:**
1. Admin sends GET request with authorization token
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Request reaches `getUsers` controller function
5. Controller queries all users from database
6. Response returns array of users (excluding sensitive data)

**Response:**
- Success: `{users: [...], total: number}`
- Error: `{error: "Unauthorized", code: 401/403}`

### 2.2 PUT `/api/users/:id/role`
**Purpose:** Update user role
**Access Level:** Admin only

**Request Flow:**
1. Admin sends PUT request with role update: `{role: "customer|mechanic|admin"}`
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Express-validator validates role is one of allowed values
5. Request reaches `updateUserRole` controller function
6. Controller updates user role in database
7. Response confirms role update

**Response:**
- Success: `{message: "User role updated successfully", user: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 2.3 DELETE `/api/users/:id`
**Purpose:** Delete a user account
**Access Level:** Admin only

**Request Flow:**
1. Admin sends DELETE request for user ID
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Request reaches `deleteUser` controller function
5. Controller deletes user from database (with cascade effects)
6. Response confirms deletion

**Response:**
- Success: `{message: "User deleted successfully"}`
- Error: `{error: "...", code: 401/403/404}`

### 2.4 GET `/api/users/mechanics`
**Purpose:** Get all mechanics in the system
**Access Level:** Admin only

**Request Flow:**
1. Admin sends GET request with authorization token
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Request reaches `getMechanics` controller function
5. Controller queries all users with role 'mechanic'
6. Response returns array of mechanics

**Response:**
- Success: `{mechanics: [...]}`

---

## 3. Vehicle Management APIs (`/api/vehicles`)

### 3.1 POST `/api/vehicles`
**Purpose:** Create a new vehicle record
**Access Level:** Authenticated users (customers, mechanics, admins)

**Request Flow:**
1. User sends POST request with vehicle details: `{vin, model, year, engine_type}`
2. `authMiddleware` validates user token
3. Express-validator validates required fields:
   - VIN is required and non-empty
   - Model is required and non-empty
   - Year is valid (between 1900-2100)
   - Engine type is optional
4. Request reaches `createVehicle` controller function
5. Controller creates new vehicle linked to current user
6. Response returns created vehicle information

**Response:**
- Success: `{message: "Vehicle created successfully", vehicle: {...}}`
- Error: `{error: "...", code: 400/401/403/409}`

### 3.2 GET `/api/vehicles`
**Purpose:** Get all vehicles in the system
**Access Level:** Authenticated users

**Request Flow:**
1. User sends GET request with authorization token
2. `authMiddleware` validates user token
3. Request reaches `getVehicles` controller function
4. Controller queries all vehicles from database
5. Response returns array of vehicles with owner information

**Response:**
- Success: `{vehicles: [...], total: number, page: number, totalPages: number}`

### 3.3 GET `/api/vehicles/user/:id`
**Purpose:** Get vehicles owned by a specific user
**Access Level:** Authenticated users (own vehicles) or admin

**Request Flow:**
1. User sends GET request for user ID
2. `authMiddleware` validates user token
3. Request reaches `getUserVehicles` controller function
4. Controller checks authorization (can view own vehicles or admin)
5. Controller queries vehicles owned by specified user
6. Response returns user's vehicles

**Response:**
- Success: `{vehicles: [...], total: number, page: number, totalPages: number}`

### 3.4 GET `/api/vehicles/:id`
**Purpose:** Get specific vehicle by ID
**Access Level:** Authenticated users

**Request Flow:**
1. User sends GET request for vehicle ID
2. `authMiddleware` validates user token
3. Request reaches `getVehicleById` controller function
4. Controller queries vehicle from database
5. Response returns vehicle information

**Response:**
- Success: `{vehicle: {...}}`
- Error: `{error: "Vehicle not found", code: 404}`

### 3.5 GET `/api/vehicles/:id/history`
**Purpose:** Get service history for a specific vehicle
**Access Level:** Authenticated users

**Request Flow:**
1. User sends GET request for vehicle ID
2. `authMiddleware` validates user token
3. Request reaches `getVehicleHistory` controller function
4. Controller queries vehicle's service history from related tables
5. Response returns vehicle service history

**Response:**
- Success: `{history: [...]}`
- Error: `{error: "Vehicle not found", code: 404}`

### 3.6 PUT `/api/vehicles/:id`
**Purpose:** Update vehicle information
**Access Level:** Customer, mechanic, or admin

**Request Flow:**
1. User sends PUT request with updated vehicle details
2. `authMiddleware` validates user token
3. `roleMiddleware` ensures user has permission to update vehicles
4. Express-validator validates optional fields
5. Request reaches `updateVehicle` controller function
6. Controller checks if user owns the vehicle or is admin
7. Controller updates vehicle in database
8. Response returns updated vehicle information

**Response:**
- Success: `{message: "Vehicle updated successfully", vehicle: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 3.7 DELETE `/api/vehicles/:id`
**Purpose:** Delete a vehicle record
**Access Level:** Customer (own vehicles) or admin

**Request Flow:**
1. User sends DELETE request for vehicle ID
2. `authMiddleware` validates user token
3. `roleMiddleware` ensures user has permission to delete vehicles
4. Request reaches `deleteVehicle` controller function
5. Controller checks if user owns the vehicle or is admin
6. Controller deletes vehicle from database
7. Response confirms deletion

**Response:**
- Success: `{message: "Vehicle deleted successfully"}`
- Error: `{error: "...", code: 401/403/404}`

---

## 4. Booking Management APIs (`/api/bookings`)

### 4.1 POST `/api/bookings`
**Purpose:** Create a new service booking
**Access Level:** Customer only

**Request Flow:**
1. Customer sends POST request with booking details: `{vehicle_id, service_type, booking_date, booking_time, notes}`
2. `authMiddleware` validates customer token
3. `roleMiddleware` ensures requesting user is customer
4. Express-validator validates:
   - Vehicle ID is valid integer
   - Service type is required
   - Booking date is valid date
   - Booking time is valid HH:MM format
   - Notes are optional
5. Request reaches `createBooking` controller function
6. Controller creates new booking with status 'pending'
7. Response returns created booking information

**Response:**
- Success: `{message: "Booking created successfully", booking: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 4.2 GET `/api/bookings/pending`
**Purpose:** Get all pending bookings
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends GET request with authorization token
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Request reaches `getPendingBookings` controller function
5. Controller queries bookings with 'pending' status
6. Response returns pending bookings

**Response:**
- Success: `{bookings: [...], total: number, page: number, totalPages: number}`

### 4.3 GET `/api/bookings/:id`
**Purpose:** Get specific booking by ID
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends GET request for booking ID
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Request reaches `getBookingById` controller function
5. Controller queries specific booking from database
6. Response returns booking information

**Response:**
- Success: `{booking: {...}}`
- Error: `{error: "Booking not found", code: 404}`

### 4.4 GET `/api/bookings/customer/:id`
**Purpose:** Get bookings for a specific customer
**Access Level:** Authenticated users (own bookings) or admin

**Request Flow:**
1. User sends GET request for customer ID
2. `authMiddleware` validates token
3. Request reaches `getCustomerBookings` controller function
4. Controller checks authorization (can view own bookings or admin)
5. Controller queries bookings for specified customer
6. Response returns customer's bookings

**Response:**
- Success: `{bookings: [...], total: number, page: number, totalPages: number}`

### 4.5 GET `/api/bookings`
**Purpose:** Get all bookings in the system
**Access Level:** Admin or mechanic only

**Request Flow:**
1. User sends GET request with authorization token
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is admin or mechanic
4. Request reaches `getAllBookings` controller function
5. Controller queries all bookings from database
6. Response returns all bookings

**Response:**
- Success: `{bookings: [...], total: number, page: number, totalPages: number}`

### 4.6 GET `/api/bookings/servicecenter/:id`
**Purpose:** Get bookings for a specific service center
**Access Level:** Authenticated users

**Request Flow:**
1. User sends GET request for service center ID
2. `authMiddleware` validates token
3. Request reaches `getServiceCenterBookings` controller function
4. Controller queries bookings for specified service center
5. Response returns service center's bookings

**Response:**
- Success: `{bookings: [...], total: number, page: number, totalPages: number}`

### 4.7 GET `/api/bookings/mechanic/:id`
**Purpose:** Get bookings assigned to a specific mechanic
**Access Level:** Admin or mechanic

**Request Flow:**
1. User sends GET request for mechanic ID
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is admin or mechanic
4. Request reaches `getMechanicBookings` controller function
5. Controller queries bookings assigned to specified mechanic
6. Response returns mechanic's bookings

**Response:**
- Success: `{bookings: [...], total: number, page: number, totalPages: number}`

### 4.8 GET `/api/bookings/date-range`
**Purpose:** Get bookings within a specific date range
**Access Level:** Authenticated users

**Request Flow:**
1. User sends GET request with date range parameters
2. `authMiddleware` validates token
3. Request reaches `getBookingsByDateRange` controller function
4. Controller queries bookings within specified date range
5. Response returns bookings within date range

**Response:**
- Success: `{bookings: [...], total: number, page: number, totalPages: number}`

### 4.9 PUT `/api/bookings/:id/approve`
**Purpose:** Approve a pending booking
**Access Level:** Admin only

**Request Flow:**
1. Admin sends PUT request to approve booking ID
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Request reaches `approveBooking` controller function
5. Controller updates booking status to 'approved'
6. Response confirms approval

**Response:**
- Success: `{message: "Booking approved successfully", booking: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 4.10 PUT `/api/bookings/:id/reject`
**Purpose:** Reject a booking
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends PUT request to reject booking ID
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Request reaches `rejectBooking` controller function
5. Controller updates booking status to 'rejected'
6. Response confirms rejection

**Response:**
- Success: `{message: "Booking rejected successfully", booking: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 4.11 PUT `/api/bookings/:id/confirm`
**Purpose:** Confirm a booking
**Access Level:** Admin only

**Request Flow:**
1. Admin sends PUT request to confirm booking ID
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Request reaches `confirmBooking` controller function
5. Controller updates booking status to 'confirmed'
6. Response confirms booking confirmation

**Response:**
- Success: `{message: "Booking confirmed successfully", booking: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 4.12 PUT `/api/bookings/:id/assign`
**Purpose:** Assign a booking to a specific mechanic
**Access Level:** Admin only

**Request Flow:**
1. Admin sends PUT request to assign booking with mechanic ID: `{mechanicId}`
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Express-validator validates mechanic ID is valid integer
5. Request reaches `assignBooking` controller function
6. Controller updates booking to assign to specified mechanic
7. Response confirms assignment

**Response:**
- Success: `{message: "Booking assigned successfully", booking: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 4.13 PUT `/api/bookings/:id/cancel`
**Purpose:** Cancel a booking
**Access Level:** Customer, mechanic, or admin

**Request Flow:**
1. User sends PUT request to cancel booking with optional reason: `{reason}`
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user has permission to cancel
4. Express-validator validates optional reason
5. Request reaches `cancelBooking` controller function
6. Controller updates booking status to 'cancelled'
7. Response confirms cancellation

**Response:**
- Success: `{message: "Booking cancelled successfully", booking: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 4.14 PUT `/api/bookings/:id/reschedule`
**Purpose:** Reschedule a booking to new date/time
**Access Level:** Customer, mechanic, or admin

**Request Flow:**
1. User sends PUT request to reschedule booking with new date/time: `{newDateTime: {date, time}, reason}`
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user has permission to reschedule
4. Express-validator validates:
   - New date is valid date
   - New time is valid HH:MM format
   - Reason is optional
5. Request reaches `rescheduleBooking` controller function
6. Controller updates booking date and time
7. Response confirms rescheduling

**Response:**
- Success: `{message: "Booking rescheduled successfully", booking: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 4.15 PUT `/api/bookings/:id/status`
**Purpose:** Update booking status
**Access Level:** Admin only

**Request Flow:**
1. Admin sends PUT request to update booking status: `{status}`
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Express-validator validates status is not empty
5. Request reaches `updateBookingStatus` controller function
6. Controller updates booking status
7. Response confirms status update

**Response:**
- Success: `{message: "Booking status updated successfully", booking: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

---

## 5. Job Card Management APIs (`/api/jobcards`)

### 5.1 POST `/api/jobcards`
**Purpose:** Create a new job card
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends POST request with job card details: `{customer_id, vehicle_id, booking_id, notes}`
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Express-validator validates optional customer ID and required vehicle ID
5. Request reaches `createJobCard` controller function
6. Controller creates new job card with initial status
7. Response returns created job card information

**Response:**
- Success: `{message: "Job card created successfully", jobcard: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 5.2 GET `/api/jobcards`
**Purpose:** Get all job cards in the system
**Access Level:** Admin or mechanic only

**Request Flow:**
1. User sends GET request with authorization token
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is admin or mechanic
4. Request reaches `getJobCards` controller function
5. Controller queries all job cards from database
6. Response returns all job cards

**Response:**
- Success: `{jobcards: [...], total: number, page: number, totalPages: number}`

### 5.3 GET `/api/jobcards/:id`
**Purpose:** Get specific job card by ID
**Access Level:** Admin or mechanic only

**Request Flow:**
1. User sends GET request for job card ID
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is admin or mechanic
4. Request reaches `getJobCardById` controller function
5. Controller queries specific job card from database
6. Response returns job card information

**Response:**
- Success: `{jobcard: {...}}`
- Error: `{error: "Job card not found", code: 404}`

### 5.4 GET `/api/jobcards/booking/:bookingId`
**Purpose:** Get job card by booking ID
**Access Level:** Admin or mechanic only

**Request Flow:**
1. User sends GET request for booking ID
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is admin or mechanic
4. Request reaches `getJobCardByBookingId` controller function
5. Controller queries job card linked to specified booking
6. Response returns job card information

**Response:**
- Success: `{jobcard: {...}}`
- Error: `{error: "Job card not found", code: 404}`

### 5.5 GET `/api/jobcards/completed`
**Purpose:** Get all completed job cards
**Access Level:** Admin or mechanic only

**Request Flow:**
1. User sends GET request with authorization token
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is admin or mechanic
4. Request reaches `getCompletedJobCards` controller function
5. Controller queries job cards with 'completed' status
6. Response returns completed job cards

**Response:**
- Success: `{jobcards: [...], total: number, page: number, totalPages: number}`

### 5.6 GET `/api/jobcards/mechanic/:id`
**Purpose:** Get job cards assigned to a specific mechanic
**Access Level:** Admin or mechanic

**Request Flow:**
1. User sends GET request for mechanic ID
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is admin or mechanic
4. Request reaches `getMechanicJobCards` controller function
5. Controller queries job cards assigned to specified mechanic
6. Response returns mechanic's job cards

**Response:**
- Success: `{jobcards: [...], total: number, page: number, totalPages: number}`

### 5.7 GET `/api/jobcards/:id/notes`
**Purpose:** Get notes for a specific job card
**Access Level:** Admin or mechanic only

**Request Flow:**
1. User sends GET request for job card ID
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is admin or mechanic
4. Request reaches `getJobCardNotes` controller function
5. Controller queries notes for specified job card
6. Response returns job card notes

**Response:**
- Success: `{notes: [...]}`

### 5.8 PUT `/api/jobcards/:id/add-task`
**Purpose:** Add a task to a job card
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends PUT request to add task with details: `{task_name, task_cost}`
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Express-validator validates required task name and cost
5. Request reaches `addTask` controller function
6. Controller adds task to specified job card
7. Response confirms task addition

**Response:**
- Success: `{message: "Task added successfully", jobcard: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 5.9 PUT `/api/jobcards/:id/add-mechanic`
**Purpose:** Assign a mechanic to a job card
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends PUT request to assign mechanic with details: `{mechanic_id}`
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Express-validator validates mechanic ID is valid integer
5. Request reaches `assignMechanic` controller function
6. Controller assigns mechanic to job card
7. Response confirms mechanic assignment

**Response:**
- Success: `{message: "Mechanic assigned successfully", jobcard: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 5.10 PUT `/api/jobcards/:id/add-sparepart`
**Purpose:** Add a spare part to a job card
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends PUT request to add spare part with details: `{part_id, quantity}`
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Express-validator validates part ID and quantity are valid
5. Request reaches `addSparePart` controller function
6. Controller adds spare part to job card and updates inventory
7. Response confirms spare part addition

**Response:**
- Success: `{message: "Spare part added successfully", jobcard: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 5.11 PUT `/api/jobcards/:id/update-status`
**Purpose:** Update job card status
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends PUT request to update status with details: `{status}`
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Express-validator validates status is not empty
5. Request reaches `updateStatus` controller function
6. Controller updates job card status
7. Response confirms status update

**Response:**
- Success: `{message: "Status updated successfully", jobcard: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 5.12 PUT `/api/jobcards/:id/update-progress`
**Purpose:** Update job card progress percentage
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends PUT request to update progress with details: `{percentComplete, notes}`
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Express-validator validates percent complete is between 0-100
5. Request reaches `updateProgress` controller function
6. Controller updates job card progress and notes
7. Response confirms progress update

**Response:**
- Success: `{message: "Progress updated successfully", jobcard: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 5.13 DELETE `/api/jobcards/:id`
**Purpose:** Delete a job card
**Access Level:** Admin only

**Request Flow:**
1. Admin sends DELETE request for job card ID
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Request reaches `deleteJobCard` controller function
5. Controller deletes job card from database
6. Response confirms deletion

**Response:**
- Success: `{message: "Job card deleted successfully"}`
- Error: `{error: "...", code: 401/403/404}`

---

## 6. Parts & Inventory Management APIs (`/api/parts`)

### 6.1 POST `/api/parts`
**Purpose:** Create a new part in inventory
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends POST request with part details: `{name, part_number, price, quantity, reorder_level, description}`
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Express-validator validates required fields and data types
5. Request reaches `createPart` controller function
6. Controller creates new part record in inventory
7. Response returns created part information

**Response:**
- Success: `{message: "Part created successfully", part: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 6.2 GET `/api/parts`
**Purpose:** Get all parts in inventory
**Access Level:** Authenticated users

**Request Flow:**
1. User sends GET request with authorization token
2. `authMiddleware` validates token
3. Request reaches `getParts` controller function
4. Controller queries all parts from inventory database
5. Response returns all parts with inventory information

**Response:**
- Success: `{parts: [...], total: number, page: number, totalPages: number}`

### 6.3 GET `/api/parts/low-stock`
**Purpose:** Get parts with low inventory levels
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends GET request with authorization token
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Request reaches `getLowStockParts` controller function
5. Controller queries parts where quantity <= reorder_level
6. Response returns low stock parts

**Response:**
- Success: `{parts: [...], total: number, page: number, totalPages: number}`

### 6.4 GET `/api/parts/usage`
**Purpose:** Get parts usage trends and analytics
**Access Level:** Authenticated users

**Request Flow:**
1. User sends GET request with authorization token
2. `authMiddleware` validates token
3. Request reaches `getPartsUsage` controller function
4. Controller analyzes parts usage patterns and consumption rates
5. Response returns parts usage analytics

**Response:**
- Success: `{usageData: [...], trends: {...}}`

### 6.5 POST `/api/parts/supplier`
**Purpose:** Create a new supplier
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends POST request with supplier details: `{name, contact_person, email, phone, address}`
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Express-validator validates required fields
5. Request reaches `createSupplier` controller function
6. Controller creates new supplier record
7. Response returns created supplier information

**Response:**
- Success: `{message: "Supplier created successfully", supplier: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 6.6 GET `/api/parts/suppliers`
**Purpose:** Get all suppliers
**Access Level:** Authenticated users

**Request Flow:**
1. User sends GET request with authorization token
2. `authMiddleware` validates token
3. Request reaches `getSuppliers` controller function
4. Controller queries all suppliers from database
5. Response returns all suppliers

**Response:**
- Success: `{suppliers: [...], total: number, page: number, totalPages: number}`

### 6.7 PUT `/api/parts/supplier/:id`
**Purpose:** Update supplier information
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends PUT request with updated supplier details
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Express-validator validates optional fields
5. Request reaches `updateSupplier` controller function
6. Controller updates supplier information in database
7. Response returns updated supplier information

**Response:**
- Success: `{message: "Supplier updated successfully", supplier: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 6.8 DELETE `/api/parts/supplier/:id`
**Purpose:** Delete a supplier
**Access Level:** Admin only

**Request Flow:**
1. Admin sends DELETE request for supplier ID
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Request reaches `deleteSupplier` controller function
5. Controller deletes supplier from database
6. Response confirms deletion

**Response:**
- Success: `{message: "Supplier deleted successfully"}`
- Error: `{error: "...", code: 401/403/404}`

### 6.9 GET `/api/parts/:id`
**Purpose:** Get specific part by ID
**Access Level:** Authenticated users

**Request Flow:**
1. User sends GET request for part ID
2. `authMiddleware` validates token
3. Request reaches `getPartById` controller function
4. Controller queries specific part from database
5. Response returns part information

**Response:**
- Success: `{part: {...}}`
- Error: `{error: "Part not found", code: 404}`

### 6.10 PUT `/api/parts/:id`
**Purpose:** Update part information
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends PUT request with updated part details
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Express-validator validates optional fields
5. Request reaches `updatePart` controller function
6. Controller updates part information in database
7. Response returns updated part information

**Response:**
- Success: `{message: "Part updated successfully", part: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 6.11 DELETE `/api/parts/:id`
**Purpose:** Delete a part from inventory
**Access Level:** Admin only

**Request Flow:**
1. Admin sends DELETE request for part ID
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Request reaches `deletePart` controller function
5. Controller deletes part from database
6. Response confirms deletion

**Response:**
- Success: `{message: "Part deleted successfully"}`
- Error: `{error: "...", code: 401/403/404}`

---

## 7. Invoice Management APIs (`/api/invoices`)

### 7.1 POST `/api/invoices`
**Purpose:** Create a new invoice
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends POST request with invoice details: `{jobcard_id, customer_id, parts_total, labor_total, grand_total}`
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Express-validator validates required financial fields
5. Request reaches `createInvoice` controller function
6. Controller creates new invoice record linked to job card
7. Response returns created invoice information

**Response:**
- Success: `{message: "Invoice created successfully", invoice: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 7.2 GET `/api/invoices/:id`
**Purpose:** Get specific invoice by ID
**Access Level:** Admin, mechanic, or customer (based on ownership)

**Request Flow:**
1. User sends GET request for invoice ID
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is admin, mechanic, or customer
4. Request reaches `getInvoiceById` controller function
5. Controller checks if user can access the invoice
6. Controller queries specific invoice from database
7. Response returns invoice information with details

**Response:**
- Success: `{invoice: {...}, tasks: [...], parts: [...]}`

### 7.3 GET `/api/invoices/booking/:bookingId`
**Purpose:** Get invoice by booking ID
**Access Level:** Admin, mechanic, or customer (based on ownership)

**Request Flow:**
1. User sends GET request for booking ID
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is admin, mechanic, or customer
4. Request reaches `getInvoiceByBookingId` controller function
5. Controller checks if user can access invoices for the booking
6. Controller queries invoice linked to specified booking
7. Response returns invoice information

**Response:**
- Success: `{invoice: {...}}`

### 7.4 GET `/api/invoices/customer/:id`
**Purpose:** Get invoices for a specific customer
**Access Level:** Admin or customer (own invoices)

**Request Flow:**
1. User sends GET request for customer ID
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is admin or customer
4. Request reaches `getCustomerInvoices` controller function
5. Controller checks authorization (can view own invoices or admin)
6. Controller queries invoices for specified customer
7. Response returns customer's invoices

**Response:**
- Success: `{invoices: [...], total: number, page: number, totalPages: number}`

### 7.5 GET `/api/invoices/mechanic/:id`
**Purpose:** Get invoices for jobs handled by a specific mechanic
**Access Level:** Admin or mechanic

**Request Flow:**
1. User sends GET request for mechanic ID
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is admin or mechanic
4. Request reaches `getMechanicInvoices` controller function
5. Controller queries invoices for jobs handled by specified mechanic
6. Response returns mechanic's invoices

**Response:**
- Success: `{invoices: [...], total: number, page: number, totalPages: number}`

### 7.6 GET `/api/invoices`
**Purpose:** Get all invoices in the system
**Access Level:** Admin only

**Request Flow:**
1. Admin sends GET request with authorization token
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Request reaches `getAllInvoices` controller function
5. Controller queries all invoices from database
6. Response returns all invoices

**Response:**
- Success: `{invoices: [...], total: number, page: number, totalPages: number}`

### 7.7 PUT `/api/invoices/:id/payment`
**Purpose:** Update payment status of an invoice
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends PUT request to update payment status: `{status, payment_method}`
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Express-validator validates payment status is valid
5. Request reaches `updatePaymentStatus` controller function
6. Controller updates invoice payment status
7. Response confirms payment status update

**Response:**
- Success: `{message: "Payment status updated successfully", invoice: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 7.8 PUT `/api/invoices/:id`
**Purpose:** Update invoice details
**Access Level:** Mechanic or admin only

**Request Flow:**
1. User sends PUT request with updated invoice details: `{parts_total, labor_total, grand_total}`
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is mechanic or admin
4. Express-validator validates optional financial fields
5. Request reaches `updateInvoice` controller function
6. Controller updates invoice details in database
7. Response returns updated invoice information

**Response:**
- Success: `{message: "Invoice updated successfully", invoice: {...}}`
- Error: `{error: "...", code: 400/401/403/404}`

### 7.9 POST `/api/invoices/mock`
**Purpose:** Process mock payment for testing
**Access Level:** Admin, mechanic, or customer

**Request Flow:**
1. User sends POST request with payment details: `{invoiceId, amount, method}`
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is authorized
4. Express-validator validates payment fields
5. Request reaches `mockPayment` controller function
6. Controller simulates payment processing
7. Response confirms mock payment result

**Response:**
- Success: `{success: true, message: "Payment processed successfully", data: {...}}`
- Error: `{success: false, message: "Payment failed", error: "..."}`

---

## 8. Payment Management APIs (`/api/payments`)

### 8.1 GET `/api/payments/mock`
**Purpose:** Get mock payment data for testing
**Access Level:** Authenticated users

**Request Flow:**
1. User sends GET request with authorization token
2. `authMiddleware` validates token
3. Request returns predefined mock payment data
4. Response contains sample payment records for testing purposes

**Response:**
- Success: `{success: true, message: "Mock payments fetched successfully", data: [...]}`

### 8.2 POST `/api/payments/mock`
**Purpose:** Process mock payment for testing
**Access Level:** Authenticated users

**Request Flow:**
1. User sends POST request with payment details: `{invoiceId, amount, method}`
2. `authMiddleware` validates token
3. Express-validator validates payment fields
4. Request reaches `mockPayment` controller function (imported from invoiceController)
5. Controller simulates payment processing
6. Response confirms mock payment result

**Response:**
- Success: `{success: true, message: "Payment processed successfully", data: {...}}`
- Error: `{success: false, message: "Payment failed", error: "..."}`

### 8.3 POST `/api/payments/process`
**Purpose:** Process actual payment
**Access Level:** Customer, mechanic, or admin

**Request Flow:**
1. User sends POST request with payment details: `{invoiceId, amount, method}`
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is authorized
4. Express-validator validates payment fields
5. Request reaches `processPayment` controller function
6. Controller processes payment through payment gateway
7. Response confirms payment processing result

**Response:**
- Success: `{success: true, message: "Payment processed successfully", data: {...}}`
- Error: `{success: false, message: "Payment failed", error: "..."}`

### 8.4 GET `/api/payments/history/:invoiceId`
**Purpose:** Get payment history for an invoice
**Access Level:** Customer, mechanic, or admin

**Request Flow:**
1. User sends GET request for invoice ID
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is authorized
4. Request reaches `getPaymentHistory` controller function
5. Controller queries payment history for specified invoice
6. Response returns payment history records

**Response:**
- Success: `{history: [...], total: number, page: number, totalPages: number}`

### 8.5 POST `/api/payments/refund/:paymentId`
**Purpose:** Process refund for a payment
**Access Level:** Admin only

**Request Flow:**
1. Admin sends POST request to refund payment with optional reason: `{reason}`
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Express-validator validates optional reason
5. Request reaches `refundPayment` controller function
6. Controller processes refund through payment gateway
7. Response confirms refund processing

**Response:**
- Success: `{success: true, message: "Refund processed successfully", data: {...}}`
- Error: `{success: false, message: "Refund failed", error: "..."}`

---

## 9. Analytics APIs (`/api/analytics`)

### 9.1 GET `/api/analytics/vehicles`
**Purpose:** Get vehicle analytics and statistics
**Access Level:** Admin only

**Request Flow:**
1. Admin sends GET request with authorization token
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Request reaches `getVehicleAnalytics` controller function
5. Controller analyzes vehicle data and generates statistics
6. Response returns vehicle analytics data

**Response:**
- Success: `{analytics: {...}, charts: {...}, summaries: {...}}`

### 9.2 GET `/api/analytics/parts-usage`
**Purpose:** Get parts usage analytics
**Access Level:** Admin only

**Request Flow:**
1. Admin sends GET request with authorization token
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Request reaches `getPartsUsage` controller function
5. Controller analyzes parts usage patterns and consumption trends
6. Response returns parts usage analytics

**Response:**
- Success: `{usageData: [...], trends: {...}, recommendations: [...]}`

### 9.3 GET `/api/analytics/revenue`
**Purpose:** Get revenue analytics and financial reports
**Access Level:** Admin only

**Request Flow:**
1. Admin sends GET request with authorization token
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Request reaches `getRevenueAnalytics` controller function
5. Controller analyzes financial data and generates revenue reports
6. Response returns revenue analytics data

**Response:**
- Success: `{revenueData: {...}, monthly: [...], quarterly: [...], yearly: [...]}`

### 9.4 GET `/api/analytics/dashboard-stats`
**Purpose:** Get dashboard statistics summary
**Access Level:** Admin only

**Request Flow:**
1. Admin sends GET request with authorization token
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Request reaches `getDashboardStats` controller function
5. Controller aggregates various statistics for dashboard display
6. Response returns comprehensive dashboard statistics

**Response:**
- Success: `{stats: {...}, totals: {...}, recent: {...}, trends: {...}}`

### 9.5 GET `/api/analytics/mechanic-performance`
**Purpose:** Get mechanic performance analytics
**Access Level:** Admin or mechanic

**Request Flow:**
1. User sends GET request with authorization token
2. `authMiddleware` validates token
3. `roleMiddleware` ensures requesting user is admin or mechanic
4. Request reaches `getMechanicPerformance` controller function
5. Controller analyzes mechanic performance metrics and statistics
6. Response returns mechanic performance data

**Response:**
- Success: `{performance: [...], metrics: {...}, rankings: [...], statistics: {...}}`

---

## 10. Cache Management APIs (`/api/cache`)

### 10.1 POST `/api/cache/clear`
**Purpose:** Clear all cached data
**Access Level:** Admin only

**Request Flow:**
1. Admin sends POST request with authorization token
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Request reaches `clearAllCache` controller function
5. Controller clears all cached data from memory/store
6. Response confirms cache clearing

**Response:**
- Success: `{message: "All cache cleared successfully"}`

### 10.2 GET `/api/cache/stats`
**Purpose:** Get cache statistics and information
**Access Level:** Admin only

**Request Flow:**
1. Admin sends GET request with authorization token
2. `authMiddleware` validates admin token
3. `roleMiddleware` ensures requesting user is admin
4. Request reaches `getCacheStats` controller function
5. Controller gathers cache statistics and metrics
6. Response returns cache information

**Response:**
- Success: `{stats: {...}, hits: number, misses: number, size: number, keys: [...]}`

---

## Security & Performance Features

### Authentication Security
- JWT tokens with configurable expiration
- Refresh token mechanism for secure token renewal
- Rate limiting on authentication endpoints
- Password hashing using bcrypt
- Input validation using express-validator

### Authorization Controls
- Role-based access control (RBAC)
- Middleware-based permission checking
- Route-level security enforcement
- Data ownership verification

### Performance Optimization
- Rate limiting for API protection
- Caching mechanisms for frequently accessed data
- Database query optimization
- Pagination for large datasets

### Error Handling
- Comprehensive error handling middleware
- Proper HTTP status codes
- Consistent error response format
- Validation error aggregation

This comprehensive API documentation outlines all the implemented endpoints, their purpose, access levels, request/response flows, and business logic. The system provides a complete solution for managing vehicle maintenance and service operations with proper security, validation, and error handling throughout.