# SVMMS Use Case Diagram

## System Overview
The Service Vehicle Management and Monitoring System (SVMMS) is a role-based system that connects customers, mechanics, and administrators to streamline vehicle service operations.

## Primary Actors
- **Customer**: Vehicle owner who books services
- **Mechanic**: Service provider who performs vehicle maintenance
- **Admin**: System administrator who manages the platform

## Use Case Diagram Layout

```
                    ┌─────────────────────────────────────────────────────────────────┐
                    │                        SVMMS SYSTEM                           │
                    │                                                                 │
                    │  ┌─────────────────────────────────────────────────────────┐    │
                    │  │                   SYSTEM BOUNDARY                     │    │
                    │  │                                                     │    │
                    │  │  ┌─────────────────┐      ┌──────────────────────┐   │    │
                    │  │  │   BOOKING       │      │    INVENTORY         │   │    │
                    │  │  │   MANAGEMENT    │      │    MANAGEMENT        │   │    │
                    │  │  │                 │      │                      │   │    │
                    │  │  │ • Book Service  │      │ • Add Parts         │   │    │
                    │  │  │ • View Status   │      │ • Update Stock      │   │    │
                    │  │  │ • Cancel Booking│      │ • View Inventory    │   │    │
                    │  │  │ • Reschedule    │      │ • Low Stock Alerts  │   │    │
                    │  │  └─────────┬───────┘      └──────────┬───────────┘   │    │
                    │  │            │                       │               │    │
                    │  │  ┌─────────▼────────┐   ┌──────────▼──────────┐   │    │
                    │  │  │   JOB CARD       │   │    INVOICE &        │   │    │
                    │  │  │   MANAGEMENT     │   │    PAYMENT          │   │    │
                    │  │  │                  │   │    MANAGEMENT       │   │    │
                    │  │  │ • Create Job     │   │                     │   │    │
                    │  │  │ • Update Status  │   │ • Generate Invoice  │   │    │
                    │  │  │ • Track Progress │   │ • Process Payment   │   │    │
                    │  │  │ • Complete Job   │   │ • View Transactions │   │    │
                    │  │  └─────────┬────────┘   └──────────┬──────────┘   │    │
                    │  │            │                       │              │    │
                    │  │  ┌─────────▼────────┐   ┌──────────▼──────────┐   │    │
                    │  │  │  USER & VEHICLE  │   │   ANALYTICS &       │   │    │
                    │  │  │   MANAGEMENT     │   │    REPORTING        │   │    │
                    │  │  │                  │   │                     │   │    │
                    │  │  │ • Manage Profile │   │ • View Reports      │   │    │
                    │  │  │ • Add Vehicle    │   │ • Revenue Analysis  │   │    │
                    │  │  │ • Update Vehicle │   │ • Performance Stats │   │    │
                    │  │  │ • Remove Vehicle │   │ • Usage Trends      │   │    │
                    │  │  └──────────────────┘   └─────────────────────┘   │    │
                    │  │                                                     │    │
                    │  └─────────────────────────────────────────────────────────┘    │
                    └─────────────────────────────────────────────────────────────────┘
```

## Use Cases by Actor

### Customer Use Cases
```
    ┌─────────────┐
    │  CUSTOMER   │
    └──────┬──────┘
           │
    ┌──────▼──────┐    ┌─────────────────────────────────────────────────────────────┐
    │             │    │                                                             │
    │   Uses      │────│  1. Book Service                                          │
    │             │    │     - Select vehicle                                       │
    │             │    │     - Choose service type                                  │
    │             │    │     - Set preferred date/time                              │
    │             │    │     - Add service description                              │
    │             │    │     - Confirm booking                                      │
    │             │    │                                                             │
    │             │    │  2. View Bookings                                         │
    │             │    │     - See booking status                                   │
    │             │    │     - Track service progress                               │
    │             │    │     - View scheduled appointments                          │
    │             │    │                                                             │
    │             │    │  3. Manage Profile                                        │
    │             │    │     - Update personal information                          │
    │             │    │     - Change password                                      │
    │             │    │     - Update contact details                               │
    │             │    │                                                             │
    │             │    │  4. Manage Vehicles                                       │
    │             │    │     - Add new vehicles                                     │
    │             │    │     - Update vehicle information                           │
    │             │    │     - Remove vehicles                                      │
    │             │    │                                                             │
    │             │    │  5. View Invoices                                         │
    │             │    │     - View completed service invoices                      │
    │             │    │     - Check billing details                                │
    │             │    │     - Download invoices                                    │
    │             │    │                                                             │
    │             │    │  6. Make Payments                                         │
    │             │    │     - Pay for services                                     │
    │             │    │     - View payment history                                 │
    │             │    │     - Process refunds if applicable                        │
    │             │    │                                                             │
    │             │    │  7. Receive Notifications                                 │
    │             │    │     - Service reminders                                    │
    │             │    │     - Booking confirmations                                │
    │             │    │     - Invoice notifications                                │
    └─────────────┘    └─────────────────────────────────────────────────────────────┘
```

