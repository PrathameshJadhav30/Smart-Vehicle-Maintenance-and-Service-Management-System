import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import authService from '../../services/authService';
import Button from '../../components/Button';

const MechanicProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    
    setPasswordData({
      ...passwordData,
      [name]: value
    });
    
    // Clear error for this field when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validation function for profile form
  const validateProfileForm = () => {
    const errors = {};
    
    // Validate name (only alphabetic characters and spaces)
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      errors.name = 'Name can only contain alphabetic characters and spaces';
    }
    
    // Validate email format
    if (!formData.email || formData.email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Validate phone if provided (must be exactly 10 digits)
    if (formData.phone && formData.phone.trim() !== '') {
      const phoneDigits = formData.phone.replace(/[^0-9]/g, ''); // Remove all non-digit characters
      if (phoneDigits.length !== 10) {
        errors.phone = 'Phone number must contain exactly 10 digits';
      }
    }
    
    return errors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    const errors = validateProfileForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast.error('Please fix the errors in the form before submitting');
      return;
    }
    
    // Clear any previous errors
    setFormErrors({});
    
    try {
      setLoading(true);
      
      // Check if there are actual changes before updating
      const hasChanges = Object.keys(formData).some(key => 
        formData[key] !== (user[key] || '')
      );
      
      if (!hasChanges) {
        // No changes detected, close the edit mode without making an API call
        setEditing(false);
        showToast.info('No changes detected. Profile remains unchanged.');
        setLoading(false);
        return;
      }
      
      const response = await authService.updateProfile(user.id, formData);
      updateUser(response.user); // Pass the user object from the response
      setEditing(false);
      showToast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Validation function for password change
  const validatePasswordChange = () => {
    const errors = {};
    
    // Validate current password
    if (!passwordData.currentPassword || passwordData.currentPassword.trim() === '') {
      errors.currentPassword = 'Current password is required';
    }
    
    // Validate new password
    if (!passwordData.newPassword || passwordData.newPassword.trim() === '') {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
    } else if (passwordData.newPassword.length > 16) {
      errors.newPassword = 'Password must be less than 16 characters';
    } else if (!/(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain at least one uppercase letter and one special character';
    }
    
    // Validate confirm password
    if (!passwordData.confirmPassword || passwordData.confirmPassword.trim() === '') {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'New passwords do not match';
    }
    
    return errors;
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password data
    const errors = validatePasswordChange();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      showToast.error('Please fix the errors in the password form');
      return;
    }
    
    // Clear any previous password errors
    setPasswordErrors({});
    
    try {
      setLoading(true);
      await authService.changePassword(user.id, {
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      // Reset password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      showToast.success('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      if (error.response && error.response.data && error.response.data.message) {
        showToast.error(`Error: ${error.response.data.message}`);
      } else {
        showToast.error('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <button 
                onClick={() => navigate('/mechanic/dashboard')}
                className="flex items-center text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md border border-blue-300 mb-2 md:mb-0"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
            </div>
            <div className="text-center md:text-center flex-1 md:mx-auto">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Profile</h1>
              <p className="mt-2 text-gray-600">Manage your profile information and settings</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-8">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="flex-shrink-0">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl w-20 h-20 flex items-center justify-center shadow-lg">
                  <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="text-center md:text-left flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 truncate">{user?.name || 'Mechanic'}</h2>
                <p className="text-lg text-gray-600 mt-1 truncate">{user?.email || 'N/A'}</p>
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                  Mechanic Account
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-6">
            {!editing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-all duration-300 shadow-sm border border-gray-100">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                        <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="ml-4 min-w-0">
                        <label className="block text-sm font-medium text-gray-500">Name</label>
                        <p className="mt-1 text-lg font-semibold text-gray-900 truncate">{user?.name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-all duration-300 shadow-sm border border-gray-100">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-3">
                        <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-4 min-w-0">
                        <label className="block text-sm font-medium text-gray-500">Email</label>
                        <p className="mt-1 text-lg font-semibold text-gray-900 truncate">{user?.email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-all duration-300 shadow-sm border border-gray-100 md:col-span-2">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-amber-100 rounded-lg p-3">
                        <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <div className="ml-4 min-w-0">
                        <label className="block text-sm font-medium text-gray-500">Phone</label>
                        <p className="mt-1 text-lg font-semibold text-gray-900 truncate">{user?.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setEditing(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </div>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200`}
                      required
                    />
                    {formErrors.name && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`mt-1 block w-full border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200`}
                      required
                    />
                    {formErrors.email && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full border ${formErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-xl shadow-sm py-3 px-4 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200`}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-sm text-gray-500">
                          {formData.phone.replace(/[^0-9]/g, '').length}/10
                        </span>
                      </div>
                    </div>
                    {formErrors.phone && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setEditing(false)}
                    className="px-6 py-3 rounded-xl hover:shadow-md transition-all duration-300"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                  >
                    <div className="flex items-center">
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </div>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
            <p className="mt-1 text-gray-600">
              Update your password regularly to keep your account secure.
            </p>
          </div>
          
          <div className="px-6 py-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className={`mt-1 block w-full border ${passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200`}
                  required
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-2 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                )}
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={`mt-1 block w-full border ${passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200`}
                  required
                />
                {passwordErrors.newPassword && (
                  <p className="mt-2 text-sm text-red-600">{passwordErrors.newPassword}</p>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  <p className="mb-1 font-medium text-gray-700">Password must contain:</p>
                  <ul className="space-y-1">
                    <li className={`flex items-center ${passwordData.newPassword && passwordData.newPassword.length >= 6 ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{passwordData.newPassword && passwordData.newPassword.length >= 6 ? '✓' : '•'}</span>
                      At least 6 characters
                    </li>
                    <li className={`flex items-center ${passwordData.newPassword && passwordData.newPassword.length <= 16 ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{passwordData.newPassword && passwordData.newPassword.length <= 16 ? '✓' : '•'}</span>
                      No more than 16 characters
                    </li>
                    <li className={`flex items-center ${passwordData.newPassword && /[A-Z]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{passwordData.newPassword && /[A-Z]/.test(passwordData.newPassword) ? '✓' : '•'}</span>
                      At least one uppercase letter
                    </li>
                    <li className={`flex items-center ${passwordData.newPassword && /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">{passwordData.newPassword && /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword) ? '✓' : '•'}</span>
                      At least one special character
                    </li>
                  </ul>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`mt-1 block w-full border ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200`}
                  required
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
                >
                  <div className="flex items-center">
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Changing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Change Password
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanicProfilePage;