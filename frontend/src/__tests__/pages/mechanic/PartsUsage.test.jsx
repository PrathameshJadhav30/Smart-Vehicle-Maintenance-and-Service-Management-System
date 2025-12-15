import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PartsUsagePage from '../../../pages/mechanic/PartsUsage';
import { useAuth } from '../../../contexts/AuthContext';
import * as partsService from '../../../services/partsService';

// Mock the contexts
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock the services
vi.mock('../../../services/partsService');

describe('PartsUsagePage', () => {
  const mockUser = { id: '123', name: 'Mechanic User', role: 'mechanic' };

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, hasRole: (role) => role === 'mechanic' });
  });

  test('renders loading spinner initially', async () => {
    // Mock the parts and suppliers loading functions
    partsService.getAllParts.mockResolvedValue([]);
    partsService.getAllSuppliers.mockResolvedValue([]);
    
    render(
      <BrowserRouter>
        <PartsUsagePage />
      </BrowserRouter>
    );

    // Check for the loading spinner div using a class-based query
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  test('renders parts when data is available', async () => {
    // Mock parts service response
    partsService.getAllParts.mockResolvedValue([
      {
        id: '1',
        name: 'Engine Oil',
        part_number: 'EO-123',
        quantity: 50,
        price: 25.00,
        supplier: 'Auto Parts Co.',
        supplier_name: 'Auto Parts Co.'
      },
      {
        id: '2',
        name: 'Brake Pads',
        part_number: 'BP-456',
        quantity: 30,
        price: 45.00,
        supplier: 'Brake Specialists',
        supplier_name: 'Brake Specialists'
      }
    ]);
    
    // Mock suppliers data
    partsService.getAllSuppliers.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <PartsUsagePage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    // Check that parts are displayed
    expect(screen.getByText('Engine Oil')).toBeInTheDocument();
    expect(screen.getByText('Brake Pads')).toBeInTheDocument();
    expect(screen.getByText('EO-123')).toBeInTheDocument();
    expect(screen.getByText('BP-456')).toBeInTheDocument();
  });

  test('renders empty state when no parts are found', async () => {
    // Mock parts service response with empty data
    partsService.getAllParts.mockResolvedValue([]);
    
    // Mock suppliers data
    partsService.getAllSuppliers.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <PartsUsagePage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    // Check that empty state is displayed
    expect(screen.getByText('No parts found')).toBeInTheDocument();
  });

  test('searches parts by term', async () => {
    // Mock parts service response
    partsService.getAllParts.mockResolvedValue([
      {
        id: '1',
        name: 'Engine Oil',
        part_number: 'EO-123',
        quantity: 50,
        price: 25.00,
        supplier: 'Auto Parts Co.',
        supplier_name: 'Auto Parts Co.'
      }
    ]);
    
    // Mock suppliers data
    partsService.getAllSuppliers.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <PartsUsagePage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    // Search for "Engine Oil"
    const searchInput = screen.getByPlaceholderText('Search parts...');
    fireEvent.change(searchInput, { target: { value: 'Engine Oil' } });

    // Check that search term is updated
    expect(searchInput).toHaveValue('Engine Oil');
  });

  test('toggles low stock filter', async () => {
    // Mock parts service response
    partsService.getAllParts.mockResolvedValue([]);
    partsService.getLowStockParts.mockResolvedValue([]);
    
    // Mock suppliers data
    partsService.getAllSuppliers.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <PartsUsagePage />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });

    // Check that the toggle button exists
    expect(screen.getByText('Show Low Stock Only')).toBeInTheDocument();
  });
});