# Ultima Todo App API Documentation

## Task API

### Task Object Structure

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Complete';
  priority: 'Low' | 'Medium' | 'High';
  due_date: string;      // ISO string
  start_time?: string;   // HH:mm format
  end_time?: string;     // HH:mm format
}
```

### Task Operations

#### Create Task
```typescript
async function createTask(task: Partial<Task>): Promise<Task>
```
- Creates a new task
- Default duration: 30 minutes
- Returns created task with ID

#### Update Task
```typescript
async function updateTask(taskId: string, updates: Partial<Task>): Promise<void>
```
- Partially updates task properties
- Maintains task duration when moving
- Validates time constraints

#### Delete Task
```typescript
async function deleteTask(taskId: string): Promise<void>
```
- Permanently removes task
- Cascades to related data

## Timeline API

### Time Slot Structure
```typescript
interface TimeSlot {
  hour: number;      // 0-23
  minute: number;    // 0 or 30
  tasks: Task[];     // Tasks starting at this slot
}
```

### Timeline Operations

#### Get Tasks for Date
```typescript
async function getTasksForDate(date: Date): Promise<Task[]>
```
- Returns all tasks for specified date
- Sorted by start time
- Includes task details

#### Move Task
```typescript
async function moveTask(
  taskId: string, 
  newDate: Date, 
  newTime: string
): Promise<void>
```
- Updates task date and time
- Preserves duration
- Handles timezone differences

## Real-time Updates

### Subscribe to Changes
```typescript
function subscribeToTasks(
  callback: (tasks: Task[]) => void
): () => void
```
- Receives real-time task updates
- Returns unsubscribe function
- Handles reconnection

### Sync Status
```typescript
interface SyncStatus {
  lastSynced: Date;
  isPending: boolean;
  error?: Error;
}
```

## Error Handling

### Error Types
```typescript
type TaskError = 
  | 'INVALID_TIME'
  | 'OVERLAP_CONFLICT'
  | 'NETWORK_ERROR'
  | 'PERMISSION_DENIED';
```

### Error Responses
```typescript
interface ErrorResponse {
  code: TaskError;
  message: string;
  details?: any;
}
```

## Data Validation

### Time Constraints
- Minimum duration: 15 minutes
- Maximum duration: 8 hours
- 30-minute slot alignment

### Task Validation
```typescript
interface TaskValidation {
  title: string[];       // Required, max 100 chars
  priority: string[];    // Must be valid priority
  due_date: string[];    // Must be valid date
  time: string[];       // Must be HH:mm format
}
```

## Performance Considerations

### Batch Operations
```typescript
async function batchUpdateTasks(
  updates: Array<[string, Partial<Task>]>
): Promise<void>
```
- Optimizes multiple updates
- Maintains consistency
- Handles failures gracefully

### Caching Strategy
- Client-side cache with TTL
- Optimistic updates
- Background sync 