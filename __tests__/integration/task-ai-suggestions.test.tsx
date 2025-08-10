import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { QuickAddTaskBar } from '@/components/quick-add-task-bar';
import type { Task } from '@/lib/types';

function Wrapper() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const getAISuggestions = async () => [{ title: 'Suggested Task' }];
  const onAddTask = async (task: Partial<Task>) => {
    const newTask = { id: Math.random().toString(), title: task.title || '', status: 'To Do', priority: 'Low' } as Task;
    setTasks(prev => [...prev, newTask]);
  };
  return (
    <div>
      <QuickAddTaskBar columnId="todo" onAddTask={onAddTask} getAISuggestions={getAISuggestions} projects={[]} />
      <ul>
        {tasks.map(t => (
          <li key={t.id}>{t.title}</li>
        ))}
      </ul>
    </div>
  );
}

describe('AI suggestions', () => {
  it('applies a suggested task', async () => {
    render(<Wrapper />);
    fireEvent.click(screen.getByText('Add task'));
    fireEvent.change(screen.getByPlaceholderText('Enter task title...'), { target: { value: 'foo' } });
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // AI suggestion button
    fireEvent.click(await screen.findByText('Suggested Task'));
    await waitFor(() => {
      expect(screen.getByText('Suggested Task')).toBeInTheDocument();
    });
  });
});
