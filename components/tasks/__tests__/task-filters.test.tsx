import { render, screen, fireEvent } from '@testing-library/react';
import { TaskFilters } from '../task-filters';
import type { TaskStatus, TaskPriority } from '@/lib/types';

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect }: any) => <div onClick={onSelect}>{children}</div>,
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <div />,
}));

describe('TaskFilters', () => {
  const setup = (filters = { status: [] as TaskStatus[], priority: [] as TaskPriority[], search: '' }, onFiltersChange = jest.fn()) => {
    render(<TaskFilters filters={filters} onFiltersChange={onFiltersChange} />);
    return { onFiltersChange };
  };

  it('updates search input', () => {
    const { onFiltersChange } = setup();
    const input = screen.getByPlaceholderText('Search tasks...');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(onFiltersChange).toHaveBeenCalledWith({ status: [], priority: [], search: 'test' });
  });

  it('toggles status filter', async () => {
    const { onFiltersChange } = setup();
    const statusButton = screen.getByText('Status');
    fireEvent.click(statusButton);
    const option = await screen.findByText('In Progress');
    fireEvent.click(option);
    expect(onFiltersChange).toHaveBeenCalledWith({ status: ['In Progress'], priority: [], search: '' });
  });

  it('clears filters', () => {
    const filters = { status: ['To Do'] as TaskStatus[], priority: ['High'] as TaskPriority[], search: 'foo' };
    const { onFiltersChange } = setup(filters);
    const clear = screen.getByText('Clear');
    fireEvent.click(clear);
    expect(onFiltersChange).toHaveBeenCalledWith({ status: [], priority: [], search: '' });
  });
});
