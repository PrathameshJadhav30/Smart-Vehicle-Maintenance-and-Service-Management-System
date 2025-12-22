import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Table, { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/Table';
const UsersManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterRole]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await authService.getAllUsers();
      // The backend returns { users: [...] }, so we need to extract the array
      setUsers(Array.isArray(data) ? data : (data.users || []));
    } catch (error) {
      console.error('Error loading users:', error);
      // Set to empty array on error to prevent crashes
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let result = users;
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply role filter
    if (filterRole !== 'all') {
      result = result.filter(user => user.role === filterRole);
    }
    
    setFilteredUsers(result);
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
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    }
  };

  const handleCreateUserInputChange = (e) => {
    setCreateUserData({
      ...createUserData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.createUser(createUserData);
      setShowCreateModal(false);
      setCreateUserData({
        name: '',
        email: '',
        password: '',
        role: 'customer',
        phone: '',
        address: ''
      });
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user. Please try again.');
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

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await authService.deleteUser(userId);
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user. Please try again.');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" data-testid="loading-spinner"></div>
      </div>
    );
  }

  // Ensure users is always an array
  const usersArray = Array.isArray(users) ? users : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
              <p className="mt-2 text-lg text-gray-600">
                Manage user accounts and permissions
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button onClick={() => setShowCreateModal(true)}>
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
                    Showing {filteredUsers.length} of {usersArray.length} users
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
                    {filteredUsers.map((user) => (
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
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
              />
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
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
              />
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
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
              />
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
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
              />
            </div>
            <div>
              <label htmlFor="create-address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                id="create-address"
                name="address"
                value={createUserData.address}
                onChange={handleCreateUserInputChange}
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200"
              />
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
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white transition-all duration-200"
              >
                <option value="customer">Customer</option>
                <option value="mechanic">Mechanic</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default UsersManagementPage;