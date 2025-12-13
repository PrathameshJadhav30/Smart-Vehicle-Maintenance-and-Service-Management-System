import { render, screen } from '@testing-library/react';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/Card';

describe('Card Component', () => {
  test('renders Card with children', () => {
    render(
      <Card>
        <div>Card Content</div>
      </Card>
    );
    
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  test('applies default classes to Card', () => {
    render(<Card data-testid="card">Content</Card>);
    
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-white', 'shadow', 'rounded-lg', 'overflow-hidden');
  });

  test('applies custom className to Card', () => {
    render(<Card className="custom-class" data-testid="card">Content</Card>);
    
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-class');
  });

  test('renders CardHeader with children', () => {
    render(
      <CardHeader>
        <h1>Header Content</h1>
      </CardHeader>
    );
    
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  test('applies default classes to CardHeader', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);
    
    const header = screen.getByTestId('header');
    expect(header).toHaveClass('px-4', 'py-5', 'sm:px-6', 'border-b', 'border-gray-200');
  });

  test('applies custom className to CardHeader', () => {
    render(<CardHeader className="custom-header-class" data-testid="header">Header</CardHeader>);
    
    const header = screen.getByTestId('header');
    expect(header).toHaveClass('custom-header-class');
  });

  test('renders CardBody with children', () => {
    render(
      <CardBody>
        <p>Body Content</p>
      </CardBody>
    );
    
    expect(screen.getByText('Body Content')).toBeInTheDocument();
  });

  test('applies default classes to CardBody', () => {
    render(<CardBody data-testid="body">Body</CardBody>);
    
    const body = screen.getByTestId('body');
    expect(body).toHaveClass('px-4', 'py-5', 'sm:p-6');
  });

  test('applies custom className to CardBody', () => {
    render(<CardBody className="custom-body-class" data-testid="body">Body</CardBody>);
    
    const body = screen.getByTestId('body');
    expect(body).toHaveClass('custom-body-class');
  });

  test('renders CardFooter with children', () => {
    render(
      <CardFooter>
        <p>Footer Content</p>
      </CardFooter>
    );
    
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  test('applies default classes to CardFooter', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    
    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('px-4', 'py-4', 'sm:px-6', 'border-t', 'border-gray-200');
  });

  test('applies custom className to CardFooter', () => {
    render(<CardFooter className="custom-footer-class" data-testid="footer">Footer</CardFooter>);
    
    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('custom-footer-class');
  });

  test('renders complete Card with all sub-components', () => {
    render(
      <Card>
        <CardHeader>
          <h1>Card Header</h1>
        </CardHeader>
        <CardBody>
          <p>Card Body</p>
        </CardBody>
        <CardFooter>
          <p>Card Footer</p>
        </CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Header')).toBeInTheDocument();
    expect(screen.getByText('Card Body')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });
});