### Mechanic Use Cases
```
    ┌─────────────┐
    │  MECHANIC   │
    └──────┬──────┘
           │
    ┌──────▼──────┐    ┌─────────────────────────────────────────────────────────────┐
    │             │    │                                                             │
    │   Uses      │────│  1. View Assigned Jobs                                    │
    │             │    │     - See job cards assigned to me                         │
    │             │    │     - Check job priorities                                 │
    │             │    │     - View job details                                     │
    │             │    │                                                             │
    │             │    │  2. Update Job Status                                     │
    │             │    │     - Mark job as in progress                              │
    │             │    │     - Update job completion percentage                     │
    │             │    │     - Mark job as completed                                │
    │             │    │                                                             │
    │             │    │  3. Add Labor Costs                                       │
    │             │    │     - Record tasks performed                               │
    │             │    │     - Add labor charges                                    │
    │             │    │     - Update job progress                                  │
    │             │    │                                                             │
    │             │    │  4. Add Parts Costs                                       │
    │             │    │     - Select parts used                                    │
    │             │    │     - Record quantities used                               │
    │             │    │     - Update parts inventory                               │
    │             │    │                                                             │
    │             │    │  5. Complete Jobs                                         │
    │             │    │     - Finalize job card                                    │
    │             │    │     - Calculate total costs                                │
    │             │    │     - Generate completion report                           │
    │             │    │                                                             │
    │             │    │  6. View Invoices                                         │
    │             │    │     - Check invoices for completed jobs                    │
    │             │    │     - View payment status                                  │
    │             │    │     - Track earnings                                       │
    │             │    │                                                             │
    │             │    │  7. Manage Profile                                        │
    │             │    │     - Update personal information                          │
    │             │    │     - Change password                                      │
    │             │    │     - Set availability                                     │
    └─────────────┘    └─────────────────────────────────────────────────────────────┘
```

### Admin Use Cases
```
    ┌─────────────┐
    │    ADMIN    │
    └──────┬──────┘
           │
    ┌──────▼──────┐    ┌─────────────────────────────────────────────────────────────┐
    │             │    │                                                             │
    │   Uses      │────│  1. Manage Users                                          │
    │             │    │     - Create user accounts                                 │
    │             │    │     - Update user roles                                    │
    │             │    │     - Deactivate/reactivate accounts                       │
    │             │    │     - Reset user passwords                                 │
    │             │    │                                                             │
    │             │    │  2. Approve Bookings                                      │
    │             │    │     - Review pending bookings                              │
    │             │    │     - Approve or reject bookings                           │
    │             │    │     - Assign mechanics to bookings                         │
    │             │    │                                                             │
    │             │    │  3. Manage Inventory                                      │
    │             │    │     - Add new parts to inventory                           │
    │             │    │     - Update part prices and quantities                    │
    │             │    │     - View low stock alerts                                │
    │             │    │     - Manage suppliers                                     │
    │             │    │                                                             │
    │             │    │  4. Generate Reports                                      │
    │             │    │     - Revenue reports                                      │
    │             │    │     - Performance analytics                                │
    │             │    │     - Usage statistics                                     │
    │             │    │     - Business insights                                    │
    │             │    │                                                             │
    │             │    │  5. Manage Vehicles                                       │
    │             │    │     - View all registered vehicles                         │
    │             │    │     - Update vehicle information                           │
    │             │    │     - Remove vehicles if needed                            │
    │             │    │                                                             │
    │             │    │  6. Manage Bookings                                       │
    │             │    │     - View all bookings                                    │
    │             │    │     - Update booking status                                │
    │             │    │     - Cancel bookings if necessary                         │
    │             │    │                                                             │
    │             │    │  7. Manage Invoices                                       │
    │             │    │     - View all invoices                                    │
    │             │    │     - Update invoice status                                │
    │             │    │     - Process payments                                     │
    │             │    │     - Generate billing reports                             │
    │             │    │                                                             │
    │             │    │  8. System Configuration                                  │
    │             │    │     - Configure system settings                            │
    │             │    │     - Manage user permissions                              │
    │             │    │     - Update business rules                                │
    └─────────────┘    └─────────────────────────────────────────────────────────────┘
```

## Cross-Actor Interactions

```
┌─────────────┐          ┌─────────────────┐          ┌─────────────┐
│  CUSTOMER   │          │   SVMMS SYSTEM  │          │  MECHANIC   │
└──────┬──────┘          └─────────┬───────┘          └──────┬──────┘
       │                           │                          │
       │ BOOKS SERVICE             │                          │
       │───────────────────────────┼─────────────────────────►│
       │                           │                          │
       │                           │ ASSIGNS MECHANIC         │
       │◄──────────────────────────┼──────────────────────────│
       │ NOTIFIED                  │                          │
       │                           │                          │
       │                           │ UPDATES JOB STATUS       │
       │◄──────────────────────────┼──────────────────────────│
       │ TRACKS PROGRESS           │                          │
       │                           │                          │
       │                           │ COMPLETES JOB            │
       │◄──────────────────────────┼──────────────────────────│
       │ RECEIVES INVOICE          │                          │
       │                           │                          │
       │ MAKES PAYMENT             │                          │
       │───────────────────────────┼─────────────────────────►│
       │                           │ PROCESSES PAYMENT        │
       │                           │                          │
       │◄──────────────────────────┼──────────────────────────│
       │ PAYMENT CONFIRMATION      │                          │
```

## System Use Cases (System-Initiated)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM USE CASES                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ • Send Notifications: Automatically sends reminders and updates to users        │
│ • Generate Invoices: Creates invoices when jobs are completed                   │
│ • Update Inventory: Automatically updates parts inventory when used in jobs     │
│ • Send Alerts: Notifies admins of low stock levels                            │
│ • Backup Data: Regular system backups for data safety                         │
│ • Process Payments: Handles payment transactions with gateways                  │
│ • Generate Reports: Creates periodic business reports for admins                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Key Relationships

- **Include Relationship**: "Complete Job" includes "Generate Invoice" and "Update Inventory"
- **Extend Relationship**: "Make Payment" extends "View Invoice" when customer decides to pay
- **Generalization**: All actors can "View Profile" and "Change Password"

This use case diagram provides a clear, non-complex view of the SVMMS system, showing what each actor can do within the system and how they interact with various system functions.