import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Card, { CardHeader, CardBody, CardFooter } from '../Card';

describe('Card Component', () => {
  test('renders card with children', () => {
    render(
      <Card>
        <div>Card Content</div>
      </Card>
    );
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  test('applies custom className to card', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  test('renders CardHeader component', () => {
    render(<CardHeader>Title</CardHeader>);
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  test('applies custom className to CardHeader', () => {
    const { container } = render(<CardHeader className="header-class">Title</CardHeader>);
    const header = container.firstChild;
    expect(header).toHaveClass('header-class');
  });

  test('renders CardBody component', () => {
    render(<CardBody>Body Content</CardBody>);
    expect(screen.getByText('Body Content')).toBeInTheDocument();
  });

  test('applies custom className to CardBody', () => {
    const { container } = render(<CardBody className="body-class">Body Content</CardBody>);
    const body = container.firstChild;
    expect(body).toHaveClass('body-class');
  });

  test('renders CardFooter component', () => {
    render(<CardFooter>Footer Content</CardFooter>);
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  test('applies custom className to CardFooter', () => {
    const { container } = render(<CardFooter className="footer-class">Footer Content</CardFooter>);
    const footer = container.firstChild;
    expect(footer).toHaveClass('footer-class');
  });

  test('renders complete card with all sub-components', () => {
    render(
      <Card>
        <CardHeader>Card Title</CardHeader>
        <CardBody>Card Body</CardBody>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Body')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });
});