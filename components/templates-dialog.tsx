import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface Subtask {
    id: number
    title: string
    completed: boolean
}

interface Task {
    id: number
    title: string
    status: 'To Do' | 'In Progress' | 'In Review' | 'Complete'
    priority: 'Low' | 'Medium' | 'High' | 'Urgent'
    due_date: string
    assignees: string[]
    description: string
    subtasks: Subtask[]
    time_tracked: number
    project: string
    tags: string[]
    dependencies: number[]
    recurrence: string | null
    importance: number
    urgency: number
    user_id: string
    created_at?: string
}

interface Template {
    id: number
    name: string
    tasks: Omit<Task, 'id' | 'timeTracked'>[]
    user_id: string
}

interface TemplatesDialogProps {
    templates: Template[];
    applyTemplate: (templateId: number) => void;
    addTemplate: (name: string, tasks: Task[]) => void;
    tasks: Task[];
}

export default function TemplatesDialog({ templates, applyTemplate, addTemplate, tasks }: TemplatesDialogProps) {
    const [templateName, setTemplateName] = useState('');

    const handleAddTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        addTemplate(templateName, tasks.filter((t) => t.status !== 'Complete'));
        setTemplateName('');
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="fixed bottom-4 right-4">
                    {/* Icon */}
                    Templates
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Task Templates</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {templates.map((template) => (
                        <div key={template.id} className="flex justify-between items-center">
                            <span>{template.name}</span>
                            <Button onClick={() => applyTemplate(template.id)}>Apply</Button>
                        </div>
                    ))}
                    <form onSubmit={handleAddTemplate}>
                        <div className="flex space-x-2">
                            <Input
                                name="name"
                                placeholder="New Template Name"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                required
                            />
                            <Button type="submit">Save Current Tasks as Template</Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
