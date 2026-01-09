import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import authService from '../../services/authService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import ConfirmationModal from '../../components/ConfirmationModal';
import Table, { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/Table';
import useDebounce from '../../hooks/useDebounce';
const UsersManagementPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'customer'
  });
  const [createUserData, setCreateUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    phone: '',
    address: ''
  });
  const [createUserErrors, setCreateUserErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [filterRole, setFilterRole] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  
  const { showToast } = useToast();

  useEffect(() => {
    loadUsers();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    // When search or filter changes, fetch filtered data
    filterUsers();
  }, [debouncedSearchTerm, filterRole]);



  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await authService.getAllUsers({
        page: pagination.page,
        limit: pagination.limit
      });
      
      setUsers(data.users || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      // Set to empty array on error to prevent crashes
      setUsers([]);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = async () => {
    // Reset to page 1 when search or filter changes
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
    
    // Fetch fresh data based on search and filter
    try {
      setLoading(true);
      const data = await authService.getAllUsers({
        page: 1,
        limit: pagination.limit,
        search: debouncedSearchTerm,
        role: filterRole !== 'all' ? filterRole : undefined
      });
      
      setUsers(data.users || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error filtering users:', error);
      setUsers([]);
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        // Check if there are actual changes before updating
        const hasChanges = selectedUser.role !== formData.role;
        
        if (!hasChanges) {
          // No changes detected, close the modal without making an API call
          setShowEditModal(false);
          setFormData({
            name: '',
            email: '',
            role: 'customer'
          });
          setSelectedUser(null);
          showToast.info('No changes detected. User role remains unchanged.');
          return;
        }
        
        // Update user role
        await authService.updateUserRole(selectedUser.id, { role: formData.role });
      }
      
      setShowEditModal(false);
      setFormData({
        name: '',
        email: '',
        role: 'customer'
      });
      setSelectedUser(null);
      // Reload users to reflect the role change
      await loadUsers();
      showToast.success('User role updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      showToast.error('Failed to update user. Please try again.');
    }
  };

  const handleCreateUserInputChange = (e) => {
    const { name, value } = e.target;
    
    setCreateUserData({
      ...createUserData,
      [name]: value
    });
    
    // Clear error for this field when user starts typing
    if (createUserErrors[name]) {
      setCreateUserErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await authService.createUser(createUserData);
      
      // Close the modal after successful creation
      setShowCreateModal(false);
      
      // Reset form data
      setCreateUserData({
        name: '',
        email: '',
        password: '',
        role: 'customer',
        phone: '',
        address: ''
      });
      
      // Clear any previous errors
      setCreateUserErrors({});
      
      // Reload users to include the new user
      await loadUsers();
      
      // Show success message
      showToast.success('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      
      // Check if error response contains validation errors
      if (error.response && error.response.data && error.response.data.errors) {
        // Handle validation errors from backend
        const errors = {};
        error.response.data.errors.forEach(err => {
          errors[err.field] = err.message;
        });
        setCreateUserErrors(errors);
        // Keep modal open to show validation errors
      } else {
        // Close the modal for non-validation errors
        setShowCreateModal(false);
        
        // Reset form data for non-validation errors
        setCreateUserData({
          name: '',
          email: '',
          password: '',
          role: 'customer',
          phone: '',
          address: ''
        });
        
        if (error.response && error.response.data && error.response.data.message) {
          // Handle general error message
          showToast.error(error.response.data.message);
        } else {
          // Handle generic error
          showToast.error('Failed to create user. Please try again.');
        }
      }
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'customer'
    });
    setShowEditModal(true);
  };

  const handleDelete = (userId) => {
    setUserToDelete(userId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        await authService.deleteUser(userToDelete);
        // Reload users to reflect the deletion
        await loadUsers();
        showToast.success('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
        showToast.error('Failed to delete user. Please try again.');
      } finally {
        setShowConfirmModal(false);
        setUserToDelete(null);
      }
    }
  };

  const getRoleBadge = (role) => {
    const roleClasses = {
      admin: 'bg-purple-100 text-purple-800 border border-purple-200',
      mechanic: 'bg-blue-100 text-blue-800 border border-blue-200',
      customer: 'bg-green-100 text-green-800 border border-green-200'
    };
    
    const roleText = {
      admin: 'Admin',
      mechanic: 'Mechanic',
      customer: 'Customer'
    };
    
    return (
      <span className={`px-3 py-1.5 inline-flex text-xs leading-4 font-semibold rounded-full ${roleClasses[role] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {roleText[role] || role}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({
        ...prev,
        page: newPage
      }));
    }
  };

  const getPageNumbers = () => {
    const { page, pages } = pagination;
    const delta = 2; // Number of pages to show around current page
    
    const range = [];
    const rangeWithDots = [];
    
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
      range.push(i);
    }
    
    if (range[0] > 1) {
      rangeWithDots.push(1);
      if (range[0] > 2) {
        rangeWithDots.push('...');
      }
    }
    
    rangeWithDots.push(...range);
    
    if (rangeWithDots[rangeWithDots.length - 1] < pages) {
      if (rangeWithDots[rangeWithDots.length - 1] < pages - 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(pages);
    }
    
    return rangeWithDots;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
      </div>
    );
  }

  // Use the current users array
  const usersArray = Array.isArray(users) ? users : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-6">
            <div>
              <button 
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md border border-blue-300 mb-4 md:mb-0"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Back to Dashboard</span>
              </button>
            </div>
            <div className="text-center md:text-center flex-1 md:mx-auto">
              <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
              <p className="mt-2 text-lg text-gray-600">
                Manage user accounts and permissions
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button onClick={() => {
                setShowCreateModal(true);
                setCreateUserErrors({}); // Clear any previous errors when opening modal
              }}>
                Create User
              </Button>
              <div className="relative rounded-lg shadow-sm w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="block w-full md:w-40 pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white transition-all duration-200"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="mechanic">Mechanic</option>
                <option value="customer">Customer</option>
              </select>
            </div>
          </div>
          {usersArray.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-4 text-xl font-medium text-gray-900">No users found</h3>
              <p className="mt-2 text-gray-500">There are no users in the system.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    User Accounts
                  </h3>
                  <p className="text-sm text-gray-500">
                    Showing {users.length} of {pagination.total} users
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table className="min-w-full divide-y divide-gray-200">
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell className="px-6 py-3">User</TableHeaderCell>
                      <TableHeaderCell className="px-6 py-3">Email</TableHeaderCell>
                      <TableHeaderCell className="px-6 py-3">Role</TableHeaderCell>
                      <TableHeaderCell className="px-6 py-3 text-right">Actions</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <TableCell className="px-6 py-4 font-medium text-gray-900">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <span className="text-white font-medium text-sm">
                                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center">
                            {getRoleBadge(user.role)}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => handleEdit(user)}
                            >
                              Edit Role
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => handleDelete(user.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${pagination.page <= 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'}`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                      className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${pagination.page >= pagination.pages ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'}`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                          className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${pagination.page <= 1 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          <span className="sr-only">Previous</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        {/* Page numbers */}
                        {getPageNumbers().map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${pagination.page === pageNum ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'}`}
                          >
                            {pageNum}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.pages}
                          className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${pagination.page >= pagination.pages ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          <span className="sr-only">Next</span>
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {selectedUser && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit User Role" size="md">
          <form onSubmit={handleSubmit}>
            <div className="space-y-5 py-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                  disabled
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
                  disabled
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white transition-all duration-200"
                >
                  <option value="customer">Customer</option>
                  <option value="mechanic">Mechanic</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="mt-8 flex justify-end space-x-3">
              <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Role
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create User Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New User" size="md">
        <form onSubmit={handleCreateUserSubmit}>
          <div className="space-y-5 py-2">
            <div>
              <label htmlFor="create-name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="create-name"
                name="name"
                value={createUserData.name}
                onChange={handleCreateUserInputChange}
                required
                className={`block w-full border ${createUserErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200`}
              />
              {createUserErrors.name && (
                <p className="mt-1 text-sm text-red-600">{createUserErrors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="create-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="create-email"
                name="email"
                value={createUserData.email}
                onChange={handleCreateUserInputChange}
                required
                className={`block w-full border ${createUserErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200`}
              />
              {createUserErrors.email && (
                <p className="mt-1 text-sm text-red-600">{createUserErrors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="create-password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="create-password"
                name="password"
                value={createUserData.password}
                onChange={handleCreateUserInputChange}
                required
                minLength="6"
                className={`block w-full border ${createUserErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200`}
              />
              {createUserErrors.password && (
                <p className="mt-1 text-sm text-red-600">{createUserErrors.password}</p>
              )}
            </div>
            <div>
              <label htmlFor="create-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                id="create-phone"
                name="phone"
                value={createUserData.phone}
                onChange={handleCreateUserInputChange}
                className={`block w-full border ${createUserErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200`}
              />
              {createUserErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{createUserErrors.phone}</p>
              )}
            </div>
            <div>
              <label htmlFor="create-address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="create-address"
                  name="address"
                  value={createUserData.address}
                  onChange={handleCreateUserInputChange}
                  className={`block w-full border ${createUserErrors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm py-2.5 px-4 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-sm text-gray-500">
                    {createUserData.address.length}/255
                  </span>
                </div>
              </div>
              {createUserErrors.address && (
                <p className="mt-1 text-sm text-red-600">{createUserErrors.address}</p>
              )}
            </div>
            <div>
              <label htmlFor="create-role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="create-role"
                name="role"
                value={createUserData.role}
                onChange={handleCreateUserInputChange}
                className={`block w-full border ${createUserErrors.role ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white transition-all duration-200`}
              >
                <option value="customer">Customer</option>
                <option value="mechanic">Mechanic</option>
                <option value="admin">Admin</option>
              </select>
              {createUserErrors.role && (
                <p className="mt-1 text-sm text-red-600">{createUserErrors.role}</p>
              )}
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => {
              setShowCreateModal(false);
              setCreateUserErrors({}); // Clear errors when closing modal
            }}>
              Cancel
            </Button>
            <Button type="submit">
              Create User
            </Button>
          </div>
        </form>
      </Modal>
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete User"
        message="Are you sure you want to delete this user?"
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </div>
  );
};
export default UsersManagementPage;

