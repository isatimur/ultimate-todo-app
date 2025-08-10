import { render, screen, fireEvent } from '@testing-library/react';
import { TaskSort } from '../task-sort';

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onSelect }: any) => <div onClick={onSelect}>{children}</div>,
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <div />,
}));

describe('TaskSort', () => {
  it('changes sort option and direction', async () => {
    const onSortChange = jest.fn();
    render(<TaskSort sortConfig={{ key: 'title', direction: 'asc' }} onSortChange={onSortChange} />);

    fireEvent.click(screen.getByText(/Sort by/i));
    const option = await screen.findByText('Due Date');
    fireEvent.click(option);
    expect(onSortChange).toHaveBeenCalledWith({ key: 'due_date', direction: 'asc' });

    const toggle = screen.getAllByRole('button')[1];
    fireEvent.click(toggle);
    expect(onSortChange).toHaveBeenCalledWith({ key: 'title', direction: 'desc' });
  });
});
