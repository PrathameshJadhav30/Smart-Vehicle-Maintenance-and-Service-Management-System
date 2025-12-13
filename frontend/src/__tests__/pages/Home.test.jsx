import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../../pages/Home';
import Button from '../../components/Button';

// Mock the Button component to simplify testing
vi.mock('../../components/Button', () => ({
  __esModule: true,
  default: ({ children, variant, size, className, ...props }) => (
    <button 
      className={`mock-button ${variant || ''} ${size || ''} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  )
}));

// Mock react-router-dom Link component
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    )
  };
});

describe('Home Page', () => {
  test('renders hero section with title and description', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    // Check that the main heading exists
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    
    // Check for the description text
    expect(screen.getByText(/A complete platform to manage vehicle servicing, booking, inventory and job cards with ease and efficiency/i)).toBeInTheDocument();
  });

  test('renders sign in and create account buttons', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /Sign In/i})).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create Account/i})).toBeInTheDocument();
  });

  test('renders features section with all features', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText(/Everything you need for Service Management/i)).toBeInTheDocument();
    
    // Check for all three features using more specific queries
    expect(screen.getByText('Service Booking')).toBeInTheDocument();
    expect(screen.getByText(/Book vehicle services with flexible scheduling and automated reminders/i)).toBeInTheDocument();
    
    expect(screen.getByText('Job Card Management')).toBeInTheDocument();
    expect(screen.getByText(/Track repair progress with task assignments and real-time updates/i)).toBeInTheDocument();
    
    expect(screen.getByText('Inventory Management')).toBeInTheDocument();
    expect(screen.getByText(/Track spare parts with low stock alerts and automated reordering/i)).toBeInTheDocument();
  });

  test('renders stats section with correct values', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText(/Trusted by Thousands/i)).toBeInTheDocument();
    expect(screen.getByText('2,500')).toBeInTheDocument();
    expect(screen.getByText(/Vehicles Managed/i)).toBeInTheDocument();
    expect(screen.getByText('12,000')).toBeInTheDocument();
    expect(screen.getByText(/Service Bookings/i)).toBeInTheDocument();
    expect(screen.getByText('340')).toBeInTheDocument();
    expect(screen.getByText(/Expert Mechanics/i)).toBeInTheDocument();
  });

  test('renders testimonials section', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Testimonials')).toBeInTheDocument();
    expect(screen.getByText(/What Our Customers Say/i)).toBeInTheDocument();
    
    // Check for at least one testimonial
    expect(screen.getByText(/This platform has transformed how we manage our fleet maintenance/i)).toBeInTheDocument();
  });

  test('renders call to action section', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText(/Ready to Transform Your Vehicle Management?/i)).toBeInTheDocument();
    expect(screen.getByText(/Join thousands of businesses already using our platform to streamline their vehicle maintenance operations/i)).toBeInTheDocument();
    
    expect(screen.getByRole('link', { name: /Get Started Free/i})).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Request Demo/i})).toBeInTheDocument();
  });

  test('has correct navigation links', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const signInLink = screen.getByRole('link', { name: /Sign In/i});
    expect(signInLink).toHaveAttribute('href', '/login');
    
    const createAccountLink = screen.getByRole('link', { name: /Create Account/i});
    expect(createAccountLink).toHaveAttribute('href', '/register');
    
    const getStartedLink = screen.getByRole('link', { name: /Get Started Free/i});
    expect(getStartedLink).toHaveAttribute('href', '/register');
    
    const requestDemoLink = screen.getByRole('link', { name: /Request Demo/i});
    expect(requestDemoLink).toHaveAttribute('href', '/register');
  });
});