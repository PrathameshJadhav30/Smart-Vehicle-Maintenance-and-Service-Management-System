# Smart Vehicle Maintenance and Service Management System (SVMMS)

A complete full-stack application for managing vehicle maintenance and service operations with role-based access control.

## 🚀 Tech Stack

### Frontend
- **React.js** with Vite
- **React Router** for navigation
- **Axios** for API calls
- **Tailwind CSS** for styling
- **Context API** for state management

### Backend
- **Node.js** + **Express.js**
- **PostgreSQL** database
- **JWT** authentication
- **bcrypt** for password hashing
- **express-validator** for validation

## 📋 Features

### 🔐 Authentication & Authorization
- Role-based login system (Customer, Mechanic, Admin)
- JWT token-based authentication
- Protected routes per role
- Secure password hashing

### 👤 Customer Features
- View and manage vehicles
- Book service appointments
- View booking history and status
- Access invoices and payment information

### 🔧 Mechanic Features
- View pending service bookings
- Approve/reject bookings
- Manage job cards
- Track ongoing and completed jobs
- Update job status

### ⚙️ Admin Features
- Analytics dashboard with revenue insights
- View all users, vehicles, and bookings
- Parts inventory management
- Top parts usage analytics
- Low stock alerts
- System-wide metrics

### 📦 Core Modules
1. **User Management** - Registration, login, profile management
2. **Vehicle Management** - Add, edit, delete vehicles
3. **Service Booking** - Create and manage bookings
4. **Job Card Management** - Track service work with tasks and parts
5. **Inventory** - Spare parts with auto-decrement and reorder alerts
6. **Invoicing** - Auto-generated invoices with breakdowns
7. **Analytics** - Revenue, parts usage, and vehicle analytics

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```
   
   Update `.env` with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=svmms_dev
   DB_USER=your_postgres_user
   DB_PASSWORD=your_postgres_password
   JWT_SECRET=your_secret_key_here
   ```

4. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE svmms_dev;
   ```

5. **Run migrations:**
   ```bash
   npm run migrate
   ```

6. **Seed the database (optional):**
   ```bash
   npm run seed
   ```
   
   This creates test accounts:
   - **Admin:** admin@svmms.com / admin123
   - **Mechanic:** mechanic@svmms.com / mechanic123
   - **Customer:** customer@svmms.com / customer123

7. **Start the backend server:**
   ```bash
   npm run dev
   ```
   
   Backend will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```
   
   The file should contain:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   
   Frontend will run on `http://localhost:5173`

## 🎯 Usage

1. **Access the application:**
   - Open browser and navigate to `http://localhost:5173`

2. **Login with demo accounts:**
   - **Customer Dashboard:** customer@svmms.com / customer123
   - **Mechanic Dashboard:** mechanic@svmms.com / mechanic123
   - **Admin Dashboard:** admin@svmms.com / admin123

3. **Or register a new account:**
   - Click "Get Started" or "Register"
   - Select your role (Customer or Mechanic)
   - Fill in your details

## 📁 Project Structure

```
Sankey Project/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # Database configuration
│   │   ├── controllers/             # API controllers
│   │   │   ├── authController.js
│   │   │   ├── vehicleController.js
│   │   │   ├── bookingController.js
│   │   │   ├── jobcardController.js
│   │   │   ├── partController.js
│   │   │   ├── invoiceController.js
│   │   │   └── analyticsController.js
│   │   ├── middleware/              # Auth & validation middleware
│   │   │   ├── auth.js
│   │   │   └── validator.js
│   │   ├── routes/                  # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── vehicleRoutes.js
│   │   │   ├── bookingRoutes.js
│   │   │   ├── jobcardRoutes.js
│   │   │   ├── partRoutes.js
│   │   │   ├── invoiceRoutes.js
│   │   │   └── analyticsRoutes.js
│   │   ├── migrations/              # Database migrations
│   │   │   └── runMigrations.js
│   │   ├── seeders/                 # Database seeders
│   │   │   └── runSeeders.js
│   │   └── server.js                # Express server
│   ├── .env                         # Environment variables
│   ├── .env.example                 # Environment template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   │   ├── ui/                  # UI components
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Table.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Toast.jsx
│   │   │   │   └── Spinner.jsx
│   │   │   └── ProtectedRoute.jsx   # Route protection
│   │   ├── context/                 # React context
│   │   │   └── AuthContext.jsx      # Auth state management
│   │   ├── pages/                   # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── customer/
│   │   │   │   └── CustomerDashboard.jsx
│   │   │   ├── mechanic/
│   │   │   │   └── MechanicDashboard.jsx
│   │   │   └── admin/
│   │   │       └── AdminDashboard.jsx
│   │   ├── services/                # API services
│   │   │   ├── api.js               # Axios instance
│   │   │   └── index.js             # Service exports
│   │   ├── App.jsx                  # Main app component
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Global styles
│   ├── .env                         # Environment variables
│   ├── .env.example                 # Environment template
│   ├── tailwind.config.js           # Tailwind configuration
│   ├── postcss.config.js            # PostCSS configuration
│   └── package.json
│
└── README.md                        # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with role
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/users/:id` - Update profile

