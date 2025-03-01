# Development Guide

## Environment Setup

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Git
- VS Code (recommended)

### VS Code Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript + JavaScript
- Error Lens

### Initial Setup
1. Clone and install dependencies:
```bash
git clone https://github.com/yourusername/ultima-todo-app.git
cd ultima-todo-app
pnpm install
```

2. Set up environment:
```bash
cp .env.example .env.local
```

3. Configure environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Development Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: New features
- `fix/*`: Bug fixes
- `release/*`: Release preparation

### Commit Convention
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Tests
- chore: Maintenance

### Code Style

#### TypeScript
```typescript
// Use interfaces for objects
interface User {
  id: string;
  name: string;
}

// Use type for unions/intersections
type Status = 'active' | 'inactive';

// Use const assertions
const config = {
  theme: 'dark',
  lang: 'en',
} as const;
```

#### React Components
```typescript
// Use functional components
function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // Hooks at the top
  const [state, setState] = useState();
  
  // Event handlers
  const handleClick = useCallback(() => {
    // ...
  }, []);
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Testing

#### Unit Tests
```typescript
describe('TaskComponent', () => {
  it('should render task title', () => {
    render(<Task title="Test Task" />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});
```

#### Integration Tests
```typescript
describe('Timeline', () => {
  it('should allow task drag and drop', async () => {
    // Setup
    render(<Timeline />);
    
    // Action
    await dragAndDrop(
      screen.getByTestId('task-1'),
      screen.getByTestId('timeslot-2')
    );
    
    // Assert
    expect(onTaskMove).toHaveBeenCalled();
  });
});
```

### Performance Optimization

#### Component Optimization
```typescript
// Memoize expensive components
const MemoizedTask = memo(Task, (prev, next) => {
  return prev.id === next.id && prev.status === next.status;
});

// Use fragments to avoid extra DOM nodes
function List() {
  return (
    <>
      <Item1 />
      <Item2 />
    </>
  );
}
```

#### Data Fetching
```typescript
// Use SWR for data fetching
const { data, error } = useSWR<Task[]>(
  '/api/tasks',
  fetcher,
  {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  }
);
```

### State Management

#### Local State
```typescript
// Use useState for simple state
const [isOpen, setIsOpen] = useState(false);

// Use useReducer for complex state
const [state, dispatch] = useReducer(taskReducer, initialState);
```

#### Global State
```typescript
// Create store
const useStore = create<Store>((set) => ({
  tasks: [],
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task]
  }))
}));

// Use store
function TaskList() {
  const tasks = useStore((state) => state.tasks);
  return <div>{/* render tasks */}</div>;
}
```

### Error Handling

#### API Errors
```typescript
try {
  await api.updateTask(taskId, updates);
} catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

#### Boundary Errors
```typescript
class ErrorBoundary extends React.Component {
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### Deployment

#### Production Build
```bash
# Build
pnpm build

# Test production build
pnpm start
```

#### Environment Variables
- Use `.env.local` for local development
- Use `.env.production` for production
- Never commit sensitive values

#### Monitoring
- Use Vercel Analytics
- Monitor performance metrics
- Track error rates
- Check API response times

### Documentation

#### Component Documentation
```typescript
/**
 * Task component displays a single task item
 * @param {TaskProps} props - Component props
 * @returns {JSX.Element} Rendered task
 */
function Task({ title, status }: TaskProps) {
  return <div>{/* ... */}</div>;
}
```

#### API Documentation
```typescript
/**
 * Updates a task's properties
 * @param {string} taskId - Task identifier
 * @param {Partial<Task>} updates - Properties to update
 * @throws {ApiError} When update fails
 * @returns {Promise<void>}
 */
async function updateTask(taskId: string, updates: Partial<Task>) {
  // ...
}
``` 