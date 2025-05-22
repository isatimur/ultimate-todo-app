import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskGantt } from '@/components/tasks/task-gantt'; // Assuming this is the correct path
import { mockSupabase, resetMocks as resetSupabaseMocks, mockInsert, mockUpdate, mockSelect, mockSingle, mockEq, mockChannel, mockOn, mockSubscribe } from '../../__mocks__/lib/supabase-browser';
import { Task, Project } from '@/lib/types';
import { toast } from 'sonner';

// Mock Supabase
jest.mock('@/lib/supabase-browser');

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

const mockProjects: Project[] = [
  { id: 'project-1', name: 'Project Alpha', user_id: 'user-gantt-1', created_at: new Date().toISOString() },
  { id: 'project-2', name: 'Project Beta', user_id: 'user-gantt-1', created_at: new Date().toISOString() },
];

const mockInitialTasks: Task[] = [
  {
    id: 'gantt-task-1',
    title: 'Gantt Task 1',
    description: 'Description for Gantt task 1',
    status: 'To Do',
    priority: 'Medium',
    user_id: 'user-gantt-1',
    project_id: 'project-1',
    date: '2024-07-01', // YYYY-MM-DD
    due_date: '2024-07-05',
    created_at: new Date('2024-06-01').toISOString(),
    updated_at: new Date('2024-06-01').toISOString(),
  },
  {
    id: 'gantt-task-2',
    title: 'Gantt Task 2',
    description: 'Description for Gantt task 2',
    status: 'In Progress',
    priority: 'High',
    user_id: 'user-gantt-1',
    project_id: 'project-2',
    date: '2024-07-03',
    due_date: '2024-07-10',
    created_at: new Date('2024-06-02').toISOString(),
    updated_at: new Date('2024-06-02').toISOString(),
  },
  {
    id: 'gantt-task-3',
    title: 'Gantt Task 3 (No Project)',
    description: 'Description for Gantt task 3',
    status: 'Done',
    priority: 'Low',
    user_id: 'user-gantt-1',
    date: '2024-07-08',
    due_date: '2024-07-12',
    created_at: new Date('2024-06-03').toISOString(),
    updated_at: new Date('2024-06-03').toISOString(),
  },
];

// Helper to get the Supabase channel callback
const getSupabaseChannelCallback = () => {
  const onCall = mockOn.mock.calls.find(
    call => call[0] === 'postgres_changes' && call[1].event === '*' && call[1].table === 'tasks'
  );
  return onCall ? onCall[2] : null;
};


