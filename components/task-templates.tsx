import { useState } from 'react';
import { Task } from '@/types/project';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from './ui/dialog';
import { IconTemplate, IconPlus } from '@tabler/icons-react';

interface Template {
  id: number;
  name: string;
  tasks: Omit<Task, 'id' | 'time_tracked'>[];
  user_id: string;
}

interface TaskTemplatesProps {
  templates: Template[];
  onCreateTemplate: (name: string, tasks: Omit<Task, 'id' | 'time_tracked'>[]) => Promise<void>;
  onApplyTemplate: (templateId: number) => Promise<void>;
  currentTasks: Task[];
}

export function TaskTemplates({
  templates,
  onCreateTemplate,
  onApplyTemplate,
  currentTasks
}: TaskTemplatesProps) {
  const [newTemplateName, setNewTemplateName] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim() || selectedTasks.length === 0) return;

    const templateTasks = currentTasks
      .filter(task => selectedTasks.includes(task.id))
      .map(({ id, time_tracked, ...rest }) => rest);

    await onCreateTemplate(newTemplateName, templateTasks);
    setNewTemplateName('');
    setSelectedTasks([]);
  };

  return (
    <div className="space-y-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <IconTemplate className="w-4 h-4 mr-2" />
            Save as Template
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Template name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
            />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Select tasks to include:</h4>
              {currentTasks.map(task => (
                <div key={task.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTasks([...selectedTasks, task.id]);
                      } else {
                        setSelectedTasks(selectedTasks.filter(id => id !== task.id));
                      }
                    }}
                  />
                  <span>{task.title}</span>
                </div>
              ))}
            </div>
            <Button onClick={handleCreateTemplate}>
              <IconPlus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <div
            key={template.id}
            className="border rounded-lg p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{template.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onApplyTemplate(template.id)}
              >
                Apply
              </Button>
            </div>
            <div className="space-y-1">
              {template.tasks.map((task, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  • {task.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 