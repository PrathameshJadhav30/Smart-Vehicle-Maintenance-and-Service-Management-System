# SVMMS Frontend - Smart Vehicle Maintenance & Service Management System

A comprehensive React frontend for the Smart Vehicle Maintenance & Service Management System with role-based authentication and full API integration.

## Features

- **Role-based Authentication**: Customer, Mechanic, and Admin roles with protected routes
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **API Integration**: Complete integration with all backend endpoints
- **Form Validation**: Client-side validation with react-hook-form and yup
- **Notifications**: Toast notifications for user feedback
- **Modern UI Components**: Reusable components for consistent UX

## Tech Stack

- **React 18+** with functional components and hooks
- **Vite** for fast development and building
- **React Router v6** for routing
- **Tailwind CSS** for styling
- **Axios** for API requests
- **React Hook Form** with Yup for form validation
- **Heroicons** for SVG icons

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the frontend root directory based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Running the Application

#### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

#### Production Build

```bash
npm run build
```

#### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/        # Reusable UI components
├── contexts/          # React contexts (Auth, Toast)
├── hooks/             # Custom hooks
├── layouts/           # Page layouts
├── pages/             # Page components
│   ├── admin/         # Admin role pages
│   ├── auth/          # Authentication pages
│   ├── customer/      # Customer role pages
│   └── mechanic/      # Mechanic role pages
├── services/          # API service functions
├── styles/            # Styling utilities and tokens
└── utils/             # Utility functions
```

## Available Roles

1. **Customer**
   - Manage vehicles
   - Book services
   - View booking history
   - Access invoices

2. **Mechanic**
   - Handle service bookings
   - Manage job cards
   - Track jobs
   - Update statuses

3. **Admin**
   - Revenue analytics
   - User/booking oversight
   - Inventory management
   - Low stock alerts
   - System metrics

## Color Palette

- **Primary**: `#0F62FE` (Blue)
- **Secondary**: `#00B388` (Teal/Green)
- **Background**: `#F7FAFC` (Gray-50)
- **Surface/Cards**: `#FFFFFF` (White)
- **Text**: `#1F2937` (Gray-800)
- **Muted Text**: `#6B7280` (Gray-500)
- **Success**: `#10B981` (Green-500)
- **Error**: `#EF4444` (Red-500)

## Development Guidelines

- All components should be functional components using hooks
- Use the provided design tokens for consistent styling
- Follow the established folder structure
- Implement proper error handling and loading states
- Write accessible code with proper semantic HTML

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Demo Credentials

For testing purposes, you can use the following credentials after seeding the database:

- **Customer**: customer@example.com / password
- **Mechanic**: mechanic@example.com / password
- **Admin**: admin@example.com / password

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

## License

This project is licensed under the MIT License.