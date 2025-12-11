import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import AuthLayout from '../../layouts/AuthLayout';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const { showToast } = useToast();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // In a real app, this would call an API to send reset instructions
      // For now, we'll just simulate the behavior
      setTimeout(() => {
        setSubmitted(true);
        showToast.success('Password reset instructions sent to your email');
      }, 1000);
    } catch (error) {
      showToast.error('Failed to send reset instructions');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout title="Check Your Email">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Check your email</h3>
          <div className="mt-2 text-sm text-gray-500">
            <p>We've sent password reset instructions to <strong>{email}</strong>.</p>
            <p className="mt-2">Didn't receive the email? Check your spam folder or <button onClick={() => setSubmitted(false)} className="font-medium text-blue-600 hover:text-blue-500">try again</button>.</p>
          </div>
          <div className="mt-6">
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Return to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Your Password">
      <div className="text-sm text-gray-600 mb-6">
        <p>Enter your email address and we'll send you a link to reset your password.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          required
        />
        
        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          Send Reset Instructions
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

export default ForgotPassword;