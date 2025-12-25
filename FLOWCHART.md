# SVMMS Detailed Module Flow Charts

## 1. User Authentication Module Flow

```
Start
  │
  ▼
User Accesses System
  │
  ▼
Check if User is Registered
  │
  ├─ Yes → Login Page
  │          │
  │          ▼
  │    Enter Credentials (Email/Password)
  │          │
  │          ▼
  │    Validate Credentials
  │          │
  │    ├─ Valid → Generate JWT Token
  │    │           │
  │    │           ▼
  │    │    Set Session & Redirect to Dashboard
  │    │           │
  │    │           ▼
  │    │    End Session (Logout)
  │    │           │
  │    │           ▼
  │    │    Clear Token & Redirect to Login
  │    │
  │    └─ Invalid → Show Error Message
  │                  │
  │                  ▼
  │                  Retry Login
  │
  └─ No → Registration Page
           │
           ▼
     Enter Registration Details
           │
           ▼
     Validate Input Data
           │
           ▼
     Check Email Availability
           │
           ├─ Available → Hash Password & Create User
           │              │
           │              ▼
           │        Send Verification Email
           │              │
           │              ▼
           │        Redirect to Login
           │
           └─ Not Available → Show Error Message
                            │
                            ▼
                            Retry Registration
```

## 2. Vehicle Management Module Flow

```
Start
  │
  ▼
User Accesses Vehicle Management
  │
  ├─ Admin → View All Vehicles
  │          │
  │          ▼
  │    Filter/Sort Vehicles
  │          │
  │          ▼
  │    Perform Vehicle Operations (Add/Edit/Delete)
  │
  ├─ Customer → View Own Vehicles
  │            │
  │            ▼
  │      View Vehicle List
  │            │
  │            ├─ Add New Vehicle
  │            │   │
  │            │   ▼
  │            │  Enter Vehicle Details
  │            │   │
  │            │   ▼
  │            │  Validate Input
  │            │   │
  │            │   ├─ Valid → Save Vehicle to DB
  │            │   │           │
  │            │   │           ▼
  │            │   │      Show Success Message
  │            │   │
  │            │   └─ Invalid → Show Error Message
  │            │
  │            ├─ Edit Vehicle
  │            │   │
  │            │   ▼
  │            │  Select Vehicle to Edit
  │            │   │
  │            │   ▼
  │            │  Update Vehicle Details
  │            │   │
  │            │   ▼
  │            │  Save Changes
  │            │
  │            └─ Delete Vehicle
  │                │
  │                ▼
  │              Confirm Deletion
  │                │
  │                ▼
  │              Remove from DB
  │
  └─ Mechanic → Access Restricted
```

## 3. Service Booking Module Flow

```
Start
  │
  ▼
Customer Accesses Booking Page
  │
  ▼
Check if Customer has Vehicles
  │
  ├─ Yes → Show Vehicle Selection
  │          │
  │          ▼
  │    Select Vehicle for Service
  │          │
  │          ▼
  │    Select Service Type
  │          │
  │          ▼
  │    Enter Preferred Date/Time
  │          │
  │          ▼
  │    Add Service Description
  │          │
  │          ▼
  │    Review Booking Details
  │          │
  │          ▼
  │    Confirm Booking
  │          │
  │          ▼
  │    Validate Booking Data
  │          │
  │          ├─ Valid → Create Booking Record
  │          │           │
  │          │           ▼
  │          │         Set Status: 'Pending'
  │          │           │
  │          │           ▼
  │          │         Send Notification to Admin
  │          │           │
  │          │           ▼
  │          │         Show Booking Confirmation
  │          │
  │          └─ Invalid → Show Error Messages
  │
  └─ No → Show "Add Vehicle First" Message
```

## 4. Booking Approval & Assignment Flow

```
Start
  │
  ▼
Admin Views Pending Bookings
  │
  ▼
Filter Bookings by Status
  │
  ▼
Select Booking to Process
  │
  ▼
Review Booking Details
  │
  ▼
Approve Booking
  │
  ▼
Assign to Available Mechanic
  │
  ├─ Mechanic Available → Assign Booking
  │                     │
  │                     ▼
  │                   Update Booking Status: 'Approved'
  │                     │
  │                     ▼
  │                   Notify Mechanic
  │                     │
  │                     ▼
  │                   Create Job Card from Booking
  │                     │
  │                     ▼
  │                   Set Job Card Status: 'Assigned'
  │                     │
  │                     ▼
  │                   Notify Customer
  │
  └─ No Available → Show Error Message
                 │
                 ▼
                 Retry Assignment
```

## 5. Job Card Management Flow

```
Start
  │
  ▼
Mechanic Accesses Assigned Jobs
  │
  ▼
View Job Card List
  │
  ├─ Start Job → Update Status: 'In Progress'
  │             │
  │             ▼
  │           Record Start Time
  │             │
  │             ▼
  │           Begin Service Work
  │
  ├─ Add Labor Costs → Enter Task Details
  │                  │
  │                  ▼
  │                Validate Task Data
  │                  │
  │                  ├─ Valid → Add Task to Job Card
  │                  │           │
  │                  │           ▼
  │                  │         Update Labor Cost
  │                  │           │
  │                  │           ▼
  │                  │         Save Task Record
  │                  │
  │                  └─ Invalid → Show Error Message
  │
  ├─ Add Parts Costs → Select Parts from Inventory
  │                  │
  │                  ▼
  │                Validate Quantity Available
  │                  │
  │                  ├─ Available → Deduct from Stock
  │                  │              │
  │                  │              ▼
  │                  │            Add to Job Card
  │                  │              │
  │                  │              ▼
  │                  │            Update Parts Cost
  │                  │
  │                  └─ Not Available → Show Low Stock Alert
  │
  └─ Complete Job → Verify All Tasks Completed
                   │
                   ▼
                 Update Status: 'Completed'
                   │
                   ▼
                 Calculate Total Cost
                   │
                   ▼
                 Update Job Card
                   │
                   ▼
                 Generate Invoice
                   │
                   ▼
                 Notify Customer
```

