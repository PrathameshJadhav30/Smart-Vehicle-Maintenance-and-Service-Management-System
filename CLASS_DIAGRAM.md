# SVMMS Class Diagram

## Overview
This document shows the class structure of the SVMMS system with their attributes, methods, and relationships in a clear, understandable format.

## Core System Classes

### 1. User Class
```
┌─────────────────────────┐
│        User           │
├─────────────────────────┤
│ - id: int             │
│ - name: string        │
│ - email: string       │
│ - password: string    │
│ - role: string        │
│ - phone: string       │
│ - address: string     │
│ - created_at: datetime│
│ - updated_at: datetime│
├─────────────────────────┤
│ + authenticate(): bool│
│ + updateProfile(): void│
│ + validate(): bool    │
│ + sendNotification(): void│
└─────────────────────────┘
```

### 2. Vehicle Class
```
┌─────────────────────────┐
│       Vehicle         │
├─────────────────────────┤
│ - id: int             │
│ - customer_id: int    │
│ - vin: string         │
│ - make: string        │
│ - model: string       │
│ - year: int           │
│ - engine_type: string │
│ - mileage: int        │
│ - last_service_date: date│
│ - registration_number: string│
│ - created_at: datetime│
│ - updated_at: datetime│
├─────────────────────────┤
│ + addVehicle(): void  │
│ + updateVehicle(): void│
│ + deleteVehicle(): void│
│ + validate(): bool    │
└─────────────────────────┘
```

### 3. Booking Class
```
┌─────────────────────────┐
│       Booking         │
├─────────────────────────┤
│ - id: int             │
│ - customer_id: int    │
│ - vehicle_id: int     │
│ - service_type: string│
│ - booking_date: date  │
│ - booking_time: time  │
│ - status: string      │
│ - notes: string       │
│ - mechanic_id: int    │
│ - estimated_cost: decimal│
│ - created_at: datetime│
│ - updated_at: datetime│
├─────────────────────────┤
│ + createBooking(): void│
│ + updateBooking(): void│
│ + cancelBooking(): void│
│ + validate(): bool    │
│ + calculateCost(): decimal│
└─────────────────────────┘
```

### 4. JobCard Class
```
┌─────────────────────────┐
│       JobCard         │
├─────────────────────────┤
│ - id: int             │
│ - booking_id: int     │
│ - customer_id: int    │
│ - vehicle_id: int     │
│ - mechanic_id: int    │
│ - status: string      │
│ - labor_cost: decimal │
│ - total_cost: decimal │
│ - notes: string       │
│ - percent_complete: int│
│ - progress_notes: string│
│ - estimated_hours: decimal│
│ - priority: string    │
│ - started_at: datetime│
│ - completed_at: datetime│
│ - created_at: datetime│
│ - updated_at: datetime│
├─────────────────────────┤
│ + assignMechanic(): void│
│ + updateStatus(): void│
│ + addLaborCost(): void│
│ + addPartsCost(): void│
│ + completeJob(): void │
│ + calculateTotal(): decimal│
└─────────────────────────┘
```

### 5. Part Class
```
┌─────────────────────────┐
│        Part           │
├─────────────────────────┤
│ - id: int             │
│ - name: string        │
│ - part_number: string │
│ - price: decimal      │
│ - quantity: int       │
│ - reorder_level: int  │
│ - description: string │
│ - supplier_id: int    │
│ - created_at: datetime│
│ - updated_at: datetime│
├─────────────────────────┤
│ + addPart(): void     │
│ + updateStock(): void │
│ + validate(): bool    │
│ + checkLowStock(): bool│
│ + updatePrice(): void │
└─────────────────────────┘
```

### 6. Invoice Class
```
┌─────────────────────────┐
│       Invoice         │
├─────────────────────────┤
│ - id: int             │
│ - jobcard_id: int     │
│ - customer_id: int    │
│ - parts_total: decimal│
│ - labor_total: decimal│
│ - grand_total: decimal│
│ - status: string      │
│ - payment_method: string│
│ - paid_at: datetime   │
│ - created_at: datetime│
│ - updated_at: datetime│
├─────────────────────────┤
│ + generateInvoice(): void│
│ + updateStatus(): void│
│ + calculateTotal(): decimal│
│ + sendToCustomer(): void│
│ + validate(): bool    │
└─────────────────────────┘
```

