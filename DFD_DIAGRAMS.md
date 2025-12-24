# SVMMS Data Flow Diagrams (DFD)

## DFD Level 0 (Context Diagram)

This diagram shows the system as a single process and its interactions with external entities.

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                 SVMMS SYSTEM                           │
                    │                                                         │
                    │  ┌─────────────────────────────────────────────────┐   │
                    │  │              Main System                        │   │
                    │  │                                                 │   │
                    │  │  ┌───────────────────────────────────────────┐  │   │
                    │  │  │         SVMMS Core System               │  │   │
                    │  │  │                                         │  │   │
                    │  │  │  • User Management                      │  │   │
                    │  │  │  • Vehicle Management                   │  │   │
                    │  │  │  • Booking Management                   │  │   │
                    │  │  │  • Job Card Management                  │  │   │
                    │  │  │  • Parts Inventory                      │  │   │
                    │  │  │  • Invoice & Billing                    │  │   │
                    │  │  │  • Payment Processing                   │  │   │
                    │  │  │  • Analytics & Reporting                │  │   │
                    │  │  │  • Authentication & Authorization       │  │   │
                    │  │  │                                         │  │   │
                    │  │  └───────────────────────────────────────────┘  │   │
                    │  │                                                 │   │
                    │  └─────────────────────────────────────────────────┘   │
                    └─────────────────────────────────────────────────────────┘
                              │              │              │
                              │              │              │
                              ▼              ▼              ▼
                    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
                    │   CUSTOMERS     │ │   MECHANICS     │ │     ADMINS      │
                    │                 │ │                 │ │                 │
                    │ • Book Services │ │ • View Jobs     │ │ • Manage Users  │
                    │ • Track Jobs    │ │ • Update Status │ │ • Manage Parts  │
                    │ • View Invoices │ │ • Add Parts/Labor│ │ • Manage Vehicles│
                    │ • View Profile  │ │ • View Invoices │ │ • View Analytics│
                    │ • Make Payments │ │ • Update Profile│ │ • System Config │
                    └─────────────────┘ └─────────────────┘ └─────────────────┘
                              │              │              │
                              │              │              │
                              ▼              ▼              ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │            EXTERNAL SYSTEMS                           │
                    │                                                         │
                    │  ┌─────────────────┐    ┌─────────────────┐            │
                    │  │ PAYMENT GATEWAY │    │   EMAIL/SMS     │            │
                    │  │                 │    │   SERVICE       │            │
                    │  │ • Process       │    │                 │            │
                    │  │   Payments      │    │ • Notifications │            │
                    │  │ • Refunds       │    │ • Alerts        │            │
                    │  │ • Transaction   │    │ • Reminders     │            │
                    │  │   Records       │    │                 │            │
                    │  └─────────────────┘    └─────────────────┘            │
                    └─────────────────────────────────────────────────────────┘