### Vehicles
- `POST /api/vehicles` - Add vehicle
- `GET /api/vehicles` - Get all vehicles
- `GET /api/vehicles/:id` - Get vehicle by ID
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle
- `GET /api/vehicles/:id/history` - Get service history

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/customer/:id` - Get customer bookings
- `GET /api/bookings/pending` - Get pending bookings
- `PUT /api/bookings/:id/approve` - Approve booking
- `PUT /api/bookings/:id/reject` - Reject booking

### Job Cards
- `POST /api/jobcards` - Create job card
- `GET /api/jobcards` - Get all job cards
- `GET /api/jobcards/:id` - Get job card details
- `PUT /api/jobcards/:id/add-task` - Add task
- `PUT /api/jobcards/:id/add-mechanic` - Assign mechanic
- `PUT /api/jobcards/:id/add-sparepart` - Add spare part
- `PUT /api/jobcards/:id/update-status` - Update status

### Parts
- `POST /api/parts` - Add part
- `GET /api/parts` - Get all parts
- `PUT /api/parts/:id` - Update part
- `DELETE /api/parts/:id` - Delete part
- `GET /api/parts/low-stock` - Get low stock parts

### Invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice
- `GET /api/invoices/customer/:id` - Get customer invoices
- `PUT /api/invoices/:id/payment` - Update payment status

### Analytics
- `GET /api/analytics/vehicles` - Vehicle analytics
- `GET /api/analytics/parts-usage` - Parts usage stats
- `GET /api/analytics/revenue` - Revenue analytics
- `GET /api/analytics/dashboard-stats` - Dashboard stats

## 🎨 UI Features

- **Modern Design:** Clean, professional interface with Tailwind CSS
- **Responsive Layout:** Mobile-first design, works on all screen sizes
- **Smooth Animations:** Subtle transitions and hover effects
- **Toast Notifications:** Real-time feedback for user actions
- **Loading States:** Spinners and skeletons for better UX
- **Form Validation:** Client-side validation with helpful error messages
- **Role-Based UI:** Different dashboards for each user role
- **Dark Mode Ready:** Color scheme prepared for dark mode extension

## 🔒 Security Features

- JWT token-based authentication
- Bcrypt password hashing (10 rounds)
- Protected API routes with middleware
- Role-based access control
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- XSS protection

## 🧪 Test Accounts

After running the seeder, use these accounts:

| Role     | Email                  | Password     |
|----------|------------------------|--------------|
| Admin    | admin@svmms.com        | admin123     |
| Mechanic | mechanic@svmms.com     | mechanic123  |
| Customer | customer@svmms.com     | customer123  |

## 📝 Database Schema

### Key Tables:
- **users** - User accounts with roles
- **vehicles** - Customer vehicles
- **bookings** - Service appointment bookings
- **jobcards** - Service job tracking
- **jobcard_tasks** - Individual tasks in job cards
- **jobcard_spareparts** - Parts used in job cards
- **parts** - Spare parts inventory
- **invoices** - Service invoices

## 🚀 Production Deployment

### Backend Deployment
1. Set `NODE_ENV=production` in `.env`
2. Use a production PostgreSQL database
3. Update `JWT_SECRET` with a strong secret
4. Enable CORS for your frontend domain
5. Use a process manager like PM2

### Frontend Deployment
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Deploy the `dist` folder to a static hosting service
3. Update `VITE_API_URL` to your production API URL

## 🤝 Contributing

This is a demonstration project. For production use, consider:
- Adding comprehensive testing (Jest, React Testing Library)
- Implementing refresh tokens
- Adding rate limiting
- Setting up logging
- Adding email notifications
- Implementing payment gateway integration

## 📄 License

This project is created for demonstration purposes.

## 👨‍💻 Developer Notes

- Backend uses ES modules (`"type": "module"` in package.json)
- Frontend uses Vite for fast development and builds
- Database migrations are idempotent (safe to run multiple times)
- All passwords are hashed before storage
- API uses consistent error response format
- Frontend has centralized API service layer

## 🆘 Troubleshooting

### Backend won't start:
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Ensure database `svmms_dev` exists
- Check if port 5000 is available

### Frontend won't start:
- Check if backend is running
- Verify `VITE_API_URL` in `.env`
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check if port 5173 is available

### Database errors:
- Run migrations: `npm run migrate`
- Check database connection settings
- Ensure PostgreSQL user has proper permissions

### Login issues:
- Verify you've run the seeder: `npm run seed`
- Check backend logs for authentication errors
- Clear browser localStorage and try again

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the console logs (both browser and terminal)
3. Verify all environment variables are set correctly

---

**Built with ❤️ using React, Node.js, and PostgreSQL**
# Smart-Vehicle-Maintenance-and-Service-Management-System
