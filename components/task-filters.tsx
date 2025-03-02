import { useState, useEffect } from 'react';
import { Task, Project } from '@/types/project';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { DatePicker } from './ui/date-picker';
import { Badge } from './ui/badge';
import { IconFilter, IconSearch, IconX } from '@tabler/icons-react';

interface TaskFiltersProps {
  tasks: Task[];
  projects: Project[];
  onFilterChange: (filters: TaskFilters) => void;
}

export interface TaskFilters {
  search: string;
  status: string[];
  priority: string[];
  projects: string[];
  assignees: string[];
  dueDateRange: {
    start: Date | null;
    end: Date | null;
  };
  tags: string[];
}

export function TaskFilters({ tasks, projects, onFilterChange }: TaskFiltersProps) {
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: [],
    priority: [],
    projects: [],
    assignees: [],
    dueDateRange: {
      start: null,
      end: null,
    },
    tags: [],
  });

  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for filter options
  const statuses = Array.from(new Set(tasks.map(t => t.status)));
  const priorities = Array.from(new Set(tasks.map(t => t.priority)));
  const projectNames = projects.map(p => p.name);
  const assigneeList = Array.from(new Set(tasks.flatMap(t => t.assignees)));
  const tagList = Array.from(new Set(tasks.flatMap(t => t.tags || [])));

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: [],
      priority: [],
      projects: [],
      assignees: [],
      dueDateRange: {
        start: null,
        end: null,
      },
      tags: [],
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status.length) count++;
    if (filters.priority.length) count++;
    if (filters.projects.length) count++;
    if (filters.assignees.length) count++;
    if (filters.dueDateRange.start || filters.dueDateRange.end) count++;
    if (filters.tags.length) count++;
    return count;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Input
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2"
        >
          <IconFilter className="w-4 h-4" />
          <span>Filters</span>
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary">{getActiveFilterCount()}</Badge>
          )}
        </Button>
        {getActiveFilterCount() > 0 && (
          <Button variant="ghost" onClick={clearFilters}>
            <IconX className="w-4 h-4" />
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status.join(',')}
              onValueChange={(value) => handleFilterChange('status', value.split(',').filter(Boolean))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select
              value={filters.priority.join(',')}
              onValueChange={(value) => handleFilterChange('priority', value.split(',').filter(Boolean))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Project</label>
            <Select
              value={filters.projects.join(',')}
              onValueChange={(value) => handleFilterChange('projects', value.split(',').filter(Boolean))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projectNames.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Assignee</label>
            <Select
              value={filters.assignees.join(',')}
              onValueChange={(value) => handleFilterChange('assignees', value.split(',').filter(Boolean))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                {assigneeList.map((assignee) => (
                  <SelectItem key={assignee} value={assignee}>
                    {assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date Range</label>
            <div className="flex space-x-2">
              <DatePicker
                date={filters.dueDateRange.start || undefined}
                setDate={(date) =>
                  handleFilterChange('dueDateRange', {
                    ...filters.dueDateRange,
                    start: date || null,
                  })
                }
                className="w-full"
              />
              <DatePicker
                date={filters.dueDateRange.end || undefined}
                setDate={(date) =>
                  handleFilterChange('dueDateRange', {
                    ...filters.dueDateRange,
                    end: date || null,
                  })
                }
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <Select
              value={filters.tags.join(',')}
              onValueChange={(value) => handleFilterChange('tags', value.split(',').filter(Boolean))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tags" />
              </SelectTrigger>
              <SelectContent>
                {tagList.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
} 