import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Table, { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../Table';

describe('Table Component', () => {
  test('renders table with children', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <td>Table Cell</td>
          </tr>
        </tbody>
      </Table>
    );
    expect(screen.getByText('Table Cell')).toBeInTheDocument();
  });

  test('applies custom className to table', () => {
    const { container } = render(<Table className="custom-table-class">Content</Table>);
    const table = container.querySelector('table');
    expect(table).toHaveClass('custom-table-class');
  });

  test('renders TableHead component', () => {
    render(<TableHead>Header Content</TableHead>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  test('applies custom className to TableHead', () => {
    const { container } = render(<TableHead className="header-class">Header Content</TableHead>);
    const thead = container.firstChild;
    expect(thead).toHaveClass('header-class');
  });

  test('renders TableBody component', () => {
    render(<TableBody>Body Content</TableBody>);
    expect(screen.getByText('Body Content')).toBeInTheDocument();
  });

  test('applies custom className to TableBody', () => {
    const { container } = render(<TableBody className="body-class">Body Content</TableBody>);
    const tbody = container.firstChild;
    expect(tbody).toHaveClass('body-class');
  });

  test('renders TableRow component', () => {
    render(<TableRow>Row Content</TableRow>);
    expect(screen.getByText('Row Content')).toBeInTheDocument();
  });

  test('applies custom className to TableRow', () => {
    const { container } = render(<TableRow className="row-class">Row Content</TableRow>);
    const tr = container.firstChild;
    expect(tr).toHaveClass('row-class');
  });

  test('renders TableHeaderCell component', () => {
    render(<TableHeaderCell>Header Cell</TableHeaderCell>);
    expect(screen.getByText('Header Cell')).toBeInTheDocument();
  });

  test('applies custom className to TableHeaderCell', () => {
    const { container } = render(<TableHeaderCell className="header-cell-class">Header Cell</TableHeaderCell>);
    const th = container.firstChild;
    expect(th).toHaveClass('header-cell-class');
  });

  test('renders TableCell component', () => {
    render(<TableCell>Table Cell</TableCell>);
    expect(screen.getByText('Table Cell')).toBeInTheDocument();
  });

  test('applies custom className to TableCell', () => {
    const { container } = render(<TableCell className="cell-class">Table Cell</TableCell>);
    const td = container.firstChild;
    expect(td).toHaveClass('cell-class');
  });

  test('renders complete table with all sub-components', () => {
    render(
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});