```

## DFD Level 1 (Detailed System Breakdown)

This diagram breaks down the main system into major processes and shows detailed data flows.

```
                    ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
                    │                                   SVMMS SYSTEM - LEVEL 1                                         │
                    │                                                                                                  │
                    │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
                    │  │   PROCESS 1     │    │   PROCESS 2     │    │   PROCESS 3     │    │   PROCESS 4     │      │
                    │  │ USER MANAGEMENT │    │ VEHICLE MGMT    │    │ BOOKING MGMT    │    │ JOB CARD MGMT   │      │
                    │  │                 │    │                 │    │                 │    │                 │      │
                    │  │ • Register      │    │ • Add Vehicle   │    │ • Create Booking│    │ • Assign Job    │      │
                    │  │ • Login/Logout  │    │ • Update Vehicle│    │ • Approve       │    │ • Update Status │      │
                    │  │ • Update Profile│    │ • View Vehicles │    │ • Schedule      │    │ • Track Progress│      │
                    │  │ • Manage Roles  │    │ • Delete Vehicle│    │ • Cancel        │    │ • Complete Job  │      │
                    │  └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘      │
                    │            │                      │                      │                      │              │
                    │            └──────────────────────┼──────────────────────┼──────────────────────┘              │
                    │                                   │                      │                                     │
                    │            ┌──────────────────────▼──────────────────────▼──────────────────────┐              │
                    │            │                    DATA STORES                                    │              │
                    │            │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐      │              │
                    │            │  │   DATASTORE 1   │ │   DATASTORE 2   │ │   DATASTORE 3   │      │              │
                    │            │  │    USERS DB     │ │   VEHICLES DB   │ │   BOOKINGS DB   │      │              │
                    │            │  │                 │ │                 │ │                 │      │              │
                    │            │  │ • user_id       │ │ • vehicle_id    │ │ • booking_id    │      │              │
                    │            │  │ • name          │ │ • customer_id   │ │ • customer_id   │      │              │
                    │            │  │ • email         │ │ • vin           │ │ • vehicle_id    │      │              │
                    │            │  │ • password      │ │ • make/model    │ │ • service_type  │      │              │
                    │            │  │ • role          │ │ • year          │ │ • booking_date  │      │              │
                    │            │  │ • phone         │ │ • registration  │ │ • booking_time  │      │              │
                    │            │  │ • address       │ │ • mileage       │ │ • status        │      │              │
                    │            │  │ • created_at    │ │ • last_service  │ │ • mechanic_id   │      │              │
                    │            │  └─────────────────┘ └─────────────────┘ └─────────────────┘      │              │
                    │            └─────────────────────────────────────────────────────────────────────┘              │
                    │                                                                                                  │
                    │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐      │
                    │  │   PROCESS 5     │    │   PROCESS 6     │    │   PROCESS 7     │    │   PROCESS 8     │      │
                    │  │ PARTS INVENTORY │    │ INVOICE MGMT    │    │ PAYMENT MGMT    │    │ ANALYTICS       │      │
                    │  │                 │    │                 │    │                 │    │                 │      │
                    │  │ • Add Parts     │    │ • Generate      │    │ • Process       │    │ • Generate      │      │
                    │  │ • Update Stock  │    │   Invoice       │    │   Payment       │    │   Reports       │      │
                    │  │ • Low Stock     │    │ • Update Status │    │ • Record        │    │ • KPI Tracking  │      │
                    │  │   Alerts        │    │ • View Invoice  │    │   Transaction   │    │ • Performance   │      │
                    │  └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘      │
                    │            │                      │                      │                      │              │
                    │            └──────────────────────┼──────────────────────┼──────────────────────┘              │
                    │                                   │                      │                                     │
                    │            ┌──────────────────────▼──────────────────────▼──────────────────────┐              │
                    │            │                    DATA STORES                                    │              │
                    │            │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐      │              │
                    │            │  │   DATASTORE 4   │ │   DATASTORE 5   │ │   DATASTORE 6   │      │              │
                    │            │  │    PARTS DB     │ │   INVOICES DB   │ │  PAYMENTS DB    │      │              │
                    │            │  │                 │ │                 │ │                 │      │              │
                    │            │  │ • part_id       │ │ • invoice_id    │ │ • payment_id    │      │              │
                    │            │  │ • name          │ │ • jobcard_id    │ │ • invoice_id    │      │              │
                    │            │  │ • part_number   │ │ • customer_id   │ │ • amount        │      │              │
                    │            │  │ • price         │ │ • parts_total   │ │ • method        │      │              │
                    │            │  │ • quantity      │ │ • labor_total   │ │ • status        │      │              │
                    │            │  │ • reorder_level │ │ • grand_total   │ │ • transaction_id│      │              │
                    │            │  │ • supplier_id   │ │ • status        │ │ • created_at    │      │              │
                    │            │  └─────────────────┘ └─────────────────┘ └─────────────────┘      │              │
                    │            └─────────────────────────────────────────────────────────────────────┘              │
                    └─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Detailed Process Descriptions

### PROCESS 1: User Management
**Inputs:**
- User registration data
- Login credentials
- Profile update requests
- Role assignment requests

**Outputs:**
- Authentication tokens
- User profiles
- Role-based access permissions
- User management reports

**Data Flows:**
- Customers → Register/Login → Users DB
- Admins → Assign Roles → Users DB
- Users → Update Profile → Users DB

### PROCESS 2: Vehicle Management
**Inputs:**
- Vehicle registration data
- Vehicle update requests
- Vehicle deletion requests

