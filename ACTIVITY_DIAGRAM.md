# SVMMS Activity Diagrams

## Overview
This document shows the workflow activities for key business processes in the SVMMS system using clear activity diagrams.

## 1. Customer Service Booking Activity

```
Start
  │
  ▼
Customer logs in
  │
  ▼
Check if customer has vehicles
  │
  ├─ No → "Add Vehicle First" message
  │         │
  │         ▼
  │    Customer adds vehicle
  │         │
  │         ▼
  │    Go to vehicle selection
  │
  └─ Yes → Select vehicle for service
            │
            ▼
          Choose service type
            │
            ▼
          Select preferred date/time
            │
            ▼
          Add service description
            │
            ▼
          Review booking details
            │
            ▼
          Confirm booking
            │
            ▼
          System validates booking
            │
            ▼
          Booking created successfully
            │
            ▼
          Send confirmation to customer
            │
            ▼
          End
```

## 2. Admin Booking Approval Activity

```
Start
  │
  ▼
Admin logs in
  │
  ▼
Navigate to booking management
  │
  ▼
View pending bookings
  │
  ▼
Select booking to process
  │
  ▼
Review booking details
  │
  ▼
Approve booking
  │
  ▼
Check available mechanics
  │
  ├─ No mechanics available → Show error message
  │                            │
  │                            ▼
  │                          End
  │
  └─ Mechanics available → Assign to mechanic
                           │
                           ▼
                         Update booking status to 'Approved'
                           │
                           ▼
                         Notify assigned mechanic
                           │
                           ▼
                         Create job card from booking
                           │
                           ▼
                         Notify customer of approval
                           │
                           ▼
                         End
```

## 3. Mechanic Job Card Processing Activity

```
Start
  │
  ▼
Mechanic logs in
  │
  ▼
View assigned jobs
  │
  ▼
Select job to work on
  │
  ▼
Check job details
  │
  ▼
Start job
  │
  ▼
Update job status to 'In Progress'
  │
  ▼
Perform service work
  │
  ▼
Add labor costs
  │
  ▼
Record tasks performed
  │
  ▼
Add parts used
  │
  ▼
Update inventory (decrease parts)
  │
  ▼
Continue working until job complete
  │
  ▼
Mark job as completed
  │
  ▼
Calculate total cost
  │
  ▼
Update job card with final details
  │
  ▼
Generate invoice
  │
  ▼
Notify customer of completion
  │
  ▼
End
```

## 4. Invoice Generation Activity

```
Start
  │
  ▼
System detects completed job
  │
  ▼
Verify job status is 'Completed'
  │
  ├─ No → End
  │
  └─ Yes → Calculate labor costs
            │
            ▼
          Calculate parts costs
            │
            ▼
          Calculate total cost
            │
            ▼
          Create invoice record
            │
            ▼
          Link invoice to customer
            │
            ▼
          Set invoice status to 'Unpaid'
            │
            ▼
          Generate invoice number
            │
            ▼
          Send invoice to customer
            │
            ▼
          Store invoice in database
            │
            ▼
          End
```

## 5. Customer Payment Processing Activity

```
Start
  │
  ▼
Customer logs in
  │
  ▼
Navigate to invoices page
  │
  ▼
View outstanding invoices
  │
  ▼
Select invoice to pay
  │
  ▼
Choose payment method
  │
  ├─ Online Payment → Process through payment gateway
  │                   │
  │                   ▼
  │                 Enter payment details
  │                   │
  │                   ▼
  │                 Submit payment
  │                   │
  │                   ▼
  │                 Verify payment success
  │                   │
  │                   ├─ Success → Update invoice status to 'Paid'
  │                   │           │
  │                   │           ▼
  │                   │         Record payment transaction
  │                   │           │
  │                   │           ▼
  │                   │         Send payment confirmation
  │                   │           │
  │                   │           ▼
  │                   │         End
  │                   │
  │                   └─ Failed → Show payment error
  │                              │
  │                              ▼
  │                            End
  │
  └─ Offline Payment → Mark as pending verification
                       │
                       ▼
                     Notify admin for verification
                       │
                       ▼
                     End
```

## 6. Parts Inventory Management Activity

```
Start
  │
  ▼
Admin logs in
  │
  ▼
Navigate to parts management
  │
  ▼
View parts inventory
  │
  ▼
Select inventory action
  │
  ├─ Add New Part → Enter part details
  │                │
  │                ▼
  │              Validate input data
  │                │
  │                ├─ Valid → Save part to database
  │                │         │
  │                │         ▼
  │                │       Update inventory count
  │                │         │
  │                │         ▼
  │                │       Show success message
  │                │         │
  │                │         ▼
  │                │       End
  │                │
  │                └─ Invalid → Show error message
  │                           │
  │                           ▼
  │                         End
  │
  ├─ Update Stock → Select part to update
  │                │
  │                ▼
  │              Enter new quantity
  │                │
  │                ▼
  │              Update database
  │                │
  │                ▼
  │              Show success message
  │                │
  │                ▼
  │              End
  │
  └─ Check Low Stock → Check all parts quantities
                       │
                       ▼
                     Identify parts below reorder level
                       │
                       ▼
                     Generate low stock alerts
                       │
                       ▼
                     Show alerts to admin
                       │
                       ▼
                     End
```

## 7. User Authentication Activity

```
Start
  │
  ▼
User accesses system
  │
  ▼
Navigate to login page
  │
  ▼
Enter email and password
  │
  ▼
Submit login credentials
  │
  ▼
System validates credentials
  │
  ├─ Invalid → Show error message
  │           │
  │           ▼
  │         Allow retry login
  │           │
  │           ▼
  │         End
  │
  └─ Valid → Verify user role
            │
            ├─ Customer → Grant customer access
            │             │
            │             ▼
            │           Redirect to customer dashboard
            │             │
            │             ▼
            │           End
            │
            ├─ Mechanic → Grant mechanic access
            │             │
            │             ▼
            │           Redirect to mechanic dashboard
            │             │
            │             ▼
            │           End
            │
            └─ Admin → Grant admin access
                        │
                        ▼
                      Redirect to admin dashboard
                        │
                        ▼
                      End
```

## 8. Admin Dashboard Analytics Activity

```
Start
  │
  ▼
Admin logs in
  │
  ▼
Navigate to dashboard
  │
  ▼
Select report type
  │
  ├─ Revenue Report → Query invoice data
  │                 │
  │                 ▼
  │               Calculate total revenue
  │                 │
  │                 ▼
  │               Generate revenue chart
  │                 │
  │                 ▼
  │               Display to admin
  │                 │
  │                 ▼
  │                 End
  │
  ├─ Job Completion Report → Query job card data
  │                         │
  │                         ▼
  │                       Calculate completion rate
  │                         │
  │                         ▼
  │                       Generate completion chart
  │                         │
  │                         ▼
  │                       Display to admin
  │                         │
  │                         ▼
  │                         End
  │
  └─ Parts Usage Report → Query parts usage data
                          │
                          ▼
                        Calculate usage statistics
                          │
                          ▼
                        Generate usage chart
                          │
                          ▼
                        Display to admin
                          │
                          ▼
                          End
```

## Key Activity Flows Summary

### Customer Activities:
- Service booking flow
- Payment processing
- Invoice viewing

### Mechanic Activities:
- Job card processing
- Cost tracking
- Job completion

### Admin Activities:
- Booking approval
- User management
- Inventory management
- Analytics reporting

These activity diagrams provide a clear, non-complex view of the workflow activities for each major business process in the SVMMS system.