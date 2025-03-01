import { useState } from 'react';
import { useTemplates } from '@/lib/hooks/useTemplates';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { TaskTemplate, TaskPriority, TaskCategory } from '@/lib/types';
import { TaskChecklist } from './TaskChecklist';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface TemplateTask {
    title: string;
    description: string;
    checklist: {
        id: string;
        title: string;
        completed: boolean;
    }[];
    priority: TaskPriority;
    category: TaskCategory;
    dueDate?: string;
}

export function TaskTemplates() {
    const {
        templates,
        isLoading,
        error,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        createTaskFromTemplate
    } = useTemplates();

    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [newTemplate, setNewTemplate] = useState<Partial<TaskTemplate>>({
        name: '',
        description: '',
        tasks: [{
            title: '',
            description: '',
            checklist: [],
            priority: 'Medium',
            category: 'Work',
        }] as TemplateTask[]
    });
    const [activeTaskIndex, setActiveTaskIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async () => {
        if (!newTemplate.name) return;

        setIsSubmitting(true);
        try {
            await createTemplate({
                name: newTemplate.name,
                description: newTemplate.description || '',
                tasks: newTemplate.tasks || [],
                isPublic: false,
                permissions: {
                    canView: [],
                    canEdit: [],
                    canShare: []
                },
                tags: [],
                version: 1,
                usageCount: 0,
                createdBy: '',
            });
            setIsCreating(false);
            setNewTemplate({
                name: '',
                description: '',
                tasks: [{
                    title: '',
                    description: '',
                    checklist: [],
                    priority: 'Medium',
                    category: 'Work',
                }] as TemplateTask[]
            });
            toast({
                title: 'Template created',
                description: 'Your template has been created successfully.'
            });
        } catch (err) {
            toast({
                title: 'Failed to create template',
                description: err instanceof Error ? err.message : 'Something went wrong',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (templateId: string, template: Partial<TaskTemplate>) => {
        setIsSubmitting(true);
        try {
            await updateTemplate(templateId, template);
            setIsEditing(null);
            toast({
                title: 'Template updated',
                description: 'Your template has been updated successfully.'
            });
        } catch (err) {
            toast({
                title: 'Failed to update template',
                description: err instanceof Error ? err.message : 'Something went wrong',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (templateId: string) => {
        try {
            await deleteTemplate(templateId);
            toast({
                title: 'Template deleted',
                description: 'Your template has been deleted.'
            });
        } catch (err) {
            toast({
                title: 'Failed to delete template',
                description: err instanceof Error ? err.message : 'Something went wrong',
                variant: 'destructive'
            });
        }
    };

    const handleCreateTask = async (templateId: string) => {
        try {
            await createTaskFromTemplate(templateId);
            toast({
                title: 'Task created',
                description: 'New task has been created from the template.'
            });
        } catch (err) {
            toast({
                title: 'Failed to create task',
                description: err instanceof Error ? err.message : 'Something went wrong',
                variant: 'destructive'
            });
        }
    };

    const addTaskToTemplate = () => {
        setNewTemplate(prevTemplate => {
            const updatedTemplate = {
                ...prevTemplate,
                tasks: [
                    ...(prevTemplate.tasks || []),
                    {
                        title: '',
                        description: '',
                        checklist: [],
                        priority: 'Medium' as const,
                        category: 'Work' as const,
                    }
                ]
            };
            setActiveTaskIndex(updatedTemplate.tasks.length - 1);
            return updatedTemplate;
        });
    };

    const updateTaskInTemplate = (index: number, updates: Partial<TemplateTask>) => {
        setNewTemplate(prevTemplate => ({
            ...prevTemplate,
            tasks: prevTemplate.tasks?.map((task, i) =>
                i === index ? { ...task, ...updates } : task
            ) || []
        }));
    };

    if (error) {
        return (
            <div className="p-4 text-red-500">
                <p>Error loading templates: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Task Templates</h2>
                <Button onClick={() => setIsCreating(true)}>
                    <Icons.add className="mr-2 h-4 w-4" />
                    Create Template
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-4">
                    <Icons.spinner className="h-6 w-6 animate-spin" />
                </div>
            ) : templates.length === 0 ? (
                <Card className="flex items-center justify-center p-8 text-muted-foreground">
                    <p>No templates yet</p>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                        <Card key={template.id} className="p-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium">{template.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setIsEditing(template.id)}
                                        >
                                            <Icons.edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(template.id)}
                                        >
                                            <Icons.trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div
                                    className="prose prose-sm dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: template.description }}
                                />
                                <div className="pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCreateTask(template.id)}
                                    >
                                        <Icons.add className="mr-2 h-4 w-4" />
                                        Use Template
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Create Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Input
                                placeholder="Template name"
                                value={newTemplate.name}
                                onChange={(e) =>
                                    setNewTemplate({ ...newTemplate, name: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <RichTextEditor
                                content={newTemplate.description || ''}
                                onChange={(content) =>
                                    setNewTemplate({ ...newTemplate, description: content })
                                }
                                placeholder="Template description..."
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium">Tasks</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addTaskToTemplate}
                                >
                                    <Icons.add className="mr-2 h-4 w-4" />
                                    Add Task
                                </Button>
                            </div>

                            <Tabs
                                value={activeTaskIndex.toString()}
                                onValueChange={(value) => setActiveTaskIndex(parseInt(value))}
                            >
                                <TabsList className="w-full">
                                    {newTemplate.tasks?.map((task, index) => (
                                        <TabsTrigger
                                            key={index}
                                            value={index.toString()}
                                            className="flex-1"
                                        >
                                            Task {index + 1}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                {newTemplate.tasks?.map((task, index) => (
                                    <TabsContent key={index} value={index.toString()}>
                                        <div className="space-y-4">
                                            <Input
                                                placeholder="Task title"
                                                value={task.title}
                                                onChange={(e) =>
                                                    updateTaskInTemplate(index, { title: e.target.value })
                                                }
                                            />
                                            <RichTextEditor
                                                content={task.description || ''}
                                                onChange={(content) =>
                                                    updateTaskInTemplate(index, { description: content })
                                                }
                                                placeholder="Task description..."
                                            />
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Select
                                                        value={task.priority}
                                                        onValueChange={(value) =>
                                                            updateTaskInTemplate(index, { priority: value as TaskPriority })
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select priority" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Low">Low</SelectItem>
                                                            <SelectItem value="Medium">Medium</SelectItem>
                                                            <SelectItem value="High">High</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Select
                                                        value={task.category}
                                                        onValueChange={(value) =>
                                                            updateTaskInTemplate(index, { category: value as TaskCategory })
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Work">Work</SelectItem>
                                                            <SelectItem value="Personal">Personal</SelectItem>
                                                            <SelectItem value="Errands">Errands</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium mb-2">Checklist</h4>
                                                <TaskChecklist
                                                    items={task.checklist}
                                                    onChange={(checklist) =>
                                                        updateTaskInTemplate(index, { checklist })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsCreating(false)}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreate}
                                disabled={isSubmitting || !newTemplate.name}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Template'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {isEditing && (
                <Dialog open={true} onOpenChange={() => setIsEditing(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Template</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {templates
                                .filter((t) => t.id === isEditing)
                                .map((template) => (
                                    <div key={template.id} className="space-y-4">
                                        <div>
                                            <Input
                                                placeholder="Template name"
                                                value={template.name}
                                                onChange={(e) =>
                                                    handleUpdate(template.id, {
                                                        ...template,
                                                        name: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <RichTextEditor
                                                content={template.description}
                                                onChange={(content) =>
                                                    handleUpdate(template.id, {
                                                        ...template,
                                                        description: content,
                                                    })
                                                }
                                                placeholder="Template description..."
                                            />
                                        </div>
                                    </div>
                                ))}
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditing(null)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => setIsEditing(null)}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
} 