## 6. Parts Inventory Management Flow

```
Start
  │
  ▼
Admin Accesses Parts Management
  │
  ├─ Add New Parts → Enter Part Details
  │                │
  │                ▼
  │              Validate Input Data
  │                │
  │                ├─ Valid → Save Part to DB
  │                │           │
  │                │           ▼
  │                │         Update Inventory Count
  │                │           │
  │                │           ▼
  │                │         Show Success Message
  │                │
  │                └─ Invalid → Show Error Message
  │
  ├─ Update Parts → Select Part to Update
  │               │
  │               ▼
  │             Modify Part Details
  │               │
  │               ▼
  │             Save Changes
  │
  ├─ View Inventory → Display Parts List
  │                 │
  │                 ▼
  │               Filter by Criteria
  │                 │
  │                 ▼
  │               Check Stock Levels
  │                 │
  │                 ├─ Low Stock → Show Alert
  │                 │
  │                 └─ Normal Stock → Continue
  │
  └─ Remove Parts → Select Part to Remove
                   │
                   ▼
                 Confirm Removal
                   │
                   ▼
                 Update Stock to Zero
                   │
                   ▼
                 Mark as Inactive
```

## 7. Invoice Generation & Billing Flow

```
Start
  │
  ▼
System Detects Completed Job Card
  │
  ▼
Verify Job Card Status: 'Completed'
  │
  ▼
Calculate Total Costs (Labor + Parts)
  │
  ▼
Create Invoice Record
  │
  ├─ Parts Total → Sum of All Parts Used
  │               │
  │               ▼
  │             Apply Part Prices
  │
  ├─ Labor Total → Sum of All Tasks
  │               │
  │               ▼
  │             Apply Labor Rates
  │
  └─ Grand Total → Parts Total + Labor Total
                  │
                  ▼
                Set Invoice Status: 'Unpaid'
                  │
                  ▼
                Link to Customer Account
                  │
                  ▼
                Generate Invoice Number
                  │
                  ▼
                Send Invoice to Customer
                  │
                  ▼
                Store Invoice in Database
```

## 8. Payment Processing Flow

```
Start
  │
  ▼
Customer Accesses Invoice/Payment Page
  │
  ▼
View Outstanding Invoices
  │
  ▼
Select Invoice for Payment
  │
  ▼
Choose Payment Method
  │
  ├─ Online Payment → Redirect to Payment Gateway
  │                 │
  │                 ▼
  │               Process Payment
  │                 │
  │                 ▼
  │               Verify Payment Success
  │                 │
  │                 ├─ Success → Update Invoice Status: 'Paid'
  │                 │           │
  │                 │           ▼
  │                 │         Record Payment Transaction
  │                 │           │
  │                 │           ▼
  │                 │         Send Payment Confirmation
  │                 │
  │                 └─ Failed → Show Payment Error
  │
  └─ Offline Payment → Mark as Pending Verification
                      │
                      ▼
                    Update Invoice Status: 'Pending Payment'
                      │
                      ▼
                    Notify Admin for Verification
```

## 9. Analytics & Reporting Flow

```
Start
  │
  ▼
Admin Accesses Analytics Dashboard
  │
  ▼
Select Report Type
  │
  ├─ Revenue Report → Query Invoices DB
  │                 │
  │                 ▼
  │               Filter by Date Range
  │                 │
  │                 ▼
  │               Calculate Total Revenue
  │                 │
  │                 ▼
  │               Generate Revenue Chart
  │
  ├─ Job Completion → Query Job Cards DB
  │                 │
  │                 ▼
  │               Filter by Status & Date
  │                 │
  │                 ▼
  │               Calculate Completion Rate
  │                 │
  │                 ▼
  │               Generate Completion Chart
  │
  ├─ Parts Usage → Query Job Card Parts DB
  │              │
  │              ▼
  │            Filter by Date Range
  │              │
  │              ▼
  │            Calculate Parts Consumption
  │              │
  │              ▼
  │            Generate Usage Report
  │
  └─ Customer Activity → Query Bookings & Users DB
                       │
                       ▼
                     Filter by Date Range
                       │
                       ▼
                     Calculate Customer Metrics
                       │
                       ▼
                     Generate Activity Report
```

## 10. System Workflow Integration

```
Start
  │
  ▼
User Logs into System
  │
  ├─ Customer → Customer Dashboard
  │            │
  │            ▼
  │          Book Service → Vehicle Management → Track Jobs → Pay Invoices
  │
  ├─ Mechanic → Mechanic Dashboard
  │            │
  │            ▼
  │          View Assigned Jobs → Update Job Status → Add Costs → Complete Jobs
  │
  └─ Admin → Admin Dashboard
              │
              ▼
            Manage Users → Manage Vehicles → Approve Bookings → Generate Reports
              │
              ▼
            All Data Flows to Analytics System
```

These flow charts provide a comprehensive view of how each module in the SVMMS system works, showing the decision points, processes, and data flows for each major component of the system.