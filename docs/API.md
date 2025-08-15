# Ultima Todo App API Documentation

## REST API (v1)

### Authentication
All endpoints under `/api/v1` require a valid Supabase session. Include the Supabase JWT in the `Authorization` header using the `Bearer <token>` scheme.

### Rate Limits
Requests are limited to **60 per minute** per IP address. Exceeding this will return HTTP 429 responses.

### Endpoints

#### `GET /api/v1/tasks`
Returns all tasks owned by the authenticated user.

#### `POST /api/v1/tasks`
Creates a new task for the authenticated user. Accepts a JSON body matching the task schema.

#### `GET /api/v1/projects`
Returns the user's projects.

#### `POST /api/v1/projects`
Creates a new project for the authenticated user.

#### `GET /api/v1/user/settings`
Returns the current user's settings object.

#### `PUT /api/v1/user/settings`
Upserts the user's settings object. Expects a JSON payload with the settings to apply.

### Webhooks

#### `POST /api/v1/hooks/tasks`
Allows external services to create or update tasks programmatically. Include a shared secret in the `x-webhook-secret` header. The body should contain an `action` field of `create` or `update` and the task `data`.

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