### 7. Supplier Class
```
┌─────────────────────────┐
│      Supplier         │
├─────────────────────────┤
│ - id: int             │
│ - name: string        │
│ - contact_person: string│
│ - email: string       │
│ - phone: string       │
│ - address: string     │
│ - created_at: datetime│
│ - updated_at: datetime│
├─────────────────────────┤
│ + addSupplier(): void │
│ + updateSupplier(): void│
│ + validate(): bool    │
│ + getContactInfo(): string│
└─────────────────────────┘
```

### 8. JobCardTask Class
```
┌─────────────────────────┐
│     JobCardTask       │
├─────────────────────────┤
│ - id: int             │
│ - jobcard_id: int     │
│ - task_name: string   │
│ - task_cost: decimal  │
│ - status: string      │
│ - created_at: datetime│
├─────────────────────────┤
│ + addTask(): void     │
│ + updateTask(): void  │
│ + completeTask(): void│
│ + calculateCost(): decimal│
└─────────────────────────┘
```

### 9. JobCardSparePart Class
```
┌─────────────────────────┐
│   JobCardSparePart    │
├─────────────────────────┤
│ - id: int             │
│ - jobcard_id: int     │
│ - part_id: int        │
│ - quantity: int       │
│ - unit_price: decimal │
│ - total_price: decimal│
│ - created_at: datetime│
├─────────────────────────┤
│ + addPartUsage(): void│
│ + calculateTotal(): decimal│
│ + updateInventory(): void│
└─────────────────────────┘
```

### 10. Payment Class
```
┌─────────────────────────┐
│       Payment         │
├─────────────────────────┤
│ - id: int             │
│ - invoice_id: int     │
│ - amount: decimal     │
│ - method: string      │
│ - status: string      │
│ - transaction_id: string│
│ - paid_at: datetime   │
│ - created_at: datetime│
├─────────────────────────┤
│ + processPayment(): void│
│ + validatePayment(): bool│
│ + updateStatus(): void│
│ + refund(): void      │
└─────────────────────────┘
```

## Class Relationships

### Inheritance Relationships:
```
User
 │
 ├─ Customer (role: 'customer')
 ├─ Mechanic (role: 'mechanic') 
 └─ Admin (role: 'admin')
```

### Association Relationships:

1. **User → Vehicle**: One-to-Many
   - A user (customer) can own many vehicles

2. **User → Booking**: One-to-Many  
   - A user (customer) can create many bookings

3. **Vehicle → Booking**: One-to-Many
   - A vehicle can have many bookings

4. **Booking → JobCard**: One-to-One
   - A booking generates one job card

5. **User → JobCard**: One-to-Many
   - A user (mechanic) can be assigned to many job cards

6. **Vehicle → JobCard**: One-to-Many
   - A vehicle can have many job cards

7. **JobCard → Invoice**: One-to-One
   - A job card generates one invoice

8. **Part → JobCardSparePart**: One-to-Many
   - A part can be used in many job cards

9. **JobCard → JobCardTask**: One-to-Many
   - A job card can contain many tasks

10. **JobCard → JobCardSparePart**: One-to-Many
    - A job card can consume many parts

11. **Supplier → Part**: One-to-Many
    - A supplier can supply many parts

12. **Invoice → Payment**: One-to-One
    - An invoice can have one payment

## Key System Interactions

### Booking Process Flow:
```
Customer → Booking → JobCard → Invoice → Payment
```

### Job Card Process Flow:
```
JobCard → JobCardTask (Many) + JobCardSparePart (Many) → Invoice
```

### Inventory Flow:
```
Part → JobCardSparePart → JobCard → Invoice
```

## Class Categories

### Entity Classes (Database Tables):
- User, Vehicle, Booking, JobCard, Part, Invoice, Supplier, JobCardTask, JobCardSparePart, Payment

### Service Classes (Business Logic):
- Not explicitly shown but would include services like BookingService, JobCardService, etc.

### Controller Classes (API Endpoints):
- Would include controllers like BookingController, JobCardController, etc.

This class diagram provides a clear, understandable view of the SVMMS system structure with all major entities and their relationships.