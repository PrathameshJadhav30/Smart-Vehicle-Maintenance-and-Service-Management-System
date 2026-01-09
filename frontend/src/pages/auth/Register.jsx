import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import AuthLayout from '../../layouts/AuthLayout';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const roleOptions = [
    { value: 'customer', label: 'Customer - Book services and manage vehicles' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate name - only letters and spaces allowed
    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      newErrors.name = 'Name must contain only letters and spaces';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6 || formData.password.length > 16) {
      newErrors.password = 'Password must be between 6 and 16 characters';
    } else {
      // Check for strong password: at least one uppercase, one lowercase, one special character
      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
      
      if (!hasUpperCase) {
        newErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!hasSpecialChar) {
        newErrors.password = 'Password must contain at least one special character';
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
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
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      
      if (result.success) {
        showToast.success('Registration successful!');
        
        showToast.info("Account created successfully. You can now book services and manage your vehicles.");
        
        navigate('/login');
      } else {
        showToast.error(result.message || 'Registration failed');
      }
    } catch (error) {
      showToast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account">
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Welcome!</strong> Create a customer account to book services and manage your vehicles.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          id="name"
          name="name"
          type="text"
          placeholder="Enter your name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          required
        />
        
        <Input
          label="Email Address"
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
        
        <Input
          label="Password"
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          required
        />
        
        {/* Password Requirements Indicator */}
        <div className="mt-1 text-xs text-gray-500">
          <p className="mb-1">Requirements:</p>
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center ${formData.password.length >= 6 && formData.password.length <= 16 ? 'text-green-600' : 'text-gray-400'}`}>
              {formData.password.length >= 6 && formData.password.length <= 16 ? '✓' : '○'} 6-16 chars
            </span>
            <span className={`inline-flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
              {/[A-Z]/.test(formData.password) ? '✓' : '○'} upper
            </span>
            <span className={`inline-flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
              {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? '✓' : '○'} special
            </span>
          </div>
        </div>
        
        <Input
          label="Confirm Password"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Enter your confirm password"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
        />
        
        {/* Hidden role field - always set to customer */}
        <input
          type="hidden"
          name="role"
          value={formData.role}
        />
        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          Create Account
        </Button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Register;