**Outputs:**
- Vehicle records
- Vehicle lists
- Vehicle information

**Data Flows:**
- Customers → Add Vehicle → Vehicles DB
- Admins → Update Vehicle → Vehicles DB
- Users → View Vehicles → Vehicles DB

### PROCESS 3: Booking Management
**Inputs:**
- Booking requests
- Booking approval decisions
- Booking cancellation requests
- Scheduling information

**Outputs:**
- Booking confirmations
- Schedule updates
- Booking status changes

**Data Flows:**
- Customers → Create Booking → Bookings DB
- Admins → Approve Booking → Bookings DB
- Mechanics → Assign to Booking → Bookings DB

### PROCESS 4: Job Card Management
**Inputs:**
- Job card creation requests
- Status updates
- Progress reports
- Completion confirmations

**Outputs:**
- Job card records
- Status updates
- Progress tracking
- Completion certificates

**Data Flows:**
- Admins → Create Job Card → Job Cards DB
- Mechanics → Update Job Status → Job Cards DB
- Systems → Generate Invoice → Invoices DB

### PROCESS 5: Parts Inventory Management
**Inputs:**
- Part addition requests
- Stock level updates
- Reorder alerts
- Part usage data

**Outputs:**
- Inventory reports
- Low stock alerts
- Part availability
- Reorder notifications

**Data Flows:**
- Admins → Add Parts → Parts DB
- Mechanics → Use Parts → Parts DB
- Systems → Check Stock → Parts DB

### PROCESS 6: Invoice Management
**Inputs:**
- Job completion data
- Cost calculations
- Invoice generation requests
- Payment status updates

**Outputs:**
- Invoices
- Payment requests
- Billing statements
- Invoice status updates

**Data Flows:**
- Job Cards → Generate Invoice → Invoices DB
- Customers → Pay Invoice → Payments DB
- Systems → Update Invoice Status → Invoices DB

### PROCESS 7: Payment Management
**Inputs:**
- Payment requests
- Transaction data
- Payment confirmations
- Refund requests

**Outputs:**
- Payment confirmations
- Transaction records
- Payment status updates
- Receipts

**Data Flows:**
- Customers → Process Payment → Payments DB
- Systems → Update Invoice → Invoices DB
- Payment Gateway → Transaction Data → Payments DB

### PROCESS 8: Analytics & Reporting
**Inputs:**
- System data from all processes
- Usage statistics
- Performance metrics
- Business data

**Outputs:**
- Business reports
- KPI dashboards
- Performance analytics
- Usage trends

**Data Flows:**
- All Processes → Collect Data → Analytics DB
- Admins → Request Reports → Analytics System
- Systems → Generate Insights → Reports

## External Entity Interactions

### Customers
- Register and login to the system
- Book services for their vehicles
- Track job progress and status
- View and pay invoices
- Update personal profiles

### Mechanics
- Login and access assigned jobs
- Update job card status and progress
- Record parts usage and labor costs
- Complete jobs and generate invoices
- Update personal profiles

### Admins
- Manage user accounts and roles
- Manage vehicle and parts inventory
- Approve bookings and assign mechanics
- Generate business reports and analytics
- Configure system settings

### External Systems
- **Payment Gateway**: Processes payments and refunds
- **Email/SMS Service**: Sends notifications, alerts, and reminders
- **Banking Systems**: Handles transaction processing

## Data Store Relationships

```
USERS DB ↔ VEHICLES DB (customer_id → user_id)
VEHICLES DB ↔ BOOKINGS DB (vehicle_id → vehicle_id)
BOOKINGS DB ↔ JOBCARDS DB (booking_id → booking_id)
JOBCARDS DB ↔ INVOICES DB (jobcard_id → jobcard_id)
PARTS DB ↔ JOBCARD_SPAREPARTS (part_id → part_id)
INVOICES DB ↔ PAYMENTS DB (invoice_id → invoice_id)
USERS DB ↔ JOBCARDS DB (mechanic_id → user_id)
USERS DB ↔ BOOKINGS DB (customer_id → user_id)
```

This DFD structure provides a clear understanding of how data flows through the SVMMS system, showing the interactions between different processes, data stores, and external entities while maintaining a well-organized module-based approach.