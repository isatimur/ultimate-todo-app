import type { DropResult } from '@hello-pangea/dnd';
import type { Task } from '@/lib/types';

type Column = { id: string; title: string; tasks: Task[] };

function move(columns: Column[], result: DropResult): Column[] {
  const { source, destination, draggableId } = result;
  if (!destination) return columns;
  const sourceCol = columns.find(c => c.id === source.droppableId)!;
  const destCol = columns.find(c => c.id === destination.droppableId)!;
  const taskIndex = source.index;
  const [task] = sourceCol.tasks.splice(taskIndex, 1);
  task.status = destCol.title as any;
  destCol.tasks.splice(destination.index, 0, task);
  return columns;
}

describe('Task drag and drop logic', () => {
  it('moves task between columns', () => {
    const columns: Column[] = [
      { id: 'todo', title: 'To Do', tasks: [{ id: '1', title: 'Task', status: 'To Do', priority: 'Low' } as Task] },
      { id: 'in-progress', title: 'In Progress', tasks: [] }
    ];
    const result: DropResult = {
      draggableId: '1',
      type: 'DEFAULT',
      reason: 'DROP',
      mode: 'FLUID',
      source: { droppableId: 'todo', index: 0 },
      destination: { droppableId: 'in-progress', index: 0 },
      combine: null
    };
    const updated = move(columns, result);
    expect(updated[0].tasks).toHaveLength(0);
    expect(updated[1].tasks[0].id).toBe('1');
  });
});
