import React, { useState } from 'react';
import utilityService from '../../services/utilityService';
import Button from '../../components/Button';

const UtilitiesPage = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [seedingStatus, setSeedingStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const status = await utilityService.getHealthStatus();
      setHealthStatus(status);
    } catch (error) {
      console.error('Error checking health status:', error);
      setHealthStatus({ status: 'error', message: 'Failed to check health status' });
    } finally {
      setLoading(false);
    }
  };

  const seedDatabase = async () => {
    if (!window.confirm('Are you sure you want to seed the database? This will add sample data and may overwrite existing data.')) {
      return;
    }
    
    try {
      setLoading(true);
      setSeedingStatus('Seeding database...');
      const result = await utilityService.seedDatabase();
      setSeedingStatus(result.message || 'Database seeded successfully!');
    } catch (error) {
      console.error('Error seeding database:', error);
      setSeedingStatus('Failed to seed database. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">System Utilities</h1>
          
          {/* Health Check */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Health Check</h2>
              <p className="mt-1 text-sm text-gray-500">
                Check the current status of the API and database connectivity.
              </p>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  {healthStatus ? (
                    <div>
                      <p className={`text-sm font-medium ${healthStatus.status === 'ok' ? 'text-green-800' : 'text-red-800'}`}>
                        Status: {healthStatus.status}
                      </p>
                      {healthStatus.message && (
                        <p className="mt-1 text-sm text-gray-500">
                          {healthStatus.message}
                        </p>
                      )}
                      {healthStatus.timestamp && (
                        <p className="mt-1 text-sm text-gray-500">
                          Last checked: {new Date(healthStatus.timestamp).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Click the button to check system health.
                    </p>
                  )}
                </div>
                <Button onClick={checkHealth} disabled={loading}>
                  {loading ? 'Checking...' : 'Check Health'}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Database Seeding */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Database Seeding</h2>
              <p className="mt-1 text-sm text-gray-500">
                Populate the database with sample data for testing and demonstration purposes.
              </p>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  {seedingStatus && (
                    <p className="text-sm text-gray-500 mb-2">
                      {seedingStatus}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    This will add sample users, vehicles, bookings, and other data to the database.
                  </p>
                </div>
                <Button onClick={seedDatabase} variant="danger" disabled={loading}>
                  {loading ? 'Seeding...' : 'Seed Database'}
                </Button>
              </div>
            </div>
          </div>
          
          {/* API Information */}
          <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">API Information</h2>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-md font-medium text-gray-900">Endpoints</h3>
                  <ul className="mt-2 space-y-1">
                    <li className="text-sm text-gray-500">Authentication: /api/auth</li>
                    <li className="text-sm text-gray-500">Vehicles: /api/vehicles</li>
                    <li className="text-sm text-gray-500">Bookings: /api/bookings</li>
                    <li className="text-sm text-gray-500">Job Cards: /api/jobcards</li>
                    <li className="text-sm text-gray-500">Parts: /api/parts</li>
                    <li className="text-sm text-gray-500">Invoices: /api/invoices</li>
                    <li className="text-sm text-gray-500">Analytics: /api/analytics</li>
                  </ul>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-md font-medium text-gray-900">Documentation</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Refer to the API documentation for detailed information about each endpoint and its parameters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UtilitiesPage;