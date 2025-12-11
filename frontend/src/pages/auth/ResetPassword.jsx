import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import AuthLayout from '../../layouts/AuthLayout';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const validateForm = () => {
    const newErrors = {};
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // In a real app, this would call an API to reset the password
      // For now, we'll just simulate the behavior
      setTimeout(() => {
        setResetSuccess(true);
        showToast.success('Password reset successfully');
      }, 1000);
    } catch (error) {
      showToast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <AuthLayout title="Password Reset Successful">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Password reset successful</h3>
          <div className="mt-2 text-sm text-gray-500">
            <p>Your password has been successfully reset. You can now sign in with your new password.</p>
          </div>
          <div className="mt-6">
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in to your account
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set New Password">
      <div className="text-sm text-gray-600 mb-6">
        <p>Please enter your new password below.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
        />
        
        <Input
          label="Confirm New Password"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          required
        />
        
        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          Reset Password
        </Button>
      </form>
      
      <div className="mt-6 text-center">
        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
          Return to sign in
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;