```
graph TD

    %% =========================
    %% User Authentication Flow
    %% =========================
    subgraph "User Authentication Flow"
        A[Start: User visits Web Application] --> B{Is user logged in?}
        B -- No --> C[Show Login / Register Page]
        C -- Login --> D[POST /api/auth/login]
        C -- Register --> E[POST /api/auth/register]
        D -- Valid Credentials --> F[Backend Generates JWT Token]
        E -- Valid Data --> F
        F --> G[Store Token in Browser]
        G --> H[Redirect Based on User Role]
        B -- Yes --> H
    end

    %% =========================
    %% Role-Based Routing
    %% =========================
    subgraph "Role-Based Application Flow"
        H -- Customer --> CD[Customer Dashboard]
        H -- Mechanic --> MD[Mechanic Dashboard]
        H -- Admin --> AD[Admin Dashboard]
    end

    %% =========================
    %% Customer Journey
    %% =========================
    subgraph "Customer Journey"
        direction LR
        CD --> CV[Manage Vehicles]
        CD --> CB[Book Service]
        CD --> CMB[View My Bookings]
        CD --> CI[View Invoices]

        CV --> VehicleAPI[/api/vehicles]
        CB --> BookingAPI[/api/bookings]
        CMB --> BookingAPI
        CI --> InvoiceAPI[/api/invoices]
    end

    %% =========================
    %% Mechanic Journey
    %% =========================
    subgraph "Mechanic Journey"
        direction LR
        MD --> MAB[View Assigned Bookings]
        MAB --> MJC[Manage Job Card]
        MJC --> PartsAPI[/api/parts]
        MJC --> JobcardAPI[/api/jobcards]
        MJC --> IG[Generate Invoice]
    end

    %% =========================
    %% Admin Journey
    %% =========================
    subgraph "Admin Journey"
        direction LR
        AD --> UM[User Management]
        AD --> BM[Booking Management]
        AD --> PM[Parts Management]
        AD --> VM[Vehicle Management]
        AD --> AN[Analytics Dashboard]

        UM --> UserAPI[/api/users]
        BM --> BookingAPI
        PM --> PartsAPI
        VM --> VehicleAPI
        AN --> AnalyticsAPI[/api/analytics]
    end

    %% =========================
    %% Backend & Database
    %% =========================
    subgraph "Backend Services & Database"
        VehicleAPI --> DB[(Database)]
        BookingAPI --> DB
        InvoiceAPI --> DB
        JobcardAPI --> DB
        PartsAPI --> DB
        UserAPI --> DB
        AnalyticsAPI --> DB
        IG --> DB
    end

    %% =========================
    %% Styling
    %% =========================
    classDef api fill:#dbeafe,stroke:#1e40af,stroke-width:2px
    class VehicleAPI,BookingAPI,InvoiceAPI,JobcardAPI,PartsAPI,UserAPI,AnalyticsAPI api
```

### Flowchart Explanation:

1.  **Authentication**: A user first visits the application and is prompted to log in or register. The backend authenticates them and returns a JSON Web Token (JWT) specific to their user role.
2.  **Role-Based Routing**: The frontend stores this token and redirects the user to the appropriate dashboard: Customer, Mechanic, or Admin.
3.  **Customer Journey**: Customers can manage their personal vehicles, book new services, and view their past bookings and invoices. Each action communicates with the respective backend API endpoints.
4.  **Mechanic Journey**: Mechanics see bookings assigned to them. They can manage the job card for a booking, add parts used during the service, and update the job status. Completing a job card can trigger the invoice generation process.
5.  **Admin Journey**: Admins have full oversight. They can manage all users, bookings, vehicle records, and the parts inventory. They also have access to an analytics dashboard to view overall system metrics.
6.  **Backend & Database**: All frontend actions trigger API calls to the backend, which contains the business logic. The backend services then interact with the database to create, read, update, or delete records.
