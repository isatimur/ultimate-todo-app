import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/ui/icons';
import { Task, TaskPriority, TaskCategory } from '@/lib/types';
import { TaskAttachments } from './TaskAttachments';
import { TaskComments } from './TaskComments';
import { formatDateTime } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

interface TaskDetailsModalProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (task: Task) => Promise<void>;
}

export function TaskDetailsModal({
    task,
    isOpen,
    onClose,
    onUpdate
}: TaskDetailsModalProps) {
    const [activeTab, setActiveTab] = useState('details');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState(task);

    const handleStatusChange = async (completed: boolean) => {
        setIsUpdating(true);
        try {
            await onUpdate({
                ...task,
                completed
            });
            toast({
                title: 'Task updated',
                description: `Task marked as ${completed ? 'completed' : 'incomplete'}.`
            });
        } catch (error) {
            toast({
                title: 'Update failed',
                description: 'Failed to update task status.',
                variant: 'destructive'
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSave = async () => {
        setIsUpdating(true);
        try {
            await onUpdate(editedTask);
            setIsEditing(false);
            toast({
                title: 'Task updated',
                description: 'Task details have been updated successfully.'
            });
        } catch (error) {
            toast({
                title: 'Update failed',
                description: 'Failed to update task details.',
                variant: 'destructive'
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = () => {
        setEditedTask(task);
        setIsEditing(false);
    };

    // Add keyboard shortcuts
    useKeyboardShortcuts({
        isEditing,
        onEdit: () => setIsEditing(true),
        onSave: handleSave,
        onCancel: handleCancel,
        onClose,
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            {isEditing ? (
                                <Input
                                    value={editedTask.title}
                                    onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                                    className="text-xl font-semibold"
                                    placeholder="Task title"
                                />
                            ) : (
                                <DialogTitle className="text-xl font-semibold">
                                    {task.title}
                                </DialogTitle>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            {isEditing ? (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancel}
                                        disabled={isUpdating}
                                    >
                                        Cancel
                                        <span className="ml-2 text-xs text-muted-foreground">ESC</span>
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? (
                                            <>
                                                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                Save Changes
                                                <span className="ml-2 text-xs text-muted-foreground">⌘S</span>
                                            </>
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsEditing(true)}
                                    >
                                        <Icons.edit className="mr-2 h-4 w-4" />
                                        Edit
                                        <span className="ml-2 text-xs text-muted-foreground">⌘E</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleStatusChange(!task.completed)}
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? (
                                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                                        ) : task.completed ? (
                                            <Icons.check className="mr-2 h-4 w-4" />
                                        ) : null}
                                        {task.completed ? 'Completed' : 'Mark as Complete'}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex-1 flex flex-col overflow-hidden"
                >
                    <TabsList>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="attachments">Attachments</TabsTrigger>
                        <TabsTrigger value="comments">Comments</TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto p-4">
                        <TabsContent value="details" className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                                {isEditing ? (
                                    <RichTextEditor
                                        content={editedTask.description || ''}
                                        onChange={(content) => setEditedTask({ ...editedTask, description: content })}
                                        placeholder="Add a description..."
                                    />
                                ) : (
                                    <div
                                        className="prose prose-sm dark:prose-invert mt-1"
                                        dangerouslySetInnerHTML={{ __html: task.description || 'No description provided.' }}
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Priority</h3>
                                    {isEditing ? (
                                        <Select
                                            value={editedTask.priority}
                                            onValueChange={(value: TaskPriority) =>
                                                setEditedTask({ ...editedTask, priority: value })
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
                                    ) : (
                                        <p className="mt-1">{task.priority}</p>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Category</h3>
                                    {isEditing ? (
                                        <Select
                                            value={editedTask.category}
                                            onValueChange={(value: TaskCategory) =>
                                                setEditedTask({ ...editedTask, category: value })
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
                                    ) : (
                                        <p className="mt-1">{task.category}</p>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Due Date</h3>
                                    {isEditing ? (
                                        <Input
                                            type="datetime-local"
                                            value={editedTask.due_date.slice(0, 16)}
                                            onChange={(e) =>
                                                setEditedTask({ ...editedTask, due_date: e.target.value })
                                            }
                                        />
                                    ) : (
                                        <p className="mt-1">{formatDateTime(task.due_date)}</p>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Progress</h3>
                                    {isEditing ? (
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={editedTask.progress}
                                            onChange={(e) =>
                                                setEditedTask({
                                                    ...editedTask,
                                                    progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                                                })
                                            }
                                        />
                                    ) : (
                                        <p className="mt-1">{task.progress}%</p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="attachments">
                            <TaskAttachments taskId={task.id} />
                        </TabsContent>

                        <TabsContent value="comments">
                            <TaskComments taskId={task.id} />
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
} 