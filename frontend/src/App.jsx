import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerVehicles from './pages/customer/Vehicles';
import BookService from './pages/customer/BookService';
import MyBookings from './pages/customer/MyBookings';
import CustomerInvoices from './pages/customer/Invoices';
import CustomerProfile from './pages/customer/Profile';
import MechanicDashboard from './pages/mechanic/Dashboard';
import MechanicAssignedBookings from './pages/mechanic/AssignedBookings';
import MechanicAssignedJobs from './pages/mechanic/AssignedJobs';
import MechanicJobCards from './pages/mechanic/JobCards';
import MechanicPartsUsage from './pages/mechanic/PartsUsage';
import MechanicProfile from './pages/mechanic/Profile';
import MechanicInvoices from './pages/mechanic/Invoices';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsersManagement from './pages/admin/UsersManagement';
import AdminVehiclesManagement from './pages/admin/VehiclesManagement';
import AdminBookingsManagement from './pages/admin/BookingsManagement';
import AdminJobCardsManagement from './pages/admin/JobCardsManagement';
import AdminPartsManagement from './pages/admin/PartsManagement';
import AdminInvoicesManagement from './pages/admin/InvoicesManagement';
import AdminAnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import AdminUtilities from './pages/admin/Utilities';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Customer Routes */}
              <Route 
                path="/customer/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/customer/vehicles" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerVehicles />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/customer/book-service" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <BookService />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/customer/bookings" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <MyBookings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/customer/invoices" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerInvoices />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/customer/profile" 
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerProfile />
                  </ProtectedRoute>
                } 
              />
              
              {/* Mechanic Routes */}
              <Route 
                path="/mechanic/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['mechanic']}>
                    <MechanicDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mechanic/bookings" 
                element={
                  <ProtectedRoute allowedRoles={['mechanic']}>
                    <MechanicAssignedBookings />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mechanic/job-cards" 
                element={
                  <ProtectedRoute allowedRoles={['mechanic']}>
                    <MechanicJobCards />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mechanic/assigned-jobs" 
                element={
                  <ProtectedRoute allowedRoles={['mechanic']}>
                    <MechanicAssignedJobs />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mechanic/parts" 
                element={
                  <ProtectedRoute allowedRoles={['mechanic']}>
                    <MechanicPartsUsage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mechanic/invoices" 
                element={
                  <ProtectedRoute allowedRoles={['mechanic']}>
                    <MechanicInvoices />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mechanic/profile" 
                element={
                  <ProtectedRoute allowedRoles={['mechanic']}>
                    <MechanicProfile />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin Routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminUsersManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/vehicles" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminVehiclesManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/bookings" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminBookingsManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/jobcards" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminJobCardsManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/parts" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPartsManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/invoices" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminInvoicesManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/analytics" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminAnalyticsDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/utilities" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminUtilities />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<Home />} />
            </Routes>
          </div>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;