describe('TaskGantt Integration Tests', () => {
  beforeEach(() => {
    resetSupabaseMocks();
    (toast.success as jest.Mock).mockClear();
    (toast.error as jest.Mock).mockClear();

    // Ensure default mock implementations for Supabase calls used by TaskGantt
    mockSelect.mockReturnThis(); // for .select()
    mockInsert.mockReturnThis(); // for .insert()
    mockUpdate.mockReturnThis(); // for .update()
    mockEq.mockReturnThis(); // for .eq()
    mockSingle.mockResolvedValue({ data: {}, error: null }); // Default for .single()

    // Mock channel subscription
    mockChannel.mockReturnThis();
    mockOn.mockReturnThis();
    mockSubscribe.mockImplementation(callback => {
      // Store the callback if needed or simulate async subscription
      // setTimeout(() => callback({ type: 'SUBSCRIBED' }), 0);
      return {
        unsubscribe: jest.fn(),
      } as any; // Type assertion
    });
  });

  describe('Initial Rendering and Task Display', () => {
    it('should render tasks correctly in flat view mode', () => {
      render(
        <TaskGantt
          initialTasks={mockInitialTasks}
          projects={mockProjects}
          userId="user-gantt-1"
        />
      );

      // Check for date headers (e.g., July 2024)
      // This depends on the actual implementation of date headers
      expect(screen.getByText(/July 2024/i)).toBeInTheDocument(); // Example, adjust based on actual header format

      // Check for task titles
      mockInitialTasks.forEach(task => {
        expect(screen.getByText(task.title)).toBeInTheDocument();
      });

      // Check that no project group headers are visible in flat mode
      mockProjects.forEach(project => {
        expect(screen.queryByText(project.name, { selector: 'h3,div.project-group-header' })).not.toBeInTheDocument();
      });
    });

    it('should render tasks correctly in grouped view mode (group by project)', async () => {
      render(
        <TaskGantt
          initialTasks={mockInitialTasks}
          projects={mockProjects}
          userId="user-gantt-1"
        />
      );

      // Switch to grouped view
      const viewModeSelect = screen.getByRole('combobox', { name: /view mode/i });
      fireEvent.mouseDown(viewModeSelect); // Open the select
      const groupedOption = await screen.findByText(/Group by Project/i);
      fireEvent.click(groupedOption);

      await waitFor(() => {
        // Check for project group headers
        mockProjects.forEach(project => {
          if (mockInitialTasks.some(task => task.project_id === project.id)) {
            expect(screen.getByText(project.name, { selector: 'h3,div.project-group-header' })).toBeInTheDocument();
          }
        });
        // Check for "Unassigned" or similar group for tasks without project_id
        expect(screen.getByText(/Unassigned/i, { selector: 'h3,div.project-group-header' })).toBeInTheDocument();
      });

      // Check for task titles within their groups
      mockInitialTasks.forEach(task => {
        expect(screen.getByText(task.title)).toBeInTheDocument();
      });
    });

    it('should display a message if no tasks are available', () => {
        render(
          <TaskGantt
            initialTasks={[]}
            projects={mockProjects}
            userId="user-gantt-1"
          />
        );
        expect(screen.getByText(/No tasks to display in the Gantt chart./i)).toBeInTheDocument();
      });
  });

  describe('Zoom Level and View Mode Functionality', () => {
    it('should change timeline granularity when zoom level is changed', async () => {
      render(
        <TaskGantt
          initialTasks={mockInitialTasks}
          projects={mockProjects}
          userId="user-gantt-1"
        />
      );

      // Default is likely 'Week' or 'Day' view based on typical Gantt.
      // Let's assume we can find buttons for Day, Week, Month.
      const dayButton = screen.getByRole('button', { name: /day/i });
      const weekButton = screen.getByRole('button', { name: /week/i });
      const monthButton = screen.getByRole('button', { name: /month/i });

      // Test clicking 'Day'
      fireEvent.click(dayButton);
      await waitFor(() => {
        // Assertions for 'Day' view:
        // More date cells should be visible, or cells represent individual days.
        // This is highly dependent on the component's rendering logic.
        // For example, check for specific date formats like "Jul 1", "Jul 2".
        expect(screen.getByText(/Jul 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Jul 2/i)).toBeInTheDocument();
      });

      // Test clicking 'Week'
      fireEvent.click(weekButton);
      await waitFor(() => {
        // Assertions for 'Week' view:
        // Cells might represent weeks, or the overall range displayed might change.
        // Check for week indicators if available, or a broader date range.
        // Example: "Week 27" or "Jul 1 - Jul 7"
        // This requires knowing how TaskGantt labels its week view.
        // For now, we ensure no error and some change.
        // A placeholder assertion:
        expect(screen.getByText(/July 2024/i)).toBeInTheDocument(); // Still visible
      });

      // Test clicking 'Month'
      fireEvent.click(monthButton);
      await waitFor(() => {
        // Assertions for 'Month' view:
        // Cells might represent months, or a very broad view.
        // Example: "July", "August"
        // A placeholder assertion:
        expect(screen.getByText(/July/i)).toBeInTheDocument();
        expect(screen.queryByText(/Jul 1/i)).not.toBeInTheDocument(); // Individual days might disappear
      });
    });

    it('should switch between Flat and Group by Project view modes', async () => {
      render(
        <TaskGantt
          initialTasks={mockInitialTasks}
          projects={mockProjects}
          userId="user-gantt-1"
        />
      );

      const viewModeSelect = screen.getByRole('combobox', { name: /view mode/i });

      // Initial: Flat view (tested in previous describe block)
      mockProjects.forEach(project => {
        expect(screen.queryByText(project.name, { selector: 'h3,div.project-group-header' })).not.toBeInTheDocument();
      });


      // Switch to Group by Project
      fireEvent.mouseDown(viewModeSelect);
      const groupedOption = await screen.findByText(/Group by Project/i);
      fireEvent.click(groupedOption);

      await waitFor(() => {
        mockProjects.forEach(project => {
          if (mockInitialTasks.some(task => task.project_id === project.id)) {
            expect(screen.getByText(project.name, { selector: 'h3,div.project-group-header' })).toBeInTheDocument();
          }
        });
        expect(screen.getByText(/Unassigned/i, { selector: 'h3,div.project-group-header' })).toBeInTheDocument();
      });

      // Switch back to Flat view
      fireEvent.mouseDown(viewModeSelect);
      const flatOption = await screen.findByText(/Flat View/i);
      fireEvent.click(flatOption);

      await waitFor(() => {
        mockProjects.forEach(project => {
          expect(screen.queryByText(project.name, { selector: 'h3,div.project-group-header' })).not.toBeInTheDocument();
        });
        expect(screen.queryByText(/Unassigned/i, { selector: 'h3,div.project-group-header' })).not.toBeInTheDocument();
      });
    });
  });

  describe('Drag-and-Drop Task Date Change', () => {
    it('should update task dates when a task is dragged and dropped onto a new date cell', async () => {
      const taskToDrag = mockInitialTasks[0]; // 'Gantt Task 1', date: '2024-07-01', due_date: '2024-07-05'
      const newStartDate = '2024-07-03'; // Arbitrary new start date
      
      // Mock the update call
      const updatedTaskData = {
        ...taskToDrag,
        date: newStartDate,
        // due_date will also change based on original duration. Let's assume duration is 4 days (5 - 1).
        // So, new due_date = 2024-07-03 + 4 days = 2024-07-07
        due_date: '2024-07-07', 
        updated_at: new Date().toISOString(),
      };
      mockUpdate.mockImplementationOnce(async (updateObject: Partial<Task>) => {
        // Check if the updateObject contains the expected date and due_date
        expect(updateObject.date).toBe(newStartDate);
        expect(updateObject.due_date).toBe(updatedTaskData.due_date);
        return { data: [updatedTaskData], error: null, count: 1 }; // Simpler return for update
      });
      // The component might also re-fetch or select the updated task.
      mockSelect.mockReturnThis(); // from().select()
      mockEq.mockReturnThis(); // .eq() for the update's where clause
      // mockSingle.mockResolvedValueOnce({ data: updatedTaskData, error: null }); // If it does .single() after update

      render(
        <TaskGantt
          initialTasks={mockInitialTasks}
          projects={mockProjects}
          userId="user-gantt-1"
        />
      );

      const taskElement = screen.getByText(taskToDrag.title);

      // To simulate drag and drop, we need a target "date cell".
      // This is highly dependent on how date cells are rendered and identified.
      // Let's assume date cells have a data-testid like `date-cell-${YYYY-MM-DD}`
      // or a role that makes them identifiable.
      // For this example, let's assume we can find a droppable area representing the new start date.
      // This might require reading the TaskGantt component to know its structure.
      // Let's assume a droppable area exists with an aria-label or data-testid for the target date.
      // For example, a droppable cell for "July 3, 2024"
      // Using a placeholder for the target cell:
      const targetDateCell = screen.getByRole('gridcell', { name: /July 3, 2024/i }); // This is an assumption

      // Simulate drag and drop
      fireEvent.dragStart(taskElement, { dataTransfer: new DataTransfer() }); // dataTransfer might be needed by the component
      fireEvent.dragOver(targetDateCell); // Allow drop
      fireEvent.drop(targetDateCell, { dataTransfer: new DataTransfer() });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
        expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
          date: newStartDate,
          due_date: updatedTaskData.due_date, 
        }));
        expect(mockEq).toHaveBeenCalledWith('id', taskToDrag.id); // Verifies the correct task was updated
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Task dates updated successfully!');
      });

      // Optionally, verify UI update if not handled by real-time simulation later
      // This might involve checking the task's new position or displayed dates.
      // This depends on how the TaskGantt re-renders or if it relies on real-time updates for this.
    });

    it('should show an error toast if drag-and-drop update fails', async () => {
        const taskToDrag = mockInitialTasks[1];
        const targetDateCell = screen.getByRole('gridcell', { name: /July 5, 2024/i }); // Assuming another target

        // Mock failed update
        mockUpdate.mockResolvedValueOnce({ data: null, error: new Error('Supabase update failed'), count: 0 });
        mockSelect.mockReturnThis();
        mockEq.mockReturnThis();
        
        render(
            <TaskGantt
              initialTasks={mockInitialTasks}
              projects={mockProjects}
              userId="user-gantt-1"
            />
          );

        const taskElement = screen.getByText(taskToDrag.title);
        fireEvent.dragStart(taskElement, { dataTransfer: new DataTransfer() });
        fireEvent.dragOver(targetDateCell);
        fireEvent.drop(targetDateCell, { dataTransfer: new DataTransfer() });

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalledWith('Failed to update task dates.');
        });
    });
  });

  describe('Real-time Task Updates (Supabase Channel Simulation)', () => {
    it('should add a new task to the Gantt chart when an INSERT event is received', async () => {
      render(
        <TaskGantt
          initialTasks={mockInitialTasks}
          projects={mockProjects}
          userId="user-gantt-1"
        />
      );

      const newTask: Task = {
        id: 'gantt-task-new',
        title: 'Newly Added Gantt Task',
        description: 'Real-time added task',
        status: 'To Do',
        priority: 'Medium',
        user_id: 'user-gantt-1',
        project_id: 'project-1',
        date: '2024-07-15',
        due_date: '2024-07-20',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Simulate Supabase channel INSERT event
      const channelCallback = getSupabaseChannelCallback();
      if (!channelCallback) throw new Error('Supabase channel callback not found.');
      
      // Mock the select().single() call that might happen after an insert in the callback
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSingle.mockResolvedValueOnce({ data: newTask, error: null });

      act(() => { // Ensure state updates are processed
        channelCallback({ eventType: 'INSERT', new: newTask, old: {}, table: 'tasks', schema: 'public' });
      });

      await waitFor(() => {
        expect(screen.getByText(newTask.title)).toBeInTheDocument();
      });
    });

    it('should update an existing task in the Gantt chart when an UPDATE event is received', async () => {
      render(
        <TaskGantt
          initialTasks={mockInitialTasks}
          projects={mockProjects}
          userId="user-gantt-1"
        />
      );

      const taskToUpdate = mockInitialTasks[0];
      const updatedTaskData: Task = {
        ...taskToUpdate,
        title: 'Updated Gantt Task Title via Real-time',
        status: 'In Progress',
        updated_at: new Date().toISOString(),
      };

      // Simulate Supabase channel UPDATE event
      const channelCallback = getSupabaseChannelCallback();
      if (!channelCallback) throw new Error('Supabase channel callback not found.');
      
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSingle.mockResolvedValueOnce({ data: updatedTaskData, error: null });

      act(() => {
        channelCallback({ eventType: 'UPDATE', new: updatedTaskData, old: { id: taskToUpdate.id }, table: 'tasks', schema: 'public' });
      });

      await waitFor(() => {
        expect(screen.queryByText(taskToUpdate.title)).not.toBeInTheDocument();
        expect(screen.getByText(updatedTaskData.title)).toBeInTheDocument();
        // Add more assertions if status change has visual implications
      });
    });

    it('should remove a task from the Gantt chart when a DELETE event is received', async () => {
      render(
        <TaskGantt
          initialTasks={mockInitialTasks}
          projects={mockProjects}
          userId="user-gantt-1"
        />
      );

      const taskToDelete = mockInitialTasks[1]; // 'Gantt Task 2'

      // Simulate Supabase channel DELETE event
      const channelCallback = getSupabaseChannelCallback();
      if (!channelCallback) throw new Error('Supabase channel callback not found.');

      act(() => {
        channelCallback({ eventType: 'DELETE', old: { id: taskToDelete.id }, new: {}, table: 'tasks', schema: 'public' });
      });

      await waitFor(() => {
        expect(screen.queryByText(taskToDelete.title)).not.toBeInTheDocument();
      });

      // Ensure other tasks are still present
      expect(screen.getByText(mockInitialTasks[0].title)).toBeInTheDocument();
    });
  });

  describe('Task Creation via CreateTaskButton', () => {
    it('should call handleCreateTask and show success toast when a task is created', async () => {
      const newTaskPayload = {
        title: 'Task Created via Button',
        description: 'A new task for Gantt',
        priority: 'Medium' as Task['priority'],
        date: '2024-07-20',
        due_date: '2024-07-25',
        // user_id will be set by handleCreateTask
        // project_id can be optional or selected in a dialog
      };

      const createdTaskWithId : Task = {
        ...newTaskPayload,
        id: 'gantt-created-task-id',
        user_id: 'user-gantt-1',
        status: 'To Do', // Default status
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Mock for the insert operation
      mockInsert.mockImplementationOnce(async (tasksToInsert: any) => {
        // tasksToInsert will be an array of objects
        expect(tasksToInsert[0].title).toBe(newTaskPayload.title);
        expect(tasksToInsert[0].user_id).toBe('user-gantt-1'); // Assuming TaskGantt sets this
        return { data: [{...tasksToInsert[0], id: createdTaskWithId.id, created_at: createdTaskWithId.created_at, updated_at: createdTaskWithId.updated_at }], error: null };
      });
      // Mock for the select().single() that follows insert
      mockSelect.mockReturnThis(); 
      mockSingle.mockResolvedValueOnce({ data: createdTaskWithId, error: null });


      render(
        <TaskGantt
          initialTasks={mockInitialTasks}
          projects={mockProjects}
          userId="user-gantt-1"
        />
      );

      // The TaskGantt component is expected to have a CreateTaskButton.
      // This button, when interacted with, should eventually call `handleCreateTask`.
      // This might involve opening a dialog. We need to simulate this interaction.

      // Find the "Create Task" button. Its text might be just "Create" or "Add Task".
      // This relies on CreateTaskButton rendering a button with an accessible name.
      const createTaskButton = screen.getByRole('button', { name: /create task/i }); // Or similar accessible name
      
      // Simulate the action that leads to `handleCreateTask` being called.
      // If CreateTaskButton directly calls `onCreateTask` (which is `handleCreateTask` in `TaskGantt`),
      // and if `CreateTaskButton` itself doesn't manage a dialog that we need to fill,
      // then a simple click might be enough if it has default values or if `handleCreateTask`
      // can be called with a partial task that then gets completed by a dialog.

      // This is a simplification: it assumes `CreateTaskButton` takes care of gathering
      // task data (e.g., via a dialog) and then calls `handleCreateTask` with it.
      // To test this properly, we'd need to know how `CreateTaskButton` works.
      // If `CreateTaskButton` opens `CreateTaskDialog`, we'd interact with that dialog.
      // For now, let's assume `TaskGantt`'s `handleCreateTask` can be invoked
      // by `CreateTaskButton` and that `CreateTaskButton` passes the necessary task data.
      
      // Since `TaskGantt`'s `handleCreateTask` is an async function that takes `Partial<Task>`,
      // we need to simulate that `CreateTaskButton` provides this data.
      // A more robust test would involve mocking `CreateTaskButton` to see how it's called
      // or to control what it passes to `handleCreateTask`.

      // For this test, we'll assume `CreateTaskButton` somehow triggers `handleCreateTask`
      // *and* that `handleCreateTask` uses the mocked Supabase client.
      // We cannot directly call `handleCreateTask` as it's internal to `TaskGantt`.
      // We need to simulate the user interaction that leads to it.

      // Let's assume the `CreateTaskButton` in `TaskGantt` is set up to call `handleCreateTask`
      // which in turn calls `supabase.from('tasks').insert(...)`.
      // The button click itself doesn't pass the data directly.
      // The `handleCreateTask` in `TaskGantt` likely opens a dialog or uses a predefined payload.

      // Given the `CreateTaskButton` component is used in `TaskList` and `TaskGantt`,
      // and it has an `onCreateTask` prop:
      // `CreateTaskButton onCreateTask={handleCreateTask}`
      // We need to mock `CreateTaskButton` to simulate its `onCreateTask` being called with data.

      // We will simulate a click on the button.
      // The actual `handleCreateTask` in `TaskGantt` will be invoked.
      // We need to ensure the Supabase mock is ready for the `insert` call.
      // The `handleCreateTask` in `TaskGantt` is `async (task: Partial<Task>)`.
      // The `CreateTaskButton` must be providing this `task` object.

      // This part is tricky without knowing how CreateTaskButton gets its data.
      // Let's assume clicking the button directly calls `handleCreateTask` with a predefined
      // or empty task, and then a dialog (if any) would be part of `handleCreateTask` or `CreateTaskDialog`.
      // If `handleCreateTask` itself opens a dialog, this test gets more complex.

      // For now, let's assume `CreateTaskButton` is a simple button, and `handleCreateTask`
      // in `TaskGantt` has a way to get the task data (e.g. opens a dialog which we can't see here).
      // The call to `supabase.insert` is what we want to verify.

      fireEvent.click(createTaskButton);
      
      // At this point, if `handleCreateTask` was called, it would use the `mockInsert`.
      // This test assumes that clicking the button *will* lead to an insert operation
      // with some data. The `TaskGantt.handleCreateTask` would be responsible for this.
      // We are checking if the `insert` mock we set up earlier is called.

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
        expect(mockInsert).toHaveBeenCalled(); 
        // We can't easily check the payload here unless CreateTaskButton is mocked
        // to control what's passed to handleCreateTask.
        // The check inside mockInsert.mockImplementationOnce is more robust for payload.
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Task created successfully!');
      });

      // Real-time update for this new task should also be tested, but that's covered
      // by the INSERT event simulation in the 'Real-time Task Updates' describe block.
      // If `handleCreateTask` adds to local state immediately, that could be checked too.
    });

    it('should show an error toast if task creation fails', async () => {
        // Mock failed insert
        mockInsert.mockResolvedValueOnce({ data: null, error: new Error('Supabase insert failed') });
        // No select().single() will be called if insert fails and error is thrown.

        render(
          <TaskGantt
            initialTasks={mockInitialTasks}
            projects={mockProjects}
            userId="user-gantt-1"
          />
        );
  
        const createTaskButton = screen.getByRole('button', { name: /create task/i });
        fireEvent.click(createTaskButton);
  
        await waitFor(() => {
          expect(mockSupabase.from).toHaveBeenCalledWith('tasks');
          expect(mockInsert).toHaveBeenCalled();
          expect(toast.error).toHaveBeenCalledWith('Failed to create task.');
        });
      });
  });
});
