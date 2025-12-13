import { render, screen } from '@testing-library/react';
import Table, { TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../../components/Table';

describe('Table Component', () => {
  test('renders Table with children', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <td>Table Content</td>
          </tr>
        </tbody>
      </Table>
    );
    
    expect(screen.getByText('Table Content')).toBeInTheDocument();
  });

  test('applies default classes to Table', () => {
    render(<Table data-testid="table">Content</Table>);
    
    const table = screen.getByTestId('table');
    expect(table).toHaveClass('min-w-full', 'divide-y', 'divide-gray-200');
  });

  test('applies custom className to Table', () => {
    render(<Table className="custom-table-class" data-testid="table">Content</Table>);
    
    const table = screen.getByTestId('table');
    expect(table).toHaveClass('custom-table-class');
  });

  test('renders TableHead with children', () => {
    render(
      <TableHead>
        <tr>
          <th>Header Content</th>
        </tr>
      </TableHead>
    );
    
    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  test('applies default classes to TableHead', () => {
    render(<TableHead data-testid="thead">Header</TableHead>);
    
    const thead = screen.getByTestId('thead');
    expect(thead).toHaveClass('bg-gray-50');
  });

  test('applies custom className to TableHead', () => {
    render(<TableHead className="custom-thead-class" data-testid="thead">Header</TableHead>);
    
    const thead = screen.getByTestId('thead');
    expect(thead).toHaveClass('custom-thead-class');
  });

  test('renders TableBody with children', () => {
    render(
      <TableBody>
        <tr>
          <td>Body Content</td>
        </tr>
      </TableBody>
    );
    
    expect(screen.getByText('Body Content')).toBeInTheDocument();
  });

  test('applies default classes to TableBody', () => {
    render(<TableBody data-testid="tbody">Body</TableBody>);
    
    const tbody = screen.getByTestId('tbody');
    expect(tbody).toHaveClass('bg-white', 'divide-y', 'divide-gray-200');
  });

  test('applies custom className to TableBody', () => {
    render(<TableBody className="custom-tbody-class" data-testid="tbody">Body</TableBody>);
    
    const tbody = screen.getByTestId('tbody');
    expect(tbody).toHaveClass('custom-tbody-class');
  });

  test('renders TableRow with children', () => {
    render(
      <TableRow>
        <td>Row Content</td>
      </TableRow>
    );
    
    expect(screen.getByText('Row Content')).toBeInTheDocument();
  });

  test('applies custom className to TableRow', () => {
    render(<TableRow className="custom-row-class" data-testid="row">Row</TableRow>);
    
    const row = screen.getByTestId('row');
    expect(row).toHaveClass('custom-row-class');
  });

  test('renders TableHeaderCell with children', () => {
    render(<TableHeaderCell>Header Cell Content</TableHeaderCell>);
    
    expect(screen.getByText('Header Cell Content')).toBeInTheDocument();
  });

  test('applies default classes to TableHeaderCell', () => {
    render(<TableHeaderCell data-testid="th">Header Cell</TableHeaderCell>);
    
    const th = screen.getByTestId('th');
    expect(th).toHaveClass(
      'px-6', 'py-3', 'text-left', 'text-xs', 'font-medium', 
      'text-gray-500', 'uppercase', 'tracking-wider'
    );
  });

  test('applies custom className to TableHeaderCell', () => {
    render(<TableHeaderCell className="custom-th-class" data-testid="th">Header Cell</TableHeaderCell>);
    
    const th = screen.getByTestId('th');
    expect(th).toHaveClass('custom-th-class');
  });

  test('renders TableCell with children', () => {
    render(<TableCell>Cell Content</TableCell>);
    
    expect(screen.getByText('Cell Content')).toBeInTheDocument();
  });

  test('applies default classes to TableCell', () => {
    render(<TableCell data-testid="td">Cell</TableCell>);
    
    const td = screen.getByTestId('td');
    expect(td).toHaveClass('px-6', 'py-4', 'whitespace-nowrap', 'text-sm', 'text-gray-500');
  });

  test('applies custom className to TableCell', () => {
    render(<TableCell className="custom-td-class" data-testid="td">Cell</TableCell>);
    
    const td = screen.getByTestId('td');
    expect(td).toHaveClass('custom-td-class');
  });

  test('renders complete Table with all sub-components', () => {
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
          <TableRow>
            <TableCell>Jane Smith</TableCell>
            <TableCell>jane@example.